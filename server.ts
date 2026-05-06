/**
 * Локальный мок API для dry-run: задайте `SEND_DATA=false` и запустите `npm run server`.
 * Согласовано с `lib/uplati-sdk`: GET `/api/user/counters`, POST `/api/sensor/:id/value`.
 * Авторизация по-прежнему идёт на боевой gw3, если не настроен отдельный мок auth.
 */
import express from 'express';

const app = express();
const PORT = Number(process.env.MOCK_PORT ?? 3000);

/** Фикстура в формате, совместимом с `parseMetersPayload` (`sensors`) */
const mockSensors = [
  {
    id: 1,
    display_name: 'Mock: холодная вода',
    last_sensor_value: 100,
    last_sensor_date: '2026-01-01T00:00:00.000Z',
  },
];

app.get('/api/user/counters', (_req, res) => {
  res.json({ sensors: mockSensors });
});

const drainBody = express.raw({ type: '*/*', limit: '2mb' });

app.post('/api/sensor/:id/value', drainBody, (req, res) => {
  console.log('Mock POST /api/sensor/%s, bytes: %s', req.params.id, req.body?.length ?? 0);
  res.json({ status: 201 });
});

app.post('/test', express.raw({ type: '*/*', limit: '2mb' }), (_req, res) => {
  res.status(200).json({ status: 'Data received for testing' });
});

app.listen(PORT, () => {
  console.log(`Mock API: http://localhost:${PORT}`);
  console.log('  GET  /api/user/counters');
  console.log('  POST /api/sensor/:id/value -> { status: 201 }');
});
