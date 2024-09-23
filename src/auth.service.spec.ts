import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import AuthService from './auth.service';
import User from './entities/auth.entity';
import { KakaoAccount, Provider } from './auth.interface';

describe('AuthService 테스트', () => {
	let authService: AuthService;
	let userRepository: Partial<Repository<User>>;
	let jwtService: Partial<JwtService>;
	let googleClient: Partial<OAuth2Client>;

	beforeEach(async () => {
		userRepository = {
			findOneBy: jest.fn(),
			create: jest.fn(),
			save: jest.fn(),
		};

		jwtService = {
			sign: jest.fn(),
			verify: jest.fn(),
		};

		googleClient = {
			verifyIdToken: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: getRepositoryToken(User), useValue: userRepository },
				{ provide: JwtService, useValue: jwtService },
				{ provide: OAuth2Client, useValue: googleClient },
			],
		}).compile();

		authService = module.get<AuthService>(AuthService);
	});

	it('authService 정의', () => {
		expect(authService).toBeDefined();
	});

	it('jwtService 정의', () => {
		expect(jwtService).toBeDefined();
	});

	it('googleClient 정의', () => {
		expect(googleClient).toBeDefined();
	});

	it('logIn - 카카오 - 정상 케이스', async () => {
		const token = 'valid-kakao-token';
		const provider = Provider.Kakao;

		// Mock Kakao token validation
		jest.spyOn(AuthService, 'validateKakaoToken').mockResolvedValue({
			id: '123456789',
			connected_at: new Date(),
			kakao_account: {
				has_email: true,
				email_needs_agreement: true,
				is_email_valid: true,
				is_email_verified: true,
				email: 'test@test.com',
			} as KakaoAccount,
		});

		// Mock existing user
		const user = {
			socialId: '123456789',
			name: '',
			email: 'test@test.com',
			nick: 'Test',
			provider: Provider.Kakao,
			createdAt: new Date(),
		};
		jest.spyOn(authService, 'getUserBySocialId').mockResolvedValue(user);

		// Mock JWT creation
		jest.spyOn(authService, 'createJwt').mockResolvedValue('jwt-token');

		const result = await authService.logIn(token, provider);

		expect(result).toEqual({
			jwt: 'jwt-token',
			userInfo: {
				nick: 'Test',
			},
		});
	});

	it('logIn - 카카오 - 데이터베이스에 user가 없는 케이스', async () => {
		const token = 'valid-kakao-token';
		const provider = Provider.Kakao;

		// Mock Kakao token validation
		jest.spyOn(AuthService, 'validateKakaoToken').mockResolvedValue({
			id: '123456789',
			connected_at: new Date(),
			kakao_account: {
				has_email: true,
				email_needs_agreement: true,
				is_email_valid: true,
				is_email_verified: true,
				email: 'test@test.com',
			} as KakaoAccount,
		});

		// Mock existing user
		jest.spyOn(authService, 'getUserBySocialId').mockResolvedValue(null);

		const result = await authService.logIn(token, provider);
		expect(result).toEqual({ status: 'SIGN_UP_REQUIRED' });
	});

	it('logIn - 카카오 - 데이터베이스에 user의 email,provider 컬럼 정보가 일치하지 않는 케이스', async () => {
		const token = 'valid-kakao-token';
		const provider = Provider.Kakao;

		// Mock Kakao token validation
		jest.spyOn(AuthService, 'validateKakaoToken').mockResolvedValue({
			id: '123456789',
			connected_at: new Date(),
			kakao_account: {
				has_email: true,
				email_needs_agreement: true,
				is_email_valid: true,
				is_email_verified: true,
				email: 'test@test.com',
			} as KakaoAccount,
		});

		// Mock getUserBySocialId to return a user that doesn't match
		const user = {
			socialId: '777777777',
			name: '',
			email: 'different@test.com',
			nick: 'Test',
			provider: Provider.Kakao,
			createdAt: new Date(),
		};
		jest.spyOn(authService, 'getUserBySocialId').mockResolvedValue(user);

		await expect(authService.logIn(token, provider)).rejects.toThrow(
			NotFoundException,
		);
	});

	it('logIn - 구글 - 정상 케이스', async () => {
		const token = 'valid-google-token';
		const provider = Provider.Google;

		// Mock Google token validation
		jest.spyOn(authService, 'validateGoogleToken').mockResolvedValue({
			iss: 'string',
			sub: '123456789',
			email: 'test@test.com',
			aud: 'string',
			iat: 1234567,
			exp: 1234567,
		});

		// Mock existing user
		const user = {
			socialId: '123456789',
			name: '',
			email: 'test@test.com',
			nick: 'Test',
			provider: Provider.Google,
			createdAt: new Date(),
		};
		jest.spyOn(authService, 'getUserBySocialId').mockResolvedValue(user);

		// Mock JWT creation
		jest.spyOn(authService, 'createJwt').mockResolvedValue('jwt-token');

		const result = await authService.logIn(token, provider);

		expect(result).toEqual({
			jwt: 'jwt-token',
			userInfo: {
				nick: 'Test',
			},
		});
	});

	it('logIn - 구글 - 데이터베이스에 user가 없는 케이스', async () => {
		const token = 'valid-Google-token';
		const provider = Provider.Google;

		// Mock Google token validation
		jest.spyOn(authService, 'validateGoogleToken').mockResolvedValue({
			iss: 'string',
			sub: '123456789',
			email: 'test@test.com',
			aud: 'string',
			iat: 1234567,
			exp: 1234567,
		});

		// Mock existing user
		jest.spyOn(authService, 'getUserBySocialId').mockResolvedValue(null);

		const result = await authService.logIn(token, provider);
		expect(result).toEqual({ status: 'SIGN_UP_REQUIRED' });
	});

	it('logIn - 구글 - 데이터베이스에 user의 email,provider 컬럼 정보가 일치하지 않는 케이스', async () => {
		const token = 'valid-Google-token';
		const provider = Provider.Google;

		// Mock Google token validation
		jest.spyOn(authService, 'validateGoogleToken').mockResolvedValue({
			iss: 'string',
			sub: '123456789',
			email: 'test@test.com',
			aud: 'string',
			iat: 1234567,
			exp: 1234567,
		});

		// Mock getUserBySocialId to return a user that doesn't match
		const user = {
			socialId: '777777777',
			name: '',
			email: 'different@test.com',
			nick: 'Test',
			provider: Provider.Kakao,
			createdAt: new Date(),
		};
		jest.spyOn(authService, 'getUserBySocialId').mockResolvedValue(user);

		await expect(authService.logIn(token, provider)).rejects.toThrow(
			NotFoundException,
		);
	});

	it('signUp - 카카오 회원가입 정상 케이스', async () => {
		const nick = 'testNick';
		const token = 'valid-kakao-token';
		const provider = Provider.Kakao;
		const givenName = '테스트이름';

		// Mock Kakao token validation
		jest.spyOn(AuthService, 'validateKakaoToken').mockResolvedValue({
			id: '123456789',
			connected_at: new Date(),
			kakao_account: {
				has_email: true,
				email_needs_agreement: true,
				is_email_valid: true,
				is_email_verified: true,
				email: 'test@test.com',
			} as KakaoAccount,
		});

		// Mock userRepository.create and userRepository.save
		const newUser = {
			socialId: '123456789',
			name: '테스트이름',
			email: 'test@test.com',
			nick: 'testNick',
			provider: Provider.Kakao,
		};
		jest.spyOn(userRepository, 'create').mockReturnValue({
			...newUser,
			createdAt: new Date(),
		});
		jest.spyOn(userRepository, 'save').mockResolvedValue({
			...newUser,
			createdAt: new Date(),
		});

		jest.spyOn(authService, 'createJwt').mockResolvedValue('123456789!@#$');

		const result = await authService.signUp(
			nick,
			token,
			provider,
			givenName,
		);

		expect(result).toEqual({ jwt: '123456789!@#$', userInfo: { nick } });
	});

	it('signUp - 구글 회원가입 정상 케이스', async () => {
		const nick = 'testNick';
		const token = 'valid-google-token';
		const provider = Provider.Google;
		const givenName = '테스트이름';

		// Mock Google token validation
		jest.spyOn(authService, 'validateGoogleToken').mockResolvedValue({
			iss: 'string',
			sub: '123456789',
			email: 'test@test.com',
			aud: 'string',
			iat: 1234567,
			exp: 1234567,
		});

		// Mock userRepository.create and userRepository.save
		const newUser = {
			socialId: '123456789',
			name: '테스트이름',
			email: 'test@test.com',
			nick: 'testNick',
			provider: Provider.Google,
		};
		jest.spyOn(userRepository, 'create').mockReturnValue({
			...newUser,
			createdAt: new Date(),
		});
		jest.spyOn(userRepository, 'save').mockResolvedValue({
			...newUser,
			createdAt: new Date(),
		});

		jest.spyOn(authService, 'createJwt').mockResolvedValue('123456789!@#$');

		const result = await authService.signUp(
			nick,
			token,
			provider,
			givenName,
		);

		expect(result).toEqual({ jwt: '123456789!@#$', userInfo: { nick } });
	});
});
