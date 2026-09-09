import Sidebar from '../components/Sidebar';

function MedicalRecordPage() {
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

        <section className="patient-banner">
          <div className="patient-banner-avatar">AP</div>
          <div>
            <h2>Andi Pratama</h2>
            <p>RM-000001 · Laki-laki · 27 tahun</p>
          </div>
          <span className="status-badge status-progress">Sedang diperiksa</span>
        </section>

        <form className="medical-form">
          <section className="data-card form-card">
            <div className="form-heading">
              <p className="page-kicker">SOAP</p>
              <h2>Catatan Pemeriksaan</h2>
            </div>

            <label>
              Subjective — Keluhan Pasien
              <textarea rows="4" placeholder="Contoh: Demam dan batuk sejak dua hari lalu..." />
            </label>

            <div className="vital-grid">
              <label>Tekanan Darah<input placeholder="Contoh: 120/80 mmHg" /></label>
              <label>Suhu Tubuh<input type="number" placeholder="Contoh: 36.5" /></label>
              <label>Berat Badan<input type="number" placeholder="Contoh: 65" /></label>
              <label>Tinggi Badan<input type="number" placeholder="Contoh: 170" /></label>
            </div>

            <label>
              Assessment — Diagnosa
              <textarea rows="3" placeholder="Tuliskan hasil diagnosa..." />
            </label>

            <label>
              Plan — Rencana Terapi
              <textarea rows="3" placeholder="Tuliskan rencana terapi..." />
            </label>
          </section>

          <section className="data-card form-card">
            <div className="form-heading">
              <h2>Tindakan Medis</h2>
              <p>Tambahkan tindakan yang diberikan kepada pasien.</p>
            </div>

            <div className="form-grid">
              <label>Nama Tindakan<input placeholder="Contoh: Pemeriksaan fisik" /></label>
              <label>Catatan<input placeholder="Catatan tindakan" /></label>
            </div>

            <button type="button" className="secondary-button">+ Tambah Tindakan</button>
          </section>

          <section className="data-card form-card">
            <div className="form-heading">
              <h2>Resep Obat</h2>
              <p>Tambahkan obat yang diresepkan.</p>
            </div>

            <div className="prescription-grid">
              <label>Nama Obat<input placeholder="Contoh: Paracetamol" /></label>
              <label>Dosis<input placeholder="Contoh: 500 mg" /></label>
              <label>Frekuensi<input placeholder="Contoh: 3x sehari" /></label>
              <label>Durasi<input placeholder="Contoh: 3 hari" /></label>
            </div>

            <label>Aturan Pakai<input placeholder="Contoh: Diminum setelah makan" /></label>
            <button type="button" className="secondary-button">+ Tambah Resep</button>
          </section>

          <div className="form-actions">
            <button type="button" className="secondary-button">Simpan Draft</button>
            <button type="button" className="primary-button">
              Simpan Pemeriksaan
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default MedicalRecordPage;