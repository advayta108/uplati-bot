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
  ReceiptsResponse,
  TransactionsResponse,
  AutopaymentsResponse,
} from './types';

// Базовый URL API
const BASE_URL = 'https://gw3-online.uplati.ru/api';
const AUTH_URL = `${BASE_URL}/auth`;
/** Список счётчиков в ЛК (вместо устаревшего /sensors) */
const COUNTERS_PATH = '/user/counters';

// Опции для клиента
export interface UplatiClientOptions {
  sendDataEnabled?: boolean;
  baseUrl?: string;
  /** База локального мока при `sendDataEnabled: false` (по умолчанию http://localhost:3000 или UPLATI_MOCK_BASE_URL) */
  mockBaseUrl?: string;
  logger?: (message: string) => void;
}

function getMockBaseUrl(options?: UplatiClientOptions): string {
  const fromOpts = options?.mockBaseUrl?.trim();
  if (fromOpts) return fromOpts.replace(/\/$/, '');
  const env = typeof process !== 'undefined' ? process.env.UPLATI_MOCK_BASE_URL?.trim() : '';
  if (env) return env.replace(/\/$/, '');
  return 'http://localhost:3000';
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function counterItemToSensor(item: unknown): Sensor {
  const r = asRecord(item);
  if (!r) throw new Error('Counter item is not an object');
  const id = Number(r.id ?? r.counter_id ?? r.meter_id ?? r.sensor_id);
  if (!Number.isFinite(id)) throw new Error('Counter item has no numeric id');
  const display_name = String(
    r.display_name ?? r.name ?? r.title ?? r.service_name ?? `Счётчик ${id}`
  );
  const last_sensor_value = Number(
    r.last_sensor_value ?? r.value ?? r.current_value ?? r.reading ?? 0
  );
  const last_sensor_date = String(
    r.last_sensor_date ?? r.updated_at ?? r.last_transmission_date ?? r.date ?? ''
  );
  return { id, display_name, last_sensor_value, last_sensor_date };
}

function normalizeSensorRow(sensor: unknown): Sensor {
  const s = asRecord(sensor);
  if (!s) throw new Error('Sensor is not an object');
  const id = Number(s.id);
  if (!Number.isFinite(id)) throw new Error('Sensor has no numeric id');
  return {
    id,
    display_name: String(s.display_name ?? `Счётчик ${id}`),
    last_sensor_value: Number(s.last_sensor_value ?? 0),
    last_sensor_date: String(s.last_sensor_date ?? ''),
  };
}

function tryMapCounterLikeItems(items: unknown[]): Sensor[] {
  const out: Sensor[] = [];
  for (const item of items) {
    try {
      out.push(counterItemToSensor(item));
    } catch {
      try {
        out.push(normalizeSensorRow(item));
      } catch {
        /* next item */
      }
    }
  }
  if (items.length > 0 && out.length === 0) {
    throw new Error('Meters response: could not map list items to sensors');
  }
  return out;
}

/** Разбор ответа GET /user/counters, /sensors и типовых обёрток API */
function parseMetersPayload(data: unknown): Sensor[] {
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      throw new Error('Meters response: body is not valid JSON');
    }
  }
  const root = asRecord(data);
  if (!root) throw new Error('Meters response: invalid JSON');

  const nested = asRecord(root.data);
  const deep = nested ? asRecord(nested.data) : null;

  const candidates: unknown[][] = [];
  if (Array.isArray(root.sensors)) candidates.push(root.sensors);
  if (Array.isArray(root.counters)) candidates.push(root.counters);
  const itemsRoot = root.items;
  if (Array.isArray(itemsRoot)) candidates.push(itemsRoot);
  if (nested) {
    if (Array.isArray(nested.sensors)) candidates.push(nested.sensors);
    if (Array.isArray(nested.counters)) candidates.push(nested.counters);
    if (Array.isArray(nested.items)) candidates.push(nested.items);
  }
  if (deep) {
    if (Array.isArray(deep.counters)) candidates.push(deep.counters);
    if (Array.isArray(deep.sensors)) candidates.push(deep.sensors);
  }

  for (const arr of candidates) {
    if (arr.length > 0) {
      try {
        return tryMapCounterLikeItems(arr);
      } catch {
        /* try next key */
      }
    }
  }

  throw new Error(
    'Meters response: expected sensors, counters, or items (incl. nested under data)'
  );
}

