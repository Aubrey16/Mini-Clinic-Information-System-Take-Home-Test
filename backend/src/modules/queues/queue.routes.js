import { Router } from 'express';
import {
  listQueues,
  createQueue,
  callQueue,
  callNextQueue,
  updateQueueStatus,
} from './queue.controller.js';
import { createQueueSchema, queueStatusSchema } from './queue.validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { allow } from '../../middlewares/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listQueues);
router.post(
  '/',
  allow('administration', 'registration_officer'),
  validate(createQueueSchema),
  createQueue
);
router.put(
  '/call-next',
  allow('administration', 'registration_officer'),
  callNextQueue
);
router.put(
  '/:id/call',
  allow('administration', 'registration_officer'),
  callQueue
);
router.put(
  '/:id/status',
  allow('administration', 'registration_officer', 'doctor'),
  validate(queueStatusSchema),
  updateQueueStatus
);

export default router;
