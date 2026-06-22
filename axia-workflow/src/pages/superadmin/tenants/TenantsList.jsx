import React, { useState, useEffect, useCallback } from 'react';
import tenantService       from '../../../services/tenantService';
import planService         from '../../../services/planService';
import subscriptionService from '../../../services/subscriptionService';
import '../../../styles/SuperAdmin.css';

/* ── Helpers ── */
const STATUS = {
  active:    { bg: '#dcfce7', color: '#166534', icon: 'ri-checkbox-circle-fill', label: 'Actif'      },
  suspended: { bg: '#fee2e2', color: '#991b1b', icon: 'ri-pause-circle-fill',    label: 'Suspendu'   },
  pending:   { bg: '#fef3c7', color: '#92400e', icon: 'ri-time-fill',             label: 'En attente' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', icon: 'ri-close-circle-fill',    label: 'Refusé'     },
  cancelled: { bg: '#f1f5f9', color: '#64748b', icon: 'ri-stop-circle-fill',     label: 'Annulé'     },
  expired:   { bg: '#fff7ed', color: '#c2410c', icon: 'ri-alarm-warning-fill',   label: 'Expiré'     },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { bg: '#f1f5f9', color: '#64748b', icon: 'ri-question-mark', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: '999px',
      fontSize: '11.5px', fontWeight: 700,
    }}>
      <i className={s.icon} style={{ fontSize: '11px' }}></i>
      {s.label}
    </span>
  );
};

