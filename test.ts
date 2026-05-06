import { authenticate ,getMetersData, sendSensorValue, Sensor} from './src/api';
import prompt from 'prompt-sync';

const promptSync = prompt({ sigint: true });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendValuesAndScheduleNext = async (token: string, meterValues: { meter: Sensor, increment: number, newValue: number }[], nextDate: Date) => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  while (true) {
    const now = new Date();
    const timeUntilNextSend = nextDate.getTime() - now.getTime();

    if (timeUntilNextSend <= 0) {
      console.log(`Попытка отправить новое значение для Радиозавод: ${now.toLocaleString('ru-RU', { timeZone: localTimeZone })}`);
      
      for (const { meter, newValue } of meterValues) {
        try {
          const ok = await sendSensorValue(token, meter.id, newValue);
          if (ok) {
            console.log(
              `Отправлено новое значение для ${meter.display_name}: ${newValue} в ${now.toLocaleString('ru-RU', { timeZone: localTimeZone })}`
            );
          } else {
            console.error(`API отклонило отправку для ${meter.display_name}: ${newValue}`);
          }
        } catch (error) {
          console.error(`Ошибка при отправке значения для ${meter.display_name}:`, error);
        }
      }

      console.log('Все показания успешно отправлены.');

      // Schedule next month's reading
      nextDate.setMonth(nextDate.getMonth() + 1);
      const nextLocalTimeString = nextDate.toLocaleString('ru-RU', { timeZone: localTimeZone });

      meterValues.forEach((meterValue) => {
        meterValue.newValue = parseFloat((meterValue.newValue + meterValue.increment).toFixed(3));
        console.log(`Показания для ${meterValue.meter.display_name} (${meterValue.newValue}) будут отправлены ${nextLocalTimeString}`);
      });

    } else {
      console.log(`Проверка времени отправки ${Math.min(timeUntilNextSend, 60 * 1000)} ms`);
      await delay(Math.min(timeUntilNextSend, 60 * 1000)); // Check every minute
      console.log(`Следующая проверка через ${Math.min(timeUntilNextSend, 60 * 1000)} ms`);
    }
  }
};

const main = async () => {
  const email = promptSync('Введите свой email: ', { echo: '*' });
  const password = promptSync('Введите свой пароль: ', { echo: '*' });

  try {
    const token = await authenticate(email, password);
    console.log('Аутентификация прошла успешно');

    const sensors = await getMetersData(token);

    console.log('Счетчик | Показание | Дата передачи');
    console.log('------------------------------------');
    sensors.forEach(sensor => {
      console.log(`${sensor.display_name} | ${sensor.last_sensor_value} | ${sensor.last_sensor_date}`);
    });

    const selectedMeters = promptSync('Для каких счетчиков вы хотите настроить автоматическую отправку показаний? (Введите номера через запятую, например, 1,2,3 или нажмите Enter для всех): ');
    const meterIndices = selectedMeters ? selectedMeters.split(',').map(Number) : sensors.map((_, index) => index + 1);
    const metersToConfigure = meterIndices.map(index => sensors[index - 1]);

    const meterValues = metersToConfigure.map(meter => {
      const increment = parseFloat(promptSync(`Введите прирост для ${meter.display_name} (текущее значение: ${meter.last_sensor_value}): `));
      const newValue = meter.last_sensor_value + increment;
      return { meter, increment, newValue: parseFloat(newValue.toFixed(3)) };
    });

    const dayOfMonth = parseInt(promptSync('Введите дату для установки следующего показания (номер дня в месяце, например, 25): '));
    const today = new Date().getDate();

    const getNextDate = (day: number): Date => {
      const now = new Date();
      if (day === today) {
        now.setMinutes(now.getMinutes() + 1); // Schedule 1 minutes from now
        return now;
      }

      let nextDate = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0);
      if (now.getDate() > day) {
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, day, 0, 0, 0);
      }
      return nextDate;
    };

    let nextDate = getNextDate(dayOfMonth);

    // Initial call to send values and set up the schedule
    await sendValuesAndScheduleNext(token, meterValues, nextDate);

  } catch (error) {
    console.error('Ошибка:', error);
  }
};

main();
