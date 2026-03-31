import Database from 'better-sqlite3';
import path from 'path';
import { logMessage } from './logging';  // Импорт логирования
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'users.db');

const ensureDirectoryExists = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logMessage(`Папка для базы данных создана: ${dir}`);
  }
};

type QueryParams = Array<string | number | null>;

export interface UserRow {
  chatId: number;
  email: string;
  password: string;
  token: string | null;
}

export interface MeterRow {
  id: number;
  userId: number;
  meterId: number;
  meterName: string;
  lastValue: number;
  lastUpdated: string;
  nextSendDate: string | null;
  increment: number;
}

type DbRow = UserRow | MeterRow | Record<string, unknown>;

type AsyncDb = {
  run: (sql: string, params?: QueryParams) => Promise<void>;
  get: <T extends DbRow = DbRow>(sql: string, params?: QueryParams) => Promise<T | undefined>;
  all: <T extends DbRow = DbRow>(sql: string, params?: QueryParams) => Promise<T[]>;
};

let sqliteDb: Database.Database | null = null;
let asyncDb: AsyncDb | null = null;

const createAsyncDbAdapter = (db: Database.Database): AsyncDb => ({
  run: async (sql: string, params: QueryParams = []) => {
    db.prepare(sql).run(...params);
  },
  get: async <T extends DbRow = DbRow>(sql: string, params: QueryParams = []) => {
    return db.prepare(sql).get(...params) as T | undefined;
  },
  all: async <T extends DbRow = DbRow>(sql: string, params: QueryParams = []) => {
    return db.prepare(sql).all(...params) as T[];
  },
});

// Инициализация базы данных
export const initializeDb = async (): Promise<AsyncDb> => {
  if (asyncDb) {
    return asyncDb;
  }

  ensureDirectoryExists(dbPath);  // Проверка папки
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  sqliteDb.exec(`CREATE TABLE IF NOT EXISTS users (
    chatId INTEGER PRIMARY KEY,
    email TEXT,
    password TEXT,
    token TEXT
  )`);

  sqliteDb.exec(`CREATE TABLE IF NOT EXISTS meters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    meterId INTEGER,
    meterName TEXT,
    lastValue REAL,
    lastUpdated TEXT,
    nextSendDate TEXT,
    increment REAL,
    FOREIGN KEY (userId) REFERENCES users(chatId)
  )`);

  asyncDb = createAsyncDbAdapter(sqliteDb);
  logMessage('База данных инициализирована');
  return asyncDb;
};

// Функция для добавления пользователя
export const addUser = async (chatId: number, email: string, password: string, token: string) => {
  const db = await initializeDb();
  await db.run('INSERT OR REPLACE INTO users (chatId, email, password, token) VALUES (?, ?, ?, ?)', [chatId, email, password, token]);
  logMessage(`Пользователь ${chatId} успешно добавлен в базу данных`);
};

// Функция для добавления счётчика пользователя
export const addMeter = async (userId: number, meterId: number, meterName: string, lastValue: number, lastUpdated: string) => {
  const db = await initializeDb();
  await db.run('INSERT INTO meters (userId, meterId, meterName, lastValue, lastUpdated) VALUES (?, ?, ?, ?, ?)', [userId, meterId, meterName, lastValue, lastUpdated]);
  logMessage(`Счётчик ${meterName} добавлен для пользователя ${userId}`);
};

// Функция для обновления счётчика пользователя
export const updateMeter = async (userId: number, meterId: number, meterName: string, lastValue: number, lastUpdated: string) => {
  const db = await initializeDb();
  await db.run('UPDATE meters SET meterName = ?, lastValue = ?, lastUpdated = ? WHERE userId = ? AND meterId = ?', 
    [meterName, lastValue, lastUpdated, userId, meterId]);
  logMessage(`Счётчик ${meterName} обновлён для пользователя ${userId}`);
};

// Функция для обновления или добавления счётчика (upsert)
export const upsertMeter = async (userId: number, meterId: number, meterName: string, lastValue: number, lastUpdated: string) => {
  const db = await initializeDb();
  const existing = await db.get<MeterRow>('SELECT * FROM meters WHERE userId = ? AND meterId = ?', [userId, meterId]);
  
  if (existing) {
    await updateMeter(userId, meterId, meterName, lastValue, lastUpdated);
  } else {
    await addMeter(userId, meterId, meterName, lastValue, lastUpdated);
  }
};

// Функция для обновления токена пользователя
export const updateUserToken = async (chatId: number, token: string) => {
  const db = await initializeDb();
  await db.run('UPDATE users SET token = ? WHERE chatId = ?', [token, chatId]);
  logMessage(`Токен обновлён для пользователя ${chatId}`);
};

// Функция для получения всех пользователей
export const getAllUsers = async () => {
  const db = await initializeDb();
  return await db.all<UserRow>('SELECT * FROM users');
};

// Функция для получения пользователя по chatId
export const getUser = async (chatId: number) => {
  const db = await initializeDb();
  return await db.get<UserRow>('SELECT * FROM users WHERE chatId = ?', [chatId]);
};