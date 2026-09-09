function App() {
  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand">
          <div className="brand-icon">+</div>

          <div>
            <p className="brand-name">Nyancare</p>
            <p className="brand-subtitle">Clinic Information System</p>
          </div>
        </div>

        <div className="hero-content">
          <p className="eyebrow">SISTEM INFORMASI KLINIK</p>
          <h1>Pelayanan yang lebih rapi, untuk kesehatan yang lebih baik.</h1>
          <p>
            Kelola data pasien, pendaftaran, antrean, dan pemeriksaan dalam
            satu sistem.
          </p>
        </div>

        <p className="hero-footer">© 2026 Nyancare Clinic</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow accent">SELAMAT DATANG</p>
          <h2>Masuk ke akun Anda</h2>
          <p className="login-description">
            Masukkan email dan kata sandi untuk melanjutkan.
          </p>

          <form className="login-form">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="contoh@klinik.com"
            />

            <label htmlFor="password">Kata sandi</label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan kata sandi"
            />

            <button type="button">Masuk</button>
          </form>

          <p className="login-note">
            Hubungi administrator klinik jika Anda tidak memiliki akun.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;