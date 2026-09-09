-- ============================================================================
--  Mini Clinic Information System — Database Schema (Turn 3)
--  DBMS   : PostgreSQL 14+
--  File   : database/schema.sql
--  Usage  : psql -h localhost -U postgres -d mini_clinic -f database/schema.sql
--
--  Covers all PRD features:
--    1. Authentication       -> users (role source for JWT auth)
--    2. Patient master data  -> patients (auto RM number, unique NIK)
--    3. Pendaftaran          -> poli, doctors, registrations
--    4. Antrean              -> queues (auto number A001 per poli per day)
--    5. Pemeriksaan Dokter   -> medical_records (SOAP), medical_actions,
--                               prescriptions, prescription_items
--    6. Dashboard            -> v_dashboard_today view
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Clean up (makes the script safe to re-run)
-- ----------------------------------------------------------------------------
DROP VIEW  IF EXISTS v_dashboard_today;

DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medical_actions;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS queues;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS poli;
DROP TABLE IF EXISTS users;

DROP SEQUENCE IF EXISTS patients_mr_seq;

DROP FUNCTION IF EXISTS set_updated_at();
DROP FUNCTION IF EXISTS generate_medical_record_no();
DROP FUNCTION IF EXISTS generate_queue_number();

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS gender;
DROP TYPE IF EXISTS payment_type;
DROP TYPE IF EXISTS registration_status;
DROP TYPE IF EXISTS queue_status;

-- ----------------------------------------------------------------------------
-- 1. Enumerated types
-- ----------------------------------------------------------------------------
-- Roles required by the PRD
CREATE TYPE user_role AS ENUM ('administration', 'doctor', 'registration_officer');

-- L = Laki-laki (male), P = Perempuan (female)
CREATE TYPE gender AS ENUM ('L', 'P');

CREATE TYPE payment_type AS ENUM ('bpjs', 'tunai', 'asuransi');

-- Visit statuses required by the PRD
CREATE TYPE registration_status AS ENUM ('menunggu', 'check_in', 'pemeriksaan', 'selesai');

-- Queue statuses: waiting -> called -> examination -> done (or cancelled)
CREATE TYPE queue_status AS ENUM ('menunggu', 'dipanggil', 'pemeriksaan', 'selesai', 'dibatalkan');

