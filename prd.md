# Mini-Clinic-Information-System-Take-Home-Test

Overview

Build a cozy website most of it is green and white color, with clinic main feature including clinic services, ranging from patient data management, visit registration, and queue management to the recording of doctor's examination results.

Core Features
1. Authentication
Build authentication mechanism using JWT Authentication
role that must have is :
 - Administration
 - Doctor
 - Registration Officer

 Fitur that must have :
 - Login
 - Logout
 - Authorization based on role

2. Patient Master Data
Patient Data
  - Nomor Rekam Medis (Auto Generate)
  - NIK (nomor induk kependudukan)
  - Nama Pasien
  - Jenis Kelamin
  - Tanggal Lahir
  - Nomor Telepon
  - Alamat
Feature
  - Adding Data
  - Update Data
  - Delete Data
  - Detail Data
  - Search
  - Pagination
Validation
  - NIK cannot be duplicate
  - Nomor Rekam Medis must be auto generated

3. Modul Pendaftaran Pasien
Bangun modul pendaftaran pasien.
Data yang dikelola minimal meliputi:
- Pasien
- Dokter
- Poli
- Tanggal Kunjungan
- Jenis Pembayaran

- Keluhan Awal
Status kunjungan:
- Menunggu
- Check In
- Pemeriksaan
- Selesai

4. Modul Antrean
Bangun modul antrean pasien.
Fitur minimal:
- Generate nomor antrean otomatis
- Menampilkan daftar antrean
- Memanggil antrean berikutnya
- Mengubah status antrean
Contoh nomor antrean:
A001
A002
A003

5. Modul Pemeriksaan Dokter

Bangun modul pemeriksaan pasien menggunakan metode SOAP.
Subjective
- Keluhan Pasien
Objective
- Tekanan Darah
- Suhu Tubuh
- Berat Badan
- Tinggi Badan
Assessment
- Diagnosa
Plan
- Rencana Terapi
Selain itu, peserta diminta membuat fitur:
- Input Tindakan Medis
- Input Resep Obat
- Riwayat Pemeriksaan Pasien

6. Dashboard

Bangun dashboard sederhana yang menampilkan informasi berikut.
- Total Pasien
- Total Pasien Hari Ini

- Total Antrean Hari Ini
- Total Pasien Menunggu
- Total Pasien Selesai Dilayani


ENDPOINT BACKEND
Backend minimal menyediakan endpoint berikut.
Authentication
POST /login
POST /logout
Patient
GET /patients
GET /patients/{id}
POST /patients
PUT /patients/{id}
DELETE /patients/{id}
Registration
GET /registrations
POST /registrations
PUT /registrations/{id}
Queue
GET /queues
POST /queues
PUT /queues/{id}/call
PUT /queues/{id}/status
Medical Record
POST /medical-records
GET /medical-records/{patientId}
Prescription
POST /prescriptions
GET /prescriptions/{id}

Standar Response API
Seluruh endpoint diharapkan menggunakan format response yang konsisten.
Success Response
JSON
{
"success": true,
"message": "Success",
"data": {}
}
Error Response
JSON
{
"success": false,
"message": "Validation Error",
"errors": {}
}


TECHNICAL REQUIREMENT
Front-end
React.js

Back-end
Nodes.js with express.js

Database
PostgreSQL

Authentication
JSON Web Token (JWT)

INFRASTRUCTURE
- DOCKER CONTAINER
- CI/CD PIPELINE

PRIORITY
1. Turn 1 : Create folder / file frontend, backend, and Infra based on Criteria above
2. Turn 2 : Create Basic Ui based on Overview and 6 feature
3. Turn 3 : Make a database and table based on all feature above
4. Turn 4 : Make Function of the auth feature (LOGIN, LOGOUT, AUTH)
5. Turn 5 : Make Function of the Patient master data
6. Turn 6 : Make Function of Modul Pendaftaran Pasien
7. Turn 7 : Make Function of Modul antrean
8. Turn 8 : Make a function of Modul pemeriksaan dokter
9. Turn 9 : Make a dashboard function
