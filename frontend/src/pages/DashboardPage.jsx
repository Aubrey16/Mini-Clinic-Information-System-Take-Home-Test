import Sidebar from '../components/Sidebar';

const statistics = [
  {
    label: 'Total Pasien',
    value: '1,248',
    description: 'Seluruh pasien terdaftar',
    icon: '♙',
    color: 'green',
  },
  {
    label: 'Pasien Hari Ini',
    value: '24',
    description: 'Pasien terdaftar hari ini',
    icon: '☀',
    color: 'blue',
  },
  {
    label: 'Antrean Hari Ini',
    value: '18',
    description: 'Total nomor antrean',
    icon: '☷',
    color: 'orange',
  },
  {
    label: 'Menunggu Dilayani',
    value: '7',
    description: 'Pasien masih menunggu',
    icon: '◷',
    color: 'purple',
  },
  {
    label: 'Selesai Dilayani',
    value: '11',
    description: 'Pasien sudah diperiksa',
    icon: '✓',
    color: 'teal',
  },
];

const queues = [
  { number: 'A001', patient: 'Andi Pratama', poly: 'Poli Umum', status: 'Pemeriksaan' },
  { number: 'A002', patient: 'Siti Rahma', poly: 'Poli Umum', status: 'Menunggu' },
  { number: 'A003', patient: 'Budi Hartono', poly: 'Poli Gigi', status: 'Menunggu' },
];

function DashboardPage() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="page-kicker">DASHBOARD</p>
            <h1>Selamat datang, Administrator</h1>
            <p className="page-description">
              Pantau ringkasan aktivitas klinik Anda hari ini.
            </p>
          </div>

          <div className="today-date">
            <span>◷</span>
            9 September 2026
          </div>
        </header>

        <section className="statistics-grid">
          {statistics.map((statistic) => (
            <article className="stat-card" key={statistic.label}>
              <div className={`stat-icon ${statistic.color}`}>
                {statistic.icon}
              </div>

              <div>
                <p>{statistic.label}</p>
                <strong>{statistic.value}</strong>
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

              <button type="button" className="text-button">
                Lihat semua
              </button>
            </div>

            <div className="queue-list">
              {queues.map((queue) => (
                <div className="queue-item" key={queue.number}>
                  <div className="queue-number">{queue.number}</div>

                  <div className="queue-patient">
                    <strong>{queue.patient}</strong>
                    <span>{queue.poly}</span>
                  </div>

                  <span
                    className={`status-badge ${
                      queue.status === 'Pemeriksaan'
                        ? 'status-progress'
                        : 'status-waiting'
                    }`}
                  >
                    {queue.status}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-card reminder-card">
            <p className="page-kicker">RINGKASAN</p>
            <h2>Aktivitas Hari Ini</h2>

            <div className="activity-row">
              <span>Pasien check-in</span>
              <strong>16 pasien</strong>
            </div>

            <div className="activity-row">
              <span>Pemeriksaan berlangsung</span>
              <strong>1 pasien</strong>
            </div>

            <div className="activity-row">
              <span>Jadwal dokter aktif</span>
              <strong>2 dokter</strong>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;