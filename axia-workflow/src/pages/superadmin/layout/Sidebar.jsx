import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const MENU = [
  { path: '/dashboard/superadmin',              icon: 'ri-dashboard-3-line',   label: 'Tableau de bord', end: true },
  { path: '/dashboard/superadmin/tenants',       icon: 'ri-building-2-line',    label: 'Entreprises'  },
  { path: '/dashboard/superadmin/subscriptions', icon: 'ri-file-list-3-line',   label: 'Abonnements'  },
  { path: '/dashboard/superadmin/plans',         icon: 'ri-price-tag-3-line',   label: 'Plans'        },
];

const Sidebar = () => {
  const { logout, getFullName } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = getFullName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const W = collapsed ? '64px' : '224px';

  return (
    <aside style={{
      width: W, minWidth: W, background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      transition: 'width .25s cubic-bezier(.4,0,.2,1), min-width .25s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden', borderRight: '1px solid rgba(255,255,255,0.05)',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '20px 12px' : '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: '64px', flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i className="ri-flow-chart" style={{ color: '#fff', fontSize: '14px' }}></i>
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>Axia</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.3px' }}>Workflow</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="ri-flow-chart" style={{ color: '#fff', fontSize: '15px' }}></i>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s', flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <i className="ri-arrow-left-s-line" style={{ fontSize: '16px' }}></i>
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{
            position: 'absolute', left: '52px', top: '20px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#2563eb', border: '2px solid #0f172a',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}>
            <i className="ri-arrow-right-s-line" style={{ fontSize: '12px' }}></i>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {!collapsed && (
          <span style={{
            display: 'block', fontSize: '9.5px', fontWeight: 700,
            color: 'rgba(148,163,184,0.45)', textTransform: 'uppercase',
            letterSpacing: '0.9px', padding: '0 8px', marginBottom: '6px',
          }}>Navigation</span>
        )}
        {MENU.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            title={collapsed ? item.label : ''}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : '10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px' : '9px 10px',
              borderRadius: '8px',
              color: isActive ? '#ffffff' : '#94a3b8',
              background: isActive ? 'rgba(37,99,235,0.2)' : 'transparent',
              textDecoration: 'none', fontSize: '13px', fontWeight: isActive ? 600 : 500,
              transition: 'all .15s', whiteSpace: 'nowrap', overflow: 'hidden',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.classList.contains('active'))
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background?.includes('37,99,235'))
                e.currentTarget.style.background = 'transparent';
            }}
          >
            {({ isActive }) => (
              <>
                <i className={item.icon} style={{
                  fontSize: '17px', flexShrink: 0,
                  color: isActive ? '#60a5fa' : '#94a3b8',
                }}></i>
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '10px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: '5px',
      }}>
        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '8px' : '8px 10px',
          borderRadius: '8px', overflow: 'hidden',
        }}>
          <div style={{
            width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: '#fff', fontSize: '12px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{initials}</div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getFullName()}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.65)' }}>Super Admin</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Déconnexion' : ''}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : '8px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '8px' : '8px 10px',
            borderRadius: '8px', background: 'transparent', border: 'none',
            color: '#94a3b8', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            transition: 'all .15s', width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <i className="ri-logout-box-r-line" style={{ fontSize: '16px', flexShrink: 0 }}></i>
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;