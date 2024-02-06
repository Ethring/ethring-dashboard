import { createLogger } from 'vue-logger-plugin';

const isProduction = import.meta.env.NODE_ENV === 'production';

// create logger with options
const logger = createLogger({
    enabled: true,
    level: isProduction ? 'error' : 'debug',
});

export default logger;
