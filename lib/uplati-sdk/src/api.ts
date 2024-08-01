// API функции для работы с сервисом Uplati
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { getHeaders } from './headers';
import {
  Sensor,
  Receipt,
  Transaction,
  Autopayment,
  AutopaymentSettings,
  AuthResponse,
  SensorsResponse,
  ReceiptsResponse,
  TransactionsResponse,
  AutopaymentsResponse,
} from './types';

// Базовый URL API
const BASE_URL = 'https://gw3-online.uplati.ru/api';
const AUTH_URL = `${BASE_URL}/auth`;

// Опции для клиента
export interface UplatiClientOptions {
  sendDataEnabled?: boolean;
  baseUrl?: string;
  logger?: (message: string) => void;
}

// Функция для аутентификации
export const authenticate = async (
  email: string,
  password: string,
  options?: UplatiClientOptions
): Promise<string> => {
  const logger = options?.logger || console.log;

  try {
    const response = await axios.post<AuthResponse>(
      AUTH_URL,
      {
        email_or_phone: email,
        password: password,
        weboper_token: 'null',
      },
      {
        headers: {
          ...getHeaders(),
          'content-type': 'multipart/form-data',
        },
      }
    );

    if (response.data.session.token) {
      return response.data.session.token;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Error during authentication: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error during authentication: ' + String(error));
    }
    throw error;
  }
};

// Функция для получения данных по счётчикам
export const getMetersData = async (
  token: string,
  options?: UplatiClientOptions
): Promise<Sensor[]> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;
  const sendDataEnabled = options?.sendDataEnabled !== false;
  const metersUrl = sendDataEnabled
    ? `${baseUrl}/sensors`
    : 'http://localhost:3000/test';

  try {
    const response = await axios.get<SensorsResponse>(metersUrl, {
      headers: getHeaders(token),
    });

    const sensors: Sensor[] = response.data.sensors.map((sensor) => ({
      id: sensor.id,
      last_sensor_value: sensor.last_sensor_value,
      last_sensor_date: sensor.last_sensor_date,
      display_name: sensor.display_name,
    }));

    return sensors;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Error fetching meters data: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error fetching meters data: ' + String(error));
    }
    return [];
  }
};

// Функция для отправки значений счётчиков
export const sendSensorValue = async (
  token: string,
  sensorId: number,
  sensorValue: number | string,
  options?: UplatiClientOptions
): Promise<boolean> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;

  try {
    const formData = new FormData();
    formData.append('sensor_value', sensorValue.toString());

    const headersWithFormData = {
      ...getHeaders(token),
      ...formData.getHeaders(),
    };

    const url = `${baseUrl}/sensor/${sensorId}/value`;

    const response = await axios.post(url, formData, { headers: headersWithFormData });

    if (response.data.status === 201) {
      logger('Данные успешно отправлены на сервер');
      return true;
    } else {
      logger('Ошибка при отправке данных: ' + JSON.stringify(response.data));
      return false;
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Ошибка при отправке данных: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error while sending data: ' + String(error));
    }
    return false;
  }
};

// Функция для получения списка квитанций
export const getReceipts = async (
  token: string,
  options?: UplatiClientOptions
): Promise<Receipt[]> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;

  try {
    const response = await axios.get<ReceiptsResponse>(`${baseUrl}/receipts`, {
      headers: getHeaders(token),
    });

    return response.data.receipts || [];
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Error fetching receipts: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error fetching receipts: ' + String(error));
    }
    return [];
  }
};

// Функция для получения последних транзакций
export const getTransactions = async (
  token: string,
  limit?: number,
  options?: UplatiClientOptions
): Promise<Transaction[]> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;

  try {
    const params = limit ? { limit } : {};
    const response = await axios.get<TransactionsResponse>(`${baseUrl}/transactions`, {
      headers: getHeaders(token),
      params,
    });

    return response.data.transactions || [];
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Error fetching transactions: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error fetching transactions: ' + String(error));
    }
    return [];
  }
};

// Функция для получения списка автоплатежей
export const getAutopayments = async (
  token: string,
  options?: UplatiClientOptions
): Promise<Autopayment[]> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;

  try {
    const response = await axios.get<AutopaymentsResponse>(`${baseUrl}/autopayments`, {
      headers: getHeaders(token),
    });

    return response.data.autopayments || [];
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Error fetching autopayments: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error fetching autopayments: ' + String(error));
    }
    return [];
  }
};

// Функция для создания/настройки автоплатежа
export const setAutopayment = async (
  token: string,
  settings: AutopaymentSettings,
  options?: UplatiClientOptions
): Promise<boolean> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;

  try {
    const response = await axios.post(
      `${baseUrl}/autopayments`,
      settings,
      {
        headers: getHeaders(token),
      }
    );

    if (response.status === 200 || response.status === 201) {
      logger('Автоплатеж успешно настроен');
      return true;
    } else {
      logger('Ошибка при настройке автоплатежа: ' + JSON.stringify(response.data));
      return false;
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Ошибка при настройке автоплатежа: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error while setting autopayment: ' + String(error));
    }
    return false;
  }
};

// Функция для удаления автоплатежа
export const deleteAutopayment = async (
  token: string,
  autopaymentId: number,
  options?: UplatiClientOptions
): Promise<boolean> => {
  const logger = options?.logger || console.log;
  const baseUrl = options?.baseUrl || BASE_URL;

  try {
    const response = await axios.delete(`${baseUrl}/autopayments/${autopaymentId}`, {
      headers: getHeaders(token),
    });

    if (response.status === 200 || response.status === 204) {
      logger('Автоплатеж успешно удалён');
      return true;
    } else {
      logger('Ошибка при удалении автоплатежа: ' + JSON.stringify(response.data));
      return false;
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      logger('Ошибка при удалении автоплатежа: ' + (error.response?.data || error.message));
    } else {
      logger('Unexpected error while deleting autopayment: ' + String(error));
    }
    return false;
  }
};

