import { query } from '../../config/database.js';
import { ok, fail } from '../../utils/response.js';
import { isForwardTransition } from './registration.validator.js';

const REGISTRATION_SELECT = `
  SELECT r.id,
         r.visit_date::text AS visit_date,
         r.payment_type,
         r.chief_complaint,
         r.status,
         r.created_at,
         json_build_object('id', p.id, 'medical_record_no', p.medical_record_no, 'full_name', p.full_name, 'gender', p.gender) AS patient,
         json_build_object('id', d.id, 'full_name', d.full_name, 'specialization', d.specialization) AS doctor,
         json_build_object('id', pl.id, 'name', pl.name, 'code', pl.code) AS poli
    FROM registrations r
    JOIN patients p ON p.id = r.patient_id
    JOIN doctors d ON d.id = r.doctor_id
    JOIN poli pl ON pl.id = r.poli_id
`;

async function findRegistration(id) {
  const { rows } = await query(`${REGISTRATION_SELECT} WHERE r.id = $1`, [id]);
  return rows[0] ?? null;
}

async function validateRelations({ patient_id, doctor_id, poli_id }) {
  const errors = {};

  if (patient_id) {
    const { rows } = await query(
      'SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL',
      [patient_id]
    );
    if (!rows.length) errors.patient_id = 'Pasien tidak ditemukan';
  }

  if (poli_id) {
    const { rows } = await query(
      'SELECT id FROM poli WHERE id = $1 AND is_active = TRUE',
      [poli_id]
    );
    if (!rows.length) errors.poli_id = 'Poli tidak ditemukan';
  }

  if (doctor_id) {
    const { rows } = await query(
      'SELECT id, poli_id FROM doctors WHERE id = $1 AND is_active = TRUE',
      [doctor_id]
    );
    if (!rows.length) {
      errors.doctor_id = 'Dokter tidak ditemukan';
    } else if (poli_id && Number(rows[0].poli_id) !== Number(poli_id)) {
      errors.doctor_id = 'Dokter tersebut tidak praktik di poli terpilih';
    }
  }

  return errors;
}

export async function listRegistrations(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      params.push(req.query.date);
      conditions.push(`r.visit_date = $${params.length}`);
    }

    if (req.query.status) {
      params.push(req.query.status);
      conditions.push(`r.status = $${params.length}::registration_status`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM registrations r ${where}`,
      params
    );
    const totalItems = countResult.rows[0].total;
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    const result = await query(
      `${REGISTRATION_SELECT} ${where}
       ORDER BY r.visit_date DESC, r.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return ok(res, {
      items: result.rows,
      meta: { page, limit, total_items: totalItems, total_pages: totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRegistration(req, res, next) {
  try {
    const relationErrors = await validateRelations(req.body);
    if (Object.keys(relationErrors).length) {
      return fail(res, relationErrors, 'Validation Error', 422);
    }

    const { rows } = await query(
      `INSERT INTO registrations
         (patient_id, doctor_id, poli_id, visit_date, payment_type, chief_complaint, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'menunggu', $7)
       RETURNING id`,
      [
        req.body.patient_id,
        req.body.doctor_id,
        req.body.poli_id,
        req.body.visit_date,
        req.body.payment_type,
        req.body.chief_complaint || null,
        req.user.id,
      ]
    );

    const registration = await findRegistration(rows[0].id);
    return ok(res, registration, 'Registration created successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateRegistration(req, res, next) {
  try {
    const existing = await findRegistration(req.params.id);
    if (!existing) {
      return fail(res, { id: 'Pendaftaran tidak ditemukan' }, 'Not Found', 404);
    }

    if (req.body.status && req.body.status !== existing.status) {
      if (!isForwardTransition(existing.status, req.body.status)) {
        return fail(
          res,
          { status: `Status tidak bisa berubah dari ${existing.status} ke ${req.body.status}` },
          'Validation Error',
          422
        );
      }
    }

    const nextValues = {
      patient_id: req.body.patient_id ?? existing.patient.id,
      doctor_id: req.body.doctor_id ?? existing.doctor.id,
      poli_id: req.body.poli_id ?? existing.poli.id,
    };

    const relationErrors = await validateRelations(nextValues);
    if (Object.keys(relationErrors).length) {
      return fail(res, relationErrors, 'Validation Error', 422);
    }

    await query(
      `UPDATE registrations
         SET patient_id = $1,
             doctor_id = $2,
             poli_id = $3,
             visit_date = COALESCE($4, visit_date),
             payment_type = COALESCE($5, payment_type),
             chief_complaint = COALESCE($6, chief_complaint),
             status = COALESCE($7, status)
       WHERE id = $8`,
      [
        nextValues.patient_id,
        nextValues.doctor_id,
        nextValues.poli_id,
        req.body.visit_date ?? null,
        req.body.payment_type ?? null,
        req.body.chief_complaint ?? null,
        req.body.status ?? null,
        req.params.id,
      ]
    );

    const registration = await findRegistration(req.params.id);
    return ok(res, registration, 'Registration updated successfully');
  } catch (error) {
    next(error);
  }
}

export { findRegistration };
