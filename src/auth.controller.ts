import { Body, Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLogInResponse } from './auth.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('google')
    async googleLogIn(
        @Body('idToken') idToken: string,
    ): Promise<GoogleLogInResponse> {
        return await this.authService.googleLogIn(idToken);
    }

    @Get('nick')
    async isNickValid(
        @Query('nick') nick: string,
    ): Promise<boolean> {
        const response = await this.authService.isNickValid(nick);
        return response;
    }

    @Post('signup')
    async signUp(
        @Body('nick') nick: string,
        @Body('provider') provider: string,
        @Body('idToken') idToken: string,
    ): Promise<string> {
        let response;
        if (provider === 'kakao') {
            response = await this.authService.kakaoSignUp(nick, idToken);
        } else if (provider === 'google') {
            response = await this.authService.googleSignUp(nick, idToken);
        } else if (provider === 'apple') {
            response = await this.authService.appleSignUp(nick, idToken);
        }
        return response;
    }
}
