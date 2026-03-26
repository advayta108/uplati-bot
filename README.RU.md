# UPLATI-BOT-SDK-MONOREPO

<p align="center">
  <img src="https://lk.uplati.ru/images/logo.png" alt="Логотип Система Город" width="220" />
</p>

[![Docs EN](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Docs RU](https://img.shields.io/badge/Docs-Russian-green)](README.RU.md)
[![API Version](https://img.shields.io/badge/API_Version-3.25.10-orange.svg)](https://uplati.ru)
[![Deploybot](https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml/badge.svg)](https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml)
[![Build](https://github.com/advayta108/uplati-bot/actions/workflows/build.yml/badge.svg)](https://github.com/advayta108/uplati-bot/actions/workflows/build.yml)
[![Lint](https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml/badge.svg)](https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml)
[![Publish SDK](https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml/badge.svg)](https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml)

`UPLATI-BOT-SDK-MONOREPO` — это production-ориентированный TypeScript-монорепозиторий для работы с сервисом [Система Город](https://uplati.ru).
Он объединяет SDK-библиотеку для интеграции с API и полноценный пример Telegram-бота с реальными сценариями: авторизация, получение счетчиков, отправка показаний, квитанции и транзакции.
Репозиторий настроен так, чтобы из одного кода можно было публиковать SDK в npm и деплоить бота через GitHub Actions.
Пример развернутого бота: [@uplatibot](https://t.me/uplatibot).

Монорепозиторий на TypeScript с двумя частями:

- `lib/uplati-sdk` - npm SDK для API Uplati
- `src/` + `run.ts` - Telegram-бот и фоновый отправщик показаний

English version: `README.md`

## 🧱 Структура

```text
.
├── lib/uplati-sdk/      # Пакет SDK
├── src/                 # Код Telegram-бота
├── run.ts               # Фоновая отправка показаний
└── docs/                # Инструкции по деплою и публикации
```

## 🚀 Быстрый старт

```bash
npm install
```

Создайте `.env`:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SEND_DATA=true
```

Запуск:

```bash
# Telegram-бот
npm run bot

# Автоматическая отправка показаний
npm start
```

## 🤖 Команды бота

- `/adduser` - регистрация пользователя
- `/status` - текущий статус счетчиков
- `/update` - обновление данных из API
- `/receipts` - список квитанций
- `/transactions` - последние транзакции

## 🛠️ Разработка

```bash
# Сборка проекта
npm run build

# Сборка SDK
npm run build:lib

# Линтинг
npm run lint
```

## 📦 Использование SDK

```bash
npm install @advayta108/uplati-sdk
```

Пакет на npm: [npmjs.com/package/@advayta108/uplati-sdk](https://www.npmjs.com/package/@advayta108/uplati-sdk)

```typescript
import { UplatiClient } from '@advayta108/uplati-sdk';
```

Подробная документация SDK: [`lib/uplati-sdk/README.md`](lib/uplati-sdk/README.md) (EN), [`lib/uplati-sdk/README.RU.md`](lib/uplati-sdk/README.RU.md) (RU)

Публикация SDK из корня:

```bash
npm run publish:lib
```

## 📚 Документация

- Деплой бота: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- Публикация библиотеки: [`docs/PUBLISHING_GUIDE.md`](docs/PUBLISHING_GUIDE.md)
- Настройка монорепозитория: [`docs/MONOREPO_SETUP.md`](docs/MONOREPO_SETUP.md)

## ✅ TODO

- Список задач проекта: [`TODO.md`](TODO.md)

## ✅ Требования

- Node.js >= 18
- npm
- Telegram Bot Token от [@BotFather](https://t.me/BotFather)

## 📄 Лицензия

MIT. См. [`LICENSE`](LICENSE).
