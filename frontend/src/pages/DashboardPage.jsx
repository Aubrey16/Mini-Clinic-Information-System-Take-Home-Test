import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api';
import { useAuth } from '../AuthContext';

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

const statisticCards = [
  { key: 'total_patients', label: 'Total Pasien', description: 'Seluruh pasien terdaftar', icon: '♙', color: 'green' },
  { key: 'total_patients_today', label: 'Pasien Hari Ini', description: 'Pasien terdaftar hari ini', icon: '☀', color: 'blue' },
  { key: 'total_queue_today', label: 'Antrean Hari Ini', description: 'Total nomor antrean', icon: '☷', color: 'orange' },
  { key: 'total_waiting', label: 'Menunggu Dilayani', description: 'Pasien masih menunggu', icon: '◷', color: 'purple' },
  { key: 'total_finished', label: 'Selesai Dilayani', description: 'Pasien sudah diperiksa', icon: '✓', color: 'teal' },
];

const emptyStats = {
  total_patients: 0,
  total_patients_today: 0,
  total_queue_today: 0,
  total_waiting: 0,
  total_finished: 0,
  check_in_today: 0,
  in_examination: 0,
  active_doctors: 0,
  recent_queues: [],
};

function DashboardPage() {
  const navigate = useNavigate();
  const { user, roleLabel } = useAuth();

  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data.data);
      setError('');
    } catch (err) {
      setError('Gagal memuat data dashboard. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const todayLabel = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="page-kicker">DASHBOARD</p>
            <h1>Selamat datang, {user?.full_name ?? 'Pengguna'}</h1>
            <p className="page-description">
              Pantau ringkasan aktivitas klinik Anda hari ini.
            </p>
          </div>

          <div className="today-date">
            <span>◷</span>
            {todayLabel}
          </div>
        </header>

        {error ? <p className="table-error">{error}</p> : null}
        {loading ? <p className="page-description">Memuat data...</p> : null}

        <section className="statistics-grid">
          {statisticCards.map((statistic) => (
            <article className="stat-card" key={statistic.key}>
              <div className={`stat-icon ${statistic.color}`}>
                {statistic.icon}
              </div>

              <div>
                <p>{statistic.label}</p>
                <strong>{stats[statistic.key]}</strong>
                <span>{statistic.description}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-card queue-card">
            <div className="card-heading">
              <div>
                <p className="page-kicker">ANTREAN</p>
                <h2>Antrean Hari Ini</h2>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={() => navigate('/queues')}
              >
                Lihat semua
              </button>
            </div>

            <div className="queue-list">
              {stats.recent_queues.map((queue) => (
                <div className="queue-item" key={queue.id}>
                  <div className="queue-number">{queue.queue_number}</div>

                  <div className="queue-patient">
                    <strong>{queue.patient.full_name}</strong>
                    <span>{queue.poli.name}</span>
                  </div>

                  <span className={`status-badge ${statusBadgeClass[queue.status]}`}>
                    {statusLabels[queue.status]}
                  </span>
                </div>
              ))}

              {!stats.recent_queues.length ? (
                <p className="empty-row">Belum ada antrean hari ini.</p>
              ) : null}
            </div>
          </article>

          <article className="dashboard-card reminder-card">
            <p className="page-kicker">RINGKASAN</p>
            <h2>Aktivitas Hari Ini</h2>

            <div className="activity-row">
              <span>Pasien check-in</span>
              <strong>{stats.check_in_today} pasien</strong>
            </div>

            <div className="activity-row">
              <span>Pemeriksaan berlangsung</span>
              <strong>{stats.in_examination} pasien</strong>
            </div>

            <div className="activity-row">
              <span>Jadwal dokter aktif</span>
              <strong>{stats.active_doctors} dokter</strong>
            </div>

            <div className="activity-row">
              <span>Status Anda</span>
              <strong>{roleLabel}</strong>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
