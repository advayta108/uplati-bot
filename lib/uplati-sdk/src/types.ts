// Типы для библиотеки Uplati SDK

// Интерфейс для счётчиков
export interface Sensor {
  id: number;
  last_sensor_value: number;
  last_sensor_date: string;
  display_name: string;
}

// Интерфейс для квитанций
export interface Receipt {
  id: number;
  number: string;
  date: string;
  amount: number;
  status: string;
  service_name?: string;
  period?: string;
}

// Интерфейс для транзакций
export interface Transaction {
  id: number;
  date: string;
  amount: number;
  status: string;
  type: string;
  description?: string;
  receipt_id?: number;
}

// Интерфейс для автоплатежей
export interface Autopayment {
  id: number;
  name: string;
  service_id: number;
  service_name: string;
  amount?: number;
  enabled: boolean;
  next_payment_date?: string;
  payment_method?: string;
}

// Интерфейс для настроек автоплатежа
export interface AutopaymentSettings {
  service_id: number;
  amount?: number;
  enabled: boolean;
  payment_method?: string;
  threshold?: number;
}

// Интерфейс для ответа авторизации
export interface AuthResponse {
  session: {
    token: string;
  };
}

// Интерфейс для ответа со списком счётчиков
export interface SensorsResponse {
  sensors: Sensor[];
}

// Интерфейс для ответа со списком квитанций
export interface ReceiptsResponse {
  receipts: Receipt[];
}

// Интерфейс для ответа со списком транзакций
export interface TransactionsResponse {
  transactions: Transaction[];
}

// Интерфейс для ответа со списком автоплатежей
export interface AutopaymentsResponse {
  autopayments: Autopayment[];
}

