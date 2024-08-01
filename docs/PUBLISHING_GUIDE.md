# Руководство по публикации в NPM

В этом проекте у вас есть два компонента:
1.  **Основной бот** (корневая папка) — это приложение, его обычно не публикуют в NPM, а деплоят (как мы сделали через Docker).
2.  **SDK библиотека** (`lib/uplati-sdk`) — вот её можно и нужно публиковать в NPM, чтобы другие разработчики могли использовать ваш код.

## Подготовка к публикации SDK

Ваша библиотека находится в `lib/uplati-sdk`. В её `package.json` уже многое настроено правильно, но есть важный нюанс с именем.

### 1. Имя пакета (Scope)
Сейчас имя пакета: `"name": "@advayta108/uplati-sdk"`.
В NPM имена, начинающиеся с `@`, называются **Scoped Packages**.
*   Если вы владеете организацией `uplati` на NPM -> всё ок.
*   Если нет (скорее всего), вам нужно переименовать пакет под ваш юзернейм или организацию.
    *   Например: `"@advayta108/uplati-sdk"` (если ваш юзернейм advayta108).

### 2. Версионирование
Перед каждой публикацией нужно повышать версию в `package.json`:
```bash
npm version patch # 1.0.0 -> 1.0.1
npm version minor # 1.0.0 -> 1.1.0
npm version major # 1.0.0 -> 2.0.0
```

## Процесс публикации (Ручной)

1.  **Авторизация** (один раз):
    ```bash
    npm login
    ```
    Вас попросят ввести логин, пароль и email от npmjs.com.

2.  **Публикация**:
    Перейдите в папку библиотеки:
    ```bash
    cd lib/uplati-sdk
    ```
    Запустите команду публикации:
    ```bash
    npm publish --access public
    ```
    *   Флаг `--access public` обязателен для Scoped пакетов (бесплатный аккаунт).
    *   Скрипт `prepublishOnly` автоматически запустит `npm run build` перед отправкой.

## Автоматическая публикация (GitHub Actions)

Можно настроить так, чтобы пакет публиковался сам при создании релиза на GitHub.

Создайте файл `.github/workflows/publish.yml`:

```yaml
name: Publish SDK to NPM

on:
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install and Build
        run: |
          cd lib/uplati-sdk
          npm ci
          npm run build
          
      - name: Publish
        run: |
          cd lib/uplati-sdk
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Для этого нужно получить токен на сайте npmjs.com (Settings -> Access Tokens) и добавить его в Secrets репозитория как `NPM_TOKEN`.
