import Database from 'better-sqlite3';
import path from 'path';
import { logMessage } from './logging';  // Импорт логирования
import fs from 'fs';

/** Корень монорепо (где лежит lib/uplati-sdk), если cwd — workspace вроде packages/uplati-bot */
function findMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const marker = path.join(dir, 'lib', 'uplati-sdk', 'package.json');
    if (fs.existsSync(marker)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/**
 * Путь к SQLite:
 * - `USERS_DB_PATH` — полный путь или относительно cwd
 * - `UPLATI_DATA_DIR` — каталог данных (в Docker: смонтированный `/home/node/app/data`)
 * - иначе `{monorepo}/data/users.db`, а не cwd/data (npm workspace меняет cwd)
 */
function getUsersDbPath(): string {
  const raw = process.env.USERS_DB_PATH?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  }
  const dataDir = process.env.UPLATI_DATA_DIR?.trim();
  if (dataDir) {
    const resolved = path.isAbsolute(dataDir) ? dataDir : path.join(process.cwd(), dataDir);
    return path.join(resolved, 'users.db');
  }
  return path.join(findMonorepoRoot(), 'data', 'users.db');
}

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
  increment: number | null;
  /** День месяца 1–25; null — автоотправка для этого счётчика не настроена */
  auto_send_day: number | null;
}

type DbRow = UserRow | MeterRow | Record<string, unknown>;

type AsyncDb = {
  run: (sql: string, params?: QueryParams) => Promise<void>;
  get: <T extends DbRow = DbRow>(sql: string, params?: QueryParams) => Promise<T | undefined>;
  all: <T extends DbRow = DbRow>(sql: string, params?: QueryParams) => Promise<T[]>;
};

let sqliteDb: Database.Database | null = null;
let asyncDb: AsyncDb | null = null;

function migrateMetersColumns(db: Database.Database) {
  const cols = db.prepare('PRAGMA table_info(meters)').all() as { name: string }[];
  const names = new Set(cols.map((c) => c.name));
  if (!names.has('auto_send_day')) {
    db.exec('ALTER TABLE meters ADD COLUMN auto_send_day INTEGER');
    logMessage('Миграция БД: добавлен столбец meters.auto_send_day');
  }
}

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

/** Закрыть соединение и сбросить кэш (только для тестов / смены пути БД) */
export const __resetDbSingletonForTests = (): void => {
  if (sqliteDb) {
    try {
      sqliteDb.close();
    } catch {
      /* ignore */
    }
  }
  sqliteDb = null;
  asyncDb = null;
};

// Инициализация базы данных
export const initializeDb = async (): Promise<AsyncDb> => {
  if (asyncDb) {
    return asyncDb;
  }

  const dbPath = getUsersDbPath();
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
    auto_send_day INTEGER,
    FOREIGN KEY (userId) REFERENCES users(chatId)
  )`);

  migrateMetersColumns(sqliteDb);

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
  await db.run(
    'INSERT INTO meters (userId, meterId, meterName, lastValue, lastUpdated, nextSendDate, increment, auto_send_day) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL)',
    [userId, meterId, meterName, lastValue, lastUpdated]
  );
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

/** Удалить счётчики пользователя, которых нет в списке meterId из API */
export const deleteMetersExceptIds = async (userId: number, meterIds: number[]) => {
  const db = await initializeDb();
  if (meterIds.length === 0) {
    await db.run('DELETE FROM meters WHERE userId = ?', [userId]);
    logMessage(`Удалены все счётчики пользователя ${userId} (пустой ответ API)`);
    return;
  }
  const placeholders = meterIds.map(() => '?').join(',');
  await db.run(`DELETE FROM meters WHERE userId = ? AND meterId NOT IN (${placeholders})`, [userId, ...meterIds]);
  logMessage(`Синхронизация: удалены устаревшие счётчики пользователя ${userId}`);
};

/** Настройка автоотправки по счётчику */
export const setMeterAutoConfig = async (
  userId: number,
  meterId: number,
  increment: number,
  autoSendDay: number,
  nextSendDateIso: string
) => {
  const db = await initializeDb();
  await db.run(
    'UPDATE meters SET increment = ?, auto_send_day = ?, nextSendDate = ? WHERE userId = ? AND meterId = ?',
    [increment, autoSendDay, nextSendDateIso, userId, meterId]
  );
  logMessage(`Автоотправка: user=${userId} meter=${meterId} increment=${increment} day=${autoSendDay}`);
};

export const getMetersWithAutoForUser = async (userId: number) => {
  const db = await initializeDb();
  return await db.all<MeterRow>(
    `SELECT * FROM meters WHERE userId = ? AND auto_send_day IS NOT NULL AND increment IS NOT NULL AND increment > 0`,
    [userId]
  );
};