import { query } from '../../config/database.js';
import { ok, fail } from '../../utils/response.js';

const PATIENT_COLUMNS = `id, medical_record_no, nik, full_name, gender, to_char(birth_date, 'YYYY-MM-DD') AS birth_date, phone, address`;

function toPatient(row) {
  return { ...row };
}

export async function listPatients(req, res, next) {
  try {
    const search = (req.query.search ?? '').trim();
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const conditions = ['deleted_at IS NULL'];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(full_name ILIKE $${params.length} OR nik ILIKE $${params.length} OR medical_record_no ILIKE $${params.length})`
      );
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM patients ${where}`,
      params
    );
    const totalItems = countResult.rows[0].total;
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    const result = await query(
      `SELECT ${PATIENT_COLUMNS} FROM patients ${where} ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return ok(res, {
      items: result.rows.map(toPatient),
      meta: { page, limit, total_items: totalItems, total_pages: totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPatient(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT ${PATIENT_COLUMNS} FROM patients WHERE id = $1 AND deleted_at IS NULL`,
      [req.params.id]
    );

    if (!rows.length) {
      return fail(res, { id: 'Pasien tidak ditemukan' }, 'Not Found', 404);
    }

    return ok(res, toPatient(rows[0]));
  } catch (error) {
    next(error);
  }
}

export async function createPatient(req, res, next) {
  try {
    const { rows } = await query(
      `INSERT INTO patients (nik, full_name, gender, birth_date, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${PATIENT_COLUMNS}`,
      [
        req.body.nik,
        req.body.full_name,
        req.body.gender,
        req.body.birth_date,
        req.body.phone,
        req.body.address,
      ]
    );

    return ok(res, toPatient(rows[0]), 'Patient created successfully', 201);
  } catch (error) {
    if (error.code === '23505') {
      return fail(res, { nik: 'NIK sudah terdaftar' }, 'Validation Error', 422);
    }
    next(error);
  }
}

export async function updatePatient(req, res, next) {
  try {
    const { rows } = await query(
      `UPDATE patients
         SET nik = $1, full_name = $2, gender = $3, birth_date = $4, phone = $5, address = $6
       WHERE id = $7 AND deleted_at IS NULL
       RETURNING ${PATIENT_COLUMNS}`,
      [
        req.body.nik,
        req.body.full_name,
        req.body.gender,
        req.body.birth_date,
        req.body.phone,
        req.body.address,
        req.params.id,
      ]
    );

    if (!rows.length) {
      return fail(res, { id: 'Pasien tidak ditemukan' }, 'Not Found', 404);
    }

    return ok(res, toPatient(rows[0]), 'Patient updated successfully');
  } catch (error) {
    if (error.code === '23505') {
      return fail(res, { nik: 'NIK sudah terdaftar' }, 'Validation Error', 422);
    }
    next(error);
  }
}

export async function deletePatient(req, res, next) {
  try {
    const { rows } = await query(
      `UPDATE patients SET deleted_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [req.params.id]
    );

    if (!rows.length) {
      return fail(res, { id: 'Pasien tidak ditemukan' }, 'Not Found', 404);
    }

    return ok(res, null, 'Patient deleted successfully');
  } catch (error) {
    next(error);
  }
}
