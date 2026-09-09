import { Router } from 'express';
import {
  createMedicalRecord,
  listMedicalRecords,
  getPatientHistory,
} from './medicalRecord.controller.js';
import { medicalRecordSchema } from './medicalRecord.validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { allow } from '../../middlewares/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listMedicalRecords);
router.post(
  '/',
  allow('doctor', 'administration'),
  validate(medicalRecordSchema),
  createMedicalRecord
);
router.get('/:patientId', getPatientHistory);

export default router;