const Btn = ({ icon, label, color = '#2563eb', bg = '#eff6ff', border = '#bfdbfe', onClick, small }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: small ? '5px 10px' : '8px 14px',
    borderRadius: '8px', border: `1px solid ${border}`,
    background: bg, color, fontSize: small ? '11.5px' : '12.5px',
    fontWeight: 600, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
  }}
    onMouseEnter={e => { e.currentTarget.style.opacity = '.8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
  >
    <i className={icon} style={{ fontSize: small ? '12px' : '14px' }}></i>
    {label}
  </button>
);

/* ── SubscriptionHistory ── */
const SubscriptionHistory = ({ tenantId }) => {
  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionService.getByTenant(tenantId)
      .then(res => {
        const d = res?.data?.data?.subscriptions || res?.data?.subscriptions || res?.data?.data || res?.data || [];
        setSubs(Array.isArray(d) ? d : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <div style={{ padding: '20px', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}><i className="ri-loader-4-line" style={{ animation: 'spin .8s linear infinite', display: 'inline-block' }}></i> Chargement...</div>;
  if (!subs.length) return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}><i className="ri-inbox-line" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}></i>Aucun abonnement</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {subs.map(sub => {
        const s = STATUS[sub.status] || STATUS.cancelled;
        return (
          <div key={sub._id} style={{
            background: '#f8fafc', borderRadius: '10px',
            border: '1px solid #e2e8f0', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{sub.plan?.name || '—'}</span>
                <StatusBadge status={sub.status} />
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>· {sub.durationMonths} mois</span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {sub.startDate
                  ? `${new Date(sub.startDate).toLocaleDateString('fr-FR')} → ${new Date(sub.endDate).toLocaleDateString('fr-FR')}`
                  : `Demande le ${new Date(sub.createdAt).toLocaleDateString('fr-FR')}`}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{sub.plan?.price ? `${sub.plan.price} dt` : ''}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Modals ── */
const ApproveModal = ({ tenant, onClose, onConfirm, renewMode }) => {
  const [months, setMonths] = useState(tenant.subscription?.durationMonths || 1);
  const [loading, setLoading] = useState(false);
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className={renewMode ? 'ri-refresh-line' : 'ri-checkbox-circle-line'} style={{ color: '#16a34a' }}></i>
            {renewMode ? 'Renouveler l\'abonnement' : 'Approuver l\'entreprise'}
          </h3>
          <button className="sa-modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px', lineHeight: 1.7 }}>
            {renewMode
              ? <>Renouveler l'abonnement de <strong>{tenant.companyName}</strong>.</>
              : <>Approuver <strong>{tenant.companyName}</strong> ? Les identifiants seront envoyés à <strong>{tenant.adminEmail}</strong>.</>
            }
          </p>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Durée de l'abonnement
          </label>
          <select value={months} onChange={e => setMonths(parseInt(e.target.value))}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
            {[1,2,3,6,12,24].map(m => <option key={m} value={m}>{m} mois{m===12?' (1 an)':m===24?' (2 ans)':''}</option>)}
          </select>
        </div>
        <div className="sa-modal-footer">
          <button className="sa-btn-secondary" onClick={onClose}>Annuler</button>
          <button onClick={async () => { setLoading(true); await onConfirm({ durationMonths: months }); setLoading(false); }}
            disabled={loading}
            style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className={renewMode ? 'ri-refresh-line' : 'ri-checkbox-circle-line'}></i>
            {loading ? 'En cours...' : renewMode ? 'Renouveler' : 'Approuver'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RejectModal = ({ tenant, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ri-close-circle-line" style={{ color: '#dc2626' }}></i>
            Rejeter la demande
          </h3>
          <button className="sa-modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 0' }}>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>Rejeter <strong>{tenant.companyName}</strong> ?</p>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Raison (optionnel)</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Ex: Documents incomplets..."
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div className="sa-modal-footer">
          <button className="sa-btn-secondary" onClick={onClose}>Annuler</button>
          <button className="sa-btn-danger" disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm({ reason }); setLoading(false); }}>
            {loading ? 'Rejet...' : 'Rejeter'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ title, message, onClose, onConfirm, danger }) => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header"><h3>{title}</h3><button className="sa-modal-close" onClick={onClose}>✕</button></div>
        <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.7, padding: '8px 0 16px' }} dangerouslySetInnerHTML={{ __html: message }} />
        <div className="sa-modal-footer">
          <button className="sa-btn-secondary" onClick={onClose}>Annuler</button>
          <button className={danger ? 'sa-btn-danger' : 'sa-btn-primary'} disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm({}); setLoading(false); }}>
            {loading ? 'En cours...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditLimitsModal = ({ tenant, onClose, onSaved }) => {
  const [form, setForm] = useState({
    maxUsers: tenant.limits?.maxUsers ?? 10, maxWorkflows: tenant.limits?.maxWorkflows ?? 50,
    maxProjects: tenant.limits?.maxProjects ?? 3, maxStorage: tenant.limits?.maxStorage ?? 5,
    hasAI: tenant.limits?.hasAI ?? false, hasAnalytics: tenant.limits?.hasAnalytics ?? false,
  });
  const [saving, setSaving] = useState(false);
  const handle = e => { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value })); };
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-settings-3-line" style={{ color: '#2563eb' }}></i>Modifier les limites</h3>
          <button className="sa-modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '8px 0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            {[['maxUsers','ri-user-line','Utilisateurs max'],['maxWorkflows','ri-flow-chart','Workflows max'],['maxProjects','ri-folder-line','Projets max'],['maxStorage','ri-hard-drive-line','Stockage (GB)']].map(([name, icon, label]) => (
              <div key={name}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  <i className={icon}></i>{label}
                </label>
                <input type="number" name={name} value={form[name]} onChange={handle} min="0"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['hasAI','ri-robot-line','IA activée'],['hasAnalytics','ri-bar-chart-line','Analytics']].map(([name, icon, label]) => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" name={name} checked={form[name]} onChange={handle} style={{ accentColor: '#2563eb', width: '15px', height: '15px' }} />
                <i className={icon} style={{ color: '#2563eb' }}></i>{label}
              </label>
            ))}
          </div>
        </div>
        <div className="sa-modal-footer">
          <button className="sa-btn-secondary" onClick={onClose}>Annuler</button>
          <button className="sa-btn-primary" disabled={saving} onClick={async () => { setSaving(true); try { await tenantService.updateLimits(tenant._id, form); onSaved('✅ Limites mises à jour'); } catch(e){ alert(e.message); } finally { setSaving(false); } }}>
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── TenantDetail ── */
const TenantDetail = ({ tenant, plans, onClose, onAction, msg }) => {
  const [tab, setTab]                     = useState('info');
  const [changePlanModal, setChangePlanModal] = useState(false);
  const [editLimitsModal, setEditLimitsModal] = useState(false);
  const [selectedPlan, setSelectedPlan]   = useState(tenant.plan?._id || '');
  const [saving, setSaving]               = useState(false);

  const InfoRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', padding: '9px 0' }}>
      <span style={{ width: '160px', flexShrink: 0, color: '#64748b', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon && <i className={icon} style={{ fontSize: '13px', color: '#94a3b8' }}></i>}{label}
      </span>
      <span style={{ color: '#0f172a', fontSize: '13px' }}>{value ?? '—'}</span>
    </div>
  );

  const actionButtons = [
    tenant.status === 'pending'    && { icon: 'ri-checkbox-circle-line', label: 'Approuver',  bg: '#dcfce7', color: '#16a34a', border: '#86efac', action: 'approve' },
    tenant.status === 'pending'    && { icon: 'ri-close-circle-line',    label: 'Rejeter',    bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', action: 'reject'  },
    tenant.status === 'active'     && { icon: 'ri-pause-circle-line',    label: 'Suspendre',  bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', action: 'suspend' },
    (tenant.status === 'suspended' || tenant.status === 'rejected') && { icon: 'ri-play-circle-line', label: 'Réactiver', bg: '#dcfce7', color: '#16a34a', border: '#86efac', action: 'reactivate' },
    tenant.status === 'expired'    && { icon: 'ri-refresh-line',         label: 'Renouveler', bg: '#dcfce7', color: '#16a34a', border: '#86efac', action: 'renew'   },
    tenant.isActive                && { icon: 'ri-mail-send-line',        label: 'Renvoyer identifiants', bg: '#fef3c7', color: '#92400e', border: '#fcd34d', action: 'resend' },
  ].filter(Boolean);

  return (
    <div>
      {/* Header détail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#f1f5f9', border: 'none', padding: '8px 14px',
          borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '13px',
        }}>
          <i className="ri-arrow-left-line"></i> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 800,
          }}>{tenant.companyName?.charAt(0)?.toUpperCase()}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{tenant.companyName}</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{tenant.slug} · créé le {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <StatusBadge status={tenant.status} />
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ padding: '11px 16px', borderRadius: '9px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b', fontWeight: 600, fontSize: '13px',
        }}>
          <i className={msg.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}></i>
          {msg.text}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {actionButtons.map((b, i) => (
          <Btn key={i} icon={b.icon} label={b.label} bg={b.bg} color={b.color} border={b.border} onClick={() => onAction(b.action)} />
        ))}
        <Btn icon="ri-vip-diamond-line"  label="Changer plan"     bg="#ede9fe" color="#7c3aed" border="#c4b5fd" onClick={() => setChangePlanModal(true)} />
        <Btn icon="ri-settings-3-line"   label="Limites"          bg="#e0f2fe" color="#0369a1" border="#7dd3fc" onClick={() => setEditLimitsModal(true)} />
        <Btn icon="ri-delete-bin-6-line" label="Supprimer"        bg="#fff5f5" color="#dc2626" border="#fca5a5" onClick={() => onAction('delete')} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        {[['info','ri-information-line','Informations'],['history','ri-history-line','Historique abonnements']].map(([key, icon, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '9px 18px', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, background: 'transparent',
            color: tab === key ? '#2563eb' : '#64748b',
            borderBottom: tab === key ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <i className={icon}></i>{label}
          </button>
        ))}
      </div>

      {/* Tab info */}
      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Société */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <i className="ri-building-2-line" style={{ color: '#2563eb' }}></i>Société
            </h3>
            <InfoRow icon="ri-text" label="Nom"            value={tenant.companyName}     />
            <InfoRow icon="ri-file-text-line" label="Matricule"     value={tenant.matriculeFiscal} />
            <InfoRow icon="ri-briefcase-line" label="Secteur"       value={tenant.sector}          />
            <InfoRow icon="ri-team-line"      label="Employés"      value={tenant.employeesCount}  />
            <InfoRow icon="ri-map-pin-line"   label="Adresse"       value={tenant.address}         />
            <InfoRow icon="ri-mail-line"      label="Email"         value={tenant.contactEmail}    />
            <InfoRow icon="ri-phone-line"     label="Téléphone"     value={tenant.contactPhone}    />
          </div>

          {/* Admin */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <i className="ri-user-settings-line" style={{ color: '#2563eb' }}></i>Administrateur
            </h3>
            <InfoRow icon="ri-user-line"      label="Prénom"  value={tenant.adminFirstName} />
            <InfoRow icon="ri-user-line"      label="Nom"     value={tenant.adminLastName}  />
            <InfoRow icon="ri-mail-line"      label="Email"   value={tenant.adminEmail}     />
            <InfoRow icon="ri-database-line"  label="Base DB" value={
              <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px' }}>{tenant.dbName}</code>
            } />

            <h3 style={{ margin: '16px 0 12px', fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <i className="ri-calendar-check-line" style={{ color: '#2563eb' }}></i>Abonnement
            </h3>
            <InfoRow icon="ri-timer-line"     label="Durée"  value={tenant.subscription?.durationMonths ? `${tenant.subscription.durationMonths} mois` : '—'} />
            <InfoRow icon="ri-calendar-line"  label="Début"  value={tenant.subscription?.startDate ? new Date(tenant.subscription.startDate).toLocaleDateString('fr-FR') : '—'} />
            <InfoRow icon="ri-calendar-2-line" label="Fin"   value={tenant.subscription?.endDate ? new Date(tenant.subscription.endDate).toLocaleDateString('fr-FR') : '—'} />
          </div>

          {/* Plan & limites */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
              <i className="ri-vip-diamond-line" style={{ color: '#7c3aed' }}></i>Plan & Limites
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg,#2563eb,#1e40af)', color: '#fff', borderRadius: '10px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-vip-crown-line" style={{ fontSize: '18px' }}></i>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{tenant.plan?.name || '—'}</div>
                  <div style={{ fontSize: '11px', opacity: .75 }}>{tenant.plan?.price ? `${tenant.plan.price} dt/mois` : ''}</div>
                </div>
              </div>
              {[
                ['ri-user-line','Utilisateurs',tenant.limits?.maxUsers,'#2563eb','#dbeafe'],
                ['ri-flow-chart','Workflows',tenant.limits?.maxWorkflows,'#7c3aed','#ede9fe'],
                ['ri-folder-line','Projets',tenant.limits?.maxProjects,'#0891b2','#e0f2fe'],
                ['ri-hard-drive-line','Stockage',tenant.limits?.maxStorage ? `${tenant.limits.maxStorage} GB` : '—','#059669','#dcfce7'],
                ['ri-robot-line','IA',tenant.limits?.hasAI ? 'Activée':'Désactivée', tenant.limits?.hasAI?'#059669':'#94a3b8', tenant.limits?.hasAI?'#dcfce7':'#f1f5f9'],
                ['ri-bar-chart-line','Analytics',tenant.limits?.hasAnalytics ? 'Activé':'Désactivé', tenant.limits?.hasAnalytics?'#059669':'#94a3b8', tenant.limits?.hasAnalytics?'#dcfce7':'#f1f5f9'],
              ].map(([icon, label, val, color, bg]) => (
                <div key={label} style={{ background: bg, borderRadius: '9px', padding: '10px 12px', textAlign: 'center' }}>
                  <i className={icon} style={{ fontSize: '16px', color, display: 'block', marginBottom: '3px' }}></i>
                  <div style={{ fontSize: '15px', fontWeight: 800, color }}>{val ?? '—'}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab history */}
      {tab === 'history' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <i className="ri-history-line" style={{ color: '#2563eb' }}></i>Historique des abonnements
          </h3>
          <SubscriptionHistory tenantId={tenant._id} />
        </div>
      )}

      {/* Modal changer plan */}
      {changePlanModal && (
        <div className="sa-modal-overlay" onClick={() => setChangePlanModal(false)}>
          <div className="sa-modal sa-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><i className="ri-vip-diamond-line" style={{ color: '#7c3aed' }}></i>Changer le plan</h3>
              <button className="sa-modal-close" onClick={() => setChangePlanModal(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 0' }}>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>Actuel : <strong>{tenant.plan?.name}</strong></p>
              <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <option value="">-- Choisir un plan --</option>
                {plans.filter(p => p.isActive).map(p => <option key={p._id} value={p._id}>{p.name} — {p.price} dt/mois</option>)}
              </select>
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn-secondary" onClick={() => setChangePlanModal(false)}>Annuler</button>
              <button className="sa-btn-primary" disabled={saving || !selectedPlan || selectedPlan === tenant.plan?._id}
                onClick={async () => { setSaving(true); try { await tenantService.changePlan(tenant._id, selectedPlan); onAction('plan_changed', '✅ Plan modifié'); setChangePlanModal(false); } catch(e){ alert(e.message); } finally { setSaving(false); } }}>
                {saving ? 'Sauvegarde...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editLimitsModal && <EditLimitsModal tenant={tenant} onClose={() => setEditLimitsModal(false)} onSaved={m => { setEditLimitsModal(false); onAction('limits_updated', m); }} />}
    </div>
  );
};

/* ── TenantsList principal ── */
const TenantsList = () => {
  const [tenants, setTenants]               = useState([]);
  const [plans, setPlans]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [filter, setFilter]                 = useState('all');
  const [search, setSearch]                 = useState('');
  const [msg, setMsg]                       = useState({ text: '', type: 'success' });
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionModal, setActionModal]       = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, pr] = await Promise.allSettled([tenantService.getAllTenants(), planService.getAll()]);
      if (tr.status === 'fulfilled') { const d = tr.value.data; setTenants(Array.isArray(d) ? d : (d?.data || [])); }
      if (pr.status === 'fulfilled') setPlans(pr.value.data?.data || pr.value.data?.plans || []);
    } catch { showMsg('Erreur de chargement', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: 'success' }), 4000); };

  const executeAction = async (type, tenantId, extra = {}) => {
    try {
      if (type === 'suspend')    await tenantService.suspendTenant(tenantId);
      if (type === 'reactivate') await tenantService.reactivateTenant(tenantId);
      if (type === 'delete')     await tenantService.deleteTenant(tenantId);
      if (type === 'approve')    await tenantService.approveTenant(tenantId, extra.durationMonths);
      if (type === 'reject')     await tenantService.rejectTenant(tenantId, extra.reason);
      if (type === 'resend')     await tenantService.resendCredentials(tenantId);
      if (type === 'renew')      await tenantService.renewSubscription(tenantId, extra.durationMonths);
      const labels = { suspend:'Entreprise suspendue', reactivate:'Entreprise réactivée', delete:'Entreprise supprimée', approve:'Entreprise approuvée', reject:'Demande rejetée', resend:'Identifiants renvoyés', renew:'Abonnement renouvelé' };
      showMsg('✅ ' + (labels[type] || 'Action effectuée'));
      setActionModal(null);
      if (type === 'delete' && selectedTenant?._id === tenantId) setSelectedTenant(null);
      await fetchData();
      if (selectedTenant && selectedTenant._id === tenantId && type !== 'delete') {
        const res = await tenantService.getAllTenants();
        const fresh = (Array.isArray(res.data) ? res.data : res.data?.data || []).find(t => t._id === tenantId);
        if (fresh) setSelectedTenant(fresh);
      }
    } catch (err) { showMsg('❌ ' + (err.message || 'Erreur'), 'error'); }
  };

  const handleDetailAction = async (type, payload) => {
    if (type === 'plan_changed' || type === 'limits_updated') { showMsg(payload || '✅ Mis à jour'); await fetchData(); const res = await tenantService.getAllTenants(); const fresh = (Array.isArray(res.data) ? res.data : res.data?.data || []).find(t => t._id === selectedTenant._id); if (fresh) setSelectedTenant(fresh); return; }
    if (type === 'error') { showMsg(payload, 'error'); return; }
    if (type === 'resend') { await executeAction('resend', selectedTenant._id); return; }
    setActionModal({ tenant: selectedTenant, type });
  };

  const FILTERS = [
    { key: 'all',       label: 'Tous',       icon: 'ri-apps-line' },
    { key: 'pending',   label: 'En attente', icon: 'ri-time-line' },
    { key: 'active',    label: 'Actifs',     icon: 'ri-checkbox-circle-line' },
    { key: 'suspended', label: 'Suspendus',  icon: 'ri-pause-circle-line' },
    { key: 'expired',   label: 'Expirés',    icon: 'ri-alarm-warning-line' },
    { key: 'rejected',  label: 'Refusés',    icon: 'ri-close-circle-line' },
  ];

  const filtered = tenants
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || t.companyName?.toLowerCase().includes(search.toLowerCase()) || t.adminEmail?.toLowerCase().includes(search.toLowerCase()));

  /* Vue détail */
  if (selectedTenant) return (
    <div className="sa-page">
      <TenantDetail tenant={selectedTenant} plans={plans} msg={msg} onClose={() => { setSelectedTenant(null); setMsg({ text: '', type: 'success' }); }} onAction={handleDetailAction} />
      {actionModal && <ActionModal actionModal={actionModal} onClose={() => setActionModal(null)} onConfirm={extra => executeAction(actionModal.type, actionModal.tenant._id, extra)} />}
    </div>
  );

  /* Vue liste */
  return (
    <div className="sa-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ri-building-2-line" style={{ color: '#2563eb', fontSize: '24px' }}></i>
            Entreprises
          </h1>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '13px' }}>
            {tenants.length} entreprise(s) · <span style={{ color: '#f59e0b', fontWeight: 600 }}>{tenants.filter(t => t.status === 'pending').length} en attente</span>
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px' }}></i>
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px 9px 34px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '13px', width: '220px', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ padding: '11px 16px', borderRadius: '9px', marginBottom: '16px', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#166534' : '#991b1b',
        }}>
          <i className={msg.type === 'success' ? 'ri-checkbox-circle-fill' : 'ri-error-warning-fill'}></i>
          {msg.text}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '7px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const count = f.key === 'all' ? tenants.length : tenants.filter(t => t.status === f.key).length;
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
              borderRadius: '9px', border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`,
              background: active ? '#2563eb' : '#fff', color: active ? '#fff' : '#64748b',
              fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
            }}>
              <i className={f.icon} style={{ fontSize: '13px' }}></i>
              {f.label}
              <span style={{ background: active ? 'rgba(255,255,255,.25)' : '#f1f5f9', color: active ? '#fff' : '#64748b', borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#94a3b8', gap: '10px', fontSize: '14px' }}>
          <i className="ri-loader-4-line" style={{ fontSize: '20px', animation: 'dspin .8s linear infinite' }}></i>
          Chargement...
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                {['Entreprise','Admin','Plan','Limites','Abonnement','Statut','Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                  <i className="ri-inbox-line" style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}></i>
                  Aucun résultat
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg,#2563eb,#1e40af)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                        {t.companyName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>{t.companyName}</strong>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.sector || t.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '12.5px', color: '#334155' }}>{t.adminFirstName} {t.adminLastName}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.adminEmail}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 9px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700 }}>{t.plan?.name || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    <i className="ri-user-line"></i> {t.limits?.maxUsers} &nbsp;·&nbsp; <i className="ri-flow-chart"></i> {t.limits?.maxWorkflows}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#64748b' }}>
                    {t.subscription?.endDate ? <>exp. {new Date(t.subscription.endDate).toLocaleDateString('fr-FR')}</> : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={t.status} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setSelectedTenant(t)} title="Voir" style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-eye-line" style={{ fontSize: '14px' }}></i>
                      </button>
                      {t.status === 'pending' && <>
                        <button onClick={() => setActionModal({ tenant: t, type: 'approve' })} title="Approuver" style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ri-checkbox-circle-line" style={{ fontSize: '14px' }}></i>
                        </button>
                        <button onClick={() => setActionModal({ tenant: t, type: 'reject' })} title="Rejeter" style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fee2e2', border: '1px solid #fca5a5', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="ri-close-circle-line" style={{ fontSize: '14px' }}></i>
                        </button>
                      </>}
                      {t.status === 'active' && <button onClick={() => setActionModal({ tenant: t, type: 'suspend' })} title="Suspendre" style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fff7ed', border: '1px solid #fed7aa', cursor: 'pointer', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-pause-circle-line" style={{ fontSize: '14px' }}></i>
                      </button>}
                      {(t.status === 'suspended' || t.status === 'rejected') && <button onClick={() => setActionModal({ tenant: t, type: 'reactivate' })} title="Réactiver" style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#dcfce7', border: '1px solid #86efac', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-play-circle-line" style={{ fontSize: '14px' }}></i>
                      </button>}
                      <button onClick={() => setActionModal({ tenant: t, type: 'delete' })} title="Supprimer" style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fff5f5', border: '1px solid #fecaca', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="ri-delete-bin-6-line" style={{ fontSize: '14px' }}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionModal && <ActionModal actionModal={actionModal} onClose={() => setActionModal(null)} onConfirm={extra => executeAction(actionModal.type, actionModal.tenant._id, extra)} />}
    </div>
  );
};

const ActionModal = ({ actionModal, onClose, onConfirm }) => {
  if (actionModal.type === 'approve') return <ApproveModal tenant={actionModal.tenant} onClose={onClose} onConfirm={onConfirm} />;
  if (actionModal.type === 'reject')  return <RejectModal  tenant={actionModal.tenant} onClose={onClose} onConfirm={onConfirm} />;
  if (actionModal.type === 'renew')   return <ApproveModal tenant={actionModal.tenant} onClose={onClose} onConfirm={onConfirm} renewMode />;

  const CFG = {
    suspend:    { title: 'Suspendre l\'entreprise', icon: 'ri-pause-circle-line',   color: '#ea580c', msg: (t) => `Suspendre <strong>${t.companyName}</strong> ?`, danger: true },
    reactivate: { title: 'Réactiver l\'entreprise', icon: 'ri-play-circle-line',    color: '#16a34a', msg: (t) => `Réactiver <strong>${t.companyName}</strong> ?`, danger: false },
    delete:     { title: 'Supprimer l\'entreprise', icon: 'ri-delete-bin-6-line',  color: '#dc2626', msg: (t) => `Supprimer définitivement <strong>${t.companyName}</strong> ? <br><br><span style="color:#dc2626">⚠️ La base <code>${t.dbName}</code> ne sera pas supprimée.</span>`, danger: true },
  };
  const c = CFG[actionModal.type] || {};
  return (
    <ConfirmModal
      title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><i className={c.icon} style={{ color: c.color }}></i>{c.title}</span>}
      message={c.msg?.(actionModal.tenant) || ''}
      onClose={onClose}
      onConfirm={onConfirm}
      danger={c.danger}
    />
  );
};

export default TenantsList;