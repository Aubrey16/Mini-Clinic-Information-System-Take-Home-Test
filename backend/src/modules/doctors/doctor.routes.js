import { Router } from 'express';
import { query } from '../../config/database.js';
import { ok } from '../../utils/response.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.id, d.full_name, d.specialization, d.poli_id, p.name AS poli_name, p.code AS poli_code
         FROM doctors d
         JOIN poli p ON p.id = d.poli_id
        WHERE d.is_active = TRUE
        ORDER BY d.full_name ASC`
    );
    return ok(res, { items: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
