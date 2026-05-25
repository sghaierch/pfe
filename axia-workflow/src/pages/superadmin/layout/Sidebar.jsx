import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const MENU = [
  { path: '/dashboard/superadmin',               icon: '📊', label: 'Dashboard',     end: true },
  { path: '/dashboard/superadmin/users',         icon: '👥', label: 'Utilisateurs' },
  { path: '/dashboard/superadmin/roles',         icon: '🛡️', label: 'Rôles' },
  { path: '/dashboard/superadmin/permissions',   icon: '🔑', label: 'Permissions' },
  { path: '/dashboard/superadmin/plans',         icon: '💎', label: 'Plans' },
  { path: '/dashboard/superadmin/subscriptions', icon: '📋', label: 'Abonnements' },
  {path: "/dashboard/superadmin/tenants",icon: "🏢",label: "Entreprises",},
];

const Sidebar = () => {
  const { logout, getFullName } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sa-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sa-sidebar-top">
        <div className="sa-logo">
          {!collapsed && (
            <span className="sa-logo-text">
              <span style={{ color: '#f1f5f9' }}>Axia</span>
              <span style={{ color: '#818cf8' }}>Workflow</span>
            </span>
          )}
          <button className="sa-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="sa-nav">
          {MENU.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="sa-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sa-nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sa-sidebar-bottom">
        <div className="sa-user-info">
          <div className="sa-user-avatar">
            {getFullName().charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="sa-user-details">
              <span className="sa-user-name">{getFullName()}</span>
              <span className="sa-user-role">Super Admin</span>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="sa-logout-btn">
          {collapsed ? '🚪' : '🚪 Déconnexion'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;