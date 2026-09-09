import Sidebar from '../components/Sidebar';

const queues = [
  { number: 'A001', patient: 'Andi Pratama', doctor: 'dr. Budi Santoso', poly: 'Poli Umum', status: 'Pemeriksaan' },
  { number: 'A002', patient: 'Siti Rahma', doctor: 'dr. Budi Santoso', poly: 'Poli Umum', status: 'Menunggu' },
  { number: 'A003', patient: 'Budi Hartono', doctor: 'dr. Budi Santoso', poly: 'Poli Gigi', status: 'Check In' },
];

function QueuePage() {
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

          <button type="button" className="primary-button">+ Buat Antrean</button>
        </header>

        <section className="queue-summary">
          <article><span>Antrean aktif</span><strong>18</strong></article>
          <article><span>Sedang diperiksa</span><strong>1</strong></article>
          <article><span>Menunggu</span><strong>7</strong></article>
          <article><span>Selesai</span><strong>11</strong></article>
        </section>

        <section className="data-card">
          <div className="table-toolbar">
            <div>
              <h2>Daftar Antrean Hari Ini</h2>
              <p>9 September 2026</p>
            </div>

            <button type="button" className="secondary-button">Panggil Berikutnya</button>
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
                  <tr key={queue.number}>
                    <td><span className="record-number">{queue.number}</span></td>
                    <td><strong>{queue.patient}</strong></td>
                    <td>{queue.doctor}</td>
                    <td>{queue.poly}</td>
                    <td>
                      <span className={`status-badge ${
                        queue.status === 'Pemeriksaan'
                          ? 'status-progress'
                          : 'status-waiting'
                      }`}>
                        {queue.status}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="table-button">
                        Panggil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default QueuePage;