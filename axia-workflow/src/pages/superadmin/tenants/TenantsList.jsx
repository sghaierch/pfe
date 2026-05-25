import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tenantService from '../../../services/tenantService';
import '../../../styles/SuperAdmin.css';

const StatusBadge = ({ status }) => {
  const map = {
    active:    { bg: '#dcfce7', color: '#166534', label: 'Actif' },
    suspended: { bg: '#fee2e2', color: '#991b1b', label: 'Suspendu' },
    inactive:  { bg: '#f1f5f9', color: '#64748b', label: 'Inactif' },
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'En attente' },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Refusé' },
    cancelled: { bg: '#f1f5f9', color: '#64748b', label: 'Annulé' },
    expired:   { bg: '#f1f5f9', color: '#64748b', label: 'Expiré' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600
    }}>
      {s.label}
    </span>
  );
};

const TenantsList = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: 'success' });
  const [detailModal, setDetailModal] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { tenant, type: 'suspend'|'reactivate'|'delete' }

 
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenantService.getAllTenants();
      console.log('✅ Tenants récupérés:', res);
      
      if (Array.isArray(res.data)) {
        setTenants(res.data);
      } else {
        setTenants([]);
      }
    } catch (err) {
      console.error('❌ Erreur fetchData:', err);
      showMsg('❌ Erreur de chargement', 'error');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);
 useEffect(() => {fetchData();}, [fetchData]);
  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  };

  const handleApprove = async () => {
    if (!actionModal) return;
    try {
      await tenantService.approveTenant(actionModal.tenant._id);
      showMsg('✅ Entreprise approuvée et base créée', 'success');
      setActionModal(null);
      fetchData();
    } catch (err) {
      showMsg('❌ ' + (err.message || 'Erreur approbation'), 'error');
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    try {
      await tenantService.rejectTenant(actionModal.tenant._id);
      showMsg('✅ Entreprise refusée', 'success');
      setActionModal(null);
      fetchData();
    } catch (err) {
      showMsg('❌ ' + (err.message || 'Erreur refus'), 'error');
    }
  };

  const handleSuspend = async () => {
    if (!actionModal) return;
    try {
      await tenantService.suspendTenant(actionModal.tenant._id);
      showMsg('✅ Entreprise suspendue', 'success');
      setActionModal(null);
      fetchData();
    } catch (err) {
      showMsg('❌ ' + (err.message || 'Erreur suspension'), 'error');
    }
  };

  const handleReactivate = async () => {
    if (!actionModal) return;
    try {
      await tenantService.reactivateTenant(actionModal.tenant._id);
      showMsg('✅ Entreprise réactivée', 'success');
      setActionModal(null);
      fetchData();
    } catch (err) {
      showMsg('❌ ' + (err.message || 'Erreur réactivation'), 'error');
    }
  };

  const handleDelete = async () => {
    if (!actionModal) return;
    try {
      await tenantService.deleteTenant(actionModal.tenant._id);
      showMsg('🗑️ Entreprise supprimée', 'success');
      setActionModal(null);
      fetchData();
    } catch (err) {
      showMsg('❌ Impossible de supprimer', 'error');
    }
  };

  const FILTERS = [
    { key: 'all',       label: 'Tous',        count: tenants.length },
    { key: 'pending',   label: 'En attente',  count: tenants.filter(t => t.status === 'pending').length },
    { key: 'active',    label: 'Actifs',      count: tenants.filter(t => t.status === 'active').length },
    { key: 'suspended', label: 'Suspendus',   count: tenants.filter(t => t.status === 'suspended').length },
  ];

  const filtered = filter === 'all' ? tenants : tenants.filter(t => t.status === filter);

  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h1>🏢 Entreprises</h1>
          <p>{tenants.length} entreprise(s) enregistrée(s)</p>
        </div>
      </div>

      {/* MESSAGE */}
      {msg.text && (
        <div className="sa-message" style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          fontWeight: 600
        }}>
          {msg.text}
        </div>
      )}

      {/* FILTRES */}
      <div className="sa-filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`sa-filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} <span className="sa-filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      {/* TABLEAU */}
      {loading ? (
        <div className="sa-loading">⏳ Chargement...</div>
      ) : (
        <div className="sa-card">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Email Admin</th>
                <th>Plan</th>
                <th>Base de données</th>
                <th>Limites</th>
                <th>Date création</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    📭 Aucun résultat
                  </td>
                </tr>
              ) : (
                filtered.map(tenant => (
                  <tr key={tenant._id}>
                    <td>
                      <div>
                        <strong>{tenant.companyName}</strong>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {tenant.slug}
                        </div>
                      </div>
                    </td>
                    <td>{tenant.adminEmail}</td>
                    <td>
                      <span className="sa-plan-tag">
                        {tenant.plan?.name || '—'}
                      </span>
                    </td>
                    <td>
                      <code style={{ 
                        background: '#f3f4f6', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {tenant.dbName}
                      </code>
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      👤 {tenant.limits?.maxUsers || '—'} users<br/>
                      🔄 {tenant.limits?.maxWorkflows || '—'} workflows
                    </td>
                    <td>
                      {tenant.createdAt
                        ? new Date(tenant.createdAt).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td><StatusBadge status={tenant.status} /></td>
                    <td>
                      <div className="sa-actions">
                        <button
                          className="sa-btn-icon"
                          onClick={() => setDetailModal(tenant)}
                          title="Voir les détails"
                        >
                          👁️
                        </button>

                       {tenant.status === 'pending' && (
  <span
    onClick={() => navigate('/dashboard/superadmin/subscriptions')}
    style={{
      fontSize: '11px',
      color: '#4f46e5',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontWeight: 600,
    }}
    title="Gérer depuis les abonnements"
  >
    → Voir abonnement
  </span>
)}
                        
                        {tenant.status === 'active' ? (
                          <button
                            className="sa-btn-icon"
                            onClick={() => setActionModal({ tenant, type: 'suspend' })}
                            title="Suspendre"
                            style={{ color: '#dc2626' }}
                          >
                            ⏸️
                          </button>
                        ) : tenant.status !== 'pending' && (
                          <button
                            className="sa-btn-icon"
                            onClick={() => setActionModal({ tenant, type: 'reactivate' })}
                            title="Réactiver"
                            style={{ color: '#16a34a' }}
                          >
                            ▶️
                          </button>
                        )}
                        
                        <button
                          className="sa-btn-icon sa-btn-delete"
                          onClick={() => setActionModal({ tenant, type: 'delete' })}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL DÉTAILS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {detailModal && (
        <div className="sa-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>🏢 Détails de l'entreprise</h2>
              <button className="sa-modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>

            <div className="sa-modal-body">
              <div className="sa-info-grid">
                <div className="sa-info-item">
                  <label>Nom de l'entreprise</label>
                  <p>{detailModal.companyName}</p>
                </div>
                <div className="sa-info-item">
                  <label>Slug</label>
                  <p><code>{detailModal.slug}</code></p>
                </div>
                <div className="sa-info-item">
                  <label>Email Admin</label>
                  <p>{detailModal.adminEmail}</p>
                </div>
                <div className="sa-info-item">
                  <label>Téléphone</label>
                  <p>{detailModal.contactPhone || '—'}</p>
                </div>
                <div className="sa-info-item">
                  <label>Base de données</label>
                  <p><code>{detailModal.dbName}</code></p>
                </div>
                <div className="sa-info-item">
                  <label>Plan</label>
                  <p><strong>{detailModal.plan?.name || '—'}</strong></p>
                </div>
                <div className="sa-info-item">
                  <label>Max Utilisateurs</label>
                  <p>{detailModal.limits?.maxUsers || '—'}</p>
                </div>
                <div className="sa-info-item">
                  <label>Max Workflows</label>
                  <p>{detailModal.limits?.maxWorkflows || '—'}</p>
                </div>
                <div className="sa-info-item">
                  <label>Stockage (GB)</label>
                  <p>{detailModal.limits?.maxStorage || '—'}</p>
                </div>
                <div className="sa-info-item">
                  <label>Date de création</label>
                  <p>
                    {detailModal.createdAt
                      ? new Date(detailModal.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '—'}
                  </p>
                </div>
                <div className="sa-info-item">
                  <label>Statut</label>
                  <p><StatusBadge status={detailModal.status} /></p>
                </div>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button className="sa-btn sa-btn-secondary" onClick={() => setDetailModal(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL ACTIONS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {actionModal && (
        <div className="sa-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="sa-modal sa-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>
                {actionModal.type === 'approve'    && '✅ Approuver l\'entreprise'}
                {actionModal.type === 'reject'     && '❌ Refuser l\'entreprise'}
                {actionModal.type === 'suspend'    && '⏸️ Suspendre l\'entreprise'}
                {actionModal.type === 'reactivate' && '▶️ Réactiver l\'entreprise'}
                {actionModal.type === 'delete'     && '🗑️ Supprimer l\'entreprise'}
              </h2>
              <button className="sa-modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>

            <div className="sa-modal-body">
              <p>
                {actionModal.type === 'approve' && (
                  <>
                    Approuver <strong>{actionModal.tenant.companyName}</strong> ?<br/><br/>
                    ✅ Le tenant sera activé et sa base de données MongoDB sera initialisée automatiquement.
                  </>
                )}
                {actionModal.type === 'reject' && (
                  <>
                    Refuser <strong>{actionModal.tenant.companyName}</strong> ?<br/><br/>
                    ❌ Le tenant sera marqué comme refusé et ne pourra pas se connecter.
                  </>
                )}
                {actionModal.type === 'suspend' && (
                  <>
                    Êtes-vous sûr de vouloir suspendre <strong>{actionModal.tenant.companyName}</strong> ?
                    <br/><br/>
                    ⚠️ L'entreprise ne pourra plus se connecter tant qu'elle sera suspendue.
                  </>
                )}
                {actionModal.type === 'reactivate' && (
                  <>
                    Réactiver <strong>{actionModal.tenant.companyName}</strong> ?<br/><br/>
                    ✅ L'entreprise pourra à nouveau se connecter.
                  </>
                )}
                {actionModal.type === 'delete' && (
                  <>
                    Êtes-vous sûr de vouloir supprimer <strong>{actionModal.tenant.companyName}</strong> ?
                    <br/><br/>
                    ⚠️ <span style={{ color: '#dc2626' }}>
                      Cette action supprime l'enregistrement mais PAS la base de données MongoDB.
                      La DB <code>{actionModal.tenant.dbName}</code> restera accessible.
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="sa-modal-footer">
              <button className="sa-btn sa-btn-secondary" onClick={() => setActionModal(null)}>
                Annuler
              </button>

              {actionModal.type === 'approve' && (
                <button className="sa-btn sa-btn-success" onClick={handleApprove}>
                  Approuver
                </button>
              )}
              {actionModal.type === 'reject' && (
                <button className="sa-btn sa-btn-danger" onClick={handleReject}>
                  Refuser
                </button>
              )}
              {actionModal.type === 'suspend' && (
                <button className="sa-btn sa-btn-danger" onClick={handleSuspend}>
                  Suspendre
                </button>
              )}
              {actionModal.type === 'reactivate' && (
                <button className="sa-btn sa-btn-success" onClick={handleReactivate}>
                  Réactiver
                </button>
              )}
              {actionModal.type === 'delete' && (
                <button className="sa-btn sa-btn-danger" onClick={handleDelete}>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsList;