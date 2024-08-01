# Инструкция по публикации библиотеки в npm

## Подготовка к публикации

### 1. Настройка npm аккаунта

Если у вас ещё нет аккаунта на npm:

```bash
npm adduser
# или
npm login
```

### 2. Проверка настроек package.json

Убедитесь, что в `lib/uplati-sdk/package.json` указаны:
- Правильное имя пакета (например, `@advayta108/uplati-sdk` или `uplati-sdk`)
- Версия пакета
- Автор и репозиторий

### 3. Сборка библиотеки

```bash
cd lib/uplati-sdk
npm run build
```

### 4. Проверка содержимого перед публикацией

```bash
# Проверка, что будет опубликовано
npm pack --dry-run

# Просмотр содержимого архива
npm pack
```

## Публикация

### Вариант 1: Публикация из директории библиотеки

```bash
cd lib/uplati-sdk
npm publish
```

### Вариант 2: Публикация с указанием директории

```bash
npm publish --workspace=lib/uplati-sdk
```

### Вариант 3: Публикация scoped пакета (если используете @advayta108/uplati-sdk)

Если имя пакета начинается с `@`, это scoped пакет. Для публикации:

```bash
cd lib/uplati-sdk
npm publish --access public
```

## Обновление версии

### Использование npm version

```bash
cd lib/uplati-sdk

# Патч версия (1.0.0 -> 1.0.1)
npm version patch

# Минорная версия (1.0.0 -> 1.1.0)
npm version minor

# Мажорная версия (1.0.0 -> 2.0.0)
npm version major
```

После обновления версии:

```bash
npm run build
npm publish
```

## Установка опубликованного пакета

После публикации, другие проекты могут установить библиотеку:

```bash
npm install @advayta108/uplati-sdk
# или
npm install uplati-sdk
```

## Использование в проекте

```typescript
import { UplatiClient } from '@advayta108/uplati-sdk';

const client = new UplatiClient();
await client.authenticate('email', 'password');
```

## Отзыв пакета (если нужно)

⚠️ **Внимание**: Отзыв пакета возможен только в течение 72 часов после публикации!

```bash
npm unpublish @advayta108/uplati-sdk@1.0.0
```

## Полезные команды

```bash
# Проверка информации о пакете
npm view @advayta108/uplati-sdk

# Проверка версий
npm view @advayta108/uplati-sdk versions

# Проверка последней версии
npm view @advayta108/uplati-sdk version
```

