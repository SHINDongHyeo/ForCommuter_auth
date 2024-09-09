import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { User } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { GoogleLogInResponse, Provider } from './auth.interface';

@Injectable()
export class AuthService {
    private readonly client: OAuth2Client;

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private readonly jwtService: JwtService
    ) {
        this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async googleLogIn(idToken: string): Promise<GoogleLogInResponse> {
        const payload = await this.validateGoogleToken(idToken);
        const user = await this.isRegistered(payload.email, Provider.Google);
        const jwt = await this.createGoogleJwt(payload);
        return { jwt, userInfo: { nick: user.nick } };
    }

    async validateGoogleToken(idToken: string): Promise<TokenPayload> {
        try {
            const ticket = await this.client.verifyIdToken({
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

    async isRegistered(email: string, provider: Provider) {
        const user = await this.userRepository.findOne({
            where: { email, provider },
        });
        if (!user) {
            throw new NotFoundException(`User email ${email} not found`);
        }
        return user;
    }

    async createGoogleJwt(payload: TokenPayload) {
        return this.jwtService.sign({
            sub: payload.sub,
            email: payload.email,
        });
    }

    async isNickValid(nick: string): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: { nick },
        });
        if (user) {
            return false;
        }
        return true;
    }

    async kakaoSignUp(nick: string, idToken: string) {
        return;
    }

    async googleSignUp(nick: string, idToken: string) {
        const payload = await this.validateGoogleToken(idToken);
        const newUser = this.userRepository.create({
            name: payload.name,
            email: payload.email,
            socialId: payload.sub,
            nick: nick,
            provider: Provider.Google,
        });
        await this.userRepository.save(newUser);
        return await this.createGoogleJwt(payload);
    }

    async appleSignUp(nick: string, idToken: string) {
        return;
    }
}
