import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

const ACTION_CONFIG = {
  workflow_started:        { label: 'Workflow démarré',   color: '#4f46e5', bg: '#ede9fe' },
  step_completed:          { label: 'Étape validée',      color: '#059669', bg: '#dcfce7' },
  step_rejected:           { label: 'Étape rejetée',      color: '#dc2626', bg: '#fee2e2' },
  workflow_completed:      { label: 'Workflow terminé',   color: '#059669', bg: '#dcfce7' },
  step_skipped_by_condition: { label: 'Étape sautée',    color: '#f59e0b', bg: '#fef3c7' },
};

const AuditLog = () => {
  const navigate = useNavigate();
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [filters,  setFilters]  = useState({ action: '', user: '', from: '', to: '', workflowId: '' });
  const [applied,  setApplied]  = useState({});

  const fetchAudit = useCallback(async (f = {}) => {
    setLoading(true);
    try {
      const res = await workflowService.getAuditLog(f);
      setEntries(res.data?.entries || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const handleApply = () => { setApplied(filters); fetchAudit(filters); };
  const handleReset = () => {
    const empty = { action: '', user: '', from: '', to: '', workflowId: '' };
    setFilters(empty); setApplied(empty); fetchAudit(empty);
  };

  const inp = {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
    fontSize: '13px', background: '#fff', color: '#0f172a',
  };

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const actionKeys = Object.keys(ACTION_CONFIG);

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={() => navigate(-1)}
          style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
          Retour
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Journal d'audit
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
            Traçabilité complète de toutes les actions sur les workflows — {total} entrée(s)
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Filtres
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Action</label>
            <select value={filters.action} onChange={e => setFilters(p => ({ ...p, action: e.target.value }))} style={{ ...inp, width: '100%' }}>
              <option value="">Toutes</option>
              {actionKeys.map(k => <option key={k} value={k}>{ACTION_CONFIG[k].label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Utilisateur</label>
            <input value={filters.user} onChange={e => setFilters(p => ({ ...p, user: e.target.value }))} placeholder="Nom..." style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Du</label>
            <input type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Au</label>
            <input type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleApply}
            style={{ padding: '8px 20px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            Appliquer
          </button>
          <button onClick={handleReset}
            style={{ padding: '8px 20px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* En-tête */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 140px 160px 180px', gap: '0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {['Date', 'Workflow / Étape', 'Action', 'Utilisateur', 'Commentaire'].map(h => (
            <div key={h} style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Corps */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📋</p>
            <p style={{ margin: 0, fontWeight: 600 }}>Aucune entrée d'audit</p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const cfg = ACTION_CONFIG[entry.action] || { label: entry.action, color: '#64748b', bg: '#f1f5f9' };
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '160px 1fr 140px 160px 180px',
                borderBottom: i < entries.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}>
                {/* Date */}
                <div style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                  {formatDate(entry.date)}
                </div>
                {/* Workflow / Étape */}
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span
                    onClick={() => navigate('/dashboard/company/workflows/' + entry.workflowId)}
                    style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent' }}
                    onMouseEnter={e => e.target.style.textDecorationColor = '#4f46e5'}
                    onMouseLeave={e => e.target.style.textDecorationColor = 'transparent'}
                  >
                    {entry.workflowName}
                  </span>
                  {entry.stepName && (
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Étape : {entry.stepName}
                    </span>
                  )}
                </div>
                {/* Action */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>
                </div>
                {/* Utilisateur */}
                <div style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {entry.byName || '—'}
                </div>
                {/* Commentaire */}
                <div style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', fontStyle: entry.comment ? 'italic' : 'normal' }}>
                  {entry.comment ? `"${entry.comment}"` : '—'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer total */}
      {!loading && entries.length > 0 && (
        <div style={{ marginTop: '12px', textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
          {entries.length} entrée(s) affichée(s) sur {total} au total
        </div>
      )}
    </div>
  );
};

export default AuditLog;