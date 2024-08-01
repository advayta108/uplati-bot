# 🚀 Быстрый старт

## 1. Как запустить бота?

### Шаг 1: Установка зависимостей
```bash
npm install
```

### Шаг 2: Создание .env файла
Создайте файл `.env` в корне проекта:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SEND_DATA=true
```

### Шаг 3: Запуск бота
```bash
# Вариант 1: Через npm скрипт (рекомендуется)
npm run bot

# Вариант 2: Прямой запуск
npx tsx src/telebot.ts

# Вариант 3: Через скрипты
# Windows: .\start.bat или .\start.ps1
# Linux/Mac: ./start.sh
```

### Шаг 4: Запуск автоматической отправки показаний (опционально)
В отдельном терминале:
```bash
npm start
# или
npx tsx run.ts
```

## 2. Как опубликовать библиотеку в npm?

### Подготовка
```bash
cd lib/uplati-sdk
npm run build
```

### Публикация
```bash
# Если используете scoped пакет (@advayta108/uplati-sdk)
npm publish --access public

# Если обычный пакет (uplati-sdk)
npm publish
```

### Обновление версии
```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
npm run build
npm publish
```

📖 **Подробная инструкция**: см. [PUBLISH.md](PUBLISH.md)

## 3. Разделение проекта

### Текущая структура (уже разделена!)
```
ts-uplati-bot/
├── lib/uplati-sdk/    # Библиотека (можно публиковать в npm)
└── src/               # Бот (использует библиотеку)
```

### Рекомендация
**Текущая структура уже хорошо разделена!** Можно:
- ✅ Публиковать `lib/uplati-sdk` в npm отдельно
- ✅ Использовать библиотеку в других проектах
- ✅ Держать бот и библиотеку в одном репозитории

### Если нужен полный монорепозиторий
📖 **Инструкция**: см. [MONOREPO_SETUP.md](MONOREPO_SETUP.md)

