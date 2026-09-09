import { z } from 'zod';

export const patientSchema = z.object({
  nik: z
    .string()
    .regex(/^\d{16}$/, 'NIK must be exactly 16 digits'),
  full_name: z.string().trim().min(1, 'Nama pasien wajib diisi').max(100),
  gender: z.enum(['L', 'P'], { message: 'Jenis kelamin harus L atau P' }),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir harus format YYYY-MM-DD')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Tanggal lahir tidak valid')
    .refine(
      (value) => new Date(value) <= new Date(),
      'Tanggal lahir tidak boleh di masa depan'
    ),
  phone: z.string().trim().min(8, 'Nomor telepon minimal 8 karakter').max(25),
  address: z.string().trim().min(3, 'Alamat minimal 3 karakter'),
});
