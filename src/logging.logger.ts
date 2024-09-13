import { createLogger, format, transports } from 'winston';

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
	format: format.combine(format.timestamp(), customFormat),
	transports: [
		new transports.Console(),
		new transports.File({ filename: './logs/auth.log' }),
	],
});

export default logger;
