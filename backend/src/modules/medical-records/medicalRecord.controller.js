import { query, pool } from '../../config/database.js';
import { ok, fail } from '../../utils/response.js';

const RECORD_SELECT = `
  SELECT mr.id,
         mr.registration_id,
         mr.patient_id,
         mr.doctor_id,
         mr.subjective,
         mr.blood_pressure,
         mr.body_temperature,
         mr.weight_kg,
         mr.height_cm,
         mr.assessment,
         mr.plan,
         mr.examined_at,
         json_build_object('id', p.id, 'medical_record_no', p.medical_record_no, 'full_name', p.full_name, 'gender', p.gender) AS patient,
         json_build_object('id', d.id, 'full_name', d.full_name, 'specialization', d.specialization) AS doctor
    FROM medical_records mr
    JOIN patients p ON p.id = mr.patient_id
    JOIN doctors d ON d.id = mr.doctor_id
`;

async function attachRelations(client, recordId) {
  const actions = await client.query(
    'SELECT id, name, notes FROM medical_actions WHERE medical_record_id = $1 ORDER BY id',
    [recordId]
  );

  const prescriptions = await client.query(
    `SELECT pr.id, pr.notes, pr.created_at,
            json_agg(json_build_object(
              'id', pi.id, 'medicine_name', pi.medicine_name, 'dosage', pi.dosage,
              'frequency', pi.frequency, 'duration', pi.duration, 'instructions', pi.instructions
            ) ORDER BY pi.id) AS items
       FROM prescriptions pr
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
      WHERE pr.medical_record_id = $1
      GROUP BY pr.id, pr.notes, pr.created_at
      ORDER BY pr.id`,
    [recordId]
  );

  return {
    medical_actions: actions.rows,
    prescriptions: prescriptions.rows.map((row) => ({
      ...row,
      items: row.items.filter((item) => item.id !== null),
    })),
  };
}

async function findRecord(recordId) {
  const { rows } = await query(`${RECORD_SELECT} WHERE mr.id = $1`, [recordId]);
  if (!rows.length) return null;
  const relations = await attachRelations(pool, recordId);
  return { ...rows[0], ...relations };
}

export async function createMedicalRecord(req, res, next) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: regRows } = await client.query(
      `SELECT r.id, r.patient_id, r.doctor_id, r.status
         FROM registrations r WHERE r.id = $1 FOR UPDATE`,
      [req.body.registration_id]
    );

    if (!regRows.length) {
      await client.query('ROLLBACK');
      return fail(res, { registration_id: 'Pendaftaran tidak ditemukan' }, 'Not Found', 404);
    }

    const registration = regRows[0];

    if (registration.status === 'selesai') {
      await client.query('ROLLBACK');
      return fail(
        res,
        { registration_id: 'Pemeriksaan untuk pendaftaran ini sudah tersimpan' },
        'Validation Error',
        422
      );
    }

    const { rows: recordRows } = await client.query(
      `INSERT INTO medical_records
         (registration_id, patient_id, doctor_id, subjective, blood_pressure,
          body_temperature, weight_kg, height_cm, assessment, plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        registration.id,
        registration.patient_id,
        registration.doctor_id,
        req.body.subjective || null,
        req.body.blood_pressure || null,
        req.body.body_temperature ?? null,
        req.body.weight_kg ?? null,
        req.body.height_cm ?? null,
        req.body.assessment,
        req.body.plan,
      ]
    );
    const recordId = recordRows[0].id;

    for (const action of req.body.medical_actions) {
      await client.query(
        'INSERT INTO medical_actions (medical_record_id, name, notes) VALUES ($1, $2, $3)',
        [recordId, action.name, action.notes || null]
      );
    }

    for (const prescription of req.body.prescriptions) {
      const { rows: prescRows } = await client.query(
        `INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, notes)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [recordId, registration.patient_id, registration.doctor_id, prescription.notes || null]
      );

      for (const item of prescription.items) {
        await client.query(
          `INSERT INTO prescription_items
             (prescription_id, medicine_name, dosage, frequency, duration, instructions)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            prescRows[0].id,
            item.medicine_name,
            item.dosage,
            item.frequency,
            item.duration || null,
            item.instructions || null,
          ]
        );
      }
    }

    await client.query(
      `UPDATE registrations SET status = 'selesai' WHERE id = $1`,
      [registration.id]
    );

    await client.query(
      `UPDATE queues SET status = 'selesai', finished_at = now()
       WHERE registration_id = $1 AND status IN ('menunggu', 'dipanggil', 'pemeriksaan')`,
      [registration.id]
    );

    await client.query('COMMIT');

    const record = await findRecord(recordId);
    return ok(res, record, 'Medical record saved successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') {
      return fail(
        res,
        { registration_id: 'Pendaftaran ini sudah memiliki pemeriksaan' },
        'Validation Error',
        422
      );
    }
    next(error);
  } finally {
    client.release();
  }
}

export async function listMedicalRecords(req, res, next) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search ?? '').trim();

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(p.full_name ILIKE $${params.length} OR p.medical_record_no ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
         FROM medical_records mr
         JOIN patients p ON p.id = mr.patient_id ${where}`,
      params
    );
    const totalItems = countResult.rows[0].total;
    const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

    const { rows } = await query(
      `${RECORD_SELECT} ${where}
       ORDER BY mr.examined_at DESC, mr.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        ...(await attachRelations(pool, row.id)),
      }))
    );

    return ok(res, {
      items,
      meta: { page, limit, total_items: totalItems, total_pages: totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPatientHistory(req, res, next) {
  try {
    const patientId = Number(req.params.patientId);

    const { rows: patientRows } = await query(
      'SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL',
      [patientId]
    );

    if (!patientRows.length) {
      return fail(res, { patientId: 'Pasien tidak ditemukan' }, 'Not Found', 404);
    }

    const { rows } = await query(
      `${RECORD_SELECT} WHERE mr.patient_id = $1 ORDER BY mr.examined_at DESC, mr.id DESC`,
      [patientId]
    );

    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        ...(await attachRelations(pool, row.id)),
      }))
    );

    return ok(res, { items });
  } catch (error) {
    next(error);
  }
}

export { findRecord };
