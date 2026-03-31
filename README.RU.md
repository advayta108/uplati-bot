
<h1 align="center">UPLATI-BOT-SDK-MONOREPO</h1>

<p align="center">
  <img src="https://lk.uplati.ru/images/logo.png" alt="Система Город Logo" width="220" />
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://www.npmjs.com/package/telegraf"><img src="https://img.shields.io/badge/Telegraf-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegraf" /></a>
  <a href="https://axios-http.com/"><img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" /></a>
  <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
</p>

<p align="center">
  <a href="./README.md"><img src="https://img.shields.io/badge/English-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="English" /></a>
  <a href="./README.RU.md"><img src="https://img.shields.io/badge/Русский-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="Русский" /></a>
</p>

<p align="center">
  <a href="https://uplati.ru"><img src="https://img.shields.io/badge/API_Version-3.25.10-orange.svg" alt="API Version" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/deploy.yml/badge.svg" alt="Deploybot" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/build.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/build.yml/badge.svg" alt="Build" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/lint.yml/badge.svg" alt="Lint" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml/badge.svg" alt="Publish SDK" /></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fadvayta108%2Fuplati-bot?ref=badge_small"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fadvayta108%2Fuplati-bot.svg?type=small" alt="FOSSA Status" /></a>
</p>

`UPLATI-BOT-SDK-MONOREPO` — это production-ориентированный TypeScript-монорепозиторий для работы с сервисом [Система Город](https://uplati.ru).
Он объединяет SDK-библиотеку для интеграции с API и полноценный пример Telegram-бота с реальными сценариями: авторизация, получение счетчиков, отправка показаний, квитанции и транзакции.
Репозиторий настроен так, чтобы из одного кода можно было публиковать SDK в npm и деплоить бота через GitHub Actions.
Пример развернутого бота: [@uplatibot](https://t.me/uplatibot).

Монорепозиторий на TypeScript с двумя частями:

- `lib/uplati-sdk` - npm SDK для API Uplati
- `src/` + `run.ts` - Telegram-бот и фоновый отправщик показаний

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
