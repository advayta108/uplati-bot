/**
 * Публикует slash-команды в меню Telegram (кнопка «/» у поля ввода).
 * Полный перечень — в `TELEGRAM_BOT_COMMANDS` (`./botCommands.ts`), сейчас это:
 * start, adduser, status, update, set_auto_meters, auto_meters_status,
 * receipts, transactions, autopayments.
 *
 * Запуск: `npm run update-bot-commands` (нужен TELEGRAM_BOT_TOKEN).
 * То же обновление вызывается при старте бота через `syncTelegramBotMenu`.
 */
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { TELEGRAM_BOT_COMMANDS, syncTelegramBotMenu } from './botCommands';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан. Укажите токен в .env или окружении.');
  process.exit(1);
}

const bot = new Telegraf(botToken);

function formatError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return String(error);
}

async function main(): Promise<void> {
  console.log('Обновление команд бота (default + all_private_chats)...');
  TELEGRAM_BOT_COMMANDS.forEach((c) => console.log(`  /${c.command} — ${c.description}`));

  try {
    await syncTelegramBotMenu(bot.telegram);
    console.log('✅ setMyCommands OK');
  } catch (error) {
    console.error('❌ setMyCommands:', formatError(error));
    process.exit(1);
  }

  console.log('✅ Меню команд обновлено. При необходимости перезапустите Telegram (кэш меню).');
}

void main();
