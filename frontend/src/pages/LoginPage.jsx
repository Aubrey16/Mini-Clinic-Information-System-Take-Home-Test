import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const response = err.response?.data;
      if (response?.errors) {
        setError(Object.values(response.errors).join(' '));
      } else {
        setError('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.');
      }
    } finally {
      setLoading(false);
    }
  }

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

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="contoh@klinik.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />

            <label htmlFor="password">Kata sandi</label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error ? <p className="login-error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="login-note">
            Hubungi administrator klinik jika Anda tidak memiliki akun.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
