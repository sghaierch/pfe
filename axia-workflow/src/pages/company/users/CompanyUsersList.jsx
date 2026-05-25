import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import userService from '../../../services/userService';

const ROLE_COLORS = {
  company_admin: { bg: '#ede9fe', color: '#6d28d9' },
  manager:       { bg: '#dbeafe', color: '#1d4ed8' },
  employee:      { bg: '#dcfce7', color: '#166534' },
};

const DeleteModal = ({ user, onConfirm, onCancel, loading }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }}>
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '32px',
      maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '24px'
        }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Supprimer l'utilisateur
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Voulez-vous vraiment supprimer <strong>{user.firstName + ' ' + user.lastName}</strong> ? Cette action est irréversible.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0',
          background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px', color: '#374151'
        }}>Annuler</button>
        <button onClick={onConfirm} disabled={loading} style={{
          flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
          background: '#dc2626', color: '#fff', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.7 : 1
        }}>{loading ? 'Suppression...' : 'Supprimer'}</button>
      </div>
    </div>
  </div>
);

const CompanyUsersList = () => {
  const { user }      = useAuth();
  const location      = useLocation();
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState(location.state?.success ? 'SUCCESS ' + location.state.success : '');
  const [deleting,    setDeleting]    = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(t); }
  }, [msg]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data?.users || []);
    } catch (err) {
      setMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await userService.delete(deleteModal._id);
      setMsg('SUCCESS Utilisateur supprimé avec succès');
      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      setMsg('ERREUR ' + (err.response?.data?.message || err.message));
      setDeleteModal(null);
    } finally { setDeleting(false); }
  };

  const msgBg    = msg.startsWith('SUCCESS') ? '#dcfce7' : '#fee2e2';
  const msgColor = msg.startsWith('SUCCESS') ? '#166534' : '#991b1b';
  const msgText  = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
  );

  return (
    // ✅ FIX PRINCIPAL : width 100%, overflow hidden sur le conteneur
    <div style={{ padding: '32px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {deleteModal && (
        <DeleteModal
          user={deleteModal}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModal(null)}
          loading={deleting}
        />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px', color: '#0f172a' }}>
            Utilisateurs
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>
            {users.length} utilisateur(s) · Limite : {user?.tenant?.plan?.maxUsers || 25}
          </p>
        </div>
        <Link
          to="/dashboard/company/users/create"
          style={{
            background: '#4f46e5', color: '#fff', padding: '11px 22px',
            borderRadius: '10px', textDecoration: 'none', fontWeight: 700,
            fontSize: '14px', whiteSpace: 'nowrap'
          }}
        >
          + Nouvel utilisateur
        </Link>
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          fontWeight: 600, background: msgBg, color: msgColor
        }}>
          {msgText}
        </div>
      )}

      {/* ✅ FIX : wrapper avec overflow-x auto pour le scroll horizontal si besoin */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflowX: 'auto',   // ✅ scroll horizontal sur petits écrans
        width: '100%',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',  // ✅ colonnes à largeur fixe = pas de débordement
        }}>
          <colgroup>
            {/* ✅ Largeurs explicites pour chaque colonne */}
            <col style={{ width: '18%' }} /> {/* Nom */}
            <col style={{ width: '20%' }} /> {/* Email */}
            <col style={{ width: '12%' }} /> {/* Rôle */}
            <col style={{ width: '13%' }} /> {/* Poste */}
            <col style={{ width: '13%' }} /> {/* Département */}
            <col style={{ width: '10%' }} /> {/* Téléphone */}
            <col style={{ width: '8%'  }} /> {/* Statut */}
            <col style={{ width: '11%'  }} /> {/* Actions */}
          </colgroup>

          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Nom', 'Email', 'Rôle', 'Poste', 'Département', 'Téléphone', 'Statut', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '14px 12px', textAlign: 'left',
                  fontWeight: 700, color: '#374151', fontSize: '12px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  Aucun utilisateur — cliquez "+ Nouvel utilisateur"
                </td>
              </tr>
            ) : users.map(u => {
              const roleName  = u.role?.name || 'employee';
              const roleStyle = ROLE_COLORS[roleName] || ROLE_COLORS.employee;
              const isSelf    = u._id === user?._id;

              return (
                <tr
                  key={u._id}
                  style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  {/* Nom */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: '#e0e7ff', color: '#4f46e5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '13px', flexShrink: 0
                      }}>
                        {u.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{
                          margin: 0, fontWeight: 600, color: '#0f172a',
                          fontSize: '13px', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {u.firstName + ' ' + u.lastName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{
                    padding: '12px', color: '#64748b', fontSize: '12px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {u.email}
                  </td>

                  {/* Rôle */}
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: roleStyle.bg, color: roleStyle.color,
                      padding: '3px 8px', borderRadius: '12px',
                      fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap'
                    }}>
                      {roleName}
                    </span>
                  </td>

                  {/* Poste */}
                  <td style={{
                    padding: '12px', color: '#64748b', fontSize: '12px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {u.jobTitle || '—'}
                  </td>

                  {/* Département */}
                  <td style={{
                    padding: '12px', color: '#64748b', fontSize: '12px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {u.department?.name || '—'}
                  </td>

                  {/* Téléphone */}
                  <td style={{
                    padding: '12px', color: '#64748b', fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}>
                    {u.phoneNumber || '—'}
                  </td>

                  {/* Statut */}
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: u.isActive ? '#dcfce7' : '#fee2e2',
                      color: u.isActive ? '#166534' : '#991b1b',
                      padding: '3px 8px', borderRadius: '12px',
                      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap'
                    }}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>

                  {/* ✅ Actions — toujours visibles */}
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Link
                        to={'/dashboard/company/users/edit/' + u._id}
                        title="Modifier"
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: '#eff6ff', color: '#4f46e5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          textDecoration: 'none', fontSize: '14px',
                          border: '1px solid #bfdbfe', flexShrink: 0,
                        }}
                      >✏️</Link>

                      {!isSelf && (
                        <button
                          onClick={() => setDeleteModal(u)}
                          title="Supprimer"
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#fff5f5', color: '#dc2626',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #fecaca', cursor: 'pointer',
                            fontSize: '14px', flexShrink: 0,
                          }}
                        >🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyUsersList;