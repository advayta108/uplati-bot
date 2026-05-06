import { describe, expect, it } from 'vitest';
import { UplatiClient } from '@advayta108/uplati-sdk';

const email = process.env.TEST_USER_EMAIL;
const pass = process.env.TEST_USER_PASS;
const runApiTests = Boolean(email && pass);

/**
 * Не полагаться на `beforeAll` при полностью пропущенном `describe`: Vitest может не вызывать хук,
 * и CI пройдёт без секретов. Этот тест всегда выполняется.
 */
describe('CI: secrets for API integration', () => {
  it('requires TEST_USER_EMAIL and TEST_USER_PASS when CI=true', () => {
    if (process.env.CI !== 'true') return;
    expect(
      runApiTests,
      'Add repository secrets TEST_USER_EMAIL and TEST_USER_PASS (GitHub → Settings → Secrets).'
    ).toBe(true);
  });
});

describe.skipIf(!runApiTests)('Uplati API (боевой gw3-online)', () => {
  const client = new UplatiClient({
    sendDataEnabled: true,
    logger: () => {
      /* тихий лог в CI */
    },
  });

  it('авторизация по TEST_USER_EMAIL / TEST_USER_PASS', async () => {
    const token = await client.authenticate(email!, pass!);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  it('отправка показаний: вызов API (дубликат показания часто отклоняется)', async () => {
    await client.authenticate(email!, pass!);
    const meters = await client.getMeters();
    expect(meters.length).toBeGreaterThan(0);

    const outcomes: { name: string; id: number; ok: boolean }[] = [];
    for (const m of meters) {
      const ok = await client.sendMeterValue(m.id, m.last_sensor_value);
      outcomes.push({ name: m.display_name, id: m.id, ok });
    }

    expect(outcomes.length).toBe(meters.length);
    const accepted = outcomes.filter((o) => o.ok).length;
    if (accepted === 0) {
      console.warn(
        '[integration] Все sendMeterValue вернули false — для части УК повтор того же показания запрещён; эндпоинт отработал без исключений.'
      );
    }
  });

  it('квитанции, транзакции, автоплатежи', async () => {
    await client.authenticate(email!, pass!);
    const receipts = await client.getReceipts();
    const transactions = await client.getTransactions(10);
    const autopayments = await client.getAutopayments();

    expect(Array.isArray(receipts)).toBe(true);
    expect(Array.isArray(transactions)).toBe(true);
    expect(Array.isArray(autopayments)).toBe(true);

    if (receipts.length > 0) {
      expect(typeof receipts[0]?.id).toBe('number');
    }
  });
});
