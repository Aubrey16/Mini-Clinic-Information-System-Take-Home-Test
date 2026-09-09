import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const menuItems = [
  { label: 'Dashboard', icon: '▦', path: '/dashboard' },
  { label: 'Data Pasien', icon: '♙', path: '/patients' },
  { label: 'Pendaftaran', icon: '▤', path: '/registrations' },
  { label: 'Antrean', icon: '☷', path: '/queues' },
  { label: 'Pemeriksaan', icon: '✚', path: '/medical-records' },
];

function Sidebar() {
  const navigate = useNavigate();
  const { user, roleLabel, logout } = useAuth();

  const initials = user?.full_name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">+</div>

        <div>
          <p>NyanCare</p>
          <span>Clinic Information System</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="menu-title">MENU UTAMA</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `menu-link ${isActive ? 'menu-link-active' : ''}`
            }
          >
            <span className="menu-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{initials || '?'}</div>

        <div className="sidebar-user-info">
          <strong>{user?.full_name ?? 'Pengguna'}</strong>
          <span>{roleLabel}</span>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          title="Keluar"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
