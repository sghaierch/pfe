import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import NotificationBell from '../../../components/NotificationBell';

// ── Design tokens (cohérents avec CompanyDashboard) ─────────────────────────
const C = {
  primary: '#2563eb', primaryDark: '#1d4ed8', primaryTint: '#eff6ff', primarySoft: '#dbeafe',
  ink: '#0f172a', body: '#475569', muted: '#94a3b8',
  border: '#e5e7eb', borderSoft: '#eef1f5', bg: '#f7f8fa', surface: '#ffffff',
  danger: '#dc2626', dangerTint: '#fef2f2',
  sidebar: '#0b1220', sidebarSoft: '#131b2e', sidebarBorder: 'rgba(255,255,255,0.06)',
  sidebarText: '#cbd5e1', sidebarMuted: '#64748b',
};

// ── Icon badge réutilisable : halo en dégradé + icône en gradient + glow ──
const IconBadge = ({ icon, color, size = 42, iconSize = 20, dark = false }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: dark
        ? `linear-gradient(135deg, ${color}40, ${color}12)`
        : `linear-gradient(135deg, ${color}29, ${color}0d)`,
      border: `1px solid ${color}${dark ? '4a' : '38'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: dark
        ? `0 4px 10px ${color}30`
        : `0 4px 10px ${color}26, inset 0 1px 1px rgba(255,255,255,0.7)`,
    }}
  >
    <i
      className={icon}
      style={{
        fontSize: iconSize,
        backgroundImage: `linear-gradient(135deg, ${color}, ${color}aa)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        filter: `drop-shadow(0 1px 2px ${color}40)`,
      }}
    />
  </div>
);

