module.exports = {
    root: true,

    env: {
        node: true,
    },

    extends: ['plugin:vue/vue3-essential', 'eslint:recommended', 'plugin:prettier/recommended'],
    plugins: ['prettier'],

    parserOptions: {
        parser: '@babel/eslint-parser',
    },

    rules: {
        'no-console': import.meta.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': import.meta.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'vue/require-default-prop': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/max-attributes-per-line': 'off',
        'arrow-parens': ['error', 'always'],
        'no-irregular-whitespace': 'off',
        curly: 'error',
        'prettier/prettier': [
            'error',
            {},
            {
                fileInfoOptions: {
                    withNodeModules: true,
                },
                endOfLine: 'warn',
            },
        ],
    },

    overrides: [
        {
            files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
            env: {
                jest: true,
            },
        },
    ],
};
