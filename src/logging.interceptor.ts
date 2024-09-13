import {
	CallHandler,
	ExecutionContext,
	HttpException,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import logger from './logging.logger';

@Injectable()
class LoggingInterceptor implements NestInterceptor {
	// eslint-disable-next-line class-methods-use-this
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const requestTime = Date.now();
		const request = context.switchToHttp().getRequest();

		logger.info({
			level: 'info',
			method: request.method,
			headers: request.headers,
			url: request.url,
			query: request.query,
			body: request.body,
			ip: request.ip,
		});

		return next
			.handle()
			.pipe(
				tap((data: any) => {
					const responseTime = Date.now();
					const response = context.switchToHttp().getResponse();

					logger.info({
						level: 'info',
						elapsedTime: responseTime - requestTime,
						statusCode: response.statusCode,
						url: request.url,
						data,
						headers: response.getHeaders(),
						ip: request.ip,
					});
				}),
			)
			.pipe(
				catchError((error) => {
					if (error instanceof HttpException) {
						logger.error({
							level: 'error',
							statusCode: error.getStatus(),
							errorMessage: error.message || 'HttpException',
							url: request.url,
							headers: request.headers,
							query: request.query,
							body: request.body,
							ip: request.ip,
						});
					} else {
						logger.error({
							level: 'error',
							statusCode: error.statusCode || 500,
							errorMessage:
								error.message || 'Unhandled error message',
							url: request.url,
							headers: request.headers,
							query: request.query,
							body: request.body,
							ip: request.ip,
						});
					}
					throw error;
				}),
			);
	}
}

export default LoggingInterceptor;
