import { createLogger, format, transports } from "winston";

const { combine, timestamp, colorize, align, printf } = format;

const logger = createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp(),
    align(),
    printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`)
  ),
  transports: [new transports.Console()],
});

export default logger;