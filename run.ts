import { initializeDb, type MeterRow, type UserRow } from './src/database';
import { UplatiClient } from '@advayta108/uplati-sdk';
import { logMessage } from './src/logging';
import {
  nextMonthlySendAfterSuccess,
  computeInitialNextSend,
  meterRowQualifiesForAutoSend,
} from './src/meterSchedule';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();

const uplatiClient = new UplatiClient({
  sendDataEnabled: process.env.SEND_DATA !== 'false',
  logger: logMessage,
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function notifyUser(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logMessage('TELEGRAM_BOT_TOKEN не задан, уведомление в Telegram не отправлено');
    return;
  }
  const bot = new Telegraf(token);
  const maxLen = 4000;
  for (let i = 0; i < text.length; i += maxLen) {
    const chunk = text.slice(i, i + maxLen);
    try {
      await bot.telegram.sendMessage(chatId, chunk);
    } catch (e) {
      logMessage(`Ошибка отправки сообщения в Telegram для ${chatId}: ${e}`);
    }
  }
}

const checkAndSendReadings = async () => {
  logMessage('Инициализация базы данных...');
  const db = await initializeDb();
  logMessage('База данных инициализирована.');

  while (true) {
    try {
      logMessage('Проверка пользователей для автоотправки показаний...');
      const users = await db.all<UserRow>('SELECT * FROM users');

      for (const user of users) {
        const meters = await db.all<MeterRow>('SELECT * FROM meters WHERE userId = ?', [user.chatId]);
        const scheduled = meters.filter(meterRowQualifiesForAutoSend);
        if (scheduled.length === 0) continue;

        const now = new Date();
        const reportLines: string[] = [];

        for (const meter of scheduled) {
          let nextSendDate = meter.nextSendDate ? new Date(meter.nextSendDate) : null;
          if (!nextSendDate && meter.auto_send_day != null) {
            nextSendDate = computeInitialNextSend(meter.auto_send_day, now);
            await db.run('UPDATE meters SET nextSendDate = ? WHERE id = ?', [
              nextSendDate.toISOString(),
              meter.id,
            ]);
          }
          if (!nextSendDate || now < nextSendDate) continue;

          try {
            let token = user.token;
            if (!token || token === 'null') {
              logMessage(`Обновление токена для пользователя ${user.chatId}...`);
              token = await uplatiClient.authenticate(user.email, user.password);
              await db.run('UPDATE users SET token = ? WHERE chatId = ?', [token, user.chatId]);
            } else {
              uplatiClient.setToken(token);
            }

            const prev = Number(meter.lastValue);
            const step = Number(meter.increment);
            const newValue = prev + step;
            const success = await uplatiClient.sendMeterValue(meter.meterId, newValue);
            const statusText = success ? 'успешно принято API' : 'ошибка при вызове API';

            reportLines.push(
              `• ${meter.meterName}: было ${prev} → отправлено ${newValue} (${statusText})`
            );

            if (success) {
              const next =
                meter.auto_send_day != null
                  ? nextMonthlySendAfterSuccess(meter.auto_send_day, now)
                  : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 10, 0, 0, 0);
              await db.run(
                'UPDATE meters SET lastUpdated = ?, nextSendDate = ?, lastValue = ? WHERE id = ?',
                [now.toISOString(), next.toISOString(), newValue, meter.id]
              );
              logMessage(`Показания для счётчика ${meter.meterName} успешно отправлены.`);
            } else {
              const retryAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
              await db.run('UPDATE meters SET nextSendDate = ? WHERE id = ?', [
                retryAt.toISOString(),
                meter.id,
              ]);
              logMessage(`Не удалось отправить показания для счётчика ${meter.meterName}, повтор через 6 ч.`);
            }
          } catch (error) {
            reportLines.push(`• ${meter.meterName}: ошибка выполнения — ${error}`);
            logMessage(`Ошибка при отправке показаний для счётчика ${meter.meterName}: ${error}`);
            try {
              const retryAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
              await db.run('UPDATE meters SET nextSendDate = ? WHERE id = ?', [
                retryAt.toISOString(),
                meter.id,
              ]);
            } catch {
              /* ignore */
            }
          }
        }

        if (reportLines.length > 0) {
          const header = `Автоотправка показаний (${now.toLocaleString('ru-RU')}):\n\n`;
          await notifyUser(user.chatId, header + reportLines.join('\n'));
        }
      }

      await delay(60 * 60 * 1000);
    } catch (error) {
      logMessage(`Ошибка в процессе проверки и отправки показаний: ${error}`);
    }
  }
};

const startProcess = async () => {
  try {
    logMessage('Запуск основного процесса автоотправки показаний...');
    await checkAndSendReadings();
  } catch (error) {
    logMessage(`Ошибка при запуске основного процесса: ${error}`);
  }
};

startProcess();
