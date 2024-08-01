import express from 'express';

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/test', (req, res) => {
  console.log('Received data:', req.body);
  res.status(200).send({ status: 'Data received for testing' });
});

app.listen(PORT, () => {
  console.log(`Test server is running on http://localhost:${PORT}`);
});
