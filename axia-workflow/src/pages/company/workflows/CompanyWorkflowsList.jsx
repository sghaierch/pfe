import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

const STATUS_CFG = {
  draft:     { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon',  dot: '#94a3b8'  },
  active:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Actif',      dot: '#3b82f6'  },
  completed: { bg: '#f0fdf4', color: '#166534', label: 'Terminé',    dot: '#22c55e'  },
  rejected:  { bg: '#fff5f5', color: '#dc2626', label: 'Rejeté',     dot: '#ef4444'  },
  archived:  { bg: '#f8fafc', color: '#94a3b8', label: 'Archivé',    dot: '#cbd5e1'  },
};

const CompanyWorkflowsList = () => {
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [msg,       setMsg]       = useState('');
  const [deleting,  setDeleting]  = useState(null); // id en cours de suppression
  const [filter,    setFilter]    = useState('all'); // all | draft | active | completed

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowService.getAll();
      // support { data: { workflows } } ou { workflows } ou tableau direct
      const list = res?.data?.workflows || res?.workflows || res?.data || [];
      setWorkflows(Array.isArray(list) ? list : []);
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const handleDelete = async (wf) => {
    if (wf.status !== 'draft') {
      showMsg('ERREUR Seuls les brouillons peuvent être supprimés.');
      return;
    }
    if (!window.confirm(`Supprimer le workflow "${wf.name}" ? Cette action est irréversible.`)) return;
    setDeleting(wf._id);
    try {
      await workflowService.delete(wf._id);
      showMsg('SUCCESS Workflow supprimé.');
      fetchWorkflows();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setDeleting(null); }
  };

  const handleEdit = (wf) => {
    navigate('/dashboard/company/workflows/' + wf._id + '/edit-info');
  };

  // ── Filtres ────────────────────────────────────────────────────────────────
  const filtered = workflows.filter(wf => filter === 'all' || wf.status === filter);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  let msgBg = '#f1f5f9', msgColor = '#334155', msgText = msg;
  if (msg.startsWith('SUCCESS')) { msgBg = '#f0fdf4'; msgColor = '#166534'; msgText = msg.replace('SUCCESS ', ''); }
  else if (msg.startsWith('ERREUR')) { msgBg = '#fff5f5'; msgColor = '#dc2626'; msgText = msg.replace('ERREUR ', ''); }

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8', fontSize: '15px' }}>
      Chargement des workflows...
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
          Workflows ({filtered.length})
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/dashboard/company/templates')}
            style={{ padding: '9px 18px', borderRadius: '8px', background: '#7c3aed', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
          >
            + Générer avec l'IA
          </button>
          <button
            onClick={() => navigate('/dashboard/company/workflows/new')}
            style={{ padding: '9px 18px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
          >
            + Nouveau workflow
          </button>
        </div>
      </div>

      {/* ── Message ── */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, background: msgBg, color: msgColor }}>
          {msgText}
        </div>
      )}

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all',       label: 'Tous' },
          { key: 'draft',     label: 'Brouillons' },
          { key: 'active',    label: 'Actifs' },
          { key: 'completed', label: 'Terminés' },
          { key: 'rejected',  label: 'Rejetés' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid',
              borderColor: filter === f.key ? '#4f46e5' : '#e2e8f0',
              background:  filter === f.key ? '#ede9fe' : '#f8fafc',
              color:       filter === f.key ? '#4f46e5' : '#64748b',
              fontWeight:  filter === f.key ? 700 : 500,
              fontSize: '13px', cursor: 'pointer',
            }}
          >
            {f.label}
            {f.key !== 'all' && (
              <span style={{ marginLeft: '6px', background: filter === f.key ? '#4f46e5' : '#e2e8f0', color: filter === f.key ? '#fff' : '#64748b', borderRadius: '10px', padding: '0 6px', fontSize: '11px', fontWeight: 700 }}>
                {workflows.filter(w => w.status === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Liste ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📋</p>
          <p style={{ color: '#94a3b8', fontWeight: 600, margin: 0 }}>Aucun workflow trouvé</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(wf => {
            const sc      = STATUS_CFG[wf.status] || STATUS_CFG.draft;
            const total   = wf.steps?.length || 0;
            const done    = wf.steps?.filter(s => s.status === 'completed').length || 0;
            const current = wf.currentStep ?? 0;
            const isDraft = wf.status === 'draft';

            return (
              <div
                key={wf._id}
                style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

                  {/* ── Infos principales ── */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                        {wf.name}
                      </h2>
                      {/* Badge statut */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {sc.label}
                      </span>
                      {/* Badge docType */}
                      {wf.docType && (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                          {wf.docType}
                        </span>
                      )}
                    </div>

                    {/* Étapes visuelles */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {(wf.steps || []).map((step, i) => {
                        const active = wf.status === 'active' && i === current;
                        const done_s = step.status === 'completed';
                        const rej    = step.status === 'rejected';
                        return (
                          <React.Fragment key={i}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: done_s ? '#059669' : rej ? '#dc2626' : active ? '#4f46e5' : '#e2e8f0',
                                color: done_s || rej || active ? '#fff' : '#94a3b8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 700, flexShrink: 0,
                                border: active ? '2px solid #818cf8' : '2px solid transparent',
                              }}>
                                {done_s ? '✓' : rej ? '✗' : i + 1}
                              </div>
                              <span style={{ fontSize: '11px', color: active ? '#4f46e5' : '#94a3b8', fontWeight: active ? 700 : 400, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {step.name}
                              </span>
                            </div>
                            {i < (wf.steps.length - 1) && (
                              <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Méta : étape courante, échéance */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {wf.status !== 'draft' && (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Étape {done + 1}/{total}
                        </span>
                      )}
                      {wf.dueDate && (
                        <span style={{ fontSize: '12px', color: new Date(wf.dueDate) < new Date() ? '#dc2626' : '#94a3b8' }}>
                          📅 {new Date(wf.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {wf.project?.name && (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>📁 {wf.project.name}</span>
                      )}
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>

                    {/* Démarrer (brouillon uniquement) */}
                    {isDraft && (
                      <button
                        onClick={async () => {
                          try {
                            await workflowService.start(wf._id);
                            showMsg('SUCCESS Workflow démarré !');
                            fetchWorkflows();
                          } catch (err) {
                            showMsg('ERREUR ' + (err.response?.data?.message || err.message));
                          }
                        }}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                      >
                        Démarrer
                      </button>
                    )}

                    {/* Modifier (brouillon uniquement) */}
                    {isDraft && (
                      <button
                        onClick={() => handleEdit(wf)}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: '#ede9fe', color: '#4f46e5', border: '1px solid #c4b5fd', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                      >
                        ✏️ Modifier
                      </button>
                    )}

                    {/* Voir */}
                    <button
                      onClick={() => navigate('/dashboard/company/workflows/' + wf._id)}
                      style={{ padding: '8px 16px', borderRadius: '8px', background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                    >
                      Voir
                    </button>

                    {/* Supprimer (brouillon uniquement) */}
                    {isDraft && (
                      <button
                        onClick={() => handleDelete(wf)}
                        disabled={deleting === wf._id}
                        style={{ padding: '8px 12px', borderRadius: '8px', background: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, cursor: deleting === wf._id ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: deleting === wf._id ? 0.6 : 1 }}
                      >
                        {deleting === wf._id ? '...' : '🗑️'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyWorkflowsList;
