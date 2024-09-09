import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LogInResponse, Provider, SignUpResponse } from './auth.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // 카카오 로그인
    @Post('kakao/log-in')
    async logInKakao(
        @Body('accessToken') accessToken: string,
    ): Promise<LogInResponse> {
        return await this.authService.logIn(accessToken, Provider.Kakao);
    }

    // 카카오 회원가입
    @Post('kakao/sign-up')
    async signUpKakao(
        @Body('name') name: string,
        @Body('nick') nick: string,
        @Body('accessToken') accessToken: string,
    ): Promise<SignUpResponse> {
        return await this.authService.signUp(nick, accessToken, Provider.Kakao, name);
    }

    // 구글 로그인
    @Post('google/log-in')
    async logInGoogle(
        @Body('idToken') idToken: string,
    ): Promise<LogInResponse> {
        return await this.authService.logIn(idToken, Provider.Google);
    }

    // 구글 회원가입
    @Post('google/sign-up')
    async signUpGoogle(
        @Body('nick') nick: string,
        @Body('idToken') idToken: string,
    ): Promise<SignUpResponse> {
        return await this.authService.signUp(nick, idToken, Provider.Google);
    }

    // 닉네임 검증
    @Get('nick/validate')
    async validateNick(
        @Query('nick') nick: string,
    ): Promise<boolean> {
        return await this.authService.validateNick(nick);
    }
}
