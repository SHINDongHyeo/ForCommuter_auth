import {
	Body,
	Controller,
	Get,
	Post,
	Query,
	Headers,
	Res,
	Patch,
	Put,
	Delete,
} from '@nestjs/common';
import { Response } from 'express';
import AuthService from './auth.service';
import {
	LogInResponse,
	Provider,
	SignUpRedirectResponse,
	SignUpResponse,
} from './auth.interface';

@Controller('auth')
class AuthController {
	constructor(private readonly authService: AuthService) { }

	// 카카오 로그인
	@Post('kakao/log-in')
	async logInKakao(
		@Body('accessToken') accessToken: string,
	): Promise<LogInResponse | SignUpRedirectResponse> {
		return this.authService.logIn(accessToken, Provider.Kakao);
	}

	// 카카오 회원가입
	@Post('kakao/sign-up')
	async signUpKakao(
		@Body('name') name: string,
		@Body('nick') nick: string,
		@Body('accessToken') accessToken: string,
	): Promise<SignUpResponse> {
		return this.authService.signUp(nick, accessToken, Provider.Kakao, name);
	}

	// 구글 로그인
	@Post('google/log-in')
	async logInGoogle(
		@Body('idToken') idToken: string,
	): Promise<LogInResponse | SignUpRedirectResponse> {
		return this.authService.logIn(idToken, Provider.Google);
	}

	// 구글 회원가입
	@Post('google/sign-up')
	async signUpGoogle(
		@Body('nick') nick: string,
		@Body('idToken') idToken: string,
	): Promise<SignUpResponse> {
		return this.authService.signUp(nick, idToken, Provider.Google);
	}

	// 자동 로그인
	@Get('auto/log-in')
	async logInAuto(
		@Headers('authorization') authHeader: string,
	): Promise<boolean> {
		return this.authService.logInAuto(authHeader);
	}

	// 닉네임 검증
	@Get('nick/validate')
	async validateNick(@Query('nick') nick: string): Promise<boolean> {
		return this.authService.validateNick(nick);
	}

	// JWT 인증
	@Get('jwt/validate')
	async getValidateJwt(
		@Headers('authorization') authHeader: string,
		@Res() response: Response,
	): Promise<void> {
		return this.authService.validateJwt(authHeader, response);
	}
}
export default AuthController;
