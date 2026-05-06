import { Telegraf, type Context } from 'telegraf';
import dotenv from 'dotenv';
import {
  addUser,
  initializeDb,
  upsertMeter,
  getAllUsers,
  updateUserToken,
  deleteMetersExceptIds,
  setMeterAutoConfig,
  getMetersWithAutoForUser,
  type MeterRow,
  type UserRow,
} from './database';
import { Autopayment, Transaction, UplatiClient, type Sensor } from '@advayta108/uplati-sdk';
import { computeInitialNextSend } from './meterSchedule';
import { logMessage } from './logging';
import { syncTelegramBotMenu } from './botCommands';

dotenv.config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  logMessage('❌ Токен Telegram-бота не найден. Убедитесь, что TELEGRAM_BOT_TOKEN установлен.');
  process.exit(1);
}

const bot = new Telegraf(botToken!);

// Создаём клиент библиотеки
const uplatiClient = new UplatiClient({
  sendDataEnabled: process.env.SEND_DATA !== 'false',
  logger: logMessage,
});

/** Лимит Telegram на длину одного сообщения — длинные подписанные URL на PDF легко его превышают. */
const TELEGRAM_MESSAGE_SAFE = 3800;

function chunkTextForTelegram(text: string, maxLen = TELEGRAM_MESSAGE_SAFE): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      chunks.push(rest);
      break;
    }
    let cut = rest.lastIndexOf('\n', maxLen);
    if (cut < maxLen / 2) cut = maxLen;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n+/, '');
  }
  return chunks;
}

async function replyLong(ctx: Context, text: string): Promise<void> {
  const parts = chunkTextForTelegram(text);
  for (const part of parts) {
    await ctx.reply(part);
  }
}

// Функция для проверки валидности токена
const isTokenValid = async (token: string): Promise<boolean> => {
  try {
    uplatiClient.setToken(token);
    await uplatiClient.getMeters(); // Пробуем получить данные
    return true;
  } catch (error) {
    logMessage(`Токен невалиден: ${error}`);
    return false;
  }
};

/** Синхронизировать счётчики пользователя с API и вернуть актуальный список */
async function syncMetersFromApiForChat(
  chatId: number
): Promise<{ ok: true; sensors: Sensor[] } | { ok: false; message: string }> {
  const db = await initializeDb();
  const user = await db.get<UserRow>('SELECT * FROM users WHERE chatId = ?', [chatId]);
  if (!user) {
    return { ok: false, message: 'Вы не зарегистрированы. Используйте /adduser.' };
  }

  const tryFetch = async (): Promise<Sensor[]> => {
    let token = user.token;
    if (!token || token === 'null' || token === '') {
      token = await uplatiClient.authenticate(user.email, user.password);
      await updateUserToken(chatId, token);
    } else {
      uplatiClient.setToken(token);
    }
    return uplatiClient.getMeters();
  };

  try {
    const sensors = await tryFetch();
    for (const sensor of sensors) {
      await upsertMeter(
        chatId,
        sensor.id,
        sensor.display_name,
        sensor.last_sensor_value,
        sensor.last_sensor_date
      );
    }
    await deleteMetersExceptIds(
      chatId,
      sensors.map((s) => s.id)
    );
    return { ok: true, sensors };
  } catch (error) {
    logMessage(`Синхронизация API для ${chatId}: ${error}`);
    try {
      const token = await uplatiClient.authenticate(user.email, user.password);
      await updateUserToken(chatId, token);
      uplatiClient.setToken(token);
      const sensors = await uplatiClient.getMeters();
      for (const sensor of sensors) {
        await upsertMeter(
          chatId,
          sensor.id,
          sensor.display_name,
          sensor.last_sensor_value,
          sensor.last_sensor_date
        );
      }
      await deleteMetersExceptIds(
        chatId,
        sensors.map((s) => s.id)
      );
      return { ok: true, sensors };
    } catch (retryError) {
      logMessage(`Повторная синхронизация для ${chatId} не удалась: ${retryError}`);
      return {
        ok: false,
        message: 'Не удалось получить данные из API. Проверьте логин и пароль или попробуйте позже.',
      };
    }
  }
}