-- ----------------------------------------------------------------------------
-- 2. Shared trigger helpers
-- ----------------------------------------------------------------------------
-- Keeps updated_at current on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. Authentication — users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,                -- bcrypt hash (never plain text)
  role          user_role    NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,   -- soft block for login
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Login accounts for administration, doctor, and registration officer roles.';

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Poli & doctors
-- ----------------------------------------------------------------------------
CREATE TABLE poli (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        CHAR(1)      NOT NULL UNIQUE,           -- queue prefix, e.g. A
  name        VARCHAR(100) NOT NULL UNIQUE,           -- e.g. Poli Umum
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN poli.code IS 'Single letter used as the queue number prefix (A -> A001, A002, ...).';

CREATE TRIGGER trg_poli_updated_at
BEFORE UPDATE ON poli
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE doctors (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        BIGINT UNIQUE REFERENCES users (id) ON DELETE SET NULL, -- optional login account
  full_name      VARCHAR(100) NOT NULL,               -- e.g. dr. Budi Santoso
  specialization VARCHAR(100),                        -- e.g. Dokter Umum
  poli_id        BIGINT       NOT NULL REFERENCES poli (id),
  phone          VARCHAR(25),
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_doctors_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Patient master data
-- ----------------------------------------------------------------------------
-- Sequence behind the auto-generated Nomor Rekam Medis (RM-000001, RM-000002, ...)
CREATE SEQUENCE patients_mr_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE patients (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medical_record_no VARCHAR(20)  NOT NULL UNIQUE,     -- RM-000001 (auto-generated)
  nik               VARCHAR(16)  NOT NULL UNIQUE CHECK (nik ~ '^[0-9]{16}$'),
  full_name         VARCHAR(100) NOT NULL,
  gender            gender       NOT NULL,            -- L = Laki-laki, P = Perempuan
  birth_date        DATE         NOT NULL CHECK (birth_date <= CURRENT_DATE),
  phone             VARCHAR(25)  NOT NULL,
  address           TEXT         NOT NULL,
  deleted_at        TIMESTAMPTZ,                      -- soft delete keeps medical history intact
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN patients.medical_record_no IS 'Auto-generated in the format RM-000001 using sequence patients_mr_seq + trigger.';
COMMENT ON COLUMN patients.nik IS 'Nomor Induk Kependudukan, exactly 16 digits, must be unique.';

-- Auto-generate the medical record number when it is not provided.
CREATE OR REPLACE FUNCTION generate_medical_record_no()
RETURNS trigger AS $$
BEGIN
  IF NEW.medical_record_no IS NULL OR NEW.medical_record_no = '' THEN
    NEW.medical_record_no := 'RM-' || LPAD(nextval('patients_mr_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patients_mr_no
BEFORE INSERT ON patients
FOR EACH ROW EXECUTE FUNCTION generate_medical_record_no();

CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Case-insensitive search on name (Search feature)
CREATE INDEX idx_patients_name ON patients (LOWER(full_name));

-- ----------------------------------------------------------------------------
-- 6. Registration module (Pendaftaran)
-- ----------------------------------------------------------------------------
CREATE TABLE registrations (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id      BIGINT              NOT NULL REFERENCES patients (id),
  doctor_id       BIGINT              NOT NULL REFERENCES doctors (id),
  poli_id         BIGINT              NOT NULL REFERENCES poli (id),
  visit_date      DATE                NOT NULL DEFAULT CURRENT_DATE,  -- Tanggal Kunjungan
  payment_type    payment_type        NOT NULL,                       -- BPJS / Tunai / Asuransi
  chief_complaint TEXT,                                                -- Keluhan Awal
  status          registration_status NOT NULL DEFAULT 'menunggu',
  created_by      BIGINT              REFERENCES users (id),          -- registration officer
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

COMMENT ON TABLE registrations IS 'Patient visit registration created by the registration officer.';

CREATE INDEX idx_registrations_visit_date ON registrations (visit_date);
CREATE INDEX idx_registrations_patient    ON registrations (patient_id);
CREATE INDEX idx_registrations_status     ON registrations (status);

CREATE TRIGGER trg_registrations_updated_at
BEFORE UPDATE ON registrations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Queue module (Antrean)
-- ----------------------------------------------------------------------------
CREATE TABLE queues (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  registration_id BIGINT       NOT NULL UNIQUE REFERENCES registrations (id) ON DELETE CASCADE,
  queue_date      DATE         NOT NULL DEFAULT CURRENT_DATE,
  queue_number    VARCHAR(10)  NOT NULL,              -- A001 (auto-generated)
  status          queue_status NOT NULL DEFAULT 'menunggu',
  called_at       TIMESTAMPTZ,                        -- when the queue is called
  started_at      TIMESTAMPTZ,                        -- when examination starts
  finished_at     TIMESTAMPTZ,                        -- when service is finished
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (queue_date, queue_number)
);

COMMENT ON COLUMN queues.queue_number IS 'Auto-generated per day per poli: <poli.code><3-digit counter>, e.g. A001.';

-- Auto-generate the queue number from the poli code + a per-day counter.
CREATE OR REPLACE FUNCTION generate_queue_number()
RETURNS trigger AS $$
DECLARE
  v_prefix TEXT;
  v_used   INTEGER;
BEGIN
  IF NEW.queue_number IS NULL OR NEW.queue_number = '' THEN
    SELECT UPPER(p.code) INTO v_prefix
      FROM registrations r
      JOIN poli p ON p.id = r.poli_id
     WHERE r.id = NEW.registration_id;

    v_prefix := COALESCE(v_prefix, 'A');

    SELECT COUNT(*) INTO v_used
      FROM queues q
      JOIN registrations r ON r.id = q.registration_id
      JOIN poli p ON p.id = r.poli_id
     WHERE q.queue_date = NEW.queue_date
       AND UPPER(p.code) = v_prefix;

    NEW.queue_number := v_prefix || LPAD((v_used + 1)::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_queues_number
BEFORE INSERT ON queues
FOR EACH ROW EXECUTE FUNCTION generate_queue_number();

CREATE TRIGGER trg_queues_updated_at
BEFORE UPDATE ON queues
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_queues_date_status ON queues (queue_date, status);

-- ----------------------------------------------------------------------------
-- 8. Doctor examination module (SOAP) + medical actions + prescriptions
-- ----------------------------------------------------------------------------
CREATE TABLE medical_records (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  registration_id  BIGINT      NOT NULL UNIQUE REFERENCES registrations (id),
  patient_id       BIGINT      NOT NULL REFERENCES patients (id),
  doctor_id        BIGINT      NOT NULL REFERENCES doctors (id),
  -- SOAP notes
  subjective       TEXT,                               -- S: Keluhan Pasien
  blood_pressure   VARCHAR(10),                        -- O: e.g. 120/80 (mmHg)
  body_temperature NUMERIC(4,1),                       -- O: e.g. 36.5 (Celsius)
  weight_kg        NUMERIC(5,2),                       -- O: e.g. 65.00
  height_cm        NUMERIC(5,1),                       -- O: e.g. 170.0
  assessment       TEXT,                               -- A: Diagnosa
  plan             TEXT,                               -- P: Rencana Terapi
  examined_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE medical_records IS 'Doctor examination notes using the SOAP method (one row per registration/visit).';

-- Patient examination history (GET /medical-records/{patientId})
CREATE INDEX idx_medical_records_patient ON medical_records (patient_id, examined_at DESC);

CREATE TRIGGER trg_medical_records_updated_at
BEFORE UPDATE ON medical_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Input Tindakan Medis
CREATE TABLE medical_actions (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medical_record_id BIGINT       NOT NULL REFERENCES medical_records (id) ON DELETE CASCADE,
  name              VARCHAR(150) NOT NULL,             -- e.g. Pemeriksaan fisik
  notes             TEXT,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_actions_record ON medical_actions (medical_record_id);

CREATE TRIGGER trg_medical_actions_updated_at
BEFORE UPDATE ON medical_actions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Input Resep Obat
CREATE TABLE prescriptions (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medical_record_id BIGINT      NOT NULL REFERENCES medical_records (id),
  patient_id        BIGINT      NOT NULL REFERENCES patients (id),
  doctor_id         BIGINT      NOT NULL REFERENCES doctors (id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE prescription_items (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id BIGINT       NOT NULL REFERENCES prescriptions (id) ON DELETE CASCADE,
  medicine_name   VARCHAR(150) NOT NULL,               -- e.g. Paracetamol
  dosage          VARCHAR(50)  NOT NULL,               -- e.g. 500 mg
  frequency       VARCHAR(50)  NOT NULL,               -- e.g. 3x sehari
  duration        VARCHAR(50),                         -- e.g. 3 hari
  instructions    TEXT,                                -- Aturan pakai
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items (prescription_id);

CREATE TRIGGER trg_prescription_items_updated_at
BEFORE UPDATE ON prescription_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. Dashboard view (Turn 9 will SELECT from this)
-- ----------------------------------------------------------------------------
CREATE VIEW v_dashboard_today AS
SELECT
  (SELECT COUNT(*) FROM patients WHERE deleted_at IS NULL)
    AS total_patients,
  (SELECT COUNT(DISTINCT patient_id) FROM registrations WHERE visit_date = CURRENT_DATE)
    AS total_patients_today,
  (SELECT COUNT(*) FROM queues WHERE queue_date = CURRENT_DATE)
    AS total_queue_today,
  (SELECT COUNT(*) FROM queues WHERE queue_date = CURRENT_DATE AND status = 'menunggu')
    AS total_waiting,
  (SELECT COUNT(*) FROM queues WHERE queue_date = CURRENT_DATE AND status = 'selesai')
    AS total_finished;

COMMIT;
