//src/api.ts
// Обёртка для обратной совместимости, использует библиотеку
import { UplatiClient, Sensor } from '@advayta108/uplati-sdk';
import { logMessage } from './logging';
import dotenv from 'dotenv';

dotenv.config();

// Создаём клиент библиотеки для обратной совместимости
const client = new UplatiClient({
  sendDataEnabled: process.env.SEND_DATA !== 'false',
  logger: logMessage,
});

// Экспортируем типы для обратной совместимости
export type { Sensor };

// Функция для аутентификации (обратная совместимость)
export const authenticate = async (email: string, password: string): Promise<string> => {
  return await client.authenticate(email, password);
};

// Функция для получения данных по счётчикам (обратная совместимость)
export const getMetersData = async (token: string): Promise<Sensor[]> => {
  client.setToken(token);
  return await client.getMeters();
};

// Функция для отправки значений счётчиков (обратная совместимость; результат как в SDK)
export const sendSensorValue = async (
  token: string,
  sensorId: number,
  sensorValue: number | string
): Promise<boolean> => {
  client.setToken(token);
  return client.sendMeterValue(sensorId, sensorValue);
};