type SetAutoMetersWizard = {
  step: 'select_indices' | 'increment' | 'day';
  sensors: Sensor[];
  selectedSensors: Sensor[];
  incrementIndex: number;
  incrementsByMeterId: Record<number, number>;
};

const setAutoWizard: Record<number, SetAutoMetersWizard> = {};

function parsePositiveNumber(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function parseMeterIndices(text: string, maxIndex: number): number[] | null {
  const parts = text
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const indices = new Set<number>();
  for (const p of parts) {
    const n = parseInt(p, 10);
    if (!Number.isInteger(n) || n < 1 || n > maxIndex) return null;
    indices.add(n - 1);
  }
  if (indices.size === 0) return null;
  return [...indices].sort((a, b) => a - b);
}

// Функция для обновления данных всех пользователей из API
const updateAllUsersData = async () => {
  try {
    logMessage('Начинаем обновление данных всех пользователей из API...');
    await initializeDb(); // Инициализируем БД
    const users = await getAllUsers();

    if (users.length === 0) {
      logMessage('В базе данных нет пользователей для обновления');
      return;
    }

    logMessage(`Найдено пользователей для обновления: ${users.length}`);

    for (const user of users) {
      try {
        logMessage(`Обработка пользователя ${user.chatId}...`);
        
        // Проверяем и обновляем токен
        let token = user.token;
        let needAuth = false;

        if (!token || token === 'null' || token === '') {
          logMessage(`Токен отсутствует для пользователя ${user.chatId}, требуется авторизация`);
          needAuth = true;
        } else {
          // Проверяем валидность токена
          logMessage(`Проверка валидности токена для пользователя ${user.chatId}...`);
          const isValid = await isTokenValid(token);
          if (!isValid) {
            logMessage(`Токен невалиден для пользователя ${user.chatId}, требуется обновление`);
            needAuth = true;
          }
        }

        if (needAuth) {
          logMessage(`Авторизация пользователя ${user.chatId}...`);
          token = await uplatiClient.authenticate(user.email, user.password);
          await updateUserToken(user.chatId, token);
          logMessage(`Токен успешно обновлён для пользователя ${user.chatId}`);
        } else {
          uplatiClient.setToken(token!);
        }

        // Получаем актуальные данные по счётчикам
        logMessage(`Получение данных счётчиков для пользователя ${user.chatId}...`);
        const sensors = await uplatiClient.getMeters();
        logMessage(`Получено ${sensors.length} счётчиков для пользователя ${user.chatId}`);

        if (sensors.length === 0) {
          logMessage(`Предупреждение: для пользователя ${user.chatId} не найдено счётчиков`);
        }

        // Обновляем данные в БД
        for (const sensor of sensors) {
          await upsertMeter(
            user.chatId,
            sensor.id,
            sensor.display_name,
            sensor.last_sensor_value,
            sensor.last_sensor_date
          );
        }
        await deleteMetersExceptIds(
          user.chatId,
          sensors.map((s) => s.id)
        );

        logMessage(`✅ Данные для пользователя ${user.chatId} успешно обновлены (${sensors.length} счётчиков)`);
      } catch (error) {
        logMessage(`❌ Ошибка при обновлении данных для пользователя ${user.chatId}: ${error}`);
        // Пытаемся обновить токен и повторить
        try {
          logMessage(`Повторная попытка с обновлением токена для пользователя ${user.chatId}...`);
          const newToken = await uplatiClient.authenticate(user.email, user.password);
          await updateUserToken(user.chatId, newToken);
          uplatiClient.setToken(newToken);
          const sensors = await uplatiClient.getMeters();
          for (const sensor of sensors) {
            await upsertMeter(
              user.chatId,
              sensor.id,
              sensor.display_name,
              sensor.last_sensor_value,
              sensor.last_sensor_date
            );
          }
          await deleteMetersExceptIds(
            user.chatId,
            sensors.map((s) => s.id)
          );
          logMessage(`✅ Данные для пользователя ${user.chatId} обновлены после обновления токена (${sensors.length} счётчиков)`);
        } catch (retryError) {
          logMessage(`❌ Не удалось обновить данные для пользователя ${user.chatId} после повторной попытки: ${retryError}`);
        }
      }
    }

    logMessage('✅ Обновление данных всех пользователей завершено');
  } catch (error) {
    logMessage(`❌ Критическая ошибка при обновлении данных пользователей: ${error}`);
  }
};

// interface SessionData {
//   meterSelectionStage?: boolean;
//   sensors?: Sensor[];
//   meterValues?: { meter: Sensor, newValue: number }[];
//   metersToConfigure?: Sensor[];
//   meterIncrementStage?: number;
//   dateStage?: boolean;
//   token?: string;
// }

interface UserData {
  email?: string;
  password?: string;
  state?: 'awaiting_email' | 'awaiting_password' | 'authenticated';
}

// interface BotContext extends Context {
//   session: SessionData;
// }

const userData: Record<number, UserData> = {};

// Приветственная команда
bot.command('start', (ctx) => {
  const message = [
    'Привет! Я бот сервиса «Система город»',
    '',
    'Что я умею:',
    '🔐 Авторизовать и сохранить данные пользователя',
    '📥 Обновлять данные по счётчикам из API',
    '📊 Показывать статус счётчиков (сверка с API и обновление БД)',
    '⚙️ Настраивать автоотправку показаний по дню месяца',
    '🧾 Показывать список квитанций',
    '💳 Показывать последние транзакции',
    '💸 Показывать автоплатежи',
    '',
    'Доступные команды:',
    '/start',
    '/adduser',
    '/status',
    '/update',
    '/receipts',
    '/transactions',
    '/get_auto_pays',
    '/set_auto_meters',
    '/auto_meters_status',
  ].join('\n');

  ctx.reply(message);
});

async function handleSetAutoWizardText(ctx: Context, chatId: number) {
  const wizard = setAutoWizard[chatId];
  if (!wizard) return;
  const text = ctx.message && 'text' in ctx.message ? ctx.message.text.trim() : '';
  if (!text) return;
  const lower = text.toLowerCase();
  if (lower === 'отмена' || lower === 'cancel') {
    delete setAutoWizard[chatId];
    await ctx.reply('Настройка автоотправки отменена.');
    return;
  }

  if (wizard.step === 'select_indices') {
    const idx = parseMeterIndices(text, wizard.sensors.length);
    if (!idx) {
      await ctx.reply(`Укажите номера от 1 до ${wizard.sensors.length}, например: 1, 2`);
      return;
    }
    wizard.selectedSensors = idx.map((i) => wizard.sensors[i]!);
    wizard.step = 'increment';
    wizard.incrementIndex = 0;
    const s = wizard.selectedSensors[0]!;
    await ctx.reply(
      `Счётчиков выбрано: ${wizard.selectedSensors.length}.\nВведите приращение показаний для «${s.display_name}» (сейчас ${s.last_sensor_value}). Число должно быть > 0 (целое или дробное). Это значение будет добавляться при каждой автоотправке на сервер.`
    );
    return;
  }

  if (wizard.step === 'increment') {
    const inc = parsePositiveNumber(text);
    if (inc === null) {
      await ctx.reply('Введите положительное число, например 3 или 0.5');
      return;
    }
    const current = wizard.selectedSensors[wizard.incrementIndex]!;
    wizard.incrementsByMeterId[current.id] = inc;
    wizard.incrementIndex += 1;
    if (wizard.incrementIndex < wizard.selectedSensors.length) {
      const nextS = wizard.selectedSensors[wizard.incrementIndex]!;
      await ctx.reply(
        `Приращение сохранено.\nВведите приращение для «${nextS.display_name}» (сейчас ${nextS.last_sensor_value}):`
      );
      return;
    }
    wizard.step = 'day';
    await ctx.reply(
      'В какой день месяца (от 1 до 25) отправлять показания для выбранных счётчиков? Введите одно число.'
    );
    return;
  }

  if (wizard.step === 'day') {
    const d = parseInt(text, 10);
    if (!Number.isInteger(d) || d < 1 || d > 25) {
      await ctx.reply('Введите целое число от 1 до 25.');
      return;
    }
    const nextAt = computeInitialNextSend(d);
    const nextIso = nextAt.toISOString();
    const count = wizard.selectedSensors.length;
    for (const s of wizard.selectedSensors) {
      const inc = wizard.incrementsByMeterId[s.id];
      if (inc === undefined) {
        await ctx.reply('Внутренняя ошибка мастера. Начните снова с /set_auto_meters.');
        delete setAutoWizard[chatId];
        return;
      }
      await setMeterAutoConfig(chatId, s.id, inc, d, nextIso);
    }
    delete setAutoWizard[chatId];
    await ctx.reply(
      `Готово. Для ${count} счётчик(ов) автоотправка запланирована на ${d}-е число каждого месяца (около 10:00 по времени сервера). Следующая отправка не раньше: ${nextAt.toLocaleString('ru-RU')}.`
    );
  }
}

// Команда для получения текущего статуса счётчиков (сверка с API и обновление БД)
bot.command('status', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /status вызвана пользователем ${chatId}`);

  try {
    await ctx.reply('Сверяю данные с API и обновляю локальную базу...');
    const sync = await syncMetersFromApiForChat(chatId);
    if (!sync.ok) {
      await ctx.reply(sync.message);
      return;
    }

    const db = await initializeDb();
    const meters = await db.all<MeterRow>(
      'SELECT * FROM meters WHERE userId = ? ORDER BY meterId',
      [chatId]
    );
    if (meters.length === 0) {
      await ctx.reply('Счётчиков не найдено после синхронизации.');
      return;
    }

    let message = 'Актуальные данные счётчиков:\n';
    meters.forEach((meter: MeterRow, index: number) => {
      message += `${index + 1}. ${meter.meterName}: ${meter.lastValue} (обновлено: ${meter.lastUpdated})\n`;
    });
    message += `\nВсего: ${meters.length}. Данные синхронизированы с API.`;

    await ctx.reply(message);
    logMessage(`Отправлен /status пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при выполнении команды /status для пользователя ${chatId}: ${error}`);
    await ctx.reply('Произошла ошибка при получении данных. Попробуйте снова позже.');
  }
});

// Команда для обновления данных из API
bot.command('update', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /update вызвана пользователем ${chatId}`);

  try {
    await ctx.reply('Обновляю данные из API...');
    const sync = await syncMetersFromApiForChat(chatId);
    if (!sync.ok) {
      await ctx.reply(sync.message);
      return;
    }
    await ctx.reply(`Данные успешно обновлены. Счётчиков в базе: ${sync.sensors.length}.`);
    logMessage(`Данные для пользователя ${chatId} успешно обновлены`);
  } catch (error) {
    logMessage(`Ошибка при обновлении данных для пользователя ${chatId}: ${error}`);
    await ctx.reply('Произошла ошибка при обновлении данных. Попробуйте снова позже.');
  }
});

