<h1 align="center">@advayta108/uplati-sdk</h1>

<p align="center">
  <img src="https://lk.uplati.ru/images/logo.png" alt="Система Город Logo" width="220" />
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://axios-http.com/"><img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" /></a>
  <a href="https://github.com/form-data/form-data"><img src="https://img.shields.io/badge/Form--data-000000?style=for-the-badge&logo=npm&logoColor=white" alt="Form-data" /></a>
</p>

<p align="center">
  <a href="https://github.com/advayta108/uplati-bot/blob/main/lib/uplati-sdk/README.md"><img src="https://img.shields.io/badge/English-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="English" /></a>
  <a href="https://github.com/advayta108/uplati-bot/blob/main/lib/uplati-sdk/README.RU.md"><img src="https://img.shields.io/badge/Русский-0052CC?style=for-the-badge&logo=github&logoColor=white" alt="Русский" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@advayta108/uplati-sdk/v/1.0.4"><img src="https://img.shields.io/static/v1?label=npm&message=1.0.4&color=CB3837&logo=npm&logoColor=white&style=flat-square" alt="npm 1.0.4" /></a>
  <a href="https://uplati.ru"><img src="https://img.shields.io/badge/API_Version-3.25.10-orange.svg" alt="API Version" /></a>
  <a href="https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml"><img src="https://github.com/advayta108/uplati-bot/actions/workflows/publish-sdk.yml/badge.svg" alt="Publish SDK" /></a>
  <a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fadvayta108%2Fuplati-bot?ref=badge_small"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fadvayta108%2Fuplati-bot.svg?type=small" alt="FOSSA Status" /></a>
</p>

**TypeScript SDK** для работы с API сервиса [«Система город»](https://uplati.ru) (Uplati). Авторизация, счётчики, показания, квитанции, транзакции и автоплатежи.

## Установка

```bash
npm install @advayta108/uplati-sdk
```

## Быстрый старт

```typescript
import { UplatiClient } from '@advayta108/uplati-sdk';

const client = new UplatiClient({
  sendDataEnabled: true,
  logger: (message) => console.log('[uplati-sdk]', message),
});

await client.authenticate('email@example.com', 'password');

const meters = await client.getMeters();
await client.sendMeterValue(meters[0].id, 123.45);
```

## Возможности

- Авторизация и управление токеном сессии
- Получение списка счётчиков
- Отправка показаний
- Получение квитанций
- История транзакций
- Получение / настройка / удаление автоплатежей

## API клиента `UplatiClient`

- `authenticate(email: string, password: string): Promise<string>`
- `setToken(token: string): void`
- `getToken(): string | null`
- `getMeters(): Promise<Sensor[]>`
- `sendMeterValue(sensorId: number, sensorValue: number | string): Promise<boolean>`
- `getReceipts(): Promise<Receipt[]>`
- `getTransactions(limit?: number): Promise<Transaction[]>`
- `getAutopayments(): Promise<Autopayment[]>`
- `setAutopayment(settings: AutopaymentSettings): Promise<boolean>`
- `deleteAutopayment(autopaymentId: number): Promise<boolean>`

## Экспортируемые типы

```typescript
import {
  Sensor,
  Receipt,
  Transaction,
  Autopayment,
  AutopaymentSettings,
} from '@advayta108/uplati-sdk';
```

## Настройки клиента

```typescript
new UplatiClient({
  sendDataEnabled: true, // false -> тестовый режим без отправки
  baseUrl: 'https://gw3-online.uplati.ru/api',
  logger: console.log,
});
```

## Разработка в монорепозитории

Если вы работаете внутри **UPLATI-BOT-SDK-MONOREPO**:

```bash
npm install
npm run build:lib
```

Публикация из монорепозитория:

```bash
npm run publish:lib
```

## Документация

- Монорепозиторий (EN): [README.md](https://github.com/advayta108/uplati-bot/blob/main/README.md)
- Монорепозиторий (RU): [README.RU.md](https://github.com/advayta108/uplati-bot/blob/main/README.RU.md)
- Деплой: [docs/DEPLOY.md](https://github.com/advayta108/uplati-bot/blob/main/docs/DEPLOY.md)
- Публикация: [docs/PUBLISHING_GUIDE.md](https://github.com/advayta108/uplati-bot/blob/main/docs/PUBLISHING_GUIDE.md)
- Монорепо: [docs/MONOREPO_SETUP.md](https://github.com/advayta108/uplati-bot/blob/main/docs/MONOREPO_SETUP.md)

## Лицензия

MIT. См. [LICENSE](https://github.com/advayta108/uplati-bot/blob/main/lib/uplati-sdk/LICENSE).
