import { beforeAll, describe, expect, it } from 'vitest';
import { UplatiClient } from '@advayta108/uplati-sdk';

const email = process.env.TEST_USER_EMAIL;
const pass = process.env.TEST_USER_PASS;
const runApiTests = Boolean(email && pass);

beforeAll(() => {
  if (process.env.CI === 'true' && !runApiTests) {
    throw new Error(
      'В CI задайте secrets TEST_USER_EMAIL и TEST_USER_PASS для интеграционных тестов API.'
    );
  }
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

  it('отправка показаний: те же значения, что вернул API', async () => {
    await client.authenticate(email!, pass!);
    const meters = await client.getMeters();
    expect(Array.isArray(meters)).toBe(true);

    for (const m of meters) {
      const ok = await client.sendMeterValue(m.id, m.last_sensor_value);
      expect(ok, `sendMeterValue для ${m.display_name} (${m.id})`).toBe(true);
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
  });
});