// Мастер настройки автоотправки показаний
bot.command('set_auto_meters', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;
  logMessage(`Команда /set_auto_meters от ${chatId}`);
  try {
    const sync = await syncMetersFromApiForChat(chatId);
    if (!sync.ok) {
      await ctx.reply(sync.message);
      return;
    }
    if (sync.sensors.length === 0) {
      await ctx.reply('Нет счётчиков для настройки.');
      return;
    }
    const lines = sync.sensors.map(
      (s, i) => `${i + 1}. ${s.display_name} (текущие показания: ${s.last_sensor_value})`
    );
    setAutoWizard[chatId] = {
      step: 'select_indices',
      sensors: sync.sensors,
      selectedSensors: [],
      incrementIndex: 0,
      incrementsByMeterId: {},
    };
    await ctx.reply(
      [
        'Настройка автоотправки показаний.',
        'Ответьте номерами через запятую или пробел, для каких счётчиков включить автоотправку (например: 1,3).',
        'Чтобы выйти, напишите «отмена».',
        '',
        ...lines,
      ].join('\n')
    );
  } catch (error) {
    logMessage(`Ошибка /set_auto_meters для ${chatId}: ${error}`);
    await ctx.reply('Не удалось начать настройку. Попробуйте позже.');
  }
});

bot.command('auto_meters_status', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;
  logMessage(`Команда /auto_meters_status от ${chatId}`);
  try {
    const db = await initializeDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE chatId = ?', [chatId]);
    if (!user) {
      await ctx.reply('Вы не зарегистрированы. Используйте /adduser.');
      return;
    }
    const rows = await getMetersWithAutoForUser(chatId);
    if (rows.length === 0) {
      await ctx.reply('Автоотправка показаний не настроена ни для одного счётчика. Используйте /set_auto_meters.');
      return;
    }
    let msg = 'Автоотправка настроена для счётчиков:\n';
    rows.forEach((m, i) => {
      const next = m.nextSendDate ? new Date(m.nextSendDate).toLocaleString('ru-RU') : '—';
      msg += `${i + 1}. ${m.meterName}\n   приращение: ${m.increment}, день месяца: ${m.auto_send_day}, следующая отправка: ${next}\n`;
    });
    await ctx.reply(msg);
  } catch (error) {
    logMessage(`Ошибка /auto_meters_status для ${chatId}: ${error}`);
    await ctx.reply('Не удалось прочитать настройки. Попробуйте позже.');
  }
});

