/** Локальное время процесса (на сервере желательно TZ=Europe/Moscow). Час отправки показаний. */
const SEND_HOUR = 10;
const SEND_MINUTE = 0;

/** Счётчик участвует в автоотправке (`run.ts`): заданы день месяца и положительное приращение */
export function meterRowQualifiesForAutoSend(m: {
  auto_send_day: number | null;
  increment: number | null;
}): boolean {
  const day = m.auto_send_day;
  const inc = Number(m.increment);
  return day != null && day >= 1 && day <= 25 && Number.isFinite(inc) && inc > 0;
}

/**
 * Ближайшая дата-время отправки: `dayOfMonth` в текущем или следующем месяце в SEND_HOUR.
 */
export function computeInitialNextSend(dayOfMonth: number, from: Date = new Date()): Date {
  let target = new Date(
    from.getFullYear(),
    from.getMonth(),
    dayOfMonth,
    SEND_HOUR,
    SEND_MINUTE,
    0,
    0
  );
  if (target.getTime() <= from.getTime()) {
    target = new Date(
      from.getFullYear(),
      from.getMonth() + 1,
      dayOfMonth,
      SEND_HOUR,
      SEND_MINUTE,
      0,
      0
    );
  }
  return target;
}

/** Следующий месяц, тот же календарный день (1–25). */
export function nextMonthlySendAfterSuccess(dayOfMonth: number, after: Date = new Date()): Date {
  return new Date(
    after.getFullYear(),
    after.getMonth() + 1,
    dayOfMonth,
    SEND_HOUR,
    SEND_MINUTE,
    0,
    0
  );
}
