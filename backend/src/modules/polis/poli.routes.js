import { Router } from 'express';
import { query } from '../../config/database.js';
import { ok } from '../../utils/response.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, code, name, description FROM poli WHERE is_active = TRUE ORDER BY name ASC`
    );
    return ok(res, { items: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
