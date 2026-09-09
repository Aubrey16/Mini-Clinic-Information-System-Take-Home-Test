import { Router } from 'express';
import { query } from '../../config/database.js';
import { ok } from '../../utils/response.js';
import { authenticate } from '../../middlewares/auth.js';

async function getDashboard(req, res, next) {
  try {
    const { rows: statRows } = await query('SELECT * FROM v_dashboard_today');
    const stats = statRows[0];

    const { rows: queueRows } = await query(
      `SELECT q.id,
              q.queue_number,
              q.status,
              json_build_object('full_name', p.full_name) AS patient,
              json_build_object('name', pl.name) AS poli
         FROM queues q
         JOIN registrations r ON r.id = q.registration_id
         JOIN patients p ON p.id = r.patient_id
         JOIN poli pl ON pl.id = r.poli_id
        WHERE q.queue_date = CURRENT_DATE
        ORDER BY q.queue_number ASC
        LIMIT 5`
    );

    const { rows: activityRows } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM registrations
           WHERE visit_date = CURRENT_DATE
             AND status IN ('check_in', 'pemeriksaan')) AS check_in_today,
         (SELECT COUNT(*)::int FROM queues
           WHERE queue_date = CURRENT_DATE AND status = 'pemeriksaan') AS in_examination,
         (SELECT COUNT(*)::int FROM doctors WHERE is_active = TRUE) AS active_doctors`
    );

    return ok(res, {
      total_patients: stats.total_patients,
      total_patients_today: stats.total_patients_today,
      total_queue_today: stats.total_queue_today,
      total_waiting: stats.total_waiting,
      total_finished: stats.total_finished,
      check_in_today: activityRows[0].check_in_today,
      in_examination: activityRows[0].in_examination,
      active_doctors: activityRows[0].active_doctors,
      recent_queues: queueRows,
    });
  } catch (error) {
    next(error);
  }
}

const router = Router();

router.use(authenticate);

router.get('/', getDashboard);

export default router;
