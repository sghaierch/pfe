import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import roleService from '../../../services/roleService';


const RolesList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const location = useLocation();
  const [search, setSearch] = useState('');

  /* ===============================
     Message après redirection
  =============================== */
  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg);
      setTimeout(() => setMsg(''), 3000);
    }
  }, [location.state]);

  /* ===============================
     Chargement initial
  =============================== */
useEffect(() => {
  const delay = setTimeout(() => {
    fetchData(search);
  }, 400); // debounce 400ms

  return () => clearTimeout(delay);
}, [search]);
  const fetchData = async (searchValue = '') => {
  setLoading(true);
  try {
    const res = await roleService.getAll(searchValue);
    setRoles(res.data?.roles || []);
  } catch (err) {
    console.error(err);
    showMsg('❌ Erreur chargement des rôles');
  } finally {
    setLoading(false);
  }
};

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  /* ===============================
     Suppression
  =============================== */
  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      await roleService.delete(deleteModal._id);
      showMsg('✅ Rôle supprimé avec succès');
      setDeleteModal(null);
      fetchData(search);
    } catch (err) {
      console.error(err);
      showMsg('❌ Impossible de supprimer le rôle');
    }
  };
  return (
    <div className="sa-page">
      {/* ================= HEADER ================= */}
   <div className="sa-page-header">
   <div className="sa-header-left">
    <div>
      <h1>Rôles</h1>
      <p>{roles.length} rôle(s) au total</p>
   </div>
    <div className="sa-search-box">
      <input
        type="text"
        placeholder="🔎 Rechercher un rôle..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>
  <Link
    to="/dashboard/superadmin/roles/create"
    className="sa-btn-primary">
    + Nouveau rôle
  </Link>
</div>
      {/* ================= MESSAGE ================= */}
      {msg && <div className="sa-msg-success">{msg}</div>}

      {/* ================= CONTENT ================= */}
      {loading ? (
        <div className="sa-loading">Chargement...</div>
      ) : roles.length === 0 ? (
        <div className="sa-empty-state">
          <div className="sa-empty-icon">🛡️</div>
          <h3>Aucun rôle créé</h3>
          <p>Créez votre premier rôle pour commencer</p>
          <Link
            to="/dashboard/superadmin/roles/create"
            className="sa-btn-primary"
          >
            + Créer un rôle
          </Link>
        </div>
      ) : (
        <div className="sa-card">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {roles.map(role => (
                <tr key={role._id}>
                  
                  {/* Nom */}
                  <td>
                    <strong>{role.name}</strong>
                  </td>

                  {/* Description */}
                  <td>
                    {role.description || '—'}
                  </td>

                  {/* Permissions */}
                  <td>
                    <div className="sa-permissions-cell">
                      {role.permissions?.length > 0 ? (
                        role.permissions.map(p => (
                          <span key={p._id} className="sa-perm-tag">
                            {p.name}
                          </span>
                        ))
                      ) : (
                        <span className="sa-no-perm">Aucune</span>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    {role.isSystemRole ? (
                      <span className="sa-system-badge">
                        🔒 Système
                      </span>
                    ) : (
                      <span className="sa-custom-badge">
                        ✨ Custom
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="sa-actions">
                      
                      <Link
                        to={`/dashboard/superadmin/roles/edit/${role._id}`}
                        className="sa-btn-edit"
                      >
                        ✏️
                      </Link>

                      {!role.isSystemRole && (
                        <button
                          className="sa-btn-delete"
                          onClick={() => setDeleteModal(role)}
                        >
                          🗑️
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL ================= */}
      {deleteModal && (
        <div
          className="sa-modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setDeleteModal(null)
          }
        >
          <div className="sa-modal sa-modal-sm">
            
            <div className="sa-modal-header">
              <h3>Supprimer le rôle</h3>
              <button
                className="sa-modal-close"
                onClick={() => setDeleteModal(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Supprimer <strong>{deleteModal.name}</strong> ?
              <br />
              Cette action est irréversible.
            </p>

            <div className="sa-modal-footer">
              <button
                className="sa-btn-secondary"
                onClick={() => setDeleteModal(null)}
              >
                Annuler
              </button>

              <button
                className="sa-btn-danger"
                onClick={handleDelete}
              >
                Supprimer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RolesList;