// Команда для получения списка квитанций
async function handleReceiptsCommand(ctx: Context): Promise<void> {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /receipts вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE chatId = ?', [chatId]);

    if (!user) {
      await ctx.reply(
        'Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.'
      );
      return;
    }

    let token = user.token;
    if (!token || token === 'null') {
      token = await uplatiClient.authenticate(user.email, user.password);
      await updateUserToken(chatId, token);
    } else {
      uplatiClient.setToken(token);
    }

    const receipts = await uplatiClient.getReceipts();

    if (receipts.length === 0) {
      await ctx.reply('У вас нет квитанций (список пуст).');
      return;
    }

    let message = 'Ваши квитанции:\n\n';
    const topReceipts = receipts.slice(0, 10);
    for (let i = 0; i < topReceipts.length; i += 1) {
      const receipt = topReceipts[i]!;
      let receiptUrl = receipt.pdf_url;
      if (!receiptUrl && receipt.abonent_id) {
        const fetchedUrl = await uplatiClient.getPaymentDocumentUrl(receipt.abonent_id, receipt.id);
        if (fetchedUrl) receiptUrl = fetchedUrl;
      }
      message += `${i + 1}. ${receipt.period_name || receipt.period || receipt.number || String(receipt.id)}\n`;
      if (receipt.service_name) {
        message += `   Услуга: ${receipt.service_name}\n`;
      }
      message += `   Период: ${receipt.period_name || receipt.period || 'N/A'}\n`;
      message += `   Дата: ${receipt.date || 'N/A'}\n`;
      message += `   Сумма: ${receipt.amount || 0} руб.\n`;
      message += `   Статус: ${receipt.status || 'N/A'}\n`;
      if (receiptUrl) {
        message += `   PDF: ${receiptUrl}\n`;
      }
      message += '\n';
    }

    if (receipts.length > 10) {
      message += `... и ещё ${receipts.length - 10} квитанций`;
    }

    await replyLong(ctx, message);
    logMessage(`Отправлен список квитанций пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при получении квитанций для пользователя ${chatId}: ${error}`);
    await ctx.reply('Произошла ошибка при получении квитанций. Попробуйте снова позже.');
  }
}

