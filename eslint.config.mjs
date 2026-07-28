// File: eslint.config.mjs
//
// ESLint 9 usa "flat config" por default y ya no lee automáticamente
// .eslintrc.js (formato legacy -- borrar ese archivo, quedó reemplazado por
// este). FlatCompat envuelve eslint-config-next/eslint-config-prettier, que
// todavía se distribuyen en formato legacy, para que sigan funcionando acá.
// Mismo parser y mismas reglas que tenía .eslintrc.js, sin cambios de
// comportamiento -- el objetivo de esta migración es que ESLint vuelva a
// correr en CI, no endurecer ni relajar ninguna regla existente.
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'dist/**'],
  },
  {
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': typescriptPlugin },
    settings: { react: { version: 'detect' } },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'no-console': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
];

export default eslintConfig;
