# История изменений

## Версия 2.1.0 — тесты, CI и автоотправка

### Новое

1. **Vitest** — юнит-тесты расписания (`computeInitialNextSend`, `nextMonthlySendAfterSuccess`, `meterRowQualifiesForAutoSend`) и проверки БД для автоотправки (`setMeterAutoConfig`, `getMetersWithAutoForUser`) с временным файлом через `USERS_DB_PATH`.
2. **Интеграционные тесты API** (`tests/uplati-api.integration.test.ts`): при заданных в CI переменных `TEST_USER_EMAIL` и `TEST_USER_PASS` (GitHub Secrets) выполняются проверки авторизации, повторной отправки текущих показаний счётчиков, а также вызовов `getReceipts`, `getTransactions`, `getAutopayments`. Локально без этих переменных блок пропускается; в CI при их отсутствии сборка падает с явной ошибкой.
3. **Workflow `.github/workflows/test.yml`** — последовательно `build`, `build:lib`, `lint`, `vitest`; перед тестами выполняется `npm rebuild better-sqlite3` под версию Node на раннере.
4. **`meterRowQualifiesForAutoSend`** вынесен в `src/meterSchedule.ts` и используется в `run.ts` (единая логика отбора счётчиков для автоотправки).
5. **`USERS_DB_PATH` и `__resetDbSingletonForTests`** в `database.ts` — изоляция тестов БД без затрагивания `data/users.db`.
6. **`sendSensorValue` в `src/api.ts`** возвращает `Promise<boolean>`, как `UplatiClient.sendMeterValue` в SDK; интерактивный `test.ts` учитывает отказ API.
7. **`server.ts`** — локальный мок под dry-run: `GET /api/user/counters`, `POST /api/sensor/:id/value` (при `SEND_DATA=false` SDK бьёт в этот мок; авторизация по умолчанию остаётся на gw3).
8. **SDK (`lib/uplati-sdk`)** — список счётчиков с `GET /api/user/counters` (fallback на `/sensors` при 404); разбор ответов с полями `sensors` или `counters`; авторизация через настоящий `multipart/form-data`; заголовки `x-client: web;2.8.5;desktop` в духе ЛК; при `sendDataEnabled: false` отправка показаний идёт в мок. Бейджи версии API в README: **3.33.23**.
9. **`dependabot-auto-merge.yml`** (из предыдущего релиза) — автослияние PR Dependabot при включённом auto-merge в настройках репозитория.
10. **Бот и фоновая отправка** — `/status` со сверкой API и БД, мастер `/set_auto_meters`, `/auto_meters_status`, колонка `auto_send_day`, очистка устаревших счётчиков; в `run.ts` — уведомления в Telegram после автоотправки.

### Совместимость с SDK

- Обёртка `src/api.ts` по-прежнему делегирует в `@advayta108/uplati-sdk`; изменение контракта `sendSensorValue` согласовано с возвращаемым значением клиента.
- Ошибки получения счётчиков в SDK по-прежнему пробрасываются (не маскируются пустым массивом), что важно для синхронизации БД в боте.

## Версия 2.0.0 - Рефакторинг в библиотеку

### Основные изменения

1. **Создана библиотека `lib/uplati-sdk`**
   - Вынесены все API функции в отдельную библиотеку
   - Создан класс `UplatiClient` для удобной работы с API
   - Добавлены TypeScript типы для всех сущностей

2. **Исправлена проблема с обновлением данных при запуске**
   - При запуске бота теперь автоматически обновляются данные всех пользователей из API
   - Добавлена команда `/update` для ручного обновления данных
   - Улучшена обработка устаревших токенов

3. **Расширена функциональность библиотеки**
   - Добавлена функция получения списка квитанций (`getReceipts`)
   - Добавлена функция получения последних транзакций (`getTransactions`)
   - Добавлена функция получения списка автоплатежей (`getAutopayments`)
   - Добавлена функция настройки автоплатежей (`setAutopayment`)
   - Добавлена функция удаления автоплатежей (`deleteAutopayment`)

4. **Новые команды бота**
   - `/update` - обновить данные из API
   - `/receipts` - получить список квитанций
   - `/transactions` - получить последние транзакции

5. **Улучшения базы данных**
   - Добавлена функция `upsertMeter` для обновления или добавления счётчика
   - Добавлена функция `updateMeter` для обновления счётчика
   - Добавлена функция `updateUserToken` для обновления токена
   - Добавлена функция `getAllUsers` для получения всех пользователей
   - Добавлена функция `getUser` для получения пользователя по chatId

### Структура проекта

```
.
├── lib/
│   └── uplati-sdk/          # Библиотека SDK
│       ├── src/
│       │   ├── index.ts     # Главный экспорт
│       │   ├── client.ts    # Класс UplatiClient
│       │   ├── api.ts       # API функции
│       │   ├── types.ts     # TypeScript типы
│       │   └── headers.ts   # Заголовки запросов
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── src/
│   ├── api.ts               # Обёртка для обратной совместимости
│   ├── database.ts          # Работа с БД (расширена)
│   ├── telebot.ts           # Telegram бот (обновлён)
│   ├── headers.ts           # (можно удалить, используется библиотека)
│   └── logging.ts
└── run.ts                   # Скрипт автоматической отправки (обновлён)
```

### Использование библиотеки

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

// Получение квитанций
const receipts = await client.getReceipts();

// Получение транзакций
const transactions = await client.getTransactions(10);

// Работа с автоплатежами
const autopayments = await client.getAutopayments();
await client.setAutopayment({ service_id: 123, enabled: true });
```

### Обратная совместимость

Файл `src/api.ts` сохранён для обратной совместимости и теперь использует библиотеку под капотом.

