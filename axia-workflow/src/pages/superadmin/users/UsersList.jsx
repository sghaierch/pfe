import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import userService from '../../../services/userService';

const UsersList = () => {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
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
      const res = await userService.getAll();
      setUsers(res.data?.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleDelete = async () => {
    try {
      await userService.delete(deleteModal._id);
      showMsg('✅ Utilisateur supprimé');
      setDeleteModal(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const toggleActive = async (user) => {
    try {
      await userService.update(user._id, { isActive: !user.isActive });
      showMsg(`✅ Compte ${!user.isActive ? 'activé' : 'désactivé'}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h1>Utilisateurs</h1>
          <p>{users.length} utilisateur(s) au total</p>
        </div>
        <Link to="/dashboard/superadmin/users/create" className="sa-btn-primary">
          + Nouvel utilisateur
        </Link>
      </div>

      {msg && <div className="sa-msg-success">{msg}</div>}

      {loading ? <div className="sa-loading">Chargement...</div> : (
        <>
          {users.length === 0 ? (
            <div className="sa-empty-state">
              <div className="sa-empty-icon">👥</div>
              <h3>Aucun utilisateur</h3>
              <p>Créez votre premier utilisateur pour commencer</p>
              <Link to="/dashboard/superadmin/users/create" className="sa-btn-primary">
                + Créer un utilisateur
              </Link>
            </div>
          ) : (
            <div className="sa-card">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Département</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="sa-user-cell">
                          <div className="sa-avatar">
                            {u.firstName?.charAt(0)?.toUpperCase()}
                          </div>
                          <span>{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`sa-role-badge sa-role-${u.role?.name}`}>
                          {u.role?.name || '—'}
                        </span>
                      </td>
                      <td>{u.department || '—'}</td>
                      <td>
                        <button
                          className={`sa-status-badge ${u.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleActive(u)}
                          title="Cliquer pour changer"
                        >
                          {u.isActive ? '✓ Actif' : '✗ Inactif'}
                        </button>
                      </td>
                      <td>
                        <div className="sa-actions">
                          <Link
                            to={`/dashboard/superadmin/users/edit/${u._id}`}
                            className="sa-btn-edit"
                          >
                            ✏️
                          </Link>
                          <button
                            className="sa-btn-delete"
                            onClick={() => setDeleteModal(u)}
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
              <h3>Supprimer l'utilisateur</h3>
              <button className="sa-modal-close" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Supprimer <strong>{deleteModal.firstName} {deleteModal.lastName}</strong> ?
              Action irréversible.
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

export default UsersList;