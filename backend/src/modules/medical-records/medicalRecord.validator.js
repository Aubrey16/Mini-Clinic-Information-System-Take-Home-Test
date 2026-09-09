import { z } from 'zod';

const medicalActionSchema = z.object({
  name: z.string().trim().min(1, 'Nama tindakan wajib diisi').max(150),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

const prescriptionItemSchema = z.object({
  medicine_name: z.string().trim().min(1, 'Nama obat wajib diisi').max(150),
  dosage: z.string().trim().min(1, 'Dosis wajib diisi').max(50),
  frequency: z.string().trim().min(1, 'Frekuensi wajib diisi').max(50),
  duration: z.string().trim().max(50).optional().or(z.literal('')),
  instructions: z.string().trim().max(500).optional().or(z.literal('')),
});

const prescriptionSchema = z.object({
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(prescriptionItemSchema).min(1, 'Resep minimal memiliki satu obat'),
});

export const medicalRecordSchema = z.object({
  registration_id: z.coerce.number().int().positive('Pendaftaran wajib dipilih'),
  subjective: z.string().trim().max(2000).optional().or(z.literal('')),
  blood_pressure: z
    .string()
    .trim()
    .regex(/^\d{2,3}\/\d{2,3}$/, 'Tekanan darah format: 120/80')
    .optional()
    .or(z.literal('')),
  body_temperature: z.coerce.number().min(30, 'Suhu tubuh minimal 30°C').max(45, 'Suhu tubuh maksimal 45°C').optional(),
  weight_kg: z.coerce.number().min(0.1, 'Berat badan tidak valid').max(500, 'Berat badan tidak valid').optional(),
  height_cm: z.coerce.number().min(1, 'Tinggi badan tidak valid').max(300, 'Tinggi badan tidak valid').optional(),
  assessment: z.string().trim().min(1, 'Diagnosa wajib diisi').max(2000),
  plan: z.string().trim().min(1, 'Rencana terapi wajib diisi').max(2000),
  medical_actions: z.array(medicalActionSchema).optional().default([]),
  prescriptions: z.array(prescriptionSchema).optional().default([]),
});

export const prescriptionCreateSchema = z.object({
  medical_record_id: z.coerce.number().int().positive('Pemeriksaan wajib dipilih'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(prescriptionItemSchema).min(1, 'Resep minimal memiliki satu obat'),
});
