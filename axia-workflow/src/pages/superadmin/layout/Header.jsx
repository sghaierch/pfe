import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const TITLES = {
  '/dashboard/superadmin':                    'Vue d\'ensemble',
  '/dashboard/superadmin/users':              'Utilisateurs',
  '/dashboard/superadmin/users/create':       'Créer un utilisateur',
  '/dashboard/superadmin/roles':              'Rôles',
  '/dashboard/superadmin/roles/create':       'Créer un rôle',
  '/dashboard/superadmin/permissions':        'Permissions',
  '/dashboard/superadmin/permissions/create': 'Créer une permission',
  '/dashboard/superadmin/subscriptions':      'Abonnements',
};

const BREADCRUMBS = {
  '/dashboard/superadmin/users':        [{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Utilisateurs' }],
  '/dashboard/superadmin/users/create': [{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Utilisateurs', to: '/dashboard/superadmin/users' }, { label: 'Créer' }],
  '/dashboard/superadmin/roles':        [{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Rôles' }],
  '/dashboard/superadmin/roles/create': [{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Rôles', to: '/dashboard/superadmin/roles' }, { label: 'Créer' }],
  '/dashboard/superadmin/permissions':  [{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Permissions' }],
  '/dashboard/superadmin/permissions/create': [{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Permissions', to: '/dashboard/superadmin/permissions' }, { label: 'Créer' }],
  '/dashboard/superadmin/subscriptions':[{ label: 'Dashboard', to: '/dashboard/superadmin' }, { label: 'Abonnements' }],
};

const Header = () => {
  const { getFullName } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const isEditPath = path.includes('/edit/');
  const basePath = isEditPath ? path.replace(/\/edit\/.*/, '') : path;
  const title = TITLES[path] || (isEditPath ? 'Modifier' : 'Dashboard');
  const breadcrumbs = BREADCRUMBS[path] || BREADCRUMBS[basePath] || [];

  return (
    <header className="sa-header">
      <div className="sa-header-left">
        <h2 className="sa-header-title">{title}</h2>
        {breadcrumbs.length > 0 && (
          <nav className="sa-breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="sa-breadcrumb-sep">/</span>}
                {b.to
                  ? <Link to={b.to} className="sa-breadcrumb-link">{b.label}</Link>
                  : <span className="sa-breadcrumb-current">{b.label}</span>
                }
              </span>
            ))}
          </nav>
        )}
      </div>
      <div className="sa-header-right">
        <div className="sa-header-user">
          <div className="sa-header-avatar">{getFullName().charAt(0).toUpperCase()}</div>
          <div>
            <div className="sa-header-name">{getFullName()}</div>
            <div className="sa-header-role">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;