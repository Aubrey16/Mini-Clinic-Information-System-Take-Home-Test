import { NavLink } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', icon: '▦', path: '/dashboard' },
  { label: 'Data Pasien', icon: '♙', path: '/patients' },
  { label: 'Pendaftaran', icon: '▤', path: '/registrations' },
  { label: 'Antrean', icon: '☷', path: '/queues' },
  { label: 'Pemeriksaan', icon: '✚', path: '/medical-records' },
];

function Sidebar() {
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
        <div className="avatar">A</div>

        <div>
          <strong>Administrator</strong>
          <span>Admin Klinik</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;