# Backend Tutorial — Mini Clinic Information System

Step-by-step guide to set up, run, and build the backend API
(Node.js + Express.js + PostgreSQL + JWT) described in `prd.md`.

---

## 1. Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Runtime  | Node.js 18+ (ESM, `"type": "module"`)            |
| Framework| Express.js 5                                     |
| Database | PostgreSQL 14+ (16 via Docker)                   |
| Auth     | JSON Web Token (`jsonwebtoken`) + `bcryptjs`     |
| Validation | Zod                                           |
| Extras   | `helmet`, `cors`, `morgan`, `pg`                 |

## 2. Prerequisites

- [Node.js](https://nodejs.org) 18 or newer (`node --version`)
- Docker Desktop **or** a local PostgreSQL 14+ installation
- (For Windows users) PowerShell 7+ or Git Bash

## 3. Setup the Database (Turn 3 output)

### 3.1 Start PostgreSQL with Docker

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts container `mini-clinic-db` (postgres:16) on port `5432`
(user `postgres`, password `postgres`, database `mini_clinic`).

### 3.2 Apply the schema and seed data

Linux / macOS / Git Bash:

```bash
docker exec -i mini-clinic-db psql -U postgres -d mini_clinic < database/schema.sql
docker exec -i mini-clinic-db psql -U postgres -d mini_clinic < database/seed.sql
```

Windows PowerShell (`<` redirection does not work, pipe instead):

```powershell
Get-Content database/schema.sql | docker exec -i mini-clinic-db psql -U postgres -d mini_clinic
Get-Content database/seed.sql  | docker exec -i mini-clinic-db psql -U postgres -d mini_clinic
```

Using a local `psql` instead:

```bash
psql -h localhost -U postgres -d mini_clinic -f database/schema.sql
psql -h localhost -U postgres -d mini_clinic -f database/seed.sql
```

What you get:

| Table                | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `users`              | Login accounts + roles (source for JWT auth)         |
| `patients`           | Patient master data, auto `RM-000001`, unique NIK    |
| `poli`, `doctors`    | Clinics and doctors (queue prefix lives on `poli`)   |
| `registrations`      | Visit registrations + visit status                   |
| `queues`             | Queues, auto number `A001` per poli per day          |
| `medical_records`    | SOAP examination notes                               |
| `medical_actions`    | Medical actions given during an examination          |
| `prescriptions`      | Prescriptions per examination                        |
| `prescription_items` | The actual medicines (name, dosage, frequency, ...)  |
| `v_dashboard_today`  | View with the 5 dashboard counters                   |

Both scripts are safe to re-run (`schema.sql` drops and recreates,
`seed.sql` truncates and re-inserts).

## 4. Setup the Backend

```bash
cd backend
npm install
```

Create your env file:

```bash
cp .env.example .env        # Linux / macOS / Git Bash
copy .env.example .env      # Windows CMD
Copy-Item .env.example .env # PowerShell
```

Variables in `.env`:

| Variable       | Example                                            | Description                          |
| -------------- | -------------------------------------------------- | ------------------------------------ |
| `PORT`         | `5000`                                             | API port                             |
| `NODE_ENV`     | `development`                                      | development / production             |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/mini_clinic` | `pg` connection string      |
| `JWT_SECRET`   | long random string (32+ chars)                     | Secret used to sign tokens           |
| `JWT_EXPIRES_IN` | `8h`                                             | Token lifetime                       |
| `CORS_ORIGIN`  | `http://localhost:5173`                            | Allowed frontend origin (Vite)       |

> Note: keep `DATABASE_URL` plain — the `?schema=public` suffix is Prisma
> syntax and is **not** understood by `node-postgres` / PostgreSQL.

## 5. Run the Backend

```bash
npm run dev     # development, auto-reload with nodemon -> http://localhost:5000
npm start       # production style, no reload
npm test        # node --test (add tests under backend/)
npm run lint    # syntax check
```

Run the frontend at the same time (separate terminal):

```bash
cd frontend
npm run dev     # -> http://localhost:5173
```

## 6. Project Structure

```
backend/src/
├── server.js              # entry: loads .env, listens on PORT (DONE)
├── app.js                 # express app: helmet, cors, morgan, Swagger UI, error handler (DONE)
├── config/
│   └── database.js        # pg.Pool from DATABASE_URL (DONE)
├── middlewares/
│   ├── auth.js            # verify JWT -> req.user = { id, role }   (DONE — Turn 4)
│   ├── role.js            # allow(...roles) restricts a route        (DONE — Turn 4)
│   └── validate.js        # zod schema -> 422 Validation Error       (DONE — Turn 4)
├── utils/
│   └── response.js        # ok(res, data, message) / fail(res, errors, message, status) (DONE)
├── validators/            # zod schemas per module                   (Turns 4-8)
└── modules/               # one folder per feature
    ├── auth/              # DONE — Turn 4 (login, logout, JWT)
    ├── patients/          # DONE — Turn 5 (CRUD, search, pagination)
    ├── polis/             # DONE — Turn 6 (master data untuk dropdown)
    ├── doctors/           # DONE — Turn 6 (master data untuk dropdown)
    ├── registrations/     # DONE — Turn 6 (create, list, update status)
    ├── queues/            # DONE — Turn 7 (create, list, call, call-next, status)
    ├── registrations/     # Turn 6
    ├── queues/            # Turn 7
    ├── medical-records/   # Turn 8
    └── dashboard/         # Turn 9
```

## 7. Seed Accounts

All accounts use the password **`password123`** (bcrypt-hashed in `seed.sql`):

| Name             | Email                     | Role                   |
| ---------------- | ------------------------- | ---------------------- |
| Admin Klinik     | `admin@klinik.test`       | `administration`       |
| dr. Budi Santoso | `dokter@klinik.test`      | `doctor`               |
| Rina Wulandari   | `pendaftaran@klinik.test` | `registration_officer` |

## 8. API Endpoints (from the PRD)

| Method | Endpoint                      | Purpose                        | Suggested roles                          |
| ------ | ----------------------------- | ------------------------------ | ---------------------------------------- |
| POST   | `/login`                      | Login, returns JWT             | public                                   |
| POST   | `/logout`                     | Logout (discard token)         | any authenticated                        |
| GET    | `/patients`                   | List + `?search=` + `?page=`   | all roles                                |
| GET    | `/patients/{id}`              | Patient detail                 | all roles                                |
| POST   | `/patients`                   | Add patient                    | administration, registration_officer     |
| PUT    | `/patients/{id}`              | Update patient                 | administration, registration_officer     |
| DELETE | `/patients/{id}`              | Delete patient (soft delete)   | administration                            |
| GET    | `/registrations`              | List registrations             | all roles                                |
| POST   | `/registrations`              | Create registration            | administration, registration_officer     |
| PUT    | `/registrations/{id}`         | Update registration / status   | administration, registration_officer     |
| GET    | `/queues`                     | List queues (`?date=today`)    | all roles                                |
| POST   | `/queues`                     | Create queue from registration | administration, registration_officer     |
| PUT    | `/queues/{id}/call`           | Call next queue                | administration, registration_officer     |
| PUT    | `/queues/{id}/status`         | Change queue status            | administration, registration_officer, doctor |
| POST   | `/medical-records`            | Save SOAP examination          | doctor                                   |
| GET    | `/medical-records/{patientId}`| Patient examination history    | all roles                                |
| POST   | `/prescriptions`              | Save prescription              | doctor                                   |
| GET    | `/prescriptions/{id}`         | Prescription detail            | all roles                                |
| GET    | `/dashboard` *(suggested)*    | Dashboard counters             | any authenticated                        |

> The role matrix above is a recommendation — adjust it to your own design,
> but keep the three PRD roles enforced somewhere.

## 9. API Documentation (Swagger / OpenAPI)

Full interactive endpoint documentation lives in **`docs/openapi.yaml`**
(OpenAPI 3.0 — all 14 paths / 19 operations from the PRD, with request/response
examples, JWT security scheme, and schemas for every entity).

### Preview the spec right now (no backend needed)

- **Swagger Editor** — paste the file into <https://editor.swagger.io>
- **VS Code** — install the *OpenAPI (Swagger) Editor* extension and open the file
- **Redoc** — <https://redocly.github.io/redoc/?url=...> (needs a public URL, or `npx @redocly/cli build-docs docs/openapi.yaml`)

### Serve Swagger UI from Express (wire this up in Turn 4)

Dependencies (already listed in `backend/package.json`):

```bash
npm install swagger-ui-express yaml
```

In `backend/src/app.js`:

```js
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const openApiPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../docs/openapi.yaml');
const openApiSpec = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
```

Then open **<http://localhost:5000/api-docs>** — you get a "Try it out"
button for every endpoint (log in first, paste the token in the *Authorize*
dialog to test protected routes).

> Tip: keep `docs/openapi.yaml` next to the code and update it as you build
> each turn — reviewers can then see the API contract even before Turn 4.

### Postman collection

An alternative to Swagger UI: **`docs/postman-collection.json`** — all 19
operations grouped into 7 folders (Auth, Patients, Registrations, Queues,
Medical Records, Prescriptions, Dashboard).

Import it: Postman → *Import* → drag the file in (or File → Import).
Then:

1. Run **Auth / Login** first — its test script automatically saves the JWT
   to the collection variable `token`.
2. Every other request sends `Authorization: Bearer {{token}}` automatically
   (inherited from the collection-level auth).
3. Switch accounts (admin / doctor / registration officer) by changing the
   `email` / `password` collection variables, then login again.

> Alternatively you can import `docs/openapi.yaml` directly into Postman —
> but the JSON collection already wires up the token flow for you.

## 10. Standard Response Format (required by the PRD)

Success:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error (validation example):

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "nik": "NIK must be exactly 16 digits"
  }
}
```

## 11. Implementation Roadmap (Turns 4–9)

**Turn 4 — Auth**
`POST /login`: find user by email → `bcrypt.compare` → sign JWT
(`{ id, role }`, `JWT_EXPIRES_IN`). `POST /logout`: JWT is stateless, the
client just discards the token (a token blacklist table is optional).
Build `auth.js` middleware (`Authorization: Bearer <token>`) and
`role.js` middleware. Tables: `users`.

**Turn 5 — Patients**
CRUD + `?search=` (`ILIKE` on name / NIK / medical_record_no) + pagination
(`LIMIT`/`OFFSET` + total `COUNT`). Let the DB auto-generate
`medical_record_no` (trigger already exists) and catch unique-violation on
`nik` (SQLSTATE `23505`) → friendly error. DELETE = set `deleted_at`;
always filter `deleted_at IS NULL`. Tables: `patients`.

**Turn 6 — Registrations**
Create registration (validate patient/doctor/poli exist via FK), include
`payment_type` and `chief_complaint`, manage status transitions
`menunggu → check_in → pemeriksaan → selesai`. Tables: `registrations`.

**Turn 7 — Queues**
`POST /queues` from a registration (number `A001` auto-generated by trigger).
`PUT /queues/{id}/call` sets status `dipanggil` + `called_at`.
`PUT /queues/{id}/status` for the other transitions and timestamps
(`started_at`, `finished_at`). Tables: `queues`.

**Turn 8 — Medical records**
`POST /medical-records` saves SOAP + vitals, plus `medical_actions` and
`prescriptions`/`prescription_items` — wrap everything in one `BEGIN ... COMMIT`
transaction, then flip the registration to `selesai` and the queue to `selesai`.
`GET /medical-records/{patientId}` returns the history ordered by
`examined_at DESC`. Tables: `medical_records`, `medical_actions`,
`prescriptions`, `prescription_items`.

**Turn 9 — Dashboard**
`GET /dashboard` simply returns `SELECT * FROM v_dashboard_today`
(total patients, patients today, queues today, waiting, finished).

## 12. Example Requests (curl)

Login:

```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin@klinik.test\", \"password\": \"password123\"}"
```

Expected response:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "full_name": "Admin Klinik", "role": "administration" }
  }
}
```

Protected request (list patients with search + pagination):

```bash
curl "http://localhost:5000/patients?search=andi&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

## 13. Troubleshooting

| Problem                              | Fix                                                              |
| ------------------------------------ | ---------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:5432`        | Docker DB is not running → `docker compose -f infra/docker-compose.yml up -d` |
| `password authentication failed`     | Wrong credentials in `DATABASE_URL` (default: `postgres:postgres`) |
| `unrecognized configuration parameter` | Remove `?schema=public` from `DATABASE_URL` (Prisma syntax)    |
| Port 5000 already in use             | Change `PORT` in `.env`                                          |
| Frontend gets CORS errors            | Set `CORS_ORIGIN` to the Vite URL (`http://localhost:5173`)      |
| Queue numbers restart "wrongly"      | Numbers reset per `queue_date` — check the row's date            |
| Duplicate NIK error 23505            | Expected — return it as a friendly validation error              |
