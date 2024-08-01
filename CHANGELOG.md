# История изменений

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