bot.command('receipts', handleReceiptsCommand);
bot.command('reciepts', handleReceiptsCommand);

// Команда для получения последних транзакций
bot.command('transactions', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /transactions вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE chatId = ?', [chatId]);
    
    if (!user) {
      await ctx.reply(
        'Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.'
      );
      return;
    }

    // Обновляем токен если нужно
    let token = user.token;
    if (!token || token === 'null') {
      token = await uplatiClient.authenticate(user.email, user.password);
      await updateUserToken(chatId, token);
    } else {
      uplatiClient.setToken(token);
    }

    const transactions = await uplatiClient.getTransactions(10);

    if (transactions.length === 0) {
      await ctx.reply(
        'Не удалось получить список транзакций или он пуст. В ЛК история может быть в другом разделе API — при необходимости пришлите Network-запрос из браузера.'
      );
      return;
    }

    let message = 'Последние транзакции:\n\n';
    transactions.forEach((transaction: Transaction, index: number) => {
      message += `${index + 1}. ${transaction.type || 'N/A'}\n`;
      message += `   Дата: ${transaction.date || 'N/A'}\n`;
      message += `   Сумма: ${transaction.amount || 0} руб.\n`;
      message += `   Статус: ${transaction.status || 'N/A'}\n`;
      if (transaction.description) {
        message += `   Описание: ${transaction.description}\n`;
      }
      message += '\n';
    });

    await replyLong(ctx, message);
    logMessage(`Отправлен список транзакций пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при получении транзакций для пользователя ${chatId}: ${error}`);
    await ctx.reply('Произошла ошибка при получении транзакций. Попробуйте снова позже.');
  }
});

