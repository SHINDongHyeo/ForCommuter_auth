import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsString,
	IsDate,
	Length,
} from 'class-validator';
import { Provider } from '../auth.interface';
import User from 'src/entities/auth.entity';

export class UserDto {
	@IsString()
	@Length(1, 100)
	socialId: string;

	@IsString()
	@Length(1, 100)
	name: string;

	@IsEmail()
	@Length(1, 100)
	email: string;

	@IsString()
	@Length(1, 100)
	nick: string;

	@IsEnum(Provider)
	provider: Provider;

	@IsDate()
	@IsNotEmpty()
	createdAt: Date;

	constructor(partial: Partial<UserDto>) {
		Object.assign(this, partial);
	}

	static fromEntity(user: User): UserDto {
		return new UserDto({
			socialId: user.socialId,
			name: user.name,
			email: user.email,
			nick: user.nick,
			provider: user.provider,
			createdAt: user.createdAt,
		});
	}
}

export class SignUpBaseDto {
	@IsNotEmpty()
	@IsString()
	nick: string;
}

export class SignUpKakaoDto extends SignUpBaseDto {
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsNotEmpty()
	@IsString()
	accessToken: string;
}

export class SignUpGoogleDto extends SignUpBaseDto {
	@IsNotEmpty()
	@IsString()
	idToken: string;
}

export function isSignUpKakaoDto(dto: any): dto is SignUpKakaoDto {
	return (
		(dto as SignUpKakaoDto).accessToken !== undefined &&
		(dto as SignUpKakaoDto).name !== undefined
	);
}

export function isSignUpGoogleDto(dto: any): dto is SignUpGoogleDto {
	return (dto as SignUpGoogleDto).idToken !== undefined;
}

export class LogInKakaoDto {
	@IsNotEmpty()
	@IsString()
	accessToken: string;
}

export class LogInGoogleDto {
	@IsNotEmpty()
	@IsString()
	idToken: string;
}

export function isLogInKakaoDto(dto: any): dto is LogInKakaoDto {
	return (dto as LogInKakaoDto).accessToken !== undefined;
}

export function isLogInGoogleDto(dto: any): dto is LogInGoogleDto {
	return (dto as LogInGoogleDto).idToken !== undefined;
}
