import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { useAuth } from '../AuthContext';

const statusLabels = {
  menunggu: 'Menunggu',
  check_in: 'Check In',
  dipanggil: 'Dipanggil',
  pemeriksaan: 'Pemeriksaan',
  selesai: 'Selesai',
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

const emptyForm = {
  subjective: '',
  blood_pressure: '',
  body_temperature: '',
  weight_kg: '',
  height_cm: '',
  assessment: '',
  plan: '',
};

const emptyAction = { name: '', notes: '' };
const emptyItem = {
  medicine_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

function MedicalRecordPage() {
  const { user } = useAuth();
  const canExamine = user?.role === 'doctor' || user?.role === 'administration';

  const [registrations, setRegistrations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [actions, setActions] = useState([]);
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const [history, setHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [view, setView] = useState('waiting');
  const [allRecords, setAllRecords] = useState([]);
  const [allMeta, setAllMeta] = useState({ page: 1, total_pages: 1, total_items: 0 });
  const [recordSearch, setRecordSearch] = useState('');
  const [recordPage, setRecordPage] = useState(1);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchAllRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError('');
    try {
      const { data } = await api.get('/medical-records', {
        params: { search: recordSearch, page: recordPage, limit: 10 },
      });
      setAllRecords(data.data.items);
      setAllMeta(data.data.meta);
    } catch (err) {
      setRecordsError('Gagal memuat riwayat pemeriksaan.');
    } finally {
      setRecordsLoading(false);
    }
  }, [recordSearch, recordPage]);

  useEffect(() => {
    if (view === 'history') {
      const timer = setTimeout(fetchAllRecords, recordSearch ? 400 : 0);
      return () => clearTimeout(timer);
    }
  }, [view, fetchAllRecords, recordSearch]);

  const fetchRegistrations = useCallback(async () => {
    try {
      const [inExam, checkedIn] = await Promise.all([
        api.get('/registrations', { params: { status: 'pemeriksaan', limit: 50 } }),
        api.get('/registrations', { params: { status: 'check_in', limit: 50 } }),
      ]);
      setRegistrations([...inExam.data.data.items, ...checkedIn.data.data.items]);
      setLoadError('');
    } catch (err) {
      setLoadError('Gagal memuat daftar pasien. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const patientAge = useMemo(() => {
    const patient = selected?.patient;
    if (!patient?.birth_date) return null;
    return calculateAge(patient.birth_date);
  }, [selected]);

  function selectRegistration(registration) {
    setSelected(registration);
    setForm(emptyForm);
    setActions([]);
    setPrescriptionItems([]);
    setFormErrors({});
    setNotice('');
    setHistory(null);
    setShowHistory(false);
  }

  function switchView(target) {
    setView(target);
    setExpandedId(null);
    if (target === 'waiting') {
      setSelected(null);
      fetchRegistrations();
    }
  }

  async function loadHistory() {
    setShowHistory(true);
    if (history?.patientId === selected.patient.id) return;
    try {
      const { data } = await api.get(`/medical-records/${selected.patient.id}`);
      setHistory({ patientId: selected.patient.id, items: data.data.items });
    } catch (err) {
      setHistory({ patientId: selected.patient.id, items: [], error: true });
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAction(index, field, value) {
    setActions((prev) =>
      prev.map((action, i) => (i === index ? { ...action, [field]: value } : action))
    );
  }

  function updateItem(index, field, value) {
    setPrescriptionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormErrors({});
    setNotice('');

    if (!form.assessment.trim() || !form.plan.trim()) {
      setFormErrors({
        assessment: form.assessment.trim() ? '' : 'Diagnosa wajib diisi',
        plan: form.plan.trim() ? '' : 'Rencana terapi wajib diisi',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        registration_id: selected.id,
        subjective: form.subjective,
        blood_pressure: form.blood_pressure,
        body_temperature: form.body_temperature === '' ? undefined : form.body_temperature,
        weight_kg: form.weight_kg === '' ? undefined : form.weight_kg,
        height_cm: form.height_cm === '' ? undefined : form.height_cm,
        assessment: form.assessment,
        plan: form.plan,
        medical_actions: actions.filter((action) => action.name.trim()),
        prescriptions: prescriptionItems.filter((item) => item.medicine_name.trim()).length
          ? [
              {
                items: prescriptionItems.filter((item) => item.medicine_name.trim()),
              },
            ]
          : [],
      };

      const { data } = await api.post('/medical-records', payload);
      setNotice(
        `Pemeriksaan ${data.data.patient.full_name} tersimpan. Pendaftaran dan antrean ditandai selesai.`
      );
      setSelected(null);
      setForm(emptyForm);
      setActions([]);
      setPrescriptionItems([]);
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

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="page-kicker">PEMERIKSAAN DOKTER</p>
            <h1>Pemeriksaan Pasien</h1>
            <p className="page-description">
              Catat hasil pemeriksaan menggunakan metode SOAP.
            </p>
          </div>
        </header>

        {notice ? <p className="form-notice">{notice}</p> : null}
        {loadError ? <p className="table-error">{loadError}</p> : null}

        {notice ? <p className="form-notice">{notice}</p> : null}
        {loadError ? <p className="table-error">{loadError}</p> : null}

        {!selected ? (
          <div className="tab-bar">
            <button
              type="button"
              className={`tab-item ${view === 'waiting' ? 'tab-active' : ''}`}
              onClick={() => switchView('waiting')}
            >
              Pasien Menunggu
            </button>
            <button
              type="button"
              className={`tab-item ${view === 'history' ? 'tab-active' : ''}`}
              onClick={() => switchView('history')}
            >
              Riwayat Pemeriksaan
            </button>
          </div>
        ) : null}

        {view === 'history' && !selected ? (
          <section className="data-card">
            <div className="table-toolbar">
              <div>
                <h2>Semua Pemeriksaan</h2>
                <p>
                  {recordsLoading
                    ? 'Memuat...'
                    : `${allMeta.total_items} pemeriksaan tercatat`}
                </p>
              </div>

              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Cari nama pasien atau No. RM..."
                  value={recordSearch}
                  onChange={(e) => {
                    setRecordSearch(e.target.value);
                    setRecordPage(1);
                  }}
                />
              </label>
            </div>

            {recordsError ? <p className="table-error">{recordsError}</p> : null}

            <div className="table-wrapper">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pasien</th>
                    <th>Dokter</th>
                    <th>Diagnosa</th>
                    <th>Resep</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecords.map((record) => (
                    <tr
                      key={record.id}
                      className={expandedId === record.id ? 'row-expanded' : ''}
                    >
                      <td>{formatDate(record.examined_at)}</td>
                      <td>
                        <strong>{record.patient.full_name}</strong>
                        <span className="cell-sub">
                          {record.patient.medical_record_no}
                        </span>
                      </td>
                      <td>{record.doctor.full_name}</td>
                      <td>{record.assessment}</td>
                      <td>
                        {record.prescriptions.length
                          ? record.prescriptions
                              .flatMap((prescription) => prescription.items)
                              .map((item) => item.medicine_name)
                              .join(', ')
                          : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-button"
                          onClick={() =>
                            setExpandedId(
                              expandedId === record.id ? null : record.id
                            )
                          }
                        >
                          {expandedId === record.id ? 'Tutup' : 'Detail'}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!recordsLoading && !allRecords.length ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        {recordSearch
                          ? `Tidak ada pemeriksaan untuk "${recordSearch}".`
                          : 'Belum ada riwayat pemeriksaan.'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {allRecords.map((record) =>
              expandedId === record.id ? (
                <div key={`detail-${record.id}`} className="history-detail">
                  <article className="history-entry">
                    <header>
                      <strong>
                        {record.patient.full_name} — {formatDate(record.examined_at)}
                      </strong>
                      <span>
                        {record.doctor.full_name} · {record.patient.medical_record_no}
                      </span>
                    </header>
                    <dl>
                      <div>
                        <dt>Subjective — Keluhan</dt>
                        <dd>{record.subjective || '-'}</dd>
                      </div>
                      <div>
                        <dt>Objective — Vital</dt>
                        <dd>
                          {[
                            record.blood_pressure && `TD ${record.blood_pressure} mmHg`,
                            record.body_temperature && `Suhu ${record.body_temperature}°C`,
                            record.weight_kg && `BB ${record.weight_kg} kg`,
                            record.height_cm && `TB ${record.height_cm} cm`,
                          ]
                            .filter(Boolean)
                            .join(' · ') || '-'}
                        </dd>
                      </div>
                      <div>
                        <dt>Assessment — Diagnosa</dt>
                        <dd>{record.assessment}</dd>
                      </div>
                      <div>
                        <dt>Plan — Rencana Terapi</dt>
                        <dd>{record.plan}</dd>
                      </div>
                      {record.medical_actions.length ? (
                        <div>
                          <dt>Tindakan Medis</dt>
                          <dd>
                            {record.medical_actions
                              .map(
                                (action) =>
                                  `${action.name}${action.notes ? ` (${action.notes})` : ''}`
                              )
                              .join('; ')}
                          </dd>
                        </div>
                      ) : null}
                      {record.prescriptions.length ? (
                        <div>
                          <dt>Resep Obat</dt>
                          <dd>
                            <ul className="prescription-list">
                              {record.prescriptions
                                .flatMap((prescription) => prescription.items)
                                .map((item) => (
                                  <li key={item.id}>
                                    <strong>{item.medicine_name}</strong> — {item.dosage},{' '}
                                    {item.frequency}
                                    {item.duration ? `, ${item.duration}` : ''}
                                    {item.instructions
                                      ? ` (${item.instructions})`
                                      : ''}
                                  </li>
                                ))}
                            </ul>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </article>
                </div>
              ) : null
            )}

            <footer className="pagination">
              <p>
                Halaman {allMeta.page} dari {allMeta.total_pages}
              </p>
              <div>
                <button
                  type="button"
                  disabled={allMeta.page <= 1}
                  onClick={() => setRecordPage(allMeta.page - 1)}
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={allMeta.page >= allMeta.total_pages}
                  onClick={() => setRecordPage(allMeta.page + 1)}
                >
                  Berikutnya →
                </button>
              </div>
            </footer>
          </section>
        ) : loading ? (
          <p className="page-description">Memuat daftar pasien...</p>
        ) : !selected ? (
          <section className="data-card">
            <div className="form-heading">
              <h2>Pasien Menunggu Pemeriksaan</h2>
              <p>Pilih pasien untuk mulai mencatat pemeriksaan SOAP.</p>
            </div>

            <div className="table-wrapper">
              <table className="patient-table">
                <thead>
                  <tr>
                    <th>Pasien</th>
                    <th>Dokter</th>
                    <th>Poli</th>
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
                      <td>
                        <span className="status-badge status-progress">
                          {statusLabels[registration.status]}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => selectRegistration(registration)}
                        >
                          Periksa
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!registrations.length ? (
                    <tr>
                      <td colSpan="5" className="empty-row">
                        Tidak ada pasien yang menunggu pemeriksaan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <>
            <section className="patient-banner">
              <div className="patient-banner-avatar">
                {selected.patient.full_name
                  .split(' ')
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h2>{selected.patient.full_name}</h2>
                <p>
                  {selected.patient.medical_record_no}
                  {patientAge !== null ? ` · ${patientAge} tahun` : ''}
                </p>
              </div>
              <span className="status-badge status-progress">
                Sedang diperiksa
              </span>
              <div className="patient-banner-actions">
                <button
                  type="button"
                  className="table-button"
                  onClick={loadHistory}
                >
                  Riwayat Pemeriksaan
                </button>
                <button
                  type="button"
                  className="table-button"
                  onClick={() => switchView('waiting')}
                >
                  Pilih Pasien Lain
                </button>
              </div>
            </section>

            {showHistory ? (
              <section className="data-card history-card">
                <div className="form-heading">
                  <h2>Riwayat Pemeriksaan</h2>
                  <p>Kunjungan pasien sebelumnya.</p>
                </div>

                {!history ? (
                  <p className="page-description">Memuat riwayat...</p>
                ) : history.error ? (
                  <p className="table-error">Gagal memuat riwayat pemeriksaan.</p>
                ) : !history.items.length ? (
                  <p className="page-description">Belum ada pemeriksaan sebelumnya.</p>
                ) : (
                  history.items.map((record) => (
                    <article key={record.id} className="history-entry">
                      <header>
                        <strong>{formatDate(record.examined_at)}</strong>
                        <span>
                          {record.doctor.full_name} · Diagnosa: {record.assessment}
                        </span>
                      </header>
                      <dl>
                        <div>
                          <dt>Subjective</dt>
                          <dd>{record.subjective || '-'}</dd>
                        </div>
                        <div>
                          <dt>Objective</dt>
                          <dd>
                            {[
                              record.blood_pressure && `TD ${record.blood_pressure}`,
                              record.body_temperature && `Suhu ${record.body_temperature}°C`,
                              record.weight_kg && `BB ${record.weight_kg} kg`,
                              record.height_cm && `TB ${record.height_cm} cm`,
                            ]
                              .filter(Boolean)
                              .join(' · ') || '-'}
                          </dd>
                        </div>
                        <div>
                          <dt>Plan</dt>
                          <dd>{record.plan || '-'}</dd>
                        </div>
                        {record.prescriptions?.length ? (
                          <div>
                            <dt>Resep</dt>
                            <dd>
                              {record.prescriptions
                                .flatMap((prescription) => prescription.items)
                                .map((item) => item.medicine_name)
                                .join(', ')}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  ))
                )}
              </section>
            ) : null}

            {canExamine ? (
              <form className="medical-form" onSubmit={handleSubmit}>
                <section className="data-card form-card">
                  <div className="form-heading">
                    <p className="page-kicker">SOAP</p>
                    <h2>Catatan Pemeriksaan</h2>
                  </div>

                  <label>
                    Subjective — Keluhan Pasien
                    <textarea
                      rows="4"
                      placeholder="Contoh: Demam dan batuk sejak dua hari lalu..."
                      value={form.subjective}
                      onChange={(e) => updateField('subjective', e.target.value)}
                    />
                  </label>

                  <div className="vital-grid">
                    <label>
                      Tekanan Darah
                      <input
                        placeholder="Contoh: 120/80 mmHg"
                        value={form.blood_pressure}
                        onChange={(e) => updateField('blood_pressure', e.target.value)}
                      />
                      {formErrors.blood_pressure ? (
                        <span className="field-error">{formErrors.blood_pressure}</span>
                      ) : null}
                    </label>
                    <label>
                      Suhu Tubuh
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Contoh: 36.5"
                        value={form.body_temperature}
                        onChange={(e) => updateField('body_temperature', e.target.value)}
                      />
                      {formErrors.body_temperature ? (
                        <span className="field-error">{formErrors.body_temperature}</span>
                      ) : null}
                    </label>
                    <label>
                      Berat Badan
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Contoh: 65"
                        value={form.weight_kg}
                        onChange={(e) => updateField('weight_kg', e.target.value)}
                      />
                    </label>
                    <label>
                      Tinggi Badan
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Contoh: 170"
                        value={form.height_cm}
                        onChange={(e) => updateField('height_cm', e.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    Assessment — Diagnosa
                    <textarea
                      rows="3"
                      placeholder="Tuliskan hasil diagnosa..."
                      value={form.assessment}
                      onChange={(e) => updateField('assessment', e.target.value)}
                    />
                    {formErrors.assessment ? (
                      <span className="field-error">{formErrors.assessment}</span>
                    ) : null}
                  </label>

                  <label>
                    Plan — Rencana Terapi
                    <textarea
                      rows="3"
                      placeholder="Tuliskan rencana terapi..."
                      value={form.plan}
                      onChange={(e) => updateField('plan', e.target.value)}
                    />
                    {formErrors.plan ? (
                      <span className="field-error">{formErrors.plan}</span>
                    ) : null}
                  </label>
                </section>

                <section className="data-card form-card">
                  <div className="form-heading">
                    <h2>Tindakan Medis</h2>
                    <p>Tambahkan tindakan yang diberikan kepada pasien.</p>
                  </div>

                  {actions.map((action, index) => (
                    <div key={index} className="dynamic-row">
                      <div className="form-grid">
                        <label>
                          Nama Tindakan
                          <input
                            placeholder="Contoh: Pemeriksaan fisik"
                            value={action.name}
                            onChange={(e) => updateAction(index, 'name', e.target.value)}
                          />
                        </label>
                        <label>
                          Catatan
                          <input
                            placeholder="Catatan tindakan"
                            value={action.notes}
                            onChange={(e) => updateAction(index, 'notes', e.target.value)}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="row-remove"
                        onClick={() =>
                          setActions((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setActions((prev) => [...prev, { ...emptyAction }])}
                  >
                    + Tambah Tindakan
                  </button>
                </section>

                <section className="data-card form-card">
                  <div className="form-heading">
                    <h2>Resep Obat</h2>
                    <p>Tambahkan obat yang diresepkan.</p>
                  </div>

                  {prescriptionItems.map((item, index) => (
                    <div key={index} className="dynamic-row">
                      <div className="prescription-grid">
                        <label>
                          Nama Obat
                          <input
                            placeholder="Contoh: Paracetamol"
                            value={item.medicine_name}
                            onChange={(e) => updateItem(index, 'medicine_name', e.target.value)}
                          />
                        </label>
                        <label>
                          Dosis
                          <input
                            placeholder="Contoh: 500 mg"
                            value={item.dosage}
                            onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                          />
                        </label>
                        <label>
                          Frekuensi
                          <input
                            placeholder="Contoh: 3x sehari"
                            value={item.frequency}
                            onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                          />
                        </label>
                        <label>
                          Durasi
                          <input
                            placeholder="Contoh: 3 hari"
                            value={item.duration}
                            onChange={(e) => updateItem(index, 'duration', e.target.value)}
                          />
                        </label>
                      </div>
                      <label>
                        Aturan Pakai
                        <input
                          placeholder="Contoh: Diminum setelah makan"
                          value={item.instructions}
                          onChange={(e) => updateItem(index, 'instructions', e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="row-remove"
                        onClick={() =>
                          setPrescriptionItems((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setPrescriptionItems((prev) => [...prev, { ...emptyItem }])}
                  >
                    + Tambah Resep
                  </button>
                </section>

                {formErrors.general ? (
                  <p className="field-error">{formErrors.general}</p>
                ) : null}
                {formErrors.registration_id ? (
                  <p className="field-error">{formErrors.registration_id}</p>
                ) : null}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setForm(emptyForm);
                      setActions([]);
                      setPrescriptionItems([]);
                      setFormErrors({});
                    }}
                  >
                    Reset Form
                  </button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Pemeriksaan'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="table-error">
                Hanya dokter yang dapat mencatat hasil pemeriksaan.
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MedicalRecordPage;
