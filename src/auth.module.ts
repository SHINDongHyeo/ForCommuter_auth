import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

import { OAuth2Client } from 'google-auth-library';

import AuthService from './auth.service';
import AuthController from './auth.controller';

import User from './entities/auth.entity';

@Module({
	imports: [
		ConfigModule.forRoot({}),
		TypeOrmModule.forRoot({
			type: 'mysql',
			host: process.env.DB_HOST,
			port: parseInt(process.env.DB_PORT, 10),
			username: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			entities: [User],
			synchronize: true,
		}),
		TypeOrmModule.forFeature([User]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '1y' },
			}),
		}),
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		{
			provide: OAuth2Client,
			useFactory: () => {
				return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
			},
		},
	],
})
export default class AppModule {}
