import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api';

const genderLabel = { L: 'Laki-laki', P: 'Perempuan' };

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function calculateAge(value) {
  if (!value) return null;
  const birth = new Date(`${value}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

const emptyForm = {
  nik: '',
  full_name: '',
  gender: '',
  birth_date: '',
  phone: '',
  address: '',
};

function PatientPage() {
  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total_items: 0, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null); // 'form' | 'detail' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/patients', {
        params: { search, page, limit: 10 },
      });
      setPatients(data.data.items);
      setMeta(data.data.meta);
    } catch (err) {
      setError('Gagal memuat data pasien. Pastikan backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(fetchPatients, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchPatients, search]);

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setModal('form');
  }

  function openEdit(patient) {
    setForm({
      nik: patient.nik,
      full_name: patient.full_name,
      gender: patient.gender,
      birth_date: patient.birth_date,
      phone: patient.phone,
      address: patient.address,
    });
    setFormErrors({});
    setSelected(patient);
    setModal('form');
  }

  function openDetail(patient) {
    setSelected(patient);
    setModal('detail');
  }

  function openDelete(patient) {
    setSelected(patient);
    setModal('delete');
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setFormErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/patients/${selected.id}`, form);
      } else {
        await api.post('/patients', form);
      }
      closeModal();
      fetchPatients();
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

  async function handleDelete() {
    setSaving(true);
    try {
      await api.delete(`/patients/${selected.id}`);
      closeModal();
      if (patients.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchPatients();
      }
    } catch (err) {
      setFormErrors({ general: 'Gagal menghapus pasien.' });
    } finally {
      setSaving(false);
    }
  }

  function goToPage(target) {
    if (target >= 1 && target <= meta.total_pages && target !== page) {
      setPage(target);
    }
  }

  function renderPageNumbers() {
    const numbers = [];
    const start = Math.max(1, page - 1);
    const end = Math.min(meta.total_pages, start + 2);
    for (let i = start; i <= end; i += 1) {
      numbers.push(i);
    }
    return numbers;
  }

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

          <button type="button" className="primary-button" onClick={openCreate}>
            + Tambah Pasien
          </button>
        </header>

        <section className="data-card">
          <div className="table-toolbar">
            <div>
              <h2>Daftar Pasien</h2>
              <p>
                {loading
                  ? 'Memuat...'
                  : `Menampilkan ${patients.length} dari ${meta.total_items} pasien`}
              </p>
            </div>

            <label className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Cari nama, NIK, atau nomor RM..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>

          {error ? <p className="table-error">{error}</p> : null}

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
                        {patient.medical_record_no}
                      </span>
                    </td>

                    <td>
                      <strong>{patient.full_name}</strong>
                    </td>

                    <td>{patient.nik}</td>

                    <td>
                      <span
                        className={`gender-badge ${
                          patient.gender === 'L'
                            ? 'gender-male'
                            : 'gender-female'
                        }`}
                      >
                        {genderLabel[patient.gender]}
                      </span>
                    </td>

                    <td>{formatDate(patient.birth_date)}</td>
                    <td>{patient.phone}</td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="Lihat detail"
                          onClick={() => openDetail(patient)}
                        >
                          ◉
                        </button>
                        <button
                          type="button"
                          title="Edit pasien"
                          onClick={() => openEdit(patient)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          title="Hapus pasien"
                          onClick={() => openDelete(patient)}
                        >
                          ♲
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && !patients.length ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      {search
                        ? `Tidak ada pasien yang cocok dengan "${search}".`
                        : 'Belum ada data pasien.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <footer className="pagination">
            <p>
              Halaman {meta.page} dari {meta.total_pages}
            </p>

            <div>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                ← Sebelumnya
              </button>

              {renderPageNumbers().map((number) => (
                <button
                  key={number}
                  type="button"
                  className={number === page ? 'page-active' : ''}
                  onClick={() => goToPage(number)}
                >
                  {number}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= meta.total_pages}
                onClick={() => goToPage(page + 1)}
              >
                Berikutnya →
              </button>
            </div>
          </footer>
        </section>

        {modal === 'form' ? (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="form-heading">
                <h2>{selected ? 'Edit Pasien' : 'Tambah Pasien'}</h2>
                <p>
                  {selected
                    ? `Perbarui data pasien ${selected.medical_record_no}.`
                    : 'Nomor Rekam Medis akan dibuat otomatis.'}
                </p>
              </div>

              <form className="clinic-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    NIK
                    <input
                      value={form.nik}
                      onChange={(e) => setForm({ ...form, nik: e.target.value })}
                      placeholder="16 digit NIK"
                      maxLength="16"
                    />
                    {formErrors.nik ? (
                      <span className="field-error">{formErrors.nik}</span>
                    ) : null}
                  </label>

                  <label>
                    Nama Pasien
                    <input
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({ ...form, full_name: e.target.value })
                      }
                      placeholder="Nama lengkap pasien"
                    />
                    {formErrors.full_name ? (
                      <span className="field-error">{formErrors.full_name}</span>
                    ) : null}
                  </label>

                  <label>
                    Jenis Kelamin
                    <select
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                    >
                      <option value="" disabled>
                        Pilih jenis kelamin
                      </option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    {formErrors.gender ? (
                      <span className="field-error">{formErrors.gender}</span>
                    ) : null}
                  </label>

                  <label>
                    Tanggal Lahir
                    <input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) =>
                        setForm({ ...form, birth_date: e.target.value })
                      }
                    />
                    {formErrors.birth_date ? (
                      <span className="field-error">{formErrors.birth_date}</span>
                    ) : null}
                  </label>

                  <label>
                    Nomor Telepon
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="Contoh: 0812-3456-7890"
                    />
                    {formErrors.phone ? (
                      <span className="field-error">{formErrors.phone}</span>
                    ) : null}
                  </label>
                </div>

                <label>
                  Alamat
                  <textarea
                    rows="3"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Alamat lengkap pasien"
                  />
                  {formErrors.address ? (
                    <span className="field-error">{formErrors.address}</span>
                  ) : null}
                </label>

                {formErrors.general ? (
                  <p className="field-error">{formErrors.general}</p>
                ) : null}

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeModal}
                  >
                    Batal
                  </button>
                  <button type="submit" className="primary-button" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Pasien'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {modal === 'detail' && selected ? (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="form-heading">
                <h2>Detail Pasien</h2>
                <p>{selected.medical_record_no}</p>
              </div>

              <div className="detail-grid">
                <div>
                  <span>NIK</span>
                  <strong>{selected.nik}</strong>
                </div>
                <div>
                  <span>Nama Pasien</span>
                  <strong>{selected.full_name}</strong>
                </div>
                <div>
                  <span>Jenis Kelamin</span>
                  <strong>{genderLabel[selected.gender]}</strong>
                </div>
                <div>
                  <span>Tanggal Lahir</span>
                  <strong>
                    {formatDate(selected.birth_date)}
                    {calculateAge(selected.birth_date) !== null
                      ? ` (${calculateAge(selected.birth_date)} tahun)`
                      : ''}
                  </strong>
                </div>
                <div>
                  <span>Nomor Telepon</span>
                  <strong>{selected.phone}</strong>
                </div>
                <div className="detail-full">
                  <span>Alamat</span>
                  <strong>{selected.address}</strong>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={closeModal}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {modal === 'delete' && selected ? (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="form-heading">
                <h2>Hapus Pasien</h2>
                <p>
                  Yakin ingin menghapus pasien{' '}
                  <strong>{selected.full_name}</strong> ({selected.medical_record_no})?
                  Riwayat pemeriksaan pasien tetap tersimpan.
                </p>
              </div>

              {formErrors.general ? (
                <p className="field-error">{formErrors.general}</p>
              ) : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default PatientPage;
