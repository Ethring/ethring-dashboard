module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'config',
                'init',
                'feat',
                'fix',
                'docs',
                'style',
                'refactor',
                'perf',
                'test',
                'build',
                'ci',
                'chore',
                'revert',
                'workflow',
                'mod',
                'types',
                'release',
                'add',
                'update',
                'merge'
            ],
        ],
        'subject-full-stop': [0, 'never'],
        'subject-case': [0, 'never'],
    },
};
