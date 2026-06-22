import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const BASE = '/dashboard/superadmin';

const TITLES = {
  [`${BASE}`]:               'Vue d\'ensemble',
  [`${BASE}/subscriptions`]: 'Abonnements',
  [`${BASE}/tenants`]:       'Entreprises',
  [`${BASE}/plans`]:         'Plans',
  [`${BASE}/plans/create`]:  'Créer un plan',
};

const BREADCRUMBS = {
  [`${BASE}/subscriptions`]: [{ label: 'Dashboard', to: BASE }, { label: 'Abonnements' }],
  [`${BASE}/tenants`]:       [{ label: 'Dashboard', to: BASE }, { label: 'Entreprises' }],
  [`${BASE}/plans`]:         [{ label: 'Dashboard', to: BASE }, { label: 'Plans' }],
  [`${BASE}/plans/create`]:  [{ label: 'Dashboard', to: BASE }, { label: 'Plans', to: `${BASE}/plans` }, { label: 'Créer' }],
};

const Header = () => {
  const { getFullName } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const isEditPlan     = path.match(`^${BASE}/plans/(.+)/edit$`);
  const isTenantDetail = path.match(`^${BASE}/tenants/(.+)$`);

  let title = TITLES[path] || 'Dashboard';
  let breadcrumbs = BREADCRUMBS[path] || [];

  if (isEditPlan) {
    title = 'Modifier le plan';
    breadcrumbs = [{ label: 'Dashboard', to: BASE }, { label: 'Plans', to: `${BASE}/plans` }, { label: 'Modifier' }];
  } else if (isTenantDetail) {
    title = 'Fiche entreprise';
    breadcrumbs = [{ label: 'Dashboard', to: BASE }, { label: 'Entreprises', to: `${BASE}/tenants` }, { label: 'Détail' }];
  }

  const initials = getFullName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header style={{
      height: '64px', minHeight: '64px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', gap: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      flexShrink: 0,
      zIndex: 50,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{title}</h2>
        {breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {i > 0 && <i className="ri-arrow-right-s-line" style={{ color: '#cbd5e1', fontSize: '13px' }}></i>}
                {b.to
                  ? <Link to={b.to} style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>{b.label}</Link>
                  : <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{b.label}</span>
                }
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Notifications */}
        <button style={{
          width: '36px', height: '36px', borderRadius: '9px',
          border: '1px solid #e2e8f0', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#64748b', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <i className="ri-notification-3-line" style={{ fontSize: '17px' }}></i>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '26px', background: '#e2e8f0' }} />

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '4px 10px 4px 4px', borderRadius: '9px', cursor: 'default',
          transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: '#fff', fontSize: '12px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{initials}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{getFullName()}</span>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.2 }}>Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;