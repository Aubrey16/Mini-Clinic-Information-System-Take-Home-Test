import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import authRouter from './modules/auth/auth.routes.js';
import patientRouter from './modules/patients/patient.routes.js';
import poliRouter from './modules/polis/poli.routes.js';
import doctorRouter from './modules/doctors/doctor.routes.js';
import registrationRouter from './modules/registrations/registration.routes.js';
import queueRouter from './modules/queues/queue.routes.js';
import medicalRecordRouter from './modules/medical-records/medicalRecord.routes.js';
import prescriptionRouter from './modules/prescriptions/prescription.routes.js';
import { pool } from './config/database.js';
import { ok, fail } from './utils/response.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? '*',
    })
  );
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  const specPath = path.resolve(__dirname, '../../docs/openapi.yaml');
  const openApiSpec = YAML.parse(fs.readFileSync(specPath, 'utf8'));

  app.use(
    '/api-docs',
    (req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"
      );
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec)
  );

  app.use('/', authRouter);
  app.use('/patients', patientRouter);
  app.use('/polis', poliRouter);
  app.use('/doctors', doctorRouter);
  app.use('/registrations', registrationRouter);
  app.use('/queues', queueRouter);
  app.use('/medical-records', medicalRecordRouter);
  app.use('/prescriptions', prescriptionRouter);

  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      return ok(res, { status: 'ok', database: 'connected' });
    } catch (error) {
      return fail(res, { database: 'disconnected' }, 'Service Unavailable', 503);
    }
  });

  app.use((req, res) => {
    return fail(
      res,
      { endpoint: `Cannot ${req.method} ${req.originalUrl}` },
      'Not Found',
      404
    );
  });

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return fail(res, { body: 'Invalid JSON format' }, 'Validation Error', 400);
    }
    console.error(err);
    return fail(res, { server: 'Internal server error' }, 'Internal Server Error', 500);
  });

  return app;
}

export default createApp;
