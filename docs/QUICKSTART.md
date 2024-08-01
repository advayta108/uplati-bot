# Quick Start

## 1) Run the bot

Install dependencies:

```bash
npm install
```

Create `.env` in repository root:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SEND_DATA=true
```

Start Telegram bot:

```bash
npm run bot
```

Start background meter sender (optional):

```bash
npm start
```

## 2) Publish SDK to npm

```bash
cd lib/uplati-sdk
npm version patch
npm run build
npm publish --access public
```

Detailed steps: `PUBLISH.md`

## 3) Project split

Current structure is already separated:

```text
UPLATI-BOT-SDK-MONOREPO/
├── lib/uplati-sdk/    # npm library
└── src/               # bot app
```

Monorepo notes: `MONOREPO_SETUP.md`

