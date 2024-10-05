import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepositoryUtils } from 'typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';

import axios from 'axios';
import * as fs from 'fs';

import { Response } from 'express';
import User from './entities/auth.entity';
import {
	KakaoPayload,
	LogInResponse,
	Provider,
	SignUpRedirectResponse,
	SignUpResponse,
} from './auth.interface';
import {
	isLogInGoogleDto,
	isLogInKakaoDto,
	isSignUpGoogleDto,
	isSignUpKakaoDto,
	SignUpBaseDto,
	SignUpGoogleDto,
	SignUpKakaoDto,
} from './dtos/auth.dto';

@Injectable()
class AuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly jwtService: JwtService,
		private readonly googleClient: OAuth2Client,
	) {}

	// 카카오, 구글 로그인
	async logIn<T>(
		logInDto: T,
		provider: Provider,
	): Promise<LogInResponse | SignUpRedirectResponse> {
		let email: string;
		let socialId: string;

		if (provider === Provider.Kakao && isLogInKakaoDto(logInDto)) {
			const payload = await AuthService.validateKakaoToken(
				logInDto.accessToken,
			);
			email = payload.kakao_account.email;
			socialId = payload.id;
		} else if (provider === Provider.Google && isLogInGoogleDto(logInDto)) {
			const payload = await this.validateGoogleToken(logInDto.idToken);
			email = payload.email;
			socialId = payload.sub;
		} else {
			throw new UnauthorizedException('Unsupported provider');
		}

		const user = await this.getUserBySocialId(socialId);
		if (!user) {
			return {
				status: 'SIGN_UP_REQUIRED',
			};
		}

		if (user.email !== email || user.provider !== provider) {
			throw new NotFoundException(
				`User socialId ${socialId} info not match with email ${email}, provider ${provider}`,
			);
		}

		const jwt = await this.createJwt(user.socialId);
		return { jwt, userInfo: { nick: user.nick } };
	}

	// 카카오 토큰 검증
	static async validateKakaoToken(
		accessToken: string,
	): Promise<KakaoPayload> {
		try {
			const response = await axios.get(
				'https://kapi.kakao.com/v2/user/me',
				{
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Content-Type':
							'application/x-www-form-urlencoded;charset=utf-8',
					},
				},
			);

			if (!response.data) {
				throw new UnauthorizedException(
					'Kakao - No payload from access token',
				);
			} else {
				return response.data;
			}
		} catch (error) {
			throw new UnauthorizedException('Kakao - Invalid access token');
		}
	}

	// 구글 토큰 검증
	async validateGoogleToken(idToken: string): Promise<TokenPayload> {
		try {
			const ticket = await this.googleClient.verifyIdToken({
				idToken,
				audience: process.env.GOOGLE_CLIENT_ID,
			});
			const payload = ticket.getPayload();

			if (payload) {
				return payload;
			}
			throw new UnauthorizedException(
				'Google - No payload from ID token',
			);
		} catch (error) {
			throw new UnauthorizedException('Google - Invalid ID token');
		}
	}

	// 사용자 조회
	async getUserBySocialId(socialId: string): Promise<User> {
		const user = await this.userRepository.findOneBy({ socialId });
		return user;
	}

	// JWT 발급
	async createJwt(socialId: string): Promise<string> {
		return this.jwtService.sign({ socialId });
	}

	// 헤더 인증 정보 추출
	static async authenticate(authHeader: string): Promise<string> {
		if (!authHeader) {
			throw new UnauthorizedException('Authorization header is missing');
		}

		const token = authHeader.split(' ')[1];

		if (!token) {
			throw new UnauthorizedException('Token is missing');
		}
		return token;
	}

	// 자동 로그인
	async logInAuto(authHeader: string): Promise<boolean> {
		const token = await AuthService.authenticate(authHeader);

		try {
			const decoded = await this.jwtService.verify(token, {
				secret: process.env.JWT_SECRET,
			});
			if (decoded) {
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	}

	async signUp<T extends SignUpBaseDto>(
		signUpDto: T,
		provider: Provider,
	): Promise<SignUpResponse> {
		let { nick } = signUpDto;
		let nameTemp: string;
		let email: string;
		let socialId: string;

		if (provider === Provider.Kakao && isSignUpKakaoDto(signUpDto)) {
			const { name, accessToken } = signUpDto as SignUpKakaoDto;
			const payload = await AuthService.validateKakaoToken(accessToken);
			nameTemp = name;
			email = payload.kakao_account.email;
			socialId = payload.id;
		} else if (
			provider === Provider.Google &&
			isSignUpGoogleDto(signUpDto)
		) {
			const { idToken } = signUpDto as SignUpGoogleDto;
			const payload = await this.validateGoogleToken(idToken);
			nameTemp = payload.name;
			email = payload.email;
			socialId = payload.sub;
		} else {
			throw new UnauthorizedException('Unsupported provider');
		}

		const existingUser = await this.userRepository.findOneBy({
			socialId: socialId,
		});
		if (existingUser) {
			throw new ConflictException(
				`User with socialId ${socialId} already exists.`,
			);
		}

		const newUser = this.userRepository.create({
			socialId,
			name: nameTemp,
			email,
			nick,
			provider,
		});
		await this.userRepository.save(newUser);

		const jwt = await this.createJwt(newUser.socialId);
		return { jwt, userInfo: { nick: newUser.nick } };
	}
}
export default AuthService;
