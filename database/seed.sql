-- ============================================================================
--  Mini Clinic Information System — Seed Data
--  File  : database/seed.sql
--  Usage : psql -h localhost -U postgres -d mini_clinic -f database/seed.sql
--
--  Requires a schema created by database/schema.sql.
--  All seeded accounts use the password: password123
-- ============================================================================

BEGIN;

-- Reset tables so the seed can be re-run (IDs become deterministic again)
TRUNCATE TABLE prescription_items, prescriptions, medical_actions,
               medical_records, queues, registrations, patients,
               doctors, poli, users
RESTART IDENTITY CASCADE;

ALTER SEQUENCE patients_mr_seq RESTART WITH 1;

-- 1. Poli -------------------------------------------------------------------
INSERT INTO poli (code, name, description) VALUES
  ('A', 'Poli Umum', 'Pemeriksaan dan pengobatan umum.'),
  ('B', 'Poli Gigi', 'Pemeriksaan dan perawatan kesehatan gigi.');

-- 2. Users (password for all: password123) -----------------------------------
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin Klinik',     'admin@klinik.test',       '$2b$10$s7Dpg38Sz5MNrNa5QzibzekkLMAX6RAHpggvMldQ.RnTIJ1dGkvh.', 'administration'),
  ('dr. Budi Santoso', 'dokter@klinik.test',      '$2b$10$s7Dpg38Sz5MNrNa5QzibzekkLMAX6RAHpggvMldQ.RnTIJ1dGkvh.', 'doctor'),
  ('Rina Wulandari',   'pendaftaran@klinik.test', '$2b$10$s7Dpg38Sz5MNrNa5QzibzekkLMAX6RAHpggvMldQ.RnTIJ1dGkvh.', 'registration_officer');

-- 3. Doctors (id 2 = the doctor account above) -------------------------------
INSERT INTO doctors (user_id, full_name, specialization, poli_id, phone) VALUES
  (2,    'dr. Budi Santoso', 'Dokter Umum',  1, '0812-1111-2222'),
  (NULL, 'dr. Gita Maharani', 'Dokter Gigi', 2, '0813-3333-4444');

-- 4. Patients (medical_record_no is auto-generated: RM-000001 .. RM-000004) --
INSERT INTO patients (nik, full_name, gender, birth_date, phone, address) VALUES
  ('3273011201990001', 'Andi Pratama', 'L', '1999-01-12', '0812-3456-7890', 'Jl. Merdeka No. 10, Bandung'),
  ('3273010402980002', 'Siti Rahma',   'P', '1998-02-04', '0813-4567-8901', 'Jl. Cihampelas No. 25, Bandung'),
  ('3273011007950003', 'Budi Hartono', 'L', '1995-07-10', '0821-5678-9012', 'Jl. Dago No. 77, Bandung'),
  ('3273012204000004', 'Dewi Lestari', 'P', '2000-04-22', '0852-6789-0123', 'Jl. Pasteur No. 5, Bandung');

-- 5. Registrations for today (created_by 3 = registration officer) -----------
INSERT INTO registrations
  (patient_id, doctor_id, poli_id, visit_date, payment_type, chief_complaint, status, created_by)
VALUES
  (1, 1, 1, CURRENT_DATE, 'tunai',    'Demam dan batuk sejak dua hari lalu.',  'pemeriksaan', 3),
  (2, 1, 1, CURRENT_DATE, 'bpjs',     'Nyeri kepala dan pusing sejak pagi.',   'menunggu',    3),
  (3, 2, 2, CURRENT_DATE, 'asuransi', 'Gigi berlubang, nyeri saat mengunyah.', 'check_in',    3);

-- 6. Queues for today (queue_number is auto-generated: A001, A002, B001) -----
INSERT INTO queues (registration_id, queue_date) VALUES
  (1, CURRENT_DATE),
  (2, CURRENT_DATE),
  (3, CURRENT_DATE);

UPDATE queues SET status = 'pemeriksaan', called_at = now() - interval '30 minute', started_at = now() - interval '25 minute' WHERE registration_id = 1;
UPDATE queues SET status = 'dipanggil',  called_at = now() - interval '5 minute'                                                   WHERE registration_id = 3;

-- 7. One SOAP examination (Andi Pratama, registration 1) ---------------------
INSERT INTO medical_records
  (registration_id, patient_id, doctor_id,
   subjective, blood_pressure, body_temperature, weight_kg, height_cm,
   assessment, plan)
VALUES
  (1, 1, 1,
   'Demam dan batuk sejak dua hari lalu, disertai nyeri otot dan tenggorokan gatal.',
   '120/80', 36.8, 65.0, 170.0,
   'ISPA (Infeksi Saluran Pernapasan Atas) derajat ringan.',
   'Obat penurun demam, istirahat cukup, perbanyak minum air putih, kontrol bila demam tidak turun dalam 3 hari.');

-- Tindakan medis
INSERT INTO medical_actions (medical_record_id, name, notes) VALUES
  (1, 'Pemeriksaan fisik umum', 'Tenggorokan sedikit merah, tonsil tidak membesar, napas normal.');

-- Resep obat + item resep
INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, notes) VALUES
  (1, 1, 1, 'Obat penurun demam dan penguat tubuh.');

INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
  (1, 'Paracetamol', '500 mg', '3x sehari', '3 hari', 'Diminum setelah makan'),
  (1, 'Vitamin C',   '100 mg', '1x sehari', '7 hari', 'Diminum setelah sarapan');

COMMIT;
