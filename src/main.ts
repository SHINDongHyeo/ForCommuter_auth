import { NestFactory } from '@nestjs/core';
import { AppModule } from './auth.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const port = configService.get<number>('NODE_PORT');
    await app.listen(port);
}
bootstrap();
