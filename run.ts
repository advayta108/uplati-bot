import { initializeDb, type MeterRow, type UserRow } from './src/database';  // Работа с БД
import { UplatiClient } from '@advayta108/uplati-sdk';
import { logMessage } from './src/logging';  // Логирование
import dotenv from 'dotenv';

dotenv.config();

// Создаём клиент библиотеки
const uplatiClient = new UplatiClient({
  sendDataEnabled: process.env.SEND_DATA !== 'false',
  logger: logMessage,
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Основная функция для проверки времени и отправки показаний
const checkAndSendReadings = async () => {
  logMessage('Инициализация базы данных...');
  const db = await initializeDb();
  logMessage('База данных инициализирована.');

  while (true) {
    try {
      logMessage('Проверка пользователей для отправки показаний...');
      const users = await db.all<UserRow>('SELECT * FROM users');  // Получаем всех пользователей
      
      for (const user of users) {
        const meters = await db.all<MeterRow>('SELECT * FROM meters WHERE userId = ?', [user.chatId]);

        for (const meter of meters) {
          const now = new Date();
          const nextSendDate = meter.nextSendDate ? new Date(meter.nextSendDate) : null;

          if (!nextSendDate || now >= nextSendDate) {
            logMessage(`Отправка показаний для пользователя ${user.chatId}`);
            try {
              // Обновляем токен если нужно
              let token = user.token;
              if (!token || token === 'null') {
                logMessage(`Обновление токена для пользователя ${user.chatId}...`);
                token = await uplatiClient.authenticate(user.email, user.password);
                await db.run('UPDATE users SET token = ? WHERE chatId = ?', [token, user.chatId]);
              } else {
                uplatiClient.setToken(token);
              }

              const newValue = meter.lastValue + (meter.increment || 0);  // Увеличиваем показания на increment
              const success = await uplatiClient.sendMeterValue(meter.meterId, newValue);
              
              if (success) {
                logMessage(`Показания для счетчика ${meter.meterName} успешно отправлены.`);
                const updatedNextSendDate = nextSendDate ? new Date(nextSendDate) : new Date();
                updatedNextSendDate.setMonth(updatedNextSendDate.getMonth() + 1);
                await db.run('UPDATE meters SET lastUpdated = ?, nextSendDate = ?, lastValue = ? WHERE id = ?', 
                  [now.toISOString(), updatedNextSendDate.toISOString(), newValue, meter.id]);
              } else {
                logMessage(`Не удалось отправить показания для счетчика ${meter.meterName}`);
              }
            } catch (error) {
              logMessage(`Ошибка при отправке показаний для счетчика ${meter.meterName}: ${error}`);
            }
          }
        }
      }

      await delay(60 * 60 * 1000);  // Ждём один час перед следующей проверкой
    } catch (error) {
      logMessage(`Ошибка в процессе проверки и отправки показаний: ${error}`);
    }
  }
};

// Запуск основного процесса
const startProcess = async () => {
  try {
    logMessage('Запуск основного процесса отправки показаний...');
    await checkAndSendReadings();  // Основной процесс отправки показаний
  } catch (error) {
    logMessage(`Ошибка при запуске основного процесса: ${error}`);
  }
};

// Запуск процесса
startProcess();
