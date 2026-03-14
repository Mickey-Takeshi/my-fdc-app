import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export function apiLogger(context: {
  service: string;
  workspaceId?: string;
}) {
  return logger.child({ ...context, correlationId: crypto.randomUUID() });
}
