import { query, pool } from '../../config/database.js';
import { ok, fail } from '../../utils/response.js';
import { canTransition, REGISTRATION_STATUS_SYNC } from './queue.validator.js';

const QUEUE_SELECT = `
  SELECT q.id,
         q.queue_number,
         q.queue_date::text AS queue_date,
         q.status,
         q.called_at,
         q.started_at,
         q.finished_at,
         q.registration_id,
         json_build_object('id', r.id, 'visit_date', r.visit_date::text, 'payment_type', r.payment_type, 'chief_complaint', r.chief_complaint, 'status', r.status) AS registration,
         json_build_object('id', p.id, 'medical_record_no', p.medical_record_no, 'full_name', p.full_name) AS patient,
         json_build_object('id', d.id, 'full_name', d.full_name) AS doctor,
         json_build_object('id', pl.id, 'name', pl.name, 'code', pl.code) AS poli
    FROM queues q
    JOIN registrations r ON r.id = q.registration_id
    JOIN patients p ON p.id = r.patient_id
    JOIN doctors d ON d.id = r.doctor_id
    JOIN poli pl ON pl.id = r.poli_id
`;

async function findQueue(id) {
  const { rows } = await query(`${QUEUE_SELECT} WHERE q.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listQueues(req, res, next) {
  try {
    const date = req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : undefined;
    const status = req.query.status;

    const conditions = [];
    const params = [];

    if (date) {
      params.push(date);
      conditions.push(`q.queue_date = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`q.status = $${params.length}::queue_status`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `${QUEUE_SELECT} ${where}
       ORDER BY q.queue_number ASC`,
      params
    );

    return ok(res, { items: result.rows });
  } catch (error) {
    next(error);
  }
}

export async function createQueue(req, res, next) {
  try {
    const { rows: regRows } = await query(
      'SELECT id, status FROM registrations WHERE id = $1',
      [req.body.registration_id]
    );

    if (!regRows.length) {
      return fail(res, { registration_id: 'Pendaftaran tidak ditemukan' }, 'Not Found', 404);
    }

    if (regRows[0].status === 'selesai') {
      return fail(
        res,
        { registration_id: 'Pendaftaran ini sudah selesai' },
        'Validation Error',
        422
      );
    }

    const { rows } = await query(
      'INSERT INTO queues (registration_id, queue_date) VALUES ($1, CURRENT_DATE) RETURNING id',
      [req.body.registration_id]
    );

    const queue = await findQueue(rows[0].id);
    return ok(res, queue, 'Queue created successfully', 201);
  } catch (error) {
    if (error.code === '23505') {
      return fail(
        res,
        { registration_id: 'Pendaftaran ini sudah memiliki antrean' },
        'Validation Error',
        422
      );
    }
    next(error);
  }
}

async function applyStatus(queueId, status) {
  const stamps = {
    dipanggil: 'called_at',
    pemeriksaan: 'started_at',
    selesai: 'finished_at',
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE queues SET status = $1::queue_status, ${stamps[status] ? `${stamps[status]} = now()` : 'updated_at = now()'} WHERE id = $2`,
      [status, queueId]
    );

    const regStatus = REGISTRATION_STATUS_SYNC[status];
    if (regStatus) {
      await client.query(
        `UPDATE registrations SET status = $1::registration_status
         WHERE id = (SELECT registration_id FROM queues WHERE id = $2)
           AND status::text <> $1`,
        [regStatus, queueId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function callQueue(req, res, next) {
  try {
    const queue = await findQueue(req.params.id);
    if (!queue) {
      return fail(res, { id: 'Antrean tidak ditemukan' }, 'Not Found', 404);
    }

    if (queue.status !== 'menunggu') {
      return fail(
        res,
        { status: `Antrean ${queue.queue_number} tidak bisa dipanggil (status saat ini: ${queue.status})` },
        'Validation Error',
        422
      );
    }

    await applyStatus(queue.id, 'dipanggil');
    const updated = await findQueue(queue.id);
    return ok(res, updated, `Antrean ${updated.queue_number} dipanggil`);
  } catch (error) {
    next(error);
  }
}

export async function callNextQueue(req, res, next) {
  try {
    const { rows } = await query(
      `${QUEUE_SELECT}
      WHERE q.queue_date = CURRENT_DATE AND q.status = 'menunggu'
      ORDER BY q.queue_number ASC
      LIMIT 1`
    );

    if (!rows.length) {
      return fail(res, { queue: 'Tidak ada antrean menunggu hari ini' }, 'Not Found', 404);
    }

    await applyStatus(rows[0].id, 'dipanggil');
    const updated = await findQueue(rows[0].id);
    return ok(res, updated, `Antrean ${updated.queue_number} dipanggil`);
  } catch (error) {
    next(error);
  }
}

export async function updateQueueStatus(req, res, next) {
  try {
    const queue = await findQueue(req.params.id);
    if (!queue) {
      return fail(res, { id: 'Antrean tidak ditemukan' }, 'Not Found', 404);
    }

    const target = req.body.status;

    if (queue.status === target) {
      return fail(res, { status: `Antrean sudah berstatus ${target}` }, 'Validation Error', 422);
    }

    if (!canTransition(queue.status, target)) {
      return fail(
        res,
        { status: `Status antrean tidak bisa berubah dari ${queue.status} ke ${target}` },
        'Validation Error',
        422
      );
    }

    await applyStatus(queue.id, target);
    const updated = await findQueue(queue.id);
    return ok(res, updated, 'Queue status updated successfully');
  } catch (error) {
    next(error);
  }
}
