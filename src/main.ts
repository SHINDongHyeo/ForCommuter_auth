import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import AppModule from './auth.module';
import LoggingInterceptor from './logging.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	const port = configService.get<number>('NODE_PORT');
	app.useGlobalInterceptors(new LoggingInterceptor());
	app.useGlobalPipes(new ValidationPipe({
		whitelist: true,      // DTO에 없는 속성은 자동으로 제거
		forbidNonWhitelisted: true,  // DTO에 정의되지 않은 속성이 있으면 에러 발생
		transform: true,       // 요청 데이터를 DTO로 자동 변환
	}));
	await app.listen(port);
}
bootstrap();
