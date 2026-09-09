import { Router } from 'express';
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from './patient.controller.js';
import { patientSchema } from './patient.validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { allow } from '../../middlewares/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listPatients);
router.get('/:id', getPatient);
router.post('/', allow('administration', 'registration_officer'), validate(patientSchema), createPatient);
router.put('/:id', allow('administration', 'registration_officer'), validate(patientSchema), updatePatient);
router.delete('/:id', allow('administration'), deletePatient);

export default router;
