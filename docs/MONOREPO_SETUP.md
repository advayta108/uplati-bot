# Настройка монорепозитория (рекомендуется)

## Зачем разделять проект?

Разделение проекта на библиотеку и бот даёт следующие преимущества:
- ✅ Независимая версионирование библиотеки
- ✅ Возможность использовать библиотеку в других проектах
- ✅ Упрощённая публикация в npm
- ✅ Чёткое разделение ответственности
- ✅ Упрощённое тестирование

## Вариант 1: Монорепозиторий с workspaces (рекомендуется)

### Структура проекта

```
ts-uplati-bot/
├── packages/
│   ├── uplati-sdk/          # Библиотека SDK
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── uplati-bot/          # Telegram бот
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── package.json             # Root package.json с workspaces
└── tsconfig.json
```

### Настройка

1. **Обновить корневой package.json:**

```json
{
  "name": "uplati-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "build:sdk": "npm run build --workspace=@advayta108/uplati-sdk",
    "build:bot": "npm run build --workspace=uplati-bot"
  }
}
```

2. **Переместить библиотеку:**

```bash
mkdir -p packages
mv lib/uplati-sdk packages/uplati-sdk
```

3. **Создать пакет для бота:**

```bash
mkdir -p packages/uplati-bot
# Переместить src/, run.ts и т.д.
```

4. **Установить зависимости:**

```bash
npm install
```

## Вариант 2: Отдельные репозитории

### Структура

```
uplati-sdk/          # Отдельный репозиторий для библиотеки
├── src/
├── package.json
└── README.md

uplati-bot/          # Отдельный репозиторий для бота
├── src/
├── package.json
└── README.md
```

### Настройка бота для использования npm пакета

В `package.json` бота:

```json
{
  "dependencies": {
    "@advayta108/uplati-sdk": "^1.0.0"
  }
}
```

## Вариант 3: Текущая структура (проще всего)

Текущая структура уже подходит для монорепозитория:

```
ts-uplati-bot/
├── lib/uplati-sdk/    # Библиотека
└── src/               # Бот
```

### Преимущества текущей структуры:
- ✅ Не требует больших изменений
- ✅ Простая навигация
- ✅ Легко публиковать библиотеку отдельно

### Недостатки:
- ⚠️ Нет явного разделения зависимостей
- ⚠️ Сложнее управлять версиями

## Рекомендация

**Для начала используйте текущую структуру** - она уже хорошо организована. Если проект вырастет, можно перейти на workspaces.

### Миграция на workspaces (когда понадобится)

1. Создать `packages/` директорию
2. Переместить `lib/uplati-sdk` → `packages/uplati-sdk`
3. Создать `packages/uplati-bot` и переместить код бота
4. Обновить корневой `package.json` с workspaces
5. Обновить импорты в коде

