import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/auth.entity';

import { KakaoPayload, LogInResponse, Provider, SignUpResponse } from './auth.interface';

import { OAuth2Client, TokenPayload } from 'google-auth-library';
import axios from 'axios';

@Injectable()
export class AuthService {
    private readonly googleClient: OAuth2Client;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) {
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    // 카카오, 구글 로그인
    async logIn(token: string, provider: Provider): Promise<LogInResponse> {
        let email: string;
        let socialId: string;

        if (provider === 'kakao') {
            const payload = await this.validateKakaoToken(token);
            email = payload.kakao_account.email;
            socialId = payload.id;
        } else if (provider === 'google') {
            const payload = await this.validateGoogleToken(token);
            email = payload.email;
            socialId = payload.sub;
        }

        const user = await this.getUserBySocialId(socialId);

        if (user.email !== email || user.provider !== provider) {
            throw new NotFoundException(`User socialId ${socialId} info not match with email ${email}, provider ${provider}`);
        }

        const jwt = await this.createJwt(user.socialId);
        return { jwt, userInfo: { nick: user.nick } };
    }

    // 카카오 토큰 검증
    async validateKakaoToken(accessToken: string): Promise<KakaoPayload> {
        try {
            const response = await axios.get('https://kapi.kakao.com/v2/user/me',
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            );

            if (response.data) {
                return response.data;
            } else {
                throw new UnauthorizedException('Kakao - No payload from access token');
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

            if (!payload) throw new UnauthorizedException('Google - No payload from ID token');
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Google - Invalid ID token');
        }
    }

    // 사용자 조회
    async getUserBySocialId(socialId: string): Promise<User> {
        const user = await this.userRepository.findOneBy({ socialId });

        if (!user) {
            throw new NotFoundException(`User socialId ${socialId} not found`);
        }
        return user;
    }

    // JWT 발급
    async createJwt(socialId: string) {
        return this.jwtService.sign({
            socialId: socialId,
        });
    }

    // 회원가입
    async signUp(nick: string, token: string, provider: Provider, name: string = 'default name'): Promise<SignUpResponse> {
        let email: string;
        let socialId: string;

        if (provider === 'kakao') {
            const payload = await this.validateKakaoToken(token);
            email = payload.kakao_account.email;
            socialId = payload.id;
        } else if (provider === 'google') {
            const payload = await this.validateGoogleToken(token);
            name = payload.name;
            email = payload.email;
            socialId = payload.sub;
        }

        const newUser = this.userRepository.create({
            socialId: socialId,
            name: name,
            email: email,
            nick: nick,
            provider: provider,
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
        const isBadWords = await this.checkNickBadWords(nick);
        if (isBadWords) {
            return false;
        }
        return true;
    }

    // 닉네임 중복 체크 - true: 중복됨, false: 중복되지 않음
    async checkNickDuplication(nick: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { nick },
        });
        if (user) {
            return true;
        }
        return false;
    }

    // 닉네임 비속어 체크 - true: 비속어, false: 비속어 아님
    async checkNickBadWords(nick: string): Promise<boolean> {
        const fs = require('fs');
        const json = fs.readFileSync('badwords.json');
        const badWords = JSON.parse(json).badWords;
        return badWords.some((badWord: string) => nick.includes(badWord));
    }
}
