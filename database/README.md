# Database — Mini Clinic Information System

PostgreSQL schema for all PRD features (Turn 3). Matches the fields used by the
frontend UI (RM numbers, queue numbers like `A001`, SOAP form, prescriptions).

## Files

| File         | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| `schema.sql` | Tables, enums, indexes, triggers, dashboard view (DDL)   |
| `seed.sql`   | Sample data: accounts, poli, doctors, patients, 1 visit  |

## Setup

1. Start PostgreSQL with Docker:

   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. Apply the schema, then the seed:

   ```bash
   psql -h localhost -U postgres -d mini_clinic -f database/schema.sql
   psql -h localhost -U postgres -d mini_clinic -f database/seed.sql
   ```

   Without a local `psql`, run them through the container:

   ```bash
   docker exec -i mini-clinic-db psql -U postgres -d mini_clinic < database/schema.sql
   docker exec -i mini-clinic-db psql -U postgres -d mini_clinic < database/seed.sql
   ```

   (On PowerShell use: `Get-Content database/schema.sql | docker exec -i mini-clinic-db psql -U postgres -d mini_clinic`)

Connection string used by the backend (see `backend/.env.example`):

```
postgresql://postgres:postgres@localhost:5432/mini_clinic
```

## Entity relationship

```
users 1----0..1 doctors            poli 1----* doctors
users 1----* registrations (created_by)

patients 1----* registrations *----1 doctors
                          |----------1 poli

registrations 1----1 queues

registrations 1----1 medical_records *----1 patients   (riwayat pemeriksaan)
                           |----1 doctors
                           |----* medical_actions      (tindakan medis)
                           |----* prescriptions 1----* prescription_items (resep)
```

## Tables per PRD feature

| PRD feature                | Tables                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| 1. Authentication          | `users` (role: administration / doctor / registration_officer)    |
| 2. Patient master data     | `patients`                                                        |
| 3. Pendaftaran pasien      | `registrations`, `doctors`, `poli`                                |
| 4. Antrean                 | `queues`                                                          |
| 5. Pemeriksaan dokter      | `medical_records` (SOAP), `medical_actions`, `prescriptions`, `prescription_items` |
| 6. Dashboard               | `v_dashboard_today` (view)                                        |

## Automatic behavior (enforced by the database)

- **Nomor Rekam Medis** — auto-generated as `RM-000001` (sequence `patients_mr_seq`
  + trigger). Insert a patient without `medical_record_no` and it is filled in.
- **Nomor antrean** — auto-generated per day per poli as `<poli.code><NNN>`
  (e.g. `A001`, `A002`), unique on `(queue_date, queue_number)`.
- **NIK** — must be exactly 16 digits and unique (CHECK + UNIQUE constraints).
- **updated_at** — refreshed automatically on every UPDATE.
- **Soft delete** — `patients.deleted_at` keeps medical history intact; queries
  should filter `deleted_at IS NULL`.

## Seed accounts (password: `password123`)

| Name             | Email                  | Role                   |
| ---------------- | ---------------------- | ---------------------- |
| Admin Klinik     | `admin@klinik.test`    | administration         |
| dr. Budi Santoso | `dokter@klinik.test`   | doctor                 |
| Rina Wulandari   | `pendaftaran@klinik.test` | registration_officer |

## Dashboard view

`v_dashboard_today` returns the five numbers the dashboard needs:

```sql
SELECT * FROM v_dashboard_today;
-- total_patients | total_patients_today | total_queue_today | total_waiting | total_finished
```
