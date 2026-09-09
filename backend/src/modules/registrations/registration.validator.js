import { z } from 'zod';

export const registrationSchema = z.object({
  patient_id: z.coerce.number().int().positive('Pasien wajib dipilih'),
  doctor_id: z.coerce.number().int().positive('Dokter wajib dipilih'),
  poli_id: z.coerce.number().int().positive('Poli wajib dipilih'),
  visit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal kunjungan harus format YYYY-MM-DD')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal kunjungan tidak valid'),
  payment_type: z.enum(['bpjs', 'tunai', 'asuransi'], {
    message: 'Jenis pembayaran harus bpjs, tunai, atau asuransi',
  }),
  chief_complaint: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const registrationUpdateSchema = z
  .object({
    patient_id: z.coerce.number().int().positive().optional(),
    doctor_id: z.coerce.number().int().positive().optional(),
    poli_id: z.coerce.number().int().positive().optional(),
    visit_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal kunjungan harus format YYYY-MM-DD')
      .optional(),
    payment_type: z.enum(['bpjs', 'tunai', 'asuransi']).optional(),
    chief_complaint: z.string().trim().max(1000).optional().or(z.literal('')),
    status: z.enum(['menunggu', 'check_in', 'pemeriksaan', 'selesai']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Minimal satu field harus diisi',
  });

const STATUS_ORDER = { menunggu: 0, check_in: 1, pemeriksaan: 2, selesai: 3 };

export function isForwardTransition(from, to) {
  return STATUS_ORDER[to] > STATUS_ORDER[from];
}
