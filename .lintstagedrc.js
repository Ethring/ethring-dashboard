module.exports = {
    '*.js': ['npm run lint:code', 'npm run lint:code:fix', 'npm run test:unit'],
    '*.vue': ['npm run lint:style'],
};
