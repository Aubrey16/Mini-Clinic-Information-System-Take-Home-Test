import 'dotenv/config';
import createApp from './app.js';
import { pool } from './config/database.js';

const port = Number(process.env.PORT) || 5000;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
