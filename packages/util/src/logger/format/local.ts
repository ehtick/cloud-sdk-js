import chalk from 'chalk';
import { format } from 'winston';
import type { TransformableInfo } from 'logform';

const { combine, timestamp, cli, printf, errors } = format;

/**
 * Format for local logging.
 */
export const local = combine(
  errors({ stack: true }),
  timestamp(),
  format(localTransformer)(),
  cli(),
  printf(info => {
    const messageContext =
      info.custom_fields && info.custom_fields.messageContext
        ? `${chalk.blue(`(${info.custom_fields.messageContext})`)}: `
        : '';
    const trimmedMessage = info.message.replace(/^\s*/, '');
    const paddingLength =
      info.message.length - trimmedMessage.length + messageContext.length;
    if (info.error) {
      info.level = chalk.inverse(info.level);
    }
    return `${chalk.gray(`[${info.timestamp}]`)} ${
      info.level
    } ${messageContext.padStart(paddingLength, ' ')}${trimmedMessage}`;
  })
);
/**
 * Gets the stack of the given error if available, otherwise the message.
 * @param info - Object to be transformed.
 * @returns The message string to be used.
 * @internal
 */
export function getMessageOrStack(info: TransformableInfo): string {
  return info.stack && info.level === 'error' ? info.stack : info.message;
}

function localTransformer(info: TransformableInfo): TransformableInfo {
  return {
    ...info,
    level: info.level.toUpperCase(),
    message: getMessageOrStack(info)
  };
}
