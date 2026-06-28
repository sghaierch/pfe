import React, { useState, useEffect, useCallback } from 'react';
import subscriptionService from '../../../services/subscriptionService';
import '../../../styles/SuperAdmin.css';

const STATUS = {
  pending:   { bg: '#fef3c7', color: '#92400e', icon: 'ri-time-fill',           label: 'En attente' },
  active:    { bg: '#dcfce7', color: '#166534', icon: 'ri-checkbox-circle-fill', label: 'Actif'      },
  rejected:  { bg: '#fee2e2', color: '#991b1b', icon: 'ri-close-circle-fill',   label: 'Refusé'     },
  expired:   { bg: '#fff7ed', color: '#c2410c', icon: 'ri-alarm-warning-fill',  label: 'Expiré'     },
  cancelled: { bg: '#f1f5f9', color: '#64748b', icon: 'ri-stop-circle-fill',    label: 'Annulé'     },
  suspended: { bg: '#fee2e2', color: '#9a3412', icon: 'ri-pause-circle-fill',   label: 'Suspendu'   },
};

const Badge = ({ status }) => {
  const s = STATUS[status] || { bg: '#f1f5f9', color: '#64748b', icon: 'ri-question-mark', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: s.bg, color: s.color, padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700 }}>
      <i className={s.icon} style={{ fontSize: '11px' }}></i>{s.label}
    </span>
  );
};

