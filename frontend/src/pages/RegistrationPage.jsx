import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

const paymentLabels = { bpjs: 'BPJS', tunai: 'Tunai', asuransi: 'Asuransi' };

const statusLabels = {
  menunggu: 'Menunggu',
  check_in: 'Check In',
  pemeriksaan: 'Pemeriksaan',
  selesai: 'Selesai',
};

const statusBadgeClass = {
  menunggu: 'status-waiting',
  check_in: 'status-progress',
  pemeriksaan: 'status-progress',
  selesai: 'status-done',
};

const nextStatus = {
  menunggu: 'check_in',
  check_in: 'pemeriksaan',
  pemeriksaan: 'selesai',
};

const nextStatusLabel = {
  menunggu: 'Check In',
  check_in: 'Mulai Pemeriksaan',
  pemeriksaan: 'Tandai Selesai',
};

function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const emptyForm = {
  patient_id: '',
  poli_id: '',
  doctor_id: '',
  visit_date: today(),
  payment_type: '',
  chief_complaint: '',
};

function RegistrationPage() {
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const [patients, setPatients] = useState([]);
  const [polis, setPolis] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [registrations, setRegistrations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const availableDoctors = doctors.filter(
    (doctor) => !form.poli_id || String(doctor.poli_id) === String(form.poli_id)
  );

  const fetchOptions = useCallback(async () => {
    try {
      const [patientsRes, polisRes, doctorsRes] = await Promise.all([
        api.get('/patients', { params: { limit: 100 } }),
        api.get('/polis'),
        api.get('/doctors'),
      ]);
      setPatients(patientsRes.data.data.items);
      setPolis(polisRes.data.data.items);
      setDoctors(doctorsRes.data.data.items);
    } catch (err) {
      setFormErrors({ general: 'Gagal memuat data master. Pastikan backend berjalan.' });
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const { data } = await api.get('/registrations', {
        params: { limit: 10, ...(statusFilter ? { status: statusFilter } : {}) },
      });
      setRegistrations(data.data.items);
    } catch (err) {
      setListError('Gagal memuat daftar pendaftaran.');
    } finally {
      setListLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  function handleChange(field, value) {
    setForm((prev) => {
      if (field === 'poli_id') {
        return { ...prev, poli_id: value, doctor_id: '' };
      }
      return { ...prev, [field]: value };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormErrors({});
    setNotice('');
    setSaving(true);
    try {
      await api.post('/registrations', form);
      setNotice('Pendaftaran berhasil dibuat.');
      setForm(emptyForm);
      fetchRegistrations();
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) {
        setFormErrors(response.errors);
      } else {
        setFormErrors({ general: 'Tidak dapat terhubung ke server.' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus(registration) {
    const target = nextStatus[registration.status];
    if (!target) return;
    try {
      await api.put(`/registrations/${registration.id}`, { status: target });
      fetchRegistrations();
    } catch (err) {
      const response = err.response?.data;
      setListError(
        response?.errors?.status ?? 'Gagal mengubah status pendaftaran.'
      );
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="page-kicker">PENDAFTARAN</p>
            <h1>Pendaftaran Pasien</h1>
            <p className="page-description">
              Buat pendaftaran kunjungan pasien baru.
            </p>
          </div>
        </header>

        <section className="data-card form-card">
          <div className="form-heading">
            <h2>Form Pendaftaran</h2>
            <p>Lengkapi data kunjungan pasien.</p>
          </div>

          {notice ? <p className="form-notice">{notice}</p> : null}

          <form className="clinic-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Pasien
                <select
                  value={form.patient_id}
                  onChange={(e) => handleChange('patient_id', e.target.value)}
                >
                  <option value="" disabled>Pilih pasien</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.medical_record_no} — {patient.full_name}
                    </option>
                  ))}
                </select>
                {formErrors.patient_id ? (
                  <span className="field-error">{formErrors.patient_id}</span>
                ) : null}
              </label>

              <label>
                Poli
                <select
                  value={form.poli_id}
                  onChange={(e) => handleChange('poli_id', e.target.value)}
                >
                  <option value="" disabled>Pilih poli</option>
                  {polis.map((poli) => (
                    <option key={poli.id} value={poli.id}>
                      {poli.name}
                    </option>
                  ))}
                </select>
                {formErrors.poli_id ? (
                  <span className="field-error">{formErrors.poli_id}</span>
                ) : null}
              </label>

              <label>
                Dokter
                <select
                  value={form.doctor_id}
                  onChange={(e) => handleChange('doctor_id', e.target.value)}
                >
                  <option value="" disabled>
                    {form.poli_id ? 'Pilih dokter' : 'Pilih poli dahulu'}
                  </option>
                  {availableDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name} — {doctor.specialization}
                    </option>
                  ))}
                </select>
                {formErrors.doctor_id ? (
                  <span className="field-error">{formErrors.doctor_id}</span>
                ) : null}
              </label>

              <label>
                Tanggal Kunjungan
                <input
                  type="date"
                  value={form.visit_date}
                  onChange={(e) => handleChange('visit_date', e.target.value)}
                />
                {formErrors.visit_date ? (
                  <span className="field-error">{formErrors.visit_date}</span>
                ) : null}
              </label>

              <label>
                Jenis Pembayaran
                <select
                  value={form.payment_type}
                  onChange={(e) => handleChange('payment_type', e.target.value)}
                >
                  <option value="" disabled>Pilih pembayaran</option>
                  {Object.entries(paymentLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                {formErrors.payment_type ? (
                  <span className="field-error">{formErrors.payment_type}</span>
                ) : null}
              </label>
            </div>

            <label>
              Keluhan Awal
              <textarea
                rows="4"
                value={form.chief_complaint}
                onChange={(e) => handleChange('chief_complaint', e.target.value)}
                placeholder="Tuliskan keluhan awal pasien..."
              />
            </label>

            {formErrors.general ? (
              <p className="field-error">{formErrors.general}</p>
            ) : null}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setForm(emptyForm)}
              >
                Batal
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Pendaftaran'}
              </button>
            </div>
          </form>
        </section>

        <section className="data-card">
          <div className="table-toolbar">
            <div>
              <h2>Daftar Pendaftaran</h2>
              <p>
                {listLoading ? 'Memuat...' : `${registrations.length} pendaftaran terbaru`}
              </p>
            </div>

            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {listError ? <p className="table-error">{listError}</p> : null}

          <div className="table-wrapper">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Pasien</th>
                  <th>Dokter</th>
                  <th>Poli</th>
                  <th>Tanggal</th>
                  <th>Bayar</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id}>
                    <td>
                      <strong>{registration.patient.full_name}</strong>
                      <span className="cell-sub">
                        {registration.patient.medical_record_no}
                      </span>
                    </td>
                    <td>{registration.doctor.full_name}</td>
                    <td>{registration.poli.name}</td>
                    <td>{registration.visit_date}</td>
                    <td>{paymentLabels[registration.payment_type]}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          statusBadgeClass[registration.status]
                        }`}
                      >
                        {statusLabels[registration.status]}
                      </span>
                    </td>
                    <td>
                      {nextStatus[registration.status] ? (
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => advanceStatus(registration)}
                        >
                          {nextStatusLabel[registration.status]}
                        </button>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!listLoading && !registrations.length ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Tidak ada pendaftaran.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default RegistrationPage;
