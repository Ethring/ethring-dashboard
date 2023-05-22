module.exports = {
    hooks: {
        'pre-commit': 'npm run lint:code && npm run lint:code:fix',
        'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
    },
};
