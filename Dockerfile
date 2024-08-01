FROM node:22 as base

WORKDIR /home/node/app

# Копируем package.json файлы для установки зависимостей
COPY package.json ./
COPY lib/uplati-sdk/package.json ./lib/uplati-sdk/

# Устанавливаем зависимости библиотеки
WORKDIR /home/node/app/lib/uplati-sdk
RUN npm install

# Возвращаемся в корень и устанавливаем основные зависимости
WORKDIR /home/node/app
RUN npm install && \
    npm audit fix --force || true && \
    npm install -g npm@latest && \
    npm install -g typescript

# Копируем весь код
COPY . .

# Собираем библиотеку
WORKDIR /home/node/app/lib/uplati-sdk
RUN npm run build

# Собираем основной проект
WORKDIR /home/node/app
RUN npm run build

FROM base as production

# Устанавливаем переменную окружения
ENV NODE_PATH=./build
ENV NODE_ENV=production

# Создаём необходимые директории
RUN mkdir -p logs data

# Запускаем бота
CMD ["npm", "run", "bot"]
