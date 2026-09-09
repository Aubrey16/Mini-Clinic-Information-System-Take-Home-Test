import { z } from 'zod';

export const createQueueSchema = z.object({
  registration_id: z.coerce.number().int().positive('Pendaftaran wajib dipilih'),
});

export const queueStatusSchema = z.object({
  status: z.enum(['menunggu', 'dipanggil', 'pemeriksaan', 'selesai', 'dibatalkan'], {
    message: 'Status antrean tidak valid',
  }),
});

const TRANSITIONS = {
  menunggu: ['dipanggil', 'dibatalkan'],
  dipanggil: ['pemeriksaan'],
  pemeriksaan: ['selesai'],
  selesai: [],
  dibatalkan: [],
};

export function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to);
}

export const REGISTRATION_STATUS_SYNC = {
  dipanggil: 'check_in',
  pemeriksaan: 'pemeriksaan',
  selesai: 'selesai',
};
