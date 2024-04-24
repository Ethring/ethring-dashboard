module.exports = {
    root: true,
    env: {
        node: true,
    },
    settings: {
        'import/resolver': {
            node: {
                paths: ['src'],
                modulesDirectories: ['node_modules'],
            },
        },
    },
    extends: [
        'plugin:vue/vue3-recommended',
        'plugin:storybook/recommended',
        'plugin:@typescript-eslint/recommended',

        'plugin:vue/vue3-essential',
        '@vue/eslint-config-typescript/recommended',

        'plugin:prettier/recommended',
        'prettier',
    ],

    plugins: ['prettier', '@typescript-eslint'],

    parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
        parser: '@babel/eslint-parser',
    },

    rules: {
        curly: ['warn', 'multi', 'consistent'],

        'no-unused-vars': ['warn'],

        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-case-declarations': 'off',

        'arrow-parens': ['error', 'always'],
        'no-irregular-whitespace': 'off',

        'vue/require-typed-ref': 'off', // Should be enabled
        'vue/require-default-prop': 'off',
        'vue/one-component-per-file': 'off',
        'vue/require-v-for-key': 'warn',

        'vue/multi-word-component-names': 'off',
        'vue/max-attributes-per-line': 'off',
        'vue/no-side-effects-in-computed-properties': 'warn',

        '@typescript-eslint/no-unused-vars': 'off',

        // Prettier
        'prettier/prettier': [
            'error',
            {},
            {
                fileInfoOptions: {
                    withNodeModules: true,
                },
                endOfLine: 'auto',
                trailingComma: 'all',
            },
        ],
    },
    overrides: [
        // * Overrides for Vitest & Jest
        {
            files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
            env: {
                jest: true,
            },
        },

        // * Overrides for TypeScript
        {
            files: ['*.ts'],
            parser: '@typescript-eslint/parser',
            extends: ['plugin:@typescript-eslint/recommended'],
            rules: {
                curly: ['warn', 'multi', 'consistent'],
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': 'warn',
                '@typescript-eslint/no-explicit-any': 'off',
            },
        },
    ],
};
