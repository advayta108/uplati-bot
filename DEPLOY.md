# 🚀 Инструкция по развертыванию бота на сервере

## Вариант 1: Автоматический деплой через GitHub Actions (рекомендуется)

### Шаг 1: Подготовка

1. **Убедитесь, что код закоммичен и запушен в репозиторий:**
   ```bash
   git add .
   git commit -m "Обновление: улучшена логика обновления данных при запуске"
   git push origin main
   ```

2. **GitHub Actions автоматически развернёт код:**
   - Workflow запустится при push в `main`
   - Автоматически остановит старые контейнеры
   - Соберёт и запустит новые контейнеры

### Шаг 2: Проверка деплоя

После завершения workflow проверьте логи:
```bash
ssh root@your-server-ip
cd /home/github/ts-uplati-bot-main
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Вариант 2: Ручной деплой через SSH

### Шаг 1: Подключение к серверу

```bash
ssh root@your-server-ip
```

### Шаг 2: Остановка старого экземпляра

```bash
cd /home/github/ts-uplati-bot-main

# Остановить и удалить контейнеры
docker-compose -f docker-compose.prod.yml down

# Или если бот запущен не через Docker:
# Найти процесс
ps aux | grep "tsx.*telebot"
# Остановить процесс
kill <PID>
```

### Шаг 3: Обновление кода

**Вариант A: Через Git (если репозиторий на сервере)**
```bash
cd /home/github/ts-uplati-bot-main
git pull origin main
```

**Вариант B: Через SCP (копирование с локальной машины)**
```bash
# На локальной машине
scp -r * root@your-server-ip:/home/github/ts-uplati-bot-main
```

### Шаг 4: Установка зависимостей и сборка

```bash
cd /home/github/ts-uplati-bot-main

# Установить зависимости
npm install

# Собрать проект
npm run build
npm run build:lib
```

### Шаг 5: Настройка переменных окружения

```bash
# Создать/обновить .env файл
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_bot_token_here
SEND_DATA=true
EOF
```

### Шаг 6: Запуск через Docker Compose

```bash
# Собрать и запустить контейнеры
docker-compose -f docker-compose.prod.yml up -d --build

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

### Шаг 7: Запуск без Docker (альтернатива)

```bash
# Запустить бота в фоне через PM2 или screen
npm run bot

# Или через screen (для отладки)
screen -S uplati-bot
npm run bot
# Нажать Ctrl+A, затем D для отсоединения
```

---

## Вариант 3: Быстрое обновление (без пересборки)

Если нужно быстро обновить только код без пересборки:

```bash
ssh root@your-server-ip
cd /home/github/ts-uplati-bot-main

# Остановить контейнер
docker-compose -f docker-compose.prod.yml stop

# Обновить код (через git или scp)
git pull origin main
# или
# scp -r src/ lib/ *.ts *.json root@server:/home/github/ts-uplati-bot-main

# Перезапустить контейнер
docker-compose -f docker-compose.prod.yml up -d

# Проверить логи
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Проверка работы бота

### 1. Проверить логи

```bash
# Docker
docker-compose -f docker-compose.prod.yml logs -f

# Или напрямую
tail -f logs/bot.log
```

### 2. Проверить, что бот запущен

```bash
# Проверить контейнеры
docker ps | grep ts-uplati-bot

# Проверить процессы
ps aux | grep "tsx.*telebot"
```

### 3. Проверить в Telegram

Отправьте боту команду `/status` или `/update` и проверьте ответ.

---

## Решение проблем

### Ошибка 409: Conflict

Это означает, что запущен другой экземпляр бота. Решение:

```bash
# Найти все процессы бота
ps aux | grep "tsx.*telebot" | grep -v grep

# Остановить все процессы
pkill -f "tsx.*telebot"

# Или через Docker
docker-compose -f docker-compose.prod.yml down
```

### Бот не обновляет данные

1. Проверьте логи на наличие ошибок
2. Используйте команду `/update` в боте для ручного обновления
3. Проверьте, что токены пользователей валидны

### Проблемы с Docker

```bash
# Очистить всё и пересобрать
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

---

## Автоматический перезапуск при сбоях

Docker Compose уже настроен с `restart: always`, но для дополнительной надёжности можно использовать PM2:

```bash
npm install -g pm2

# Создать ecosystem файл
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'uplati-bot',
    script: 'npm',
    args: 'run bot',
    cwd: '/home/github/ts-uplati-bot-main',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Запустить через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Рекомендации

1. **Всегда останавливайте старый экземпляр** перед запуском нового
2. **Проверяйте логи** после развертывания
3. **Используйте версионирование** - тегируйте релизы в Git
4. **Делайте бэкапы БД** перед обновлением:
   ```bash
   cp data/users.db data/users.db.backup
   ```

