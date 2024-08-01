import fs from 'fs';
import path from 'path';

// Определяем путь для файла лога
const logFilePath = path.join(process.cwd(), 'logs', 'bot.log');
const MAX_LOG_SIZE = 256 * 1024 * 1024; // Максимальный размер файла лога - 256 MB

// Функция для форматирования времени
const formatTime = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Месяцы в JavaScript начинаются с 0
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `[${day}.${month}.${year} ${hours}:${minutes}:${seconds}]`;
};

// Проверка размера файла лога и его очистка при превышении лимита
const checkLogFileSize = (): void => {
  if (fs.existsSync(logFilePath)) {
    const stats = fs.statSync(logFilePath);
    if (stats.size > MAX_LOG_SIZE) {
      console.log('⚠️ Лог-файл превышает максимальный размер, очищаем файл...');
      fs.writeFileSync(logFilePath, ''); // Очищаем файл лога
    }
  }
};

// Функция для записи сообщений в файл лога
const logToFile = (message: string): void => {
  checkLogFileSize(); // Проверка размера файла перед записью
  const logMessage = `${formatTime()} ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage, 'utf-8');
};

// Основная функция логирования, которая пишет и в консоль, и в файл
export const logMessage = (message: string): void => {
  console.log(message);  // Логируем в консоль
  logToFile(message);     // Логируем в файл
};

// Инициализация лог-файла
const ensureLogFileExists = (): void => {
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '', 'utf-8');
  }
};

ensureLogFileExists();
