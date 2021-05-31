module.exports = {
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        '@tophat/eslint-config/base',
        '@tophat/eslint-config/jest',
    ],
    ignorePatterns: ['lib/'],
    parser: '@typescript-eslint/parser',
    rules: {
        '@typescript-eslint/no-unused-vars': 2,
        'no-unused-var': 0,
        'sort-imports': 2,
        'sort-keys': 2,
    },
    settings: {
        'import/internal-regex': '^@react-vector-graphics/',
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
}
