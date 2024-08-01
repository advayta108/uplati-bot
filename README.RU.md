[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT) [![Status](https://img.shields.io/badge/Project%20Stage-Development-red.svg)](https://github.com/advayta108/uplati-bot/blob/main/) [![Deploy Bot](https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml) [![API Version](https://img.shields.io/badge/API_Version-3.25.10-orange)](https://uplati.ru) [![@types/node](https://img.shields.io/badge/@types/node-22.7.6-green)](https://www.npmjs.com/package/@types/node) [![Language](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/) [![Build](https://github.com/advayta108/uplati-bot/actions/workflows/build.yml/badge.svg)](https://github.com/advayta108/uplati-bot/actions/workflows/build.yml) [![Lint](https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml/badge.svg)](https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml) [![tsx](https://img.shields.io/badge/tsx-4.19.1-blue)](https://www.npmjs.com/package/tsx) [![telegraf](https://img.shields.io/badge/telegraf-4.16.3-green)](https://www.npmjs.com/package/telegraf) [![axios](https://img.shields.io/badge/axios-1.7.7-red)](https://www.npmjs.com/package/axios) [![dotenv](https://img.shields.io/badge/dotenv-16.4.5-green)](https://www.npmjs.com/package/dotenv) [![form-data](https://img.shields.io/badge/form--data-4.0.1-orange)](https://www.npmjs.com/package/form-data)<br>

Бот для автоматической отправки показаний счетчиков с помощью сервиса [Система Город](https://uplati.ru) <br>

<img src="https://lk.uplati.ru/images/logo.png" alt="Logo" width="256"/> <br>
# ts-uplati-bot

## 📦 Структура проекта

Проект состоит из двух частей:
- **Библиотека SDK** (`lib/uplati-sdk`) - npm TypeScript-библиотека для работы с API Uplati
- **Telegram бот** (`src/telebot.ts`) - бот и пример использования SDK

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SEND_DATA=true
```

### 3. Запуск бота

#### Вариант 1: Запуск через npm скрипт (рекомендуется)

```bash
# Запуск Telegram бота
npm run bot

# Или запуск автоматической отправки показаний
npm start
```

#### Вариант 2: Прямой запуск через tsx

```bash
# Telegram бот
npx tsx src/telebot.ts

# Автоматическая отправка показаний
npx tsx run.ts
```

#### Вариант 3: Через скрипты для разных ОС

**Windows:**
```powershell
.\start.ps1
# или
.\start.bat
```

**Linux/MacOS:**
```bash
chmod +x start.sh
./start.sh
```

## 📋 Команды бота

После запуска бота, пользователи могут использовать следующие команды:

- `/adduser` - Регистрация нового пользователя (ввод email и пароля)
- `/status` - Просмотр текущего статуса счётчиков
- `/update` - Обновить данные из API
- `/receipts` - Получить список квитанций
- `/transactions` - Получить последние транзакции

## 🔧 Разработка

### Сборка проекта

```bash
# Сборка основного проекта
npm run build

# Сборка библиотеки
npm run build:lib
```

### Использование библиотеки в своём проекте

```typescript
import { UplatiClient } from '@advayta108/uplati-sdk';

const client = new UplatiClient({
  sendDataEnabled: true,
  logger: console.log,
});

// Авторизация
await client.authenticate('email@example.com', 'password');

// Получение счётчиков
const meters = await client.getMeters();

// Отправка показаний
await client.sendMeterValue(sensorId, 123.45);
```

## 📚 Документация библиотеки

Подробная документация по библиотеке находится в [`lib/uplati-sdk/README.md`](lib/uplati-sdk/README.md)

Пакет для npm: `@advayta108/uplati-sdk`

Публикация из корня монорепозитория:

```bash
npm run publish:lib
```

## 🛠️ Требования

- Node.js >= 18.x
- npm или yarn
- Telegram Bot Token (получить у [@BotFather](https://t.me/BotFather))

## 📝 Лицензия

MIT
