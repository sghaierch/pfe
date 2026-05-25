import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import permissionService from '../../../services/permissionService';

const CATEGORIES = [
  'users','roles','workflows','forms','execution',
  'ai','supervision','notifications','files','audit'
];

const PermissionsList = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [filterCat,   setFilterCat]   = useState('all');
  const [deleteModal, setDeleteModal] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg);
      setTimeout(() => setMsg(''), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await permissionService.getAll();
      setPermissions(res.data?.permissions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleDelete = async () => {
    try {
      await permissionService.delete(deleteModal._id);
      showMsg('✅ Permission supprimée');
      setDeleteModal(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const filtered = filterCat === 'all'
    ? permissions
    : permissions.filter(p => p.category === filterCat);

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h1>Permissions</h1>
          <p>{permissions.length} permission(s) au total</p>
        </div>
        <Link to="/dashboard/superadmin/permissions/create" className="sa-btn-primary">
          + Nouvelle permission
        </Link>
      </div>

      {msg && <div className="sa-msg-success">{msg}</div>}

   <div className="sa-filter-bar">
  <button
    className={`sa-filter-btn ${filterCat === 'all' ? 'active' : ''}`}
    onClick={() => setFilterCat('all')}
  >
    Toutes <span className="sa-badge">{permissions.length}</span>
  </button>

  {CATEGORIES.filter(c => permissions.some(p => p.category === c)).map(c => (
    <button
      key={c}
      className={`sa-filter-btn ${filterCat === c ? 'active' : ''}`}
      onClick={() => setFilterCat(c)}
    >
      {c} <span className="sa-badge">{permissions.filter(p => p.category === c).length}</span>
    </button>
  ))}
</div>

      {loading ? <div className="sa-loading">Chargement...</div> : (
        <>
          {permissions.length === 0 ? (
            <div className="sa-empty-state">
              <div className="sa-empty-icon">🔑</div>
              <h3>Aucune permission créée</h3>
              <p>Créez votre première permission pour commencer</p>
              <Link to="/dashboard/superadmin/permissions/create" className="sa-btn-primary">
                + Créer une permission
              </Link>
            </div>
          ) : (
            <div className="sa-card">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="sa-empty">
                        Aucune permission dans cette catégorie
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p._id}>
                      <td><code className="sa-perm-code">{p.name}</code></td>
                      <td><span className="sa-cat-badge">{p.category}</span></td>
                      <td style={{ color: '#64748b' }}>{p.description || '—'}</td>
                      <td>
                        <div className="sa-actions">
                          <Link
                            to={`/dashboard/superadmin/permissions/edit/${p._id}`}
                            className="sa-btn-edit"
                          >
                            ✏️
                          </Link>
                          <button
                            className="sa-btn-delete"
                            onClick={() => setDeleteModal(p)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {deleteModal && (
        <div
          className="sa-modal-overlay"
          onClick={e => e.target === e.currentTarget && setDeleteModal(null)}
        >
          <div className="sa-modal sa-modal-sm">
            <div className="sa-modal-header">
              <h3>Supprimer la permission</h3>
              <button className="sa-modal-close" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Supprimer <strong>{deleteModal.name}</strong> ?
              Elle sera retirée de tous les rôles.
            </p>
            <div className="sa-modal-footer">
              <button className="sa-btn-secondary" onClick={() => setDeleteModal(null)}>
                Annuler
              </button>
              <button className="sa-btn-danger" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsList;