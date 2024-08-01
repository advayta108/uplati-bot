# @advayta108/uplati-sdk

TypeScript SDK для работы с API Uplati (Система Город).

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
- Получение списка счетчиков
- Отправка показаний счетчиков
- Получение квитанций
- Получение истории транзакций
- Получение/настройка/удаление автоплатежей

## API клиента

`UplatiClient`:

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

Если вы работаете внутри `ts-uplati-bot`:

```bash
npm install
npm run build:lib
```

Для публикации из монорепозитория:

```bash
npm run publish:lib
```

## Документация проекта

- Основной репозиторий (EN): `../../README.md`
- Основной репозиторий (RU): `../../README.RU.md`

