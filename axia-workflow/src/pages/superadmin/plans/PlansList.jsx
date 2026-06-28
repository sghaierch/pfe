import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import planService from '../../../services/planService';
import '../../../styles/SuperAdmin.css';

const PlansList = () => {
  const [plans,       setPlans]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [search,      setSearch]      = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [archiveModal, setArchiveModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.msg) { setMsg(location.state.msg); setTimeout(() => setMsg(''), 3000); }
  }, []);// eslint-disable-line

  useEffect(() => { fetchData(); }, []);// eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try { const res = await planService.getAll(); setPlans(res.data?.plans || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleToggle = async (plan) => {
    try { await planService.toggle(plan._id); showMsg(`Plan ${plan.isActive ? 'désactivé' : 'activé'}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  const handleArchive = async () => {
    try {
      await planService.archive(archiveModal._id);
      showMsg('Plan archivé');
      setArchiveModal(null);
      fetchData();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Erreur lors de l\'archivage');
    }
  };

  const caps = (plan) => [
    plan.hasAI            && { icon: 'ri-robot-line',         label: 'IA'          },
    plan.hasAnalytics     && { icon: 'ri-bar-chart-line',     label: 'Analytics'   },
    plan.hasAdvancedForms && { icon: 'ri-file-edit-line',     label: 'Formulaires' },
    plan.hasAPIAccess     && { icon: 'ri-code-s-slash-line',  label: 'API'         },
    plan.hasSSO           && { icon: 'ri-shield-keyhole-line',label: 'SSO'         },
    plan.hasSMSNotif      && { icon: 'ri-message-3-line',     label: 'SMS'         },
  ].filter(Boolean);

  const filtered = plans
    .filter(p => filterActive === 'all' ? true : filterActive === 'active' ? p.isActive : !p.isActive)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="sa-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ri-price-tag-3-line" style={{ color: '#2563eb', fontSize: '24px' }}></i>
            Plans & Tarification
          </h1>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px' }}>
            {plans.length} plan(s) · <span style={{ color: '#10b981', fontWeight: 600 }}>{plans.filter(p => p.isActive).length} actifs</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <i className="ri-search-line" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', pointerEvents: 'none' }}></i>
            <input type="text" placeholder="Rechercher un plan..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 34px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', width: '220px', outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          <Link to="/dashboard/superadmin/plans/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#2563eb', color: '#fff', padding: '9px 18px', borderRadius: '9px', textDecoration: 'none', fontWeight: 700, fontSize: '13px' }}>
            <i className="ri-add-line" style={{ fontSize: '16px' }}></i> Nouveau plan
          </Link>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '11px 16px', borderRadius: '9px', marginBottom: '16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', background: '#dcfce7', color: '#166534' }}>
          <i className="ri-checkbox-circle-fill"></i>{msg}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '7px', marginBottom: '18px' }}>
        {[['all','Tous','ri-apps-line'], ['active','Actifs','ri-checkbox-circle-line'], ['inactive','Inactifs','ri-close-circle-line']].map(([key, label, icon]) => {
          const count = key === 'all' ? plans.length : key === 'active' ? plans.filter(p => p.isActive).length : plans.filter(p => !p.isActive).length;
          const active = filterActive === key;
          return (
            <button key={key} onClick={() => setFilterActive(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '9px', border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`, background: active ? '#2563eb' : '#fff', color: active ? '#fff' : '#64748b', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
              <i className={icon} style={{ fontSize: '13px' }}></i>{label}
              <span style={{ background: active ? 'rgba(255,255,255,.25)' : '#f1f5f9', color: active ? '#fff' : '#64748b', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#94a3b8', gap: '10px', fontSize: '14px' }}>
          <i className="ri-loader-4-line" style={{ fontSize: '20px', animation: 'dspin .8s linear infinite' }}></i> Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
          <i className="ri-price-tag-3-line" style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}></i>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 16px' }}>Aucun plan{search ? ` pour "${search}"` : ''}</p>
          <Link to="/dashboard/superadmin/plans/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', padding: '9px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '13px' }}>
            <i className="ri-add-line"></i> Créer un plan
          </Link>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Plan','Prix','Limites','Capacités','Statut','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(plan => (
                <tr key={plan._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .12s', opacity: plan.isActive ? 1 : .55 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>

                  {/* Plan name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: plan.color || '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ri-vip-diamond-line" style={{ color: '#fff', fontSize: '16px' }}></i>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '14px' }}>{plan.name}</strong>
                          {plan.isPopular && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><i className="ri-star-fill"></i>Populaire</span>}
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>{plan.description || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Prix */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{plan.price}</span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8', marginLeft: '3px' }}>dt/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                  </td>

                  {/* Limites */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {[['ri-user-line', plan.maxUsers + ' utilisateurs'], ['ri-flow-chart', plan.maxWorkflows + ' workflows'], ['ri-folder-line', plan.maxProjects + ' projets']].map(([icon, label]) => (
                        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                          <i className={icon} style={{ color: '#94a3b8', fontSize: '12px' }}></i>{label}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Capacités */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {caps(plan).length === 0
                        ? <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Aucune</span>
                        : caps(plan).map(c => (
                          <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: 600 }}>
                            <i className={c.icon} style={{ fontSize: '11px' }}></i>{c.label}
                          </span>
                        ))
                      }
                    </div>
                  </td>

                  {/* Statut */}
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => handleToggle(plan)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                      background: plan.isActive ? '#dcfce7' : '#fee2e2',
                      color: plan.isActive ? '#166534' : '#991b1b' }}>
                      <i className={plan.isActive ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'} style={{ fontSize: '12px' }}></i>
                      {plan.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setDetailModal(plan)} title="Voir les détails"
                        style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-eye-line" style={{ fontSize: '14px' }}></i>
                      </button>
                      <Link to={`/dashboard/superadmin/plans/edit/${plan._id}`} title="Modifier"
                        style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#f0fdf4', border: '1px solid #86efac', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        <i className="ri-edit-line" style={{ fontSize: '14px' }}></i>
                      </Link>
                      {/* ✅ Bouton archiver (orange) au lieu de supprimer (rouge) */}
                      <button onClick={() => setArchiveModal(plan)} title="Archiver"
                        style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fffbeb', border: '1px solid #fde68a', cursor: 'pointer', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Modal détail plan */}
      {detailModal && (
        <div className="sa-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="sa-modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: detailModal.color || '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ri-vip-diamond-line" style={{ color: '#fff', fontSize: '16px' }}></i>
                </div>
                {detailModal.name}
                {detailModal.isPopular && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>⭐ Populaire</span>}
              </h2>
              <button className="sa-modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="sa-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                <i className="ri-money-dollar-circle-line" style={{ fontSize: '24px', color: detailModal.color || '#2563eb' }}></i>
                <div>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{detailModal.price} dt</span>
                  <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>/ {detailModal.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>{detailModal.description || '—'}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {[['ri-user-line','Utilisateurs', detailModal.maxUsers,'#2563eb','#dbeafe'],
                  ['ri-flow-chart','Workflows', detailModal.maxWorkflows,'#7c3aed','#ede9fe'],
                  ['ri-folder-line','Projets', detailModal.maxProjects,'#0891b2','#e0f2fe']].map(([icon, label, val, color, bg]) => (
                  <div key={label} style={{ background: bg, borderRadius: '9px', padding: '10px 12px', textAlign: 'center' }}>
                    <i className={icon} style={{ fontSize: '18px', color, display: 'block', marginBottom: '3px' }}></i>
                    <div style={{ fontSize: '18px', fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>
              {caps(detailModal).length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 8px' }}>Capacités incluses</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {caps(detailModal).map(c => (
                      <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '7px', padding: '5px 10px', fontSize: '12px', fontWeight: 600 }}>
                        <i className={c.icon}></i>{c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailModal.features?.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 8px' }}>Fonctionnalités</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {detailModal.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151' }}>
                        <i className="ri-check-line" style={{ color: '#10b981', fontSize: '15px', flexShrink: 0 }}></i>{f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn-secondary" onClick={() => setDetailModal(null)}>Fermer</button>
              <Link to={`/dashboard/superadmin/plans/edit/${detailModal._id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
                <i className="ri-edit-line"></i> Modifier ce plan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal archivage */}
      {archiveModal && (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && setArchiveModal(null)}>
          <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <i className="ri-archive-line" style={{ color: '#d97706' }}></i>Archiver le plan
              </h3>
              <button className="sa-modal-close" onClick={() => setArchiveModal(null)}>✕</button>
            </div>
            <p style={{ color: '#64748b', margin: '8px 0 20px', fontSize: '13px', lineHeight: 1.6 }}>
              Archiver <strong>{archiveModal.name}</strong> ? Le plan ne sera plus visible pour les nouvelles inscriptions. Les abonnements existants ne seront pas affectés.
            </p>
            <div className="sa-modal-footer">
              <button className="sa-btn-secondary" onClick={() => setArchiveModal(null)}>Annuler</button>
              <button onClick={handleArchive}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d97706', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                <i className="ri-archive-line"></i> Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansList;