import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>;
  if (!data)   return <div style={{ padding: '40px' }}>Erreur de chargement</div>;

  const { stats, workflows = [], templates = [] } = data;

  // ── Filtrage des demandes (instances) ────────────────────────────────────────
  const filteredInstances = workflows.filter((wf) => {
    if (filter === 'active')    return wf.status === 'active';
    if (filter === 'overdue')   return wf.isOverdue || wf.stepOverdue;
    if (filter === 'completed') return wf.status === 'completed';
    if (filter === 'rejected')  return wf.status === 'rejected';
    return true;
  });

  // ── Filtrage des templates ───────────────────────────────────────────────────
  const filteredTemplates = templates.filter((wf) => {
    if (filter === 'active')  return wf.status === 'active';
    if (filter === 'overdue') return false;
    return true;
  });

  const getStatusColor = (wf) => {
    if (wf.status === 'completed') return { bg: '#f0fdf4', border: '#86efac', dot: '#059669', label: 'Terminé' };
    if (wf.status === 'rejected')  return { bg: '#fff5f5', border: '#fecaca', dot: '#dc2626', label: 'Rejeté' };
    if (wf.isOverdue || wf.stepOverdue) return { bg: '#fff5f5', border: '#fecaca', dot: '#dc2626', label: 'En retard' };
    if (wf.status === 'active')    return { bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', label: 'Actif' };
    return { bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8', label: 'Brouillon' };
  };

  const WorkflowCard = ({ wf, isTemplate }) => {
    const sc = getStatusColor(wf);
    return (
      <div
        onClick={() => navigate('/dashboard/company/workflows/' + wf._id)}
        style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', border: '1px solid ' + sc.border, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {wf.name}
              </h3>
              <span style={{ background: sc.bg, color: sc.dot, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                {sc.label}
              </span>
              {isTemplate && (
                <span style={{ background: '#ede9fe', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  📋 Template
                </span>
              )}
              {(wf.isOverdue || wf.stepOverdue) && (
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  ⚠️ RETARD
                </span>
              )}
            </div>
            {wf.status !== 'draft' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: wf.progress + '%', background: wf.status === 'completed' ? '#059669' : wf.isOverdue ? '#dc2626' : '#4f46e5', borderRadius: '3px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>{wf.progress}%</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>{wf.doneSteps}/{wf.totalSteps} étapes</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {wf.status === 'active' && wf.currentStepName && (
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                Étape : {wf.currentStepName}
              </p>
            )}
            {wf.status === 'active' && wf.currentStepAssignee && (
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>👤 {wf.currentStepAssignee}</p>
            )}
            {wf.dueDate && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: wf.isOverdue ? '#dc2626' : '#94a3b8', fontWeight: wf.isOverdue ? 700 : 400 }}>
                📅 {new Date(wf.dueDate).toLocaleDateString('fr-FR')}
              </p>
            )}
            {wf.createdBy && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                par {wf.createdBy.firstName} {wf.createdBy.lastName}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const activeList    = tab === 'instances' ? filteredInstances : filteredTemplates;
  const isInstances   = tab === 'instances';

  return (
    <div style={{ padding: '32px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>Tableau de bord</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Suivi en temps réel de vos workflows</p>
      </div>

      {/* ── Stats demandes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {[
          { label: 'Demandes total', value: stats.total,     color: '#4f46e5', bg: '#ede9fe', icon: '📊' },
          { label: 'En cours',       value: stats.active,    color: '#3b82f6', bg: '#dbeafe', icon: '⏳' },
          { label: 'Terminées',      value: stats.completed, color: '#059669', bg: '#dcfce7', icon: '✅' },
          { label: 'Rejetées',       value: stats.rejected,  color: '#dc2626', bg: '#fee2e2', icon: '❌' },
          { label: 'En retard',      value: stats.overdue,   color: '#f59e0b', bg: '#fef3c7', icon: '⚠️' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: stat.color }}>{stat.value}</p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stat templates ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 18px', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TEMPLATES ACTIFS</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#4f46e5' }}>{stats.activeTemplates ?? templates.filter(t => t.status === 'active').length}</p>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '12px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📝</span>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>BROUILLONS</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#94a3b8' }}>{stats.draftTemplates ?? templates.filter(t => t.status === 'draft').length}</p>
          </div>
        </div>
      </div>

      {/* ── Alerte retards ── */}
      {stats.overdue > 0 && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#dc2626', fontSize: '15px' }}>{stats.overdue} demande(s) en retard !</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Ces demandes ont dépassé leur échéance. Traitez-les en priorité.</p>
          </div>
          <button onClick={() => { setFilter('overdue'); setTab('instances'); }}
            style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: '8px', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>
            Voir les retards
          </button>
        </div>
      )}

      {/* ── Tabs : Demandes / Templates ── */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>
        {[
          { key: 'instances', label: '📥 Demandes', count: stats.total },
          { key: 'templates', label: '📋 Templates', count: stats.totalTemplates ?? templates.length },
        ].map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setFilter('all'); }}
            style={{ padding: '10px 22px', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              color: tab === t.key ? '#4f46e5' : '#94a3b8',
              borderBottom: tab === t.key ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s' }}>
            {t.label}
            <span style={{ marginLeft: '6px', background: tab === t.key ? '#ede9fe' : '#f1f5f9', color: tab === t.key ? '#4f46e5' : '#94a3b8', padding: '1px 7px', borderRadius: '10px', fontSize: '12px' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(isInstances ? [
          { key: 'all',       label: 'Tous (' + stats.total + ')',          color: '#4f46e5' },
          { key: 'active',    label: 'En cours (' + stats.active + ')',     color: '#3b82f6' },
          { key: 'overdue',   label: 'En retard (' + stats.overdue + ')',   color: '#dc2626' },
          { key: 'completed', label: 'Terminées (' + stats.completed + ')', color: '#059669' },
          { key: 'rejected',  label: 'Rejetées (' + stats.rejected + ')',   color: '#64748b' },
        ] : [
          { key: 'all',    label: 'Tous (' + templates.length + ')',                              color: '#4f46e5' },
          { key: 'active', label: 'Actifs (' + templates.filter(t => t.status === 'active').length + ')', color: '#059669' },
        ]).map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '7px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: filter === f.key ? f.color : '#f1f5f9',
              color:      filter === f.key ? '#fff'   : '#64748b',
              transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Liste ── */}
      {activeList.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>{isInstances ? '📥' : '📋'}</p>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {isInstances ? 'Aucune demande dans cette catégorie' : 'Aucun template dans cette catégorie'}
          </p>
          {!isInstances && (
            <button onClick={() => navigate('/dashboard/company/workflows/new')}
              style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              + Créer un workflow
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeList.map((wf) => (
            <WorkflowCard key={wf._id} wf={wf} isTemplate={!isInstances} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