const SubscriptionsList = () => {
  const [subs,        setSubs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [msg,         setMsg]         = useState({ text: '', type: 'success' });
  const [actionModal, setActionModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [adminNote,   setAdminNote]   = useState('');
  const [saving,      setSaving]      = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionService.getAllSubscriptions();
      const list = res?.data?.subscriptions || res?.data?.data || res?.data || [];
      setSubs(Array.isArray(list) ? list : []);
    } catch { showMsg('Erreur de chargement', 'error'); setSubs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 4000); };

  const handleApprove = async () => {
    setSaving(true);
    try {
      await subscriptionService.approve(actionModal.sub._id, adminNote);
      showMsg('Abonnement approuvé avec succès');
      setActionModal(null); setAdminNote(''); fetchData();
    } catch (err) { showMsg(err.message || 'Erreur approbation', 'error'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    if (!adminNote.trim()) { showMsg('Veuillez indiquer une raison de refus', 'error'); return; }
    setSaving(true);
    try {
      await subscriptionService.reject(actionModal.sub._id, adminNote);
      showMsg('Demande refusée');
      setActionModal(null); setAdminNote(''); fetchData();
    } catch (err) { showMsg(err.message || 'Erreur rejet', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await subscriptionService.deleteSubscription(deleteModal._id);
      showMsg('Abonnement supprimé');
      setDeleteModal(null); fetchData();
    } catch { showMsg('Impossible de supprimer', 'error'); }
  };

  const getName  = s => s.tenant?.companyName  || '—';
  const getEmail = s => s.tenant?.contactEmail || s.tenant?.adminEmail || '—';
  const getPhone = s => s.tenant?.contactPhone || '—';
  const getEmp   = s => s.tenant?.employeesCount || '—';
  const getMF    = s => s.tenant?.matriculeFiscal || '—';
  const getPlan  = s => s.plan?.name || '—';

  const FILTERS = [
    { key: 'all',       label: 'Tous',       icon: 'ri-apps-line' },
    { key: 'pending',   label: 'En attente', icon: 'ri-time-line' },
    { key: 'active',    label: 'Actifs',     icon: 'ri-checkbox-circle-line' },
    { key: 'rejected',  label: 'Refusés',    icon: 'ri-close-circle-line' },
    { key: 'expired',   label: 'Expirés',    icon: 'ri-alarm-warning-line' },
    { key: 'suspended', label: 'Suspendus',  icon: 'ri-pause-circle-line' },
  ];

  const filtered = subs
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => !search ||
      getName(s).toLowerCase().includes(search.toLowerCase()) ||
      getEmail(s).toLowerCase().includes(search.toLowerCase()) ||
      getPlan(s).toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="sa-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ri-file-list-3-line" style={{ color: '#2563eb', fontSize: '24px' }}></i>
            Abonnements
          </h1>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px' }}>
            {subs.length} abonnement(s) ·{' '}
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>
              {subs.filter(s => s.status === 'pending').length} en attente
            </span>
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', pointerEvents: 'none' }}></i>
          <input
            type="text" placeholder="Rechercher entreprise, email, plan..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px 9px 34px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', width: '260px', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ padding: '11px 16px', borderRadius: '9px', marginBottom: '16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
          <i className={msg.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}></i>
          {msg.text}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '7px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.key === 'all' ? subs.length : subs.filter(s => s.status === f.key).length;
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`, background: active ? '#2563eb' : '#fff', color: active ? '#fff' : '#64748b', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              <i className={f.icon} style={{ fontSize: '13px' }}></i>
              {f.label}
              <span style={{ background: active ? 'rgba(255,255,255,.25)' : '#f1f5f9', color: active ? '#fff' : '#64748b', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tableau */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#94a3b8', gap: '10px', fontSize: '14px' }}>
          <i className="ri-loader-4-line" style={{ fontSize: '20px', animation: 'dspin .8s linear infinite' }}></i> Chargement...
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Entreprise','Email','Plan','Durée','Date demande','Statut','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  <i className="ri-inbox-line" style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}></i>
                  Aucun résultat{search ? ` pour "${search}"` : ''}
                </td></tr>
              ) : filtered.map(sub => (
                <tr key={sub._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#2563eb,#1e40af)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>
                        {getName(sub).charAt(0).toUpperCase()}
                      </div>
                      <strong style={{ color: '#0f172a', fontSize: '13px' }}>{getName(sub)}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12.5px' }}>{getEmail(sub)}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: (sub.plan?.color || '#2563eb') + '20', color: sub.plan?.color || '#2563eb', padding: '3px 9px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                      {getPlan(sub)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12.5px' }}>{sub.durationMonths ? `${sub.durationMonths} mois` : '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '12.5px' }}>{sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={{ padding: '12px 14px' }}><Badge status={sub.status} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => { setAdminNote(''); setActionModal({ sub, type: 'view' }); }} title="Voir les détails"
                        style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-eye-line" style={{ fontSize: '14px' }}></i>
                      </button>
                      {sub.status === 'pending' && <>
                        <button onClick={() => { setAdminNote(''); setActionModal({ sub, type: 'approve' }); }} title="Approuver"
                          style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ri-checkbox-circle-line" style={{ fontSize: '14px' }}></i>
                        </button>
                        <button onClick={() => { setAdminNote(''); setActionModal({ sub, type: 'reject' }); }} title="Refuser"
                          style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fee2e2', border: '1px solid #fca5a5', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ri-close-circle-line" style={{ fontSize: '14px' }}></i>
                        </button>
                      </>}
                      <button onClick={() => setDeleteModal(sub)} title="Supprimer"
                        style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fff7ed', border: '1px solid #fed7aa', cursor: 'pointer', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<i className="ri-archive-line" style={{ fontSize: '14px' }}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal détails / approuver / refuser */}
      {actionModal && (
        <div className="sa-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="sa-modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '16px' }}>
                <i className={actionModal.type === 'view' ? 'ri-file-info-line' : actionModal.type === 'approve' ? 'ri-checkbox-circle-line' : 'ri-close-circle-line'}
                   style={{ color: actionModal.type === 'approve' ? '#16a34a' : actionModal.type === 'reject' ? '#dc2626' : '#2563eb', fontSize: '20px' }}></i>
                {actionModal.type === 'view' ? 'Détails de la demande' : actionModal.type === 'approve' ? 'Approuver la demande' : 'Refuser la demande'}
              </h2>
              <button className="sa-modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div className="sa-modal-body">
              {/* Grille infos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  ['ri-building-2-line','Entreprise', getName(actionModal.sub)],
                  ['ri-file-text-line', 'Matricule fiscal', getMF(actionModal.sub)],
                  ['ri-mail-line',      'Email contact',   getEmail(actionModal.sub)],
                  ['ri-phone-line',     'Téléphone',       getPhone(actionModal.sub)],
                  ['ri-mail-send-line', 'Email admin',     actionModal.sub.tenant?.adminEmail || '—'],
                  ['ri-vip-diamond-line','Plan',           getPlan(actionModal.sub)],
                  ['ri-calendar-line',  'Durée',           actionModal.sub.durationMonths + ' mois'],
                  ['ri-team-line',      'Employés',        getEmp(actionModal.sub)],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className={icon}></i>{label}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{val}</div>
                  </div>
                ))}
              </div>

              {actionModal.sub.requestMessage && (
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="ri-chat-quote-line"></i>Message
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{actionModal.sub.requestMessage}</p>
                </div>
              )}

              {actionModal.type === 'approve' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', color: '#1e40af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <i className="ri-information-line"></i>Ce qui va se passer
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#1e40af', lineHeight: 2, fontSize: '12.5px' }}>
                    <li>Création de la base <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: '4px' }}>{actionModal.sub.tenant?.dbName}</code></li>
                    <li>Initialisation des rôles et collections</li>
                    <li>Email envoyé à <strong>{actionModal.sub.tenant?.adminEmail}</strong></li>
                    <li>Abonnement actif pour <strong>{actionModal.sub.durationMonths} mois</strong></li>
                  </ul>
                </div>
              )}

              {(actionModal.type === 'approve' || actionModal.type === 'reject') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '12px', color: '#374151', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    Note {actionModal.type === 'reject' ? '(obligatoire)' : '(optionnelle)'}
                  </label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3}
                    placeholder={actionModal.type === 'approve' ? "Bienvenue ! N'hésitez pas à nous contacter..." : 'Raison du refus...'}
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', resize: 'vertical', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              )}
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn sa-btn-secondary" onClick={() => setActionModal(null)} disabled={saving}>Annuler</button>
              {actionModal.type === 'approve' && (
                <button onClick={handleApprove} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                  <i className="ri-checkbox-circle-line"></i>{saving ? 'En cours...' : 'Approuver'}
                </button>
              )}
              {actionModal.type === 'reject' && (
                <button onClick={handleReject} disabled={saving || !adminNote.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: saving || !adminNote.trim() ? 'not-allowed' : 'pointer', opacity: !adminNote.trim() ? .6 : 1, fontSize: '13px' }}>
                  <i className="ri-close-circle-line"></i>{saving ? 'En cours...' : 'Refuser'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteModal && (
        <div className="sa-modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
<i className="ri-archive-line" style={{ color: '#dc2626' }}></i>Confirmer la suppression
              </h2>
              <button className="sa-modal-close" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <div className="sa-modal-body">
              <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>Supprimer la demande de <strong>{getName(deleteModal)}</strong> ?</p>
              <p style={{ color: '#dc2626', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ri-error-warning-line"></i>Cette action est irréversible.
              </p>
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn sa-btn-secondary" onClick={() => setDeleteModal(null)}>Annuler</button>
              <button className="sa-btn-danger" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;