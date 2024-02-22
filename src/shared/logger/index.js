import { createLogger } from 'vue-logger-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// create logger with options
const logger = createLogger({
    enabled: true,
    level: isProduction ? 'error' : LOG_LEVEL,
});

export default logger;
