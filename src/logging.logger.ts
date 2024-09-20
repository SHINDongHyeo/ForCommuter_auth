import { createLogger, format, transports } from 'winston';
import * as moment from 'moment-timezone';

const customFormat = format.printf(({ message, timestamp }) => {
	return JSON.stringify(
		{
			timestamp,
			...message,
		},
		null,
		2,
	);
});

const logger = createLogger({
	format: format.combine(
		format.timestamp({
			format: () =>
				moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss'),
		}),
		customFormat,
	),
	transports: [
		new transports.Console(),
		new transports.File({ filename: './logs/auth.log' }),
	],
});

export default logger;