// Команда для получения списка автоплатежей
bot.command('get_auto_pays', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /get_auto_pays вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    const user = await db.get<UserRow>('SELECT * FROM users WHERE chatId = ?', [chatId]);

    if (!user) {
      ctx.reply('Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.');
      return;
    }

    let token = user.token;
    if (!token || token === 'null') {
      token = await uplatiClient.authenticate(user.email, user.password);
      await updateUserToken(chatId, token);
    } else {
      uplatiClient.setToken(token);
    }

    const autopays = await uplatiClient.getAutopayments();
    if (autopays.length === 0) {
      ctx.reply('Активных автоплатежей не найдено.');
      return;
    }

    let message = 'Ваши автоплатежи:\n\n';
    autopays.slice(0, 10).forEach((a: Autopayment, index: number) => {
      message += `${index + 1}. ${a.service_name || a.name || 'N/A'}\n`;
      message += `   Статус: ${a.status_name || (a.enabled ? 'Активен' : 'Неактивен')}\n`;
      message += `   Режим: ${a.payment_method || 'N/A'}\n`;
      message += `   Периодичность: ${a.periodicity_human || a.periodicity || 'N/A'}\n`;
      message += `   Сумма: ${a.amount ?? 'N/A'} руб.\n`;
      if (a.max_amount !== undefined) {
        message += `   Лимит: ${a.max_amount} руб.\n`;
      }
      message += `   След. дата: ${a.next_payment_date || 'N/A'}\n`;
      if (a.card_mask) {
        message += `   Карта: ${a.card_mask}\n`;
      }
      message += '\n';
    });

    if (autopays.length > 10) {
      message += `... и ещё ${autopays.length - 10} автоплатежей`;
    }

    ctx.reply(message);
    logMessage(`Отправлен список автоплатежей пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при получении автоплатежей для пользователя ${chatId}: ${error}`);
    ctx.reply('Произошла ошибка при получении автоплатежей. Попробуйте снова позже.');
  }
});

