import { Router } from 'express';
import {
  listRegistrations,
  createRegistration,
  updateRegistration,
} from './registration.controller.js';
import {
  registrationSchema,
  registrationUpdateSchema,
} from './registration.validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { allow } from '../../middlewares/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listRegistrations);
router.post(
  '/',
  allow('administration', 'registration_officer'),
  validate(registrationSchema),
  createRegistration
);
router.put(
  '/:id',
  allow('administration', 'registration_officer'),
  validate(registrationUpdateSchema),
  updateRegistration
);

export default router;
