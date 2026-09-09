import Sidebar from '../components/Sidebar';

function RegistrationPage() {
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

          <form className="clinic-form">
            <div className="form-grid">
              <label>
                Pasien
                <select defaultValue="">
                  <option value="" disabled>Pilih pasien</option>
                  <option>RM-000001 — Andi Pratama</option>
                  <option>RM-000002 — Siti Rahma</option>
                  <option>RM-000003 — Budi Hartono</option>
                </select>
              </label>

              <label>
                Dokter
                <select defaultValue="">
                  <option value="" disabled>Pilih dokter</option>
                  <option>dr. Budi Santoso — Dokter Umum</option>
                </select>
              </label>

              <label>
                Poli
                <select defaultValue="">
                  <option value="" disabled>Pilih poli</option>
                  <option>Poli Umum</option>
                  <option>Poli Gigi</option>
                </select>
              </label>

              <label>
                Tanggal Kunjungan
                <input type="date" />
              </label>

              <label>
                Jenis Pembayaran
                <select defaultValue="">
                  <option value="" disabled>Pilih pembayaran</option>
                  <option>BPJS</option>
                  <option>Tunai</option>
                  <option>Asuransi</option>
                </select>
              </label>
            </div>

            <label>
              Keluhan Awal
              <textarea
                rows="4"
                placeholder="Tuliskan keluhan awal pasien..."
              />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary-button">Batal</button>
              <button type="button" className="primary-button">
                Simpan Pendaftaran
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default RegistrationPage;