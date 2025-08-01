import json from '@eslint/json';
import markdown from '@eslint/markdown';
import css from '@eslint/css';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';
import tsc from 'eslint-plugin-tsc';
import js from '@eslint/js';

import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['package-lock.json', '**/*.d.ts', 'dist/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [js.configs.recommended],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'max-len': ['error', { code: 150, tabWidth: 2 }],
      semi: ['error', 'always'],
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prettier/prettier': ['warn'],
    },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    rules: json.configs.recommended.rules,
  },
  {
    files: ['**/*.jsonc'],
    plugins: { json },
    language: 'json/jsonc',
    rules: json.configs.recommended.rules,
  },
  {
    files: ['**/*.json5'],
    plugins: { json },
    language: 'json/json5',
    rules: json.configs.recommended.rules,
  },
  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/commonmark',
    rules: markdown.configs.recommended[0].rules,
  },
  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    rules: css.configs.recommended.rules,
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    extends: [...tseslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    plugins: {
      prettier: prettierPlugin,
      tsc,
    },
    rules: {
      strict: ['error', 'global'],
      'max-len': ['error', { code: 150, tabWidth: 2 }],
      semi: ['error', 'always'],
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'prettier/prettier': ['warn'],
      'tsc/config': [
        'error',
        {
          configFile: 'tsconfig.json',
        },
      ],
    },
  },
);
