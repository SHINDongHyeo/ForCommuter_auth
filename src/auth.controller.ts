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
import {
	LogInGoogleDto,
	LogInKakaoDto,
	SignUpGoogleDto,
	SignUpKakaoDto,
} from './dtos/auth.dto';

@Controller('auth')
class AuthController {
	constructor(private readonly authService: AuthService) {}

	// 자동 로그인
	@Get('log-in/auto')
	async logInAuto(
		@Headers('authorization') authHeader: string,
	): Promise<boolean> {
		return this.authService.logInAuto(authHeader);
	}

	// 카카오 로그인
	@Post('log-in/kakao')
	async logInKakao(
		@Body() logInKakaoDto: LogInKakaoDto,
	): Promise<LogInResponse | SignUpRedirectResponse> {
		return this.authService.logIn(logInKakaoDto, Provider.Kakao);
	}

	// 카카오 회원가입
	@Post('sign-up/kakao')
	async signUpKakao(
		@Body() signUpKakaoDto: SignUpKakaoDto,
	): Promise<SignUpResponse> {
		return this.authService.signUp(signUpKakaoDto, Provider.Kakao);
	}

	// 구글 로그인
	@Post('log-in/google')
	async logInGoogle(
		@Body() logInGoogleDto: LogInGoogleDto,
	): Promise<LogInResponse | SignUpRedirectResponse> {
		return this.authService.logIn(logInGoogleDto, Provider.Google);
	}

	// 구글 회원가입
	@Post('sign-up/google')
	async signUpGoogle(
		@Body() signUpGoogleDto: SignUpGoogleDto,
	): Promise<SignUpResponse> {
		return this.authService.signUp(signUpGoogleDto, Provider.Google);
	}
}
export default AuthController;
