# Deploy Guide

How to deploy the Telegram bot to a server.

## Automatic deploy (recommended)

Workflow: `.github/workflows/deploy.yml`  
Trigger: push to `main`.

### Required GitHub Secrets

- `SERVER_IP`
- `SSH_PRIVATE_KEY`
- `TELEGRAM_BOT_TOKEN`

### Start deployment

```bash
git add .
git commit -m "deploy update"
git push origin main
```

The workflow stops old containers, uploads files, builds, and starts new containers.

## Manual deploy via SSH

```bash
ssh root@your-server-ip
cd /home/github/ts-uplati-bot-main
docker-compose -f docker-compose.prod.yml down
git pull origin main
npm install
npm run build
npm run build:lib
```

Create `.env`:

```bash
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_bot_token_here
SEND_DATA=true
NODE_ENV=production
EOF
```

Start:

```bash
docker-compose -f docker-compose.prod.yml up -d --build --remove-orphans
docker-compose -f docker-compose.prod.yml logs --tail=100
```

## Health check

```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=100
```

Test in Telegram with `/status` or `/update`.

## Common issues

- **409 Conflict**: another bot instance is running.
- **No bot response**: verify `TELEGRAM_BOT_TOKEN` and logs.
- **Container issues**: rebuild without cache.

```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```
