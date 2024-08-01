#!/bin/bash

# Скрипт для быстрого развертывания бота на сервере

set -e  # Остановка при ошибке

echo "🚀 Начинаем развертывание бота..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Файл .env не найден. Создайте его с переменными окружения.${NC}"
    exit 1
fi

# Остановка старых контейнеров
echo -e "${YELLOW}🛑 Останавливаем старые контейнеры...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Остановка процессов бота (если запущен не через Docker)
echo -e "${YELLOW}🛑 Останавливаем процессы бота...${NC}"
pkill -f "tsx.*telebot" || true
pkill -f "npm.*bot" || true

# Ожидание завершения процессов
sleep 2

# Установка зависимостей
echo -e "${YELLOW}📦 Устанавливаем зависимости...${NC}"
npm install

# Сборка библиотеки
echo -e "${YELLOW}🔨 Собираем библиотеку...${NC}"
cd lib/uplati-sdk && npm install && npm run build && cd ../..

# Сборка проекта
echo -e "${YELLOW}🔨 Собираем проект...${NC}"
npm run build

# Создание необходимых директорий
echo -e "${YELLOW}📁 Создаём необходимые директории...${NC}"
mkdir -p data logs

# Сборка и запуск Docker контейнеров
echo -e "${YELLOW}🐳 Собираем и запускаем Docker контейнеры...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Ожидание запуска
sleep 5

# Проверка статуса
echo -e "${YELLOW}📊 Проверяем статус контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Показываем логи
echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo -e "${YELLOW}📋 Последние логи:${NC}"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo -e "${GREEN}✨ Готово! Бот должен быть запущен.${NC}"
echo -e "${YELLOW}💡 Для просмотра логов в реальном времени: docker-compose -f docker-compose.prod.yml logs -f${NC}"

