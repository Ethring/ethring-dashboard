module.exports = {
    './src/**/*.js': ['npm run lint:code', 'npm run lint:code:fix', 'npm run test:unit'],
    './src/**/*.vue': ['npm run lint:style'],
};
