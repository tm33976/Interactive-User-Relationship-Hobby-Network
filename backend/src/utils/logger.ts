const getTimestamp = (): string => new Date().toISOString();

export const logger = {
  info: (message: string) => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`);
  },
  warn: (message: string) => {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`);
  },
  error: (message: string, error?: Error) => {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`, error || '');
  },
  http: (message: string) => {
    console.log(`[${getTimestamp()}] [HTTP] ${message}`);
  },
};