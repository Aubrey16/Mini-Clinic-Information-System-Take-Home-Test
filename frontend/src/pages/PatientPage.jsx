import Sidebar from '../components/Sidebar';

const patients = [
  {
    id: 1,
    medicalRecordNumber: 'RM-000001',
    nik: '3273011201990001',
    name: 'Andi Pratama',
    gender: 'Laki-laki',
    birthDate: '12 Januari 1999',
    phone: '0812-3456-7890',
  },
  {
    id: 2,
    medicalRecordNumber: 'RM-000002',
    nik: '3273014502980002',
    name: 'Siti Rahma',
    gender: 'Perempuan',
    birthDate: '4 Februari 1998',
    phone: '0813-4567-8901',
  },
  {
    id: 3,
    medicalRecordNumber: 'RM-000003',
    nik: '3273011007950003',
    name: 'Budi Hartono',
    gender: 'Laki-laki',
    birthDate: '10 Juli 1995',
    phone: '0821-5678-9012',
  },
  {
    id: 4,
    medicalRecordNumber: 'RM-000004',
    nik: '3273012204000004',
    name: 'Dewi Lestari',
    gender: 'Perempuan',
    birthDate: '22 April 2000',
    phone: '0852-6789-0123',
  },
];

function PatientPage() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="page-kicker">MASTER DATA</p>
            <h1>Data Pasien</h1>
            <p className="page-description">
              Kelola seluruh data pasien klinik.
            </p>
          </div>

          <button type="button" className="primary-button">
            + Tambah Pasien
          </button>
        </header>

        <section className="data-card">
          <div className="table-toolbar">
            <div>
              <h2>Daftar Pasien</h2>
              <p>Menampilkan 4 dari 1.248 pasien</p>
            </div>

            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Cari nama, NIK, atau nomor RM..."
              />
            </label>
          </div>

          <div className="table-wrapper">
            <table className="patient-table">
              <thead>
                <tr>
                  <th>No. RM</th>
                  <th>Pasien</th>
                  <th>NIK</th>
                  <th>Jenis Kelamin</th>
                  <th>Tanggal Lahir</th>
                  <th>No. Telepon</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <span className="record-number">
                        {patient.medicalRecordNumber}
                      </span>
                    </td>

                    <td>
                      <strong>{patient.name}</strong>
                    </td>

                    <td>{patient.nik}</td>

                    <td>
                      <span
                        className={`gender-badge ${
                          patient.gender === 'Laki-laki'
                            ? 'gender-male'
                            : 'gender-female'
                        }`}
                      >
                        {patient.gender}
                      </span>
                    </td>

                    <td>{patient.birthDate}</td>
                    <td>{patient.phone}</td>

                    <td>
                      <div className="table-actions">
                        <button type="button" title="Lihat detail">
                          ◉
                        </button>
                        <button type="button" title="Edit pasien">
                          ✎
                        </button>
                        <button type="button" title="Hapus pasien">
                          ♲
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="pagination">
            <p>Halaman 1 dari 125</p>

            <div>
              <button type="button" disabled>
                ← Sebelumnya
              </button>
              <button type="button" className="page-active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">Berikutnya →</button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default PatientPage;