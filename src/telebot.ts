import { Telegraf} from 'telegraf';
import dotenv from 'dotenv';
import { addUser, initializeDb, upsertMeter, getAllUsers, updateUserToken } from './database';  // Импортируем базу данных
import { Receipt, Transaction, UplatiClient } from '@advayta108/uplati-sdk';
import { logMessage } from './logging';

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
          uplatiClient.setToken(token);
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

// Команда для получения текущего статуса счётчиков
bot.command('status', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /status вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    
    const user = await db.get('SELECT * FROM users WHERE chatId = ?', [chatId]);
    if (!user) {
      ctx.reply('Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.');
      return;
    }

    const meters = await db.all('SELECT * FROM meters WHERE userId = ?', [user.chatId]);
    if (meters.length === 0) {
      ctx.reply('У вас нет зарегистрированных счётчиков.');
      return;
    }

    let message = 'Ваши счётчики:\n';
    meters.forEach((meter: { meterName: string, lastValue: string, lastUpdated: string }, index: number) => {
      message += `${index + 1}. ${meter.meterName}: ${meter.lastValue} (последнее обновление: ${meter.lastUpdated})\n`;
    });

    ctx.reply(message);
    logMessage(`Отправлен список счётчиков пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при выполнении команды /status для пользователя ${chatId}: ${error}`);
    ctx.reply('Произошла ошибка при получении данных. Попробуйте снова позже.');
  }
});

// Команда для обновления данных из API
bot.command('update', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /update вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    const user = await db.get('SELECT * FROM users WHERE chatId = ?', [chatId]);
    
    if (!user) {
      ctx.reply('Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.');
      return;
    }

    ctx.reply('Обновляю данные из API...');

    // Обновляем токен если нужно
    let token = user.token;
    if (!token || token === 'null') {
      token = await uplatiClient.authenticate(user.email, user.password);
      await updateUserToken(chatId, token);
    } else {
      uplatiClient.setToken(token);
    }

    // Получаем актуальные данные по счётчикам
    const sensors = await uplatiClient.getMeters();
    logMessage(`Получено ${sensors.length} счётчиков для пользователя ${chatId}`);

    // Обновляем данные в БД
    for (const sensor of sensors) {
      await upsertMeter(
        chatId,
        sensor.id,
        sensor.display_name,
        sensor.last_sensor_value,
        sensor.last_sensor_date
      );
    }

    ctx.reply(`Данные успешно обновлены! Найдено счётчиков: ${sensors.length}`);
    logMessage(`Данные для пользователя ${chatId} успешно обновлены`);
  } catch (error) {
    logMessage(`Ошибка при обновлении данных для пользователя ${chatId}: ${error}`);
    ctx.reply('Произошла ошибка при обновлении данных. Попробуйте снова позже.');
  }
});

// Команда для получения списка квитанций
bot.command('receipts', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /receipts вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    const user = await db.get('SELECT * FROM users WHERE chatId = ?', [chatId]);
    
    if (!user) {
      ctx.reply('Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.');
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

    const receipts = await uplatiClient.getReceipts();
    
    if (receipts.length === 0) {
      ctx.reply('У вас нет квитанций.');
      return;
    }

    let message = 'Ваши квитанции:\n\n';
    receipts.slice(0, 10).forEach((receipt: Receipt, index: number) => {
      message += `${index + 1}. ${receipt.number || 'N/A'}\n`;
      message += `   Дата: ${receipt.date || 'N/A'}\n`;
      message += `   Сумма: ${receipt.amount || 0} руб.\n`;
      message += `   Статус: ${receipt.status || 'N/A'}\n\n`;
    });

    if (receipts.length > 10) {
      message += `... и ещё ${receipts.length - 10} квитанций`;
    }

    ctx.reply(message);
    logMessage(`Отправлен список квитанций пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при получении квитанций для пользователя ${chatId}: ${error}`);
    ctx.reply('Произошла ошибка при получении квитанций. Попробуйте снова позже.');
  }
});

// Команда для получения последних транзакций
bot.command('transactions', async (ctx) => {
  const chatId = ctx.message?.chat.id;
  if (!chatId) return;

  logMessage(`Команда /transactions вызвана пользователем ${chatId}`);

  try {
    const db = await initializeDb();
    const user = await db.get('SELECT * FROM users WHERE chatId = ?', [chatId]);
    
    if (!user) {
      ctx.reply('Вы не зарегистрированы. Пожалуйста, используйте команду /adduser для регистрации.');
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
      ctx.reply('У вас нет транзакций.');
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

    ctx.reply(message);
    logMessage(`Отправлен список транзакций пользователю ${chatId}`);
  } catch (error) {
    logMessage(`Ошибка при получении транзакций для пользователя ${chatId}: ${error}`);
    ctx.reply('Произошла ошибка при получении транзакций. Попробуйте снова позже.');
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
      logMessage(`Пользователь ${chatId} ввёл пароль: ${userState.password}`);

      const token = await uplatiClient.authenticate(userState.email!, userState.password!);
      logMessage(`Авторизация успешна для пользователя ${chatId} с токеном: ${token}`);

      await addUser(chatId, userState.email!, userState.password!, token);

      const sensors = await uplatiClient.getMeters();
      for (const sensor of sensors) {
        await upsertMeter(chatId, sensor.id, sensor.display_name, sensor.last_sensor_value, sensor.last_sensor_date);
      }

      logMessage(`Счётчики для пользователя ${chatId} сохранены.`);
      ctx.reply('Ваши данные и счётчики успешно сохранены.');
      userState.state = 'authenticated';
    }
  } catch (error) {
    logMessage(`Ошибка при авторизации пользователя ${chatId}: ${error}`);
    ctx.reply('Ошибка при авторизации. Попробуйте снова.');
  }
});

// Запуск бота через polling API
bot.launch()
  .then(async () => {
    logMessage('🤖 Telegram бот запущен и работает через polling API');
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