// Команда для начала регистрации /adduser
bot.command('adduser', (ctx) => {
  const chatId = ctx.message?.chat.id;
  logMessage(`Запуск команды /adduser для пользователя ${chatId}`);

  if (chatId !== undefined) {
    if (!userData[chatId]) {
      userData[chatId] = { state: 'awaiting_email' };
      logMessage(`Пользователь ${chatId} начал регистрацию.`);
      ctx.reply('Пожалуйста, введите свой email:');
    } else {
      logMessage(`Пользователь ${chatId} уже находится в процессе регистрации.`);
      ctx.reply('Вы уже начали регистрацию. Пожалуйста, введите свой email.');
    }
  }
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  logMessage(`Получено текстовое сообщение от пользователя ${chatId}`);

  if (!chatId) return;

  if (setAutoWizard[chatId]) {
    await handleSetAutoWizardText(ctx, chatId);
    return;
  }

  const userState = userData[chatId];
  if (!userState) {
    logMessage(`Пользователь ${chatId} не начал процесс регистрации.`);
    return;
  }

  try {
    if (userState.state === 'awaiting_email') {
      userState.email = ctx.message.text;
      userState.state = 'awaiting_password';
      logMessage(`Пользователь ${chatId} ввёл email: ${userState.email}`);
      ctx.reply('Пожалуйста, введите свой пароль:');
    } else if (userState.state === 'awaiting_password') {
      userState.password = ctx.message.text;
      logMessage(`Пользователь ${chatId} ввёл пароль (длина: ${userState.password?.length ?? 0})`);

      const token = await uplatiClient.authenticate(userState.email!, userState.password!);
      logMessage(`Авторизация успешна для пользователя ${chatId}`);

      await addUser(chatId, userState.email!, userState.password!, token);

      try {
        const sensors = await uplatiClient.getMeters();
        for (const sensor of sensors) {
          await upsertMeter(
            chatId,
            sensor.id,
            sensor.display_name,
            sensor.last_sensor_value,
            sensor.last_sensor_date
          );
        }
        logMessage(`Счётчики для пользователя ${chatId} сохранены.`);
        await ctx.reply('Ваши данные и счётчики успешно сохранены.');
      } catch (meterErr) {
        logMessage(`Ошибка загрузки счётчиков после входа ${chatId}: ${meterErr}`);
        await ctx.reply(
          'Вход выполнен, но не удалось получить список счётчиков с сервера. Позже выполните /update или /status.'
        );
      }
      userState.state = 'authenticated';
    }
  } catch (error) {
    logMessage(`Ошибка при авторизации пользователя ${chatId}: ${error}`);
    await ctx.reply('Ошибка при авторизации (логин или пароль). Попробуйте снова командой /adduser.');
  }
});

// Запуск бота через polling API
bot.launch()
  .then(async () => {
    logMessage('🤖 Telegram бот запущен и работает через polling API');
    try {
      await syncTelegramBotMenu(bot.telegram);
      logMessage('Меню slash-команд синхронизировано (setMyCommands)');
    } catch (err) {
      logMessage(`Не удалось обновить меню команд: ${err}`);
    }
    // Небольшая задержка перед обновлением данных
    setTimeout(async () => {
      await updateAllUsersData();
    }, 2000); // 2 секунды задержки для стабилизации бота
  })
  .catch((error) => {
    if (error.message && error.message.includes('409')) {
      logMessage('❌ Ошибка 409: Другой экземпляр бота уже запущен. Остановите другие экземпляры перед запуском.');
    } else {
      logMessage(`❌ Ошибка при запуске бота: ${error}`);
    }
    process.exit(1);
  });

// Ловим ошибки бота
bot.catch((err, ctx) => {
  logMessage(`Ошибка в боте для пользователя ${ctx.updateType}: ${err}`);
});
