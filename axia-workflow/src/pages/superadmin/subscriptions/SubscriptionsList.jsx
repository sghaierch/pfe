import subscriptionService from '../../../services/subscriptionService';
import '../../../styles/SuperAdmin.css';
import React, { useState, useEffect, useCallback } from 'react';
const Badge = ({ status }) => {
  const map = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'En attente'  },
    active:    { bg: '#dcfce7', color: '#166534', label: 'Actif'       },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Refusé'      },
    expired:   { bg: '#f1f5f9', color: '#64748b', label: 'Expiré'      },
    cancelled: { bg: '#f1f5f9', color: '#64748b', label: 'Annulé'      },
    suspended: { bg: '#fff7ed', color: '#9a3412', label: 'Suspendu'    },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: '12px',
      fontSize: '12px', fontWeight: 600
    }}>
      {s.label}
    </span>
  );
};

const SubscriptionsList = () => {
  const [subs,        setSubs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [msg,         setMsg]         = useState({ text: '', type: 'success' });
  const [actionModal, setActionModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [adminNote,   setAdminNote]   = useState('');
  const [saving,      setSaving]      = useState(false);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await subscriptionService.getAllSubscriptions();

    const list =
      res?.data?.subscriptions ||
      res?.data?.data ||
      res?.data ||
      [];

    setSubs(Array.isArray(list) ? list : []);
  } catch (err) {
    console.error('❌ fetchData:', err);
    showMsg('❌ Erreur de chargement', 'error');
    setSubs([]);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getAllSubscriptions();

      const list =
        res?.data?.subscriptions ||
        res?.data?.data ||
        res?.data ||
        [];

      setSubs(Array.isArray(list) ? list : []);
    } catch (err) {
      showMsg('❌ Erreur de chargement', 'error');
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: 'success' }), 4000);
  };

  const handleApprove = async () => {
    if (!actionModal) return;
    setSaving(true);
    try {
      await subscriptionService.approve(actionModal.sub._id, adminNote);
      showMsg('✅ Abonnement approuvé ! Base créée avec succès.', 'success');
      setActionModal(null);
      setAdminNote('');
      fetchData();
    } catch (err) {
      showMsg('❌ ' + (err.message || 'Erreur approbation'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    if (!adminNote.trim()) {
      showMsg('❌ Veuillez indiquer une raison de refus', 'error');
      return;
    }
    setSaving(true);
    try {
      await subscriptionService.reject(actionModal.sub._id, adminNote);
      showMsg('✅ Demande refusée', 'success');
      setActionModal(null);
      setAdminNote('');
      fetchData();
    } catch (err) {
      showMsg('❌ ' + (err.message || 'Erreur rejet'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await subscriptionService.deleteSubscription(deleteModal._id);
      showMsg('🗑️ Abonnement supprimé', 'success');
      setDeleteModal(null);
      fetchData();
    } catch (err) {
      showMsg('❌ Impossible de supprimer', 'error');
    }
  };

  // ✅ FIX : les données viennent de sub.tenant (populé par le backend)
  const getName    = s => s.tenant?.companyName  || '—';
  const getEmail   = s => s.tenant?.contactEmail || s.tenant?.adminEmail || '—';
  const getPhone   = s => s.tenant?.contactPhone || '—';
  const getEmp     = s => s.tenant?.employeesCount || '—';
  const getMF      = s => s.tenant?.matriculeFiscal || '—';
  const getPlan    = s => s.plan?.name || '—';

  const FILTERS = [
    { key: 'all',       label: 'Tous',        count: subs.length },
    { key: 'pending',   label: 'En attente',  count: subs.filter(s => s.status === 'pending').length   },
    { key: 'active',    label: 'Actifs',      count: subs.filter(s => s.status === 'active').length    },
    { key: 'rejected',  label: 'Refusés',     count: subs.filter(s => s.status === 'rejected').length  },
    { key: 'expired',   label: 'Expirés',     count: subs.filter(s => s.status === 'expired').length   },
    { key: 'suspended', label: 'Suspendus',   count: subs.filter(s => s.status === 'suspended').length },
  ];

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  return (
    <div className="sa-page">
      {/* HEADER */}
      <div className="sa-page-header">
        <div>
          <h1>Abonnements</h1>
          <p>
            {subs.filter(s => s.status === 'pending').length > 0
              ? `🔔 ${subs.filter(s => s.status === 'pending').length} demande(s) en attente`
              : 'Aucune demande en attente'}
          </p>
        </div>
      </div>

      {/* MESSAGE */}
      {msg.text && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600,
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color:      msg.type === 'success' ? '#166534' : '#991b1b',
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
                <th>Email contact</th>
                <th>Plan</th>
                <th>Durée</th>
                <th>Date demande</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    📭 Aucun résultat
                  </td>
                </tr>
              ) : (
                filtered.map(sub => (
                  <tr key={sub._id}>
                    {/* ✅ FIX : on lit depuis sub.tenant */}
                    <td><strong>{getName(sub)}</strong></td>
                    <td>{getEmail(sub)}</td>
                    <td>
                      <span className="sa-plan-tag" style={{ background: sub.plan?.color + '22', color: sub.plan?.color }}>
                        {getPlan(sub)}
                      </span>
                    </td>
                    <td>{sub.durationMonths ? `${sub.durationMonths} mois` : '—'}</td>
                    <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                    <td><Badge status={sub.status} /></td>
                    <td>
                      <div className="sa-actions">
                        <button
                          className="sa-btn-icon"
                          onClick={() => setActionModal({ sub, type: 'view' })}
                          title="Voir les détails"
                        >👁️</button>

                        {sub.status === 'pending' && (
                          <>
                            <button
                              className="sa-btn-icon sa-btn-approve"
                              onClick={() => { setAdminNote(''); setActionModal({ sub, type: 'approve' }); }}
                              title="Approuver"
                            >✓</button>
                            <button
                              className="sa-btn-icon sa-btn-reject"
                              onClick={() => { setAdminNote(''); setActionModal({ sub, type: 'reject' }); }}
                              title="Refuser"
                            >✗</button>
                          </>
                        )}

                        <button
                          className="sa-btn-icon sa-btn-delete"
                          onClick={() => setDeleteModal(sub)}
                          title="Supprimer"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL DÉTAILS / APPROUVER / REFUSER ── */}
      {actionModal && (
        <div className="sa-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>
                {actionModal.type === 'view'    && '📋 Détails de la demande'}
                {actionModal.type === 'approve' && '✅ Approuver la demande'}
                {actionModal.type === 'reject'  && '❌ Refuser la demande'}
              </h2>
              <button className="sa-modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>

            <div className="sa-modal-body">
              <div className="sa-info-grid">
                <div className="sa-info-item">
                  <label>Entreprise</label>
                  <p><strong>{getName(actionModal.sub)}</strong></p>
                </div>
                <div className="sa-info-item">
                  <label>Matricule fiscale</label>
                  <p>{getMF(actionModal.sub)}</p>
                </div>
                <div className="sa-info-item">
                  <label>Email contact</label>
                  <p>{getEmail(actionModal.sub)}</p>
                </div>
                <div className="sa-info-item">
                  <label>Téléphone</label>
                  <p>{getPhone(actionModal.sub)}</p>
                </div>
                <div className="sa-info-item">
                  <label>Email admin</label>
                  <p>{actionModal.sub.tenant?.adminEmail || '—'}</p>
                </div>
                <div className="sa-info-item">
                  <label>Plan</label>
                  <p><strong>{getPlan(actionModal.sub)}</strong></p>
                </div>
                <div className="sa-info-item">
                  <label>Durée choisie</label>
                  <p>{actionModal.sub.durationMonths} mois</p>
                </div>
                <div className="sa-info-item">
                  <label>Nombre d'employés</label>
                  <p>{getEmp(actionModal.sub)}</p>
                </div>
                <div className="sa-info-item">
                  <label>Date de demande</label>
                  <p>{actionModal.sub.createdAt ? new Date(actionModal.sub.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
                <div className="sa-info-item">
                  <label>Statut</label>
                  <p><Badge status={actionModal.sub.status} /></p>
                </div>
              </div>

              {actionModal.sub.requestMessage && (
                <div className="sa-info-item" style={{ marginTop: '16px' }}>
                  <label>Message de l'entreprise</label>
                  <p style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                    {actionModal.sub.requestMessage}
                  </p>
                </div>
              )}

              {actionModal.type === 'approve' && (
                <div style={{ marginTop: '20px', background: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#1e40af' }}>ℹ️ Ce qui va se passer :</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e40af', lineHeight: '1.8' }}>
                    <li>Création d'une base de données dédiée : <code>{actionModal.sub.tenant?.dbName}</code></li>
                    <li>Initialisation des rôles et collections</li>
                    <li>Création du compte admin avec mot de passe temporaire</li>
                    <li>Email envoyé à <strong>{actionModal.sub.tenant?.adminEmail}</strong></li>
                    <li>Abonnement actif pour <strong>{actionModal.sub.durationMonths} mois</strong></li>
                  </ul>
                </div>
              )}

              {(actionModal.type === 'approve' || actionModal.type === 'reject') && (
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Note {actionModal.type === 'reject' ? '(obligatoire)' : '(optionnelle)'}
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    placeholder={
                      actionModal.type === 'approve'
                        ? "Bienvenue ! N'hésitez pas à nous contacter..."
                        : 'Raison du refus...'
                    }
                    rows={4}
                    style={{
                      width: '100%', padding: '10px', boxSizing: 'border-box',
                      border: '1px solid #e5e7eb', borderRadius: '6px',
                      fontFamily: 'inherit', fontSize: '14px',
                    }}
                  />
                </div>
              )}
            </div>

            <div className="sa-modal-footer">
              <button className="sa-btn sa-btn-secondary" onClick={() => setActionModal(null)} disabled={saving}>
                Annuler
              </button>
              {actionModal.type === 'approve' && (
                <button className="sa-btn sa-btn-success" onClick={handleApprove} disabled={saving}>
                  {saving ? '⏳ Création en cours...' : '✓ Confirmer l\'approbation'}
                </button>
              )}
              {actionModal.type === 'reject' && (
                <button className="sa-btn sa-btn-danger" onClick={handleReject} disabled={saving || !adminNote.trim()}>
                  {saving ? '⏳ Traitement...' : '✗ Confirmer le refus'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION ── */}
      {deleteModal && (
        <div className="sa-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>🗑️ Confirmer la suppression</h2>
              <button className="sa-modal-close" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <div className="sa-modal-body">
              <p>Supprimer la demande de <strong>{getName(deleteModal)}</strong> ?</p>
              <p style={{ color: '#dc2626', fontSize: '14px' }}>⚠️ Cette action est irréversible.</p>
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn sa-btn-secondary" onClick={() => setDeleteModal(null)}>Annuler</button>
              <button className="sa-btn sa-btn-danger" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;