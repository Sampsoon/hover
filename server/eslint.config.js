import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

const tsFiles = ['**/*.ts'];

export default [
  { ignores: ['.vercel'] },
  { files: tsFiles, ...js.configs.recommended },
  ...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: tsFiles })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({ ...config, files: tsFiles })),
  { files: tsFiles, ...eslintConfigPrettier },
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 2022,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'prettier/prettier': 'error',
    },
  },
];
