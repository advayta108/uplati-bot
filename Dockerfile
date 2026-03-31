FROM node:25 AS base

WORKDIR /home/node/app

# sqlite3 is a native module: keep build toolchain in image
# so bindings are built for current Node/OS and not reused mismatched binaries.
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

# Копируем манифесты для установки зависимостей workspaces
COPY package.json ./
COPY package-lock.json ./
COPY lib/uplati-sdk/package.json ./lib/uplati-sdk/
COPY packages/uplati-bot/package.json ./packages/uplati-bot/

# Устанавливаем зависимости (включая workspace-пакеты)
WORKDIR /home/node/app
RUN npm ci
RUN npm rebuild better-sqlite3 --build-from-source

# Копируем весь код
COPY . .

# Собираем библиотеку
WORKDIR /home/node/app/lib/uplati-sdk
RUN npm run build

# Собираем основной проект
WORKDIR /home/node/app
RUN npm run build

FROM base AS production

# Устанавливаем переменную окружения
ENV NODE_PATH=./build
ENV NODE_ENV=production

# Создаём необходимые директории
RUN mkdir -p logs data

# Запускаем бота
CMD ["npm", "run", "bot"]
