import {
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

@Injectable()
class AuthService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly jwtService: JwtService,
		private readonly googleClient: OAuth2Client,
	) { }

	// 카카오, 구글 로그인
	async logIn(
		token: string,
		provider: Provider,
	): Promise<LogInResponse | SignUpRedirectResponse> {
		let email: string;
		let socialId: string;

		if (provider === Provider.Kakao) {
			const payload = await AuthService.validateKakaoToken(token);
			email = payload.kakao_account.email;
			socialId = payload.id;
		} else if (provider === Provider.Google) {
			const payload = await this.validateGoogleToken(token);
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

	// JWT 인증
	async validateJwt(authHeader: string, response: Response): Promise<void> {
		const token = await AuthService.authenticate(authHeader);
		try {
			const decoded = await this.jwtService.verifyAsync(token, {
				secret: process.env.JWT_SECRET,
			});

			response.status(200).json({ socialId: decoded.socialId });
		} catch (error) {
			throw new UnauthorizedException('Invalid Token');
		}
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

	// 회원가입
	async signUp(
		nick: string,
		token: string,
		provider: Provider,
		givenName: string = 'default name',
	): Promise<SignUpResponse> {
		let name = givenName;
		let email: string;
		let socialId: string;

		if (provider === Provider.Kakao) {
			const payload = await AuthService.validateKakaoToken(token);
			email = payload.kakao_account.email;
			socialId = payload.id;
		} else if (provider === Provider.Google) {
			const payload = await this.validateGoogleToken(token);
			name = payload.name;
			email = payload.email;
			socialId = payload.sub;
		} else {
			throw new UnauthorizedException('Unsupported provider');
		}

		const newUser = this.userRepository.create({
			socialId,
			name,
			email,
			nick,
			provider,
		});
		await this.userRepository.save(newUser);

		const jwt = await this.createJwt(newUser.socialId);
		return { jwt, userInfo: { nick: newUser.nick } };
	}

	// 닉네임 검증 - true: 유효함, false: 유효하지 않음
	async validateNick(nick: string): Promise<boolean> {
		const isDuplicated = await this.checkNickDuplication(nick);
		if (isDuplicated) {
			return false;
		}
		const isBadWords = await AuthService.checkNickBadWords(nick);
		if (isBadWords) {
			return false;
		}
		return true;
	}

	// 닉네임 중복 체크 - true: 중복됨, false: 중복되지 않음
	async checkNickDuplication(nick: string): Promise<boolean> {
		const user = await this.userRepository.findOneBy({ nick });

		if (user) {
			return true;
		}
		return false;
	}

	// 닉네임 비속어 체크 - true: 비속어, false: 비속어 아님
	static async checkNickBadWords(nick: string): Promise<boolean> {
		const json = fs.readFileSync('badwords.json', 'utf-8');
		const { badWords } = JSON.parse(json);
		return badWords.some((badWord: string) => nick.includes(badWord));
	}
}
export default AuthService;
