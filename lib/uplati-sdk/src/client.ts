// Основной клиент для работы с API Uplati
import {
  authenticate as auth,
  getMetersData,
  sendSensorValue,
  getReceipts,
  getTransactions,
  getAutopayments,
  setAutopayment,
  deleteAutopayment,
  UplatiClientOptions,
} from './api';
import {
  Sensor,
  Receipt,
  Transaction,
  Autopayment,
  AutopaymentSettings,
} from './types';

export class UplatiClient {
  private token: string | null = null;
  private options: UplatiClientOptions;

  constructor(options?: UplatiClientOptions) {
    this.options = options || {};
  }

  // Авторизация
  async authenticate(email: string, password: string): Promise<string> {
    this.token = await auth(email, password, this.options);
    return this.token;
  }

  // Установка токена напрямую
  setToken(token: string): void {
    this.token = token;
  }

  // Получить текущий токен
  getToken(): string | null {
    return this.token;
  }

  // Получить данные по счётчикам
  async getMeters(): Promise<Sensor[]> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return getMetersData(this.token, this.options);
  }

  // Отправить показания счётчика
  async sendMeterValue(sensorId: number, sensorValue: number | string): Promise<boolean> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return sendSensorValue(this.token, sensorId, sensorValue, this.options);
  }

  // Получить список квитанций
  async getReceipts(): Promise<Receipt[]> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return getReceipts(this.token, this.options);
  }

  // Получить последние транзакции
  async getTransactions(limit?: number): Promise<Transaction[]> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return getTransactions(this.token, limit, this.options);
  }

  // Получить список автоплатежей
  async getAutopayments(): Promise<Autopayment[]> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return getAutopayments(this.token, this.options);
  }

  // Настроить автоплатеж
  async setAutopayment(settings: AutopaymentSettings): Promise<boolean> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return setAutopayment(this.token, settings, this.options);
  }

  // Удалить автоплатеж
  async deleteAutopayment(autopaymentId: number): Promise<boolean> {
    if (!this.token) {
      throw new Error('Token is required. Please authenticate first.');
    }
    return deleteAutopayment(this.token, autopaymentId, this.options);
  }
}

