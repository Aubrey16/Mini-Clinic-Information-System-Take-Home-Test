import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

const statusLabels = {
  menunggu: 'Menunggu',
  dipanggil: 'Dipanggil',
  pemeriksaan: 'Pemeriksaan',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

const statusBadgeClass = {
  menunggu: 'status-waiting',
  dipanggil: 'status-progress',
  pemeriksaan: 'status-progress',
  selesai: 'status-done',
  dibatalkan: 'status-waiting',
};

const nextAction = {
  menunggu: { status: 'dipanggil', label: 'Panggil' },
  dipanggil: { status: 'pemeriksaan', label: 'Mulai Periksa' },
  pemeriksaan: { status: 'selesai', label: 'Selesai' },
};

const paymentLabels = { bpjs: 'BPJS', tunai: 'Tunai', asuransi: 'Asuransi' };

function formatDateLong(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function QueuePage() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [modal, setModal] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [registrationId, setRegistrationId] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchQueues = useCallback(async () => {
    try {
      const { data } = await api.get('/queues');
      setQueues(data.data.items);
      setError('');
    } catch (err) {
      setError('Gagal memuat antrean. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 15000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  const summary = useMemo(() => {
    const active = queues.filter((q) => q.status === 'menunggu' || q.status === 'dipanggil');
    const examining = queues.filter((q) => q.status === 'pemeriksaan');
    const waiting = queues.filter((q) => q.status === 'menunggu');
    const done = queues.filter((q) => q.status === 'selesai');
    return { active: active.length, examining: examining.length, waiting: waiting.length, done: done.length };
  }, [queues]);

  const todayLabel = useMemo(() => formatDateLong(new Date().toISOString().slice(0, 10)), []);

  async function openCreateModal() {
    setModalError('');
    setRegistrationId('');
    try {
      const { data } = await api.get('/registrations', { params: { limit: 50 } });
      const queuedIds = new Set(queues.map((q) => String(q.registration_id)));
      setRegistrations(
        data.data.items.filter(
          (registration) =>
            registration.status !== 'selesai' && !queuedIds.has(String(registration.id))
        )
      );
    } catch (err) {
      setModalError('Gagal memuat daftar pendaftaran.');
    }
    setModal(true);
  }

  async function handleCreate() {
    if (!registrationId) {
      setModalError('Pilih pendaftaran terlebih dahulu.');
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      const { data } = await api.post('/queues', { registration_id: registrationId });
      setNotice(`Antrean ${data.data.queue_number} berhasil dibuat.`);
      setModal(false);
      fetchQueues();
    } catch (err) {
      const response = err.response?.data;
      setModalError(
        Object.values(response?.errors ?? {})[0] ?? 'Gagal membuat antrean.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCallNext() {
    setError('');
    setNotice('');
    try {
      const { data } = await api.put('/queues/call-next');
      setNotice(`Antrean ${data.data.queue_number} sedang dipanggil.`);
      fetchQueues();
    } catch (err) {
      const response = err.response?.data;
      setError(Object.values(response?.errors ?? {})[0] ?? 'Gagal memanggil antrean.');
    }
  }

  async function handleAdvance(queue) {
    const action = nextAction[queue.status];
    if (!action) return;
    setError('');
    setNotice('');
    try {
      await api.put(`/queues/${queue.id}/status`, { status: action.status });
      fetchQueues();
    } catch (err) {
      const response = err.response?.data;
      setError(Object.values(response?.errors ?? {})[0] ?? 'Gagal mengubah status antrean.');
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="page-kicker">ANTREAN</p>
            <h1>Antrean Pasien</h1>
            <p className="page-description">Pantau dan panggil antrean pasien hari ini.</p>
          </div>

          <button type="button" className="primary-button" onClick={openCreateModal}>
            + Buat Antrean
          </button>
        </header>

        {notice ? <p className="form-notice">{notice}</p> : null}
        {error ? <p className="table-error">{error}</p> : null}

        <section className="queue-summary">
          <article><span>Antrean aktif</span><strong>{summary.active}</strong></article>
          <article><span>Sedang diperiksa</span><strong>{summary.examining}</strong></article>
          <article><span>Menunggu</span><strong>{summary.waiting}</strong></article>
          <article><span>Selesai</span><strong>{summary.done}</strong></article>
        </section>

        <section className="data-card">
          <div className="table-toolbar">
            <div>
              <h2>Daftar Antrean Hari Ini</h2>
              <p>{todayLabel}</p>
            </div>

            <button type="button" className="secondary-button" onClick={handleCallNext}>
              Panggil Berikutnya
            </button>
          </div>

          <div className="table-wrapper">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>Nomor</th>
                  <th>Pasien</th>
                  <th>Dokter</th>
                  <th>Poli</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {queues.map((queue) => (
                  <tr key={queue.id}>
                    <td><span className="record-number">{queue.queue_number}</span></td>
                    <td>
                      <strong>{queue.patient.full_name}</strong>
                      <span className="cell-sub">{queue.patient.medical_record_no}</span>
                    </td>
                    <td>{queue.doctor.full_name}</td>
                    <td>{queue.poli.name}</td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass[queue.status]}`}>
                        {statusLabels[queue.status]}
                      </span>
                    </td>
                    <td>
                      {nextAction[queue.status] ? (
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => handleAdvance(queue)}
                        >
                          {nextAction[queue.status].label}
                        </button>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && !queues.length ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      Belum ada antrean hari ini.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {modal ? (
          <div className="modal-overlay" onClick={() => setModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="form-heading">
                <h2>Buat Antrean</h2>
                <p>Nomor antrean dibuat otomatis sesuai poli (contoh: A001).</p>
              </div>

              <form
                className="clinic-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
              >
                <label>
                  Pendaftaran
                  <select
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                  >
                    <option value="" disabled>Pilih pendaftaran</option>
                    {registrations.map((registration) => (
                      <option key={registration.id} value={registration.id}>
                        {registration.patient.full_name} — {registration.poli.name} ·{' '}
                        {paymentLabels[registration.payment_type]}
                      </option>
                    ))}
                  </select>
                  {registrations.length === 0 ? (
                    <span className="field-error">
                      Tidak ada pendaftaran aktif tanpa antrean.
                    </span>
                  ) : null}
                </label>

                {modalError ? <p className="field-error">{modalError}</p> : null}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setModal(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Buat Antrean'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default QueuePage;
