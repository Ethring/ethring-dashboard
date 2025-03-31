import { createLogger, LogLevel } from 'vue-logger-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';

export default createLogger({
    enabled: true,
    level: isProduction ? 'error' : DEFAULT_LOG_LEVEL,
});
