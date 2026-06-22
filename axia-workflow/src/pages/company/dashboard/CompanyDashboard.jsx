import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

// ── Design tokens ─────────────────────────────────────────────────────────
const C = {
  primary: '#2563eb', primaryDark: '#1d4ed8', primaryTint: '#eff6ff', primarySoft: '#dbeafe',
  ink: '#0f172a', body: '#475569', muted: '#94a3b8',
  border: '#e5e7eb', borderSoft: '#eef1f5', bg: '#f7f8fa', surface: '#ffffff',
  success: '#16a34a', successTint: '#f0fdf4', successSoft: '#dcfce7',
  danger: '#dc2626', dangerTint: '#fef2f2', dangerSoft: '#fee2e2',
  warning: '#d97706', warningTint: '#fffbeb', warningSoft: '#fef3c7',
  neutral: '#64748b', neutralTint: '#f8fafc', neutralSoft: '#f1f5f9',
};

const card = { background: C.surface, borderRadius: '16px', border: `1px solid ${C.borderSoft}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' };

// ── Icon badge : halo en dégradé + icône en gradient + glow ──────────────
const IconBadge = ({ icon, color, size = 42, iconSize = 20, square = false }) => (
  <div
    style={{
      width: size, height: size, borderRadius: square ? size * 0.28 : size * 0.28,
      flexShrink: 0, position: 'relative',
      background: `linear-gradient(135deg, ${color}29, ${color}0d)`,
      border: `1px solid ${color}38`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 10px ${color}26, inset 0 1px 1px rgba(255,255,255,0.7)`,
    }}
  >
    <i
      className={icon}
      style={{
        fontSize: iconSize,
        backgroundImage: `linear-gradient(135deg, ${color}, ${color}aa)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        filter: `drop-shadow(0 1px 2px ${color}40)`,
      }}
    />
  </div>
);

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [tab,     setTab]     = useState('instances'); // 'instances' | 'templates'

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await workflowService.getStats();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ padding: '120px 0', textAlign: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <i className="ri-loader-4-line" style={{ fontSize: '28px', color: C.primary, display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ margin: '14px 0 0', color: C.muted, fontSize: '13px', fontWeight: 600 }}>Chargement du tableau de bord…</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <i className="ri-error-warning-line" style={{ fontSize: '28px', color: C.danger }} />
        <p style={{ margin: '12px 0 0', color: C.body, fontWeight: 600, fontSize: '13px' }}>Erreur de chargement</p>
      </div>
    );
  }

  const { stats, workflows = [], templates = [] } = data;

  const filteredInstances = workflows.filter((wf) => {
    if (filter === 'active')    return wf.status === 'active';
    if (filter === 'overdue')   return wf.isOverdue || wf.stepOverdue;
    if (filter === 'completed') return wf.status === 'completed';
    if (filter === 'rejected')  return wf.status === 'rejected';
    return true;
  });

  const filteredTemplates = templates.filter((wf) => {
    if (filter === 'active') return wf.status === 'active';
    if (filter === 'draft')  return wf.status === 'draft';
    return true;
  });

  const getStatusMeta = (wf) => {
    if (wf.status === 'completed') return { tint: C.successTint, border: '#bbf7d0', rail: C.success, label: 'Terminé', icon: 'ri-checkbox-circle-fill' };
    if (wf.status === 'rejected')  return { tint: C.dangerTint, border: '#fecaca', rail: C.danger, label: 'Rejeté', icon: 'ri-close-circle-fill' };
    if (wf.isOverdue || wf.stepOverdue) return { tint: C.dangerTint, border: '#fecaca', rail: C.danger, label: 'En retard', icon: 'ri-alarm-warning-fill' };
    if (wf.status === 'active')    return { tint: C.primaryTint, border: '#bfdbfe', rail: C.primary, label: 'Actif', icon: 'ri-time-fill' };
    return { tint: C.neutralTint, border: C.borderSoft, rail: C.muted, label: 'Brouillon', icon: 'ri-draft-fill' };
  };

  // ── Carte pour les DEMANDES (instances) ─────────────────────────────────
  const DemandeCard = ({ wf }) => {
    const sc = getStatusMeta(wf);
    const isLate = wf.isOverdue || wf.stepOverdue;
    return (
      <div
        onClick={() => navigate('/dashboard/company/workflows/' + wf._id)}
        style={{ ...card, position: 'relative', overflow: 'hidden', padding: '20px 24px 20px 28px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: sc.rail }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <IconBadge icon={sc.icon} color={sc.rail} size={42} iconSize={19} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {wf.name}
              </h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: sc.tint, color: sc.rail, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                <i className={sc.icon} style={{ fontSize: '11px' }} />
                {sc.label}
              </span>
              {isLate && wf.status !== 'completed' && wf.status !== 'rejected' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: C.warningTint, color: C.warning, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  <i className="ri-alarm-warning-fill" style={{ fontSize: '11px' }} /> Retard
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '6px', background: C.neutralSoft, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: wf.progress + '%', background: wf.status === 'completed' ? C.success : isLate ? C.danger : C.primary, borderRadius: '3px', transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: C.body, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{wf.progress}%</span>
              <span style={{ fontSize: '12px', color: C.muted, flexShrink: 0 }}>{wf.doneSteps}/{wf.totalSteps} étapes</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '150px', borderLeft: `1px solid ${C.borderSoft}`, paddingLeft: '18px' }}>
            {wf.status === 'active' && wf.currentStepName && (
              <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 700, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                {wf.currentStepName} <i className="ri-arrow-right-up-line" style={{ fontSize: '12px' }} />
              </p>
            )}
            {wf.status === 'active' && wf.currentStepAssignee && (
              <p style={{ margin: '0 0 5px', fontSize: '11px', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <i className="ri-user-3-line" style={{ fontSize: '12px' }} /> {wf.currentStepAssignee}
              </p>
            )}
            {wf.createdBy && (
              <p style={{ margin: '5px 0 0', fontSize: '11px', color: C.muted }}>
                Par {wf.createdBy.firstName} {wf.createdBy.lastName}
              </p>
            )}
            {wf.dueDate && (
              <p style={{ margin: '5px 0 0', fontSize: '11px', color: isLate ? C.danger : C.muted, fontWeight: isLate ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <i className="ri-calendar-event-line" style={{ fontSize: '12px' }} /> {new Date(wf.dueDate).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Carte pour les WORKFLOWS (templates) ────────────────────────────────
  const WorkflowCard = ({ wf }) => {
    const isActive = wf.status === 'active';
    const stepCount = wf.totalSteps || wf.steps?.length || 0;
    const createdAt = wf.createdAt ? new Date(wf.createdAt).toLocaleDateString('fr-FR') : '—';
    const updatedAt = wf.updatedAt ? new Date(wf.updatedAt).toLocaleDateString('fr-FR') : '—';
    const rail = isActive ? C.primary : C.muted;

    return (
      <div
        onClick={() => navigate('/dashboard/company/workflows/' + wf._id)}
        style={{ ...card, position: 'relative', overflow: 'hidden', padding: '20px 24px 20px 28px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = card.boxShadow; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: rail }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <IconBadge icon={isActive ? 'ri-flashlight-fill' : 'ri-draft-line'} color={rail} size={42} iconSize={19} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.ink }}>{wf.name}</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: isActive ? C.successSoft : C.neutralSoft, color: isActive ? '#15803d' : C.neutral }}>
                <i className={isActive ? 'ri-checkbox-circle-fill' : 'ri-draft-fill'} style={{ fontSize: '11px' }} />
                {isActive ? 'Actif' : 'Brouillon'}
              </span>
              {(wf.allowedPosts?.length > 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <i className="ri-lock-2-line" style={{ fontSize: '11px', color: C.primary }} />
                  {wf.allowedPosts.map(p => (
                    <span key={p} style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: C.primaryTint, color: C.primaryDark, border: `1px solid ${C.primarySoft}` }}>
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: C.successSoft, color: '#15803d' }}>
                  <i className="ri-global-line" style={{ fontSize: '11px' }} /> Tous les employés
                </span>
              )}
            </div>

            {wf.description && (
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {wf.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: C.body, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="ri-list-ordered" style={{ fontSize: '13px', color: C.muted }} />
                <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{stepCount}</strong> étape{stepCount > 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '12px', color: C.muted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="ri-calendar-line" style={{ fontSize: '13px' }} /> Créé le {createdAt}
              </span>
              {updatedAt !== createdAt && (
                <span style={{ fontSize: '12px', color: C.muted, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <i className="ri-edit-2-line" style={{ fontSize: '13px' }} /> Modifié le {updatedAt}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); navigate('/dashboard/company/workflows/' + wf._id); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', border: `1px solid ${C.border}`, background: C.surface, color: C.body, fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.body; }}
          >
            <i className="ri-eye-line" style={{ fontSize: '14px' }} /> Voir
          </button>
        </div>
      </div>
    );
  };

  const isInstances = tab === 'instances';
  const activeList  = isInstances ? filteredInstances : filteredTemplates;

  const allStats = [
    { label: 'Demandes total',  value: stats.total,     color: C.primary, tint: C.primaryTint, icon: 'ri-file-list-3-line' },
    { label: 'En cours',        value: stats.active,    color: '#0891b2', tint: '#ecfeff',      icon: 'ri-time-line' },
    { label: 'Terminées',       value: stats.completed, color: C.success, tint: C.successTint,  icon: 'ri-checkbox-circle-line' },
    { label: 'Rejetées',        value: stats.rejected,  color: C.danger,  tint: C.dangerTint,   icon: 'ri-close-circle-line' },
    { label: 'En retard',       value: stats.overdue,   color: C.warning, tint: C.warningTint,  icon: 'ri-alarm-warning-line' },
    { label: 'Workflows actifs', value: stats.activeTemplates ?? templates.filter(t => t.status === 'active').length, color: '#7c3aed', tint: '#f5f3ff', icon: 'ri-flashlight-line' },
    { label: 'Brouillons',      value: stats.draftTemplates ?? templates.filter(t => t.status === 'draft').length, color: C.muted, tint: C.neutralSoft, icon: 'ri-draft-line' },
  ];

  return (
    <div style={{ padding: '32px', background: C.bg, minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: C.ink, letterSpacing: '-0.02em' }}>Tableau de bord</h1>
        <p style={{ margin: 0, color: C.muted, fontSize: '14px' }}>Suivi en temps réel de vos workflows</p>
      </div>

      {/* ── Stats : grille uniforme, 4 par ligne ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {allStats.map((stat) => (
          <div key={stat.label} style={{ ...card, position: 'relative', overflow: 'hidden', padding: '18px 18px 22px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: '0 0 9px', fontSize: '11px', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: '30px', fontWeight: 800, color: C.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{stat.value}</p>
              </div>
              <IconBadge icon={stat.icon} color={stat.color} size={46} iconSize={21} />
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '3px', background: stat.color }} />
          </div>
        ))}
      </div>

      {/* ── Alerte retards ── */}
      {stats.overdue > 0 && (
        <div style={{ ...card, position: 'relative', overflow: 'hidden', padding: '16px 20px 16px 28px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: C.danger }} />
          <IconBadge icon="ri-alarm-warning-fill" color={C.danger} size={40} iconSize={19} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 3px', fontWeight: 700, color: C.ink, fontSize: '14px' }}>{stats.overdue} demande{stats.overdue > 1 ? 's' : ''} en retard</p>
            <p style={{ margin: 0, color: C.muted, fontSize: '13px' }}>Ces demandes ont dépassé leur échéance — à traiter en priorité.</p>
          </div>
          <button onClick={() => { setFilter('overdue'); setTab('instances'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: C.danger, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>
            Voir <i className="ri-arrow-right-line" />
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'inline-flex', gap: '4px', marginBottom: '18px', background: C.neutralSoft, padding: '4px', borderRadius: '12px' }}>
        {[
          { key: 'instances', label: 'Demandes', icon: 'ri-inbox-line', count: stats.total },
          { key: 'templates', label: 'Workflows', icon: 'ri-flow-chart', count: stats.totalTemplates ?? templates.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilter('all'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '9px',
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: '0.15s ease',
              background: tab === t.key ? C.surface : 'transparent',
              color: tab === t.key ? C.primary : C.body,
              boxShadow: tab === t.key ? '0 1px 3px rgba(15,23,42,0.1)' : 'none',
            }}
          >
            <i className={t.icon} style={{ fontSize: '17px' }} />
            <span>{t.label}</span>
            <span style={{
              fontSize: '11px', padding: '1px 7px', borderRadius: '999px', fontWeight: 700,
              background: tab === t.key ? C.primaryTint : '#e2e8f0',
              color: tab === t.key ? C.primary : C.neutral,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(isInstances ? [
          { key: 'all',       label: 'Tous (' + stats.total + ')',          color: C.primary },
          { key: 'active',    label: 'En cours (' + stats.active + ')',     color: '#0891b2' },
          { key: 'overdue',   label: 'En retard (' + stats.overdue + ')',   color: C.warning },
          { key: 'completed', label: 'Terminées (' + stats.completed + ')', color: C.success },
          { key: 'rejected',  label: 'Rejetées (' + stats.rejected + ')',   color: C.danger },
        ] : [
          { key: 'all',    label: 'Tous (' + templates.length + ')',                                         color: C.primary },
          { key: 'active', label: 'Actifs (' + templates.filter(t => t.status === 'active').length + ')',     color: C.success },
          { key: 'draft',  label: 'Brouillons (' + templates.filter(t => t.status === 'draft').length + ')',  color: C.muted },
        ]).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: '7px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 700, fontSize: '12.5px',
              border: `1px solid ${filter === f.key ? f.color : C.border}`,
              background: filter === f.key ? f.color : C.surface,
              color: filter === f.key ? '#fff' : C.body,
              transition: 'all 0.15s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Liste ── */}
      {activeList.length === 0 ? (
        <div style={{ ...card, padding: '60px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex' }}>
            <IconBadge icon={isInstances ? 'ri-inbox-archive-line' : 'ri-flashlight-line'} color={C.muted} size={54} iconSize={24} />
          </div>
          <p style={{ margin: '16px 0 0', fontWeight: 700, color: C.ink, fontSize: '14px' }}>
            {isInstances ? 'Aucune demande dans cette catégorie' : 'Aucun workflow dans cette catégorie'}
          </p>
          {!isInstances && (
            <button onClick={() => navigate('/dashboard/company/workflows/new')}
              style={{ marginTop: '18px', display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 22px', borderRadius: '10px', background: C.primary, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              <i className="ri-add-line" /> Créer un workflow
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeList.map((wf) =>
            isInstances
              ? <DemandeCard  key={wf._id} wf={wf} />
              : <WorkflowCard key={wf._id} wf={wf} />
          )}
        </div>
      )}
    </div>
  );
};
export default CompanyDashboard;