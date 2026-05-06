import type { Telegraf } from 'telegraf';

/**
 * Список slash-команд для Bot API (setMyCommands) и скрипта `npm run update-bot-commands`.
 * Описания — до ~256 символов на команду (лимит Telegram).
 */
export const TELEGRAM_BOT_COMMANDS: { command: string; description: string }[] = [
  { command: 'start', description: 'Справка и список команд' },
  { command: 'adduser', description: 'Регистрация (email и пароль Uplati)' },
  { command: 'status', description: 'Счётчики: сверка с API и обновление БД' },
  { command: 'update', description: 'Обновить данные счётчиков из API' },
  { command: 'set_auto_meters', description: 'Мастер автоотправки показаний' },
  { command: 'auto_meters_status', description: 'Какие счётчики на автоотправке' },
  { command: 'del_auto_meters', description: 'Отключить автоотправку по номеру' },
  { command: 'receipts', description: 'Список квитанций' },
  { command: 'transactions', description: 'Последние транзакции' },
  { command: 'get_auto_pays', description: 'Показать автоплатежи' },
];

/** Обновить меню команд в клиентах (default + приватные чаты). */
export async function syncTelegramBotMenu(telegram: Telegraf['telegram']): Promise<void> {
  const scopes = [{ type: 'default' as const }, { type: 'all_private_chats' as const }];
  for (const scope of scopes) {
    await telegram.setMyCommands(TELEGRAM_BOT_COMMANDS, { scope });
  }
}
