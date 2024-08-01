// @ts-check

import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser'; // Импортируем TypeScript парсер

import { fileURLToPath } from 'url';
import path from 'path';

// Получаем путь к текущему файлу и директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parser: tsParser, // Указываем tsParser как используемый парсер
      parserOptions: {
        project: './tsconfig.json', // Указываем путь к tsconfig.json для TypeScript
        tsconfigRootDir: __dirname, // Корневая директория для tsconfig.json
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
        // Убираем NodeJS из глобальных, TypeScript уже должен его знать
      },
    },
    plugins: {
      '@typescript-eslint': tsEslint,
    },
    rules: {
      ...eslint.configs.recommended.rules, // Стандартные правила ESLint
      ...tsEslint.configs['recommended'].rules, // Рекомендуемые правила для TypeScript
    },
    ignores: ['js/**', 'build/**', '**/*.js'], // Игнорируем скомпилированные файлы
  },
];
