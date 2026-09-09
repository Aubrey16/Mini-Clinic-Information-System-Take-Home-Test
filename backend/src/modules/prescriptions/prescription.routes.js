import { query } from '../../config/database.js';
import { ok, fail } from '../../utils/response.js';
import { findRecord } from '../medical-records/medicalRecord.controller.js';
import { prescriptionCreateSchema } from '../medical-records/medicalRecord.validator.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { allow } from '../../middlewares/role.js';
import { Router } from 'express';

async function findPrescription(id) {
  const { rows } = await query(
    `SELECT pr.id,
            pr.notes,
            pr.created_at,
            json_build_object('id', mr.id, 'registration_id', mr.registration_id) AS medical_record,
            json_build_object('id', p.id, 'medical_record_no', p.medical_record_no, 'full_name', p.full_name) AS patient,
            json_build_object('id', d.id, 'full_name', d.full_name) AS doctor
       FROM prescriptions pr
       JOIN medical_records mr ON mr.id = pr.medical_record_id
       JOIN patients p ON p.id = pr.patient_id
       JOIN doctors d ON d.id = pr.doctor_id
      WHERE pr.id = $1`,
    [id]
  );

  if (!rows.length) return null;

  const items = await query(
    `SELECT id, medicine_name, dosage, frequency, duration, instructions
       FROM prescription_items WHERE prescription_id = $1 ORDER BY id`,
    [id]
  );

  return { ...rows[0], items: items.rows };
}

async function createPrescription(req, res, next) {
  try {
    const { rows: recordRows } = await query(
      'SELECT id, patient_id, doctor_id FROM medical_records WHERE id = $1',
      [req.body.medical_record_id]
    );

    if (!recordRows.length) {
      return fail(res, { medical_record_id: 'Pemeriksaan tidak ditemukan' }, 'Not Found', 404);
    }

    const record = recordRows[0];

    const { rows: prescRows } = await query(
      `INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, notes)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [record.id, record.patient_id, record.doctor_id, req.body.notes || null]
    );

    for (const item of req.body.items) {
      await query(
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

    const prescription = await findPrescription(prescRows[0].id);
    return ok(res, prescription, 'Prescription saved successfully', 201);
  } catch (error) {
    next(error);
  }
}

async function getPrescription(req, res, next) {
  try {
    const prescription = await findPrescription(req.params.id);
    if (!prescription) {
      return fail(res, { id: 'Resep tidak ditemukan' }, 'Not Found', 404);
    }
    return ok(res, prescription);
  } catch (error) {
    next(error);
  }
}

const router = Router();

router.use(authenticate);

router.post(
  '/',
  allow('doctor', 'administration'),
  validate(prescriptionCreateSchema),
  createPrescription
);
router.get('/:id', getPrescription);

export default router;