const NAV_GROUPS = [
  {
    label: 'Aperçu',
    items: [
      { to: '/dashboard/company', label: 'Dashboard', icon: 'ri-dashboard-3', exact: true, color: '#60a5fa' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/dashboard/company/users',          label: 'Utilisateurs',        icon: 'ri-team',          color: '#22d3ee' },
      { to: '/dashboard/company/projects',        label: 'Projets',             icon: 'ri-folder-3',      color: '#fbbf24' },
      { to: '/dashboard/company/templates',       label: 'Templates',           icon: 'ri-file-list-3',   color: '#a78bfa' },
      { to: '/dashboard/company/document-types',  label: 'Types de documents',  icon: 'ri-file-copy-2',   color: '#f472b6' },
      { to: '/dashboard/company/ai-assistant',    label: 'Assistant IA',        icon: 'ri-sparkling-2',   color: '#34d399' },
      { to: '/dashboard/company/departments',     label: 'Départements',        icon: 'ri-building-2',    color: '#fb923c' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/dashboard/company/audit',                     label: "Journal d'audit", icon: 'ri-shield-check',     color: '#4ade80' },
      { to: '/dashboard/company/settings/posts',             label: 'Postes',          icon: 'ri-briefcase-4',      color: '#818cf8' },
      { to: '/dashboard/company/settings/notifications',     label: 'Notifications',   icon: 'ri-notification-3',   color: '#f87171' },
      { to: '/dashboard/company/profile',                    label: 'Profil',          icon: 'ri-user-settings',    color: '#94a3b8' },
    ],
  },
];

const isLinkActive = (pathname, item) =>
  item.exact ? pathname === item.to : pathname.includes(item.to.split('/').pop());

const CompanyLayout = () => {
  const { user, logout, getFullName, subscriptionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const isProfilePage = location.pathname.includes('/profile');

  // ── Blocage si mot de passe temporaire non changé ──────────────────────
  if (user?.mustChangePassword && !isProfilePage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ background: C.surface, borderRadius: '18px', padding: '48px 40px', maxWidth: '440px', width: '90%', border: `1px solid ${C.borderSoft}`, textAlign: 'center', boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }}>
          <div style={{ display: 'inline-flex', marginBottom: '22px' }}>
            <IconBadge icon="ri-lock-2-line" color={C.primary} size={64} iconSize={28} />
          </div>
          <h2 style={{ color: C.ink, fontSize: '19px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
            Changement de mot de passe requis
          </h2>
          <p style={{ color: C.muted, fontSize: '14px', lineHeight: 1.7, margin: '0 0 28px' }}>
            Vous utilisez un mot de passe temporaire. Pour des raisons de sécurité, vous devez le changer avant de continuer.
          </p>
          <button
            onClick={() => navigate('/dashboard/company/profile')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color: '#fff', border: 'none', borderRadius: '11px', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer' }}
          >
            Changer mon mot de passe <i className="ri-arrow-right-line" />
          </button>
          <button
            onClick={handleLogout}
            style={{ marginTop: '12px', width: '100%', padding: '11px', background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: '11px', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer' }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // ── Layout normal ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: '260px', flexShrink: 0, background: C.sidebar, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>

        {/* Brand */}
        <div style={{ padding: '24px 22px 20px', borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: '17px', fontWeight: 800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.tenant?.companyName}
          </h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(37,99,235,0.18)', color: '#93c5fd', fontSize: '11px', fontWeight: 700 }}>
            <i className="ri-vip-crown-2-fill" style={{ fontSize: '12px', filter: 'drop-shadow(0 1px 1px rgba(37,99,235,0.5))' }} />
            {user?.tenant?.plan?.name}
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 6px', padding: '0 10px', fontSize: '10.5px', fontWeight: 700, color: C.sidebarMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {group.label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const active = isLinkActive(location.pathname, item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      style={{
                        position: 'relative', display: 'flex', alignItems: 'center', gap: '11px',
                        padding: '7px 12px 7px 14px', borderRadius: '9px', textDecoration: 'none',
                        fontSize: '13.5px', fontWeight: active ? 700 : 500,
                        color: active ? '#fff' : C.sidebarText,
                        background: active ? `${item.color}22` : 'transparent',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {active && <span style={{ position: 'absolute', left: 0, top: '6px', bottom: '6px', width: '3px', borderRadius: '3px', background: item.color }} />}
                      <span style={{ opacity: active ? 1 : 0.62, transition: 'opacity 0.15s' }}>
                        <IconBadge icon={`${item.icon}-${active ? 'fill' : 'line'}`} color={item.color} size={30} iconSize={15} dark />
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '14px', borderTop: `1px solid ${C.sidebarBorder}` }}>
          <Link to="/dashboard/company/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '12.5px', flexShrink: 0, boxShadow: `0 3px 8px ${C.primary}55` }}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getFullName()}</div>
              <div style={{ color: C.sidebarMuted, fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.role?.name}</div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            style={{ width: '100%', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderRadius: '9px', border: 'none', background: 'transparent', color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220,38,38,0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <i className="ri-logout-box-r-line" style={{ fontSize: '15px' }} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Zone droite : header + main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <header style={{ position: 'sticky', top: 0, zIndex: 10, background: C.surface, borderBottom: `1px solid ${C.borderSoft}` }}>
          {subscriptionExpired && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: C.danger, color: '#fff', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}>
              <i className="ri-error-warning-fill" />
              Votre abonnement a expiré. Veuillez contacter l'administrateur pour le renouveler.
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', padding: '14px 28px' }}>
            <style>{`@keyframes bellPulse { 0% { box-shadow: 0 0 0 0 ${C.primary}40; } 70% { box-shadow: 0 0 0 7px ${C.primary}00; } 100% { box-shadow: 0 0 0 0 ${C.primary}00; } }`}</style>
            <div style={{
              width: '42px', height: '42px', borderRadius: '13px', position: 'relative',
              background: '#ffffff',
              border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '19px', color: '#fde047',
              boxShadow: `0 4px 14px rgba(15,23,42,0.08)`,
              animation: 'bellPulse 2.4s ease-out infinite',
              transition: 'transform 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px) scale(1.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
            >
              <NotificationBell />
            </div>
            <div style={{ width: '1px', height: '22px', background: C.border }} />
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: C.ink }}>{getFullName()}</span>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;