// Функция для аутентификации: JSON (как раньше в Node) и запасной multipart
export const authenticate = async (
  email: string,
  password: string,
  options?: UplatiClientOptions
): Promise<string> => {
  const logger = options?.logger || console.log;

  const tokenFrom = (data: AuthResponse | undefined): string | null => {
    const t = data?.session?.token;
    return typeof t === 'string' && t.length > 0 ? t : null;
  };

  try {
    const jsonRes = await axios.post<AuthResponse>(
      AUTH_URL,
      { email_or_phone: email, password, weboper_token: 'null' },
      { headers: { ...getHeaders(), 'content-type': 'application/json' } }
    );
    const t1 = tokenFrom(jsonRes.data);
    if (t1) return t1;
  } catch (e: unknown) {
    if (e instanceof AxiosError) {
      logger('Auth JSON attempt: ' + (e.response?.data || e.message));
    }
  }

  try {
    const formData = new FormData();
    formData.append('email_or_phone', email);
    formData.append('password', password);
    formData.append('weboper_token', 'null');

    const response = await axios.post<AuthResponse>(AUTH_URL, formData, {
      headers: {
        ...getHeaders(),
        ...formData.getHeaders(),
      },
    });

    const t2 = tokenFrom(response.data);
    if (t2) return t2;
    throw new Error('Authentication failed: empty session.token');
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
  const mockBase = getMockBaseUrl(options);
  const headers = getHeaders(token);

  if (!sendDataEnabled) {
    const metersUrl = `${mockBase}/api/user/counters`;
    try {
      const response = await axios.get(metersUrl, { headers });
      return parseMetersPayload(response.data);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        logger('Error fetching meters data (mock): ' + (error.response?.data || error.message));
      } else {
        logger('Unexpected error fetching meters data (mock): ' + String(error));
      }
      throw error;
    }
  }

  const fetchParsed = async (path: string): Promise<Sensor[]> => {
    const response = await axios.get(`${baseUrl}${path}`, { headers });
    return parseMetersPayload(response.data);
  };

  try {
    return await fetchParsed('/sensors');
  } catch (firstErr: unknown) {
    const is404 = firstErr instanceof AxiosError && firstErr.response?.status === 404;
    const isParse =
      firstErr instanceof Error && firstErr.message.includes('Meters response');
    if (is404 || isParse) {
      logger(`GET /sensors unusable (${String(firstErr)}), trying ${COUNTERS_PATH}`);
      try {
        return await fetchParsed(COUNTERS_PATH);
      } catch (secondErr: unknown) {
        if (secondErr instanceof AxiosError) {
          logger(
            'Error fetching meters data (/user/counters): ' +
              (secondErr.response?.data || secondErr.message)
          );
        } else {
          logger('Error after /user/counters: ' + String(secondErr));
        }
        throw secondErr;
      }
    }
    if (firstErr instanceof AxiosError) {
      logger(
        'Error fetching meters data (/sensors): ' + (firstErr.response?.data || firstErr.message)
      );
    } else {
      logger('Unexpected error fetching meters data: ' + String(firstErr));
    }
    throw firstErr;
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
  const sendDataEnabled = options?.sendDataEnabled !== false;
  const mockBase = getMockBaseUrl(options);

  try {
    const formData = new FormData();
    formData.append('sensor_value', sensorValue.toString());

    const headersWithFormData = {
      ...getHeaders(token),
      ...formData.getHeaders(),
    };

    const url = sendDataEnabled
      ? `${baseUrl}/sensor/${sensorId}/value`
      : `${mockBase}/api/sensor/${sensorId}/value`;

    const response = await axios.post(url, formData, { headers: headersWithFormData });

    if (response.data?.status === 201) {
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

