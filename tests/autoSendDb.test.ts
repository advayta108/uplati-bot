import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterAll, describe, expect, it } from 'vitest';

const tmpRoot = mkdtempSync(join(tmpdir(), 'uplati-autosend-'));
process.env.USERS_DB_PATH = join(tmpRoot, 'users.db');

const dbmod = await import('../src/database');

afterAll(() => {
  dbmod.__resetDbSingletonForTests();
});

describe('автосендер и БД', () => {
  it('getMetersWithAutoForUser после setMeterAutoConfig', async () => {
    await dbmod.initializeDb();
    const chatId = 990_001;
    await dbmod.addUser(chatId, 'auto-test@example.com', 'x', 'token');
    await dbmod.upsertMeter(chatId, 42, 'Тестовый счётчик', 100, '2026-01-01');
    await dbmod.setMeterAutoConfig(chatId, 42, 3, 12, new Date().toISOString());

    const rows = await dbmod.getMetersWithAutoForUser(chatId);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.meterId).toBe(42);
    expect(rows[0]!.increment).toBe(3);
    expect(rows[0]!.auto_send_day).toBe(12);
  });

  it('счётчик без авто не попадает в выборку', async () => {
    dbmod.__resetDbSingletonForTests();
    process.env.USERS_DB_PATH = join(tmpRoot, 'users2.db');
    await dbmod.initializeDb();
    const chatId = 990_002;
    await dbmod.addUser(chatId, 'b@example.com', 'p', 't');
    await dbmod.upsertMeter(chatId, 1, 'M', 1, '2026-01-01');

    const rows = await dbmod.getMetersWithAutoForUser(chatId);
    expect(rows).toHaveLength(0);
  });
});
