import { describe, expect, it } from 'vitest';
import {
  computeInitialNextSend,
  meterRowQualifiesForAutoSend,
  nextMonthlySendAfterSuccess,
} from '../src/meterSchedule';

describe('meterSchedule', () => {
  it('computeInitialNextSend: ближайший слот в текущем месяце', () => {
    const from = new Date(2026, 4, 6, 12, 0, 0); // 6 мая
    const next = computeInitialNextSend(10, from);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(4);
    expect(next.getDate()).toBe(10);
    expect(next.getHours()).toBe(10);
  });

  it('computeInitialNextSend: перенос на следующий месяц если день уже прошёл', () => {
    const from = new Date(2026, 4, 12, 12, 0, 0);
    const next = computeInitialNextSend(10, from);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(10);
  });

  it('nextMonthlySendAfterSuccess', () => {
    const after = new Date(2026, 4, 10, 15, 30, 0);
    const next = nextMonthlySendAfterSuccess(10, after);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(5);
    expect(next.getDate()).toBe(10);
  });
});

describe('meterRowQualifiesForAutoSend (логика автосендера)', () => {
  it('включает счётчик с днём 1–25 и increment > 0', () => {
    expect(
      meterRowQualifiesForAutoSend({ auto_send_day: 15, increment: 1.5 })
    ).toBe(true);
  });

  it('отключает при отсутствии дня или неположительном приращении', () => {
    expect(meterRowQualifiesForAutoSend({ auto_send_day: null, increment: 5 })).toBe(
      false
    );
    expect(meterRowQualifiesForAutoSend({ auto_send_day: 10, increment: 0 })).toBe(false);
    expect(meterRowQualifiesForAutoSend({ auto_send_day: 10, increment: null })).toBe(
      false
    );
    expect(meterRowQualifiesForAutoSend({ auto_send_day: 30, increment: 2 })).toBe(false);
  });
});
