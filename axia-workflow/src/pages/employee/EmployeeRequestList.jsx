import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// ✅ FIX BUG 1 : on n'utilise plus templateService (qui retourne les WorkflowTemplates)
//   mais workflowService pour récupérer les workflows isTemplate:true (instances admin)
import workflowService from '../../services/workflowService';

const C = {
  primary:   '#4f46e5',
  primary2:  '#7c3aed',
  success:   '#059669',
  warning:   '#d97706',
  bg:        '#f4f6fb',
  surface:   '#ffffff',
  border:    '#e8edf5',
  text:      '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};
const font = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const TYPE_CONFIG = {
  validation_confirmation: {
    label: 'Validation + Confirmation',
    color: '#4f46e5', bg: '#ede9fe',
    icon: '✅',
    desc: 'Nécessite validation puis confirmation',
  },
  confirmation_only: {
    label: 'Confirmation simple',
    color: '#059669', bg: '#dcfce7',
    icon: '☑️',
    desc: 'Une seule étape de confirmation',
  },
  automatic: {
    label: 'Automatique',
    color: '#d97706', bg: '#fef3c7',
    icon: '⚡',
    desc: 'Approuvé automatiquement',
  },
};

const EmployeeRequestList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        // ✅ FIX BUG 1 : appeler le nouvel endpoint /workflows/templates/active
        //   qui retourne uniquement les workflows isTemplate:true + status:'active'
        const res = await workflowService.getActiveTemplates();
        const list =
          res?.data?.workflows ||
          res?.data?.data      ||
          res?.data            ||
          [];
        const active = Array.isArray(list) ? list : [];
        setTemplates(active);
      } catch (err) {
        console.error('Erreur chargement templates:', err);
        setError('Impossible de charger les types de demandes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✅ Déduire le type depuis les steps (si pas de champ type direct sur le workflow)
  const inferType = (wf) => {
    if (wf.type) return wf.type;
    const steps = wf.steps || [];
    const hasAuto = steps.some(s => s.assignedPost === 'AUTO' || s.role === 'system');
    if (hasAuto) return 'automatic';
    const hasValidation = steps.some(s => s.role === 'validateur' || (s.claims?.canValidate && s.role !== 'employe'));
    const hasConfirmation = steps.filter(s => s.role !== 'employe').length >= 2;
    if (hasConfirmation) return 'validation_confirmation';
    return 'confirmation_only';
  };

  const types = ['all', ...Object.keys(TYPE_CONFIG)];

  const filtered = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase());
    const inferredType = inferType(t);
    const matchFilter  = filter === 'all' || inferredType === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, fontFamily: font }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: `4px solid ${C.border}`, borderTop: `4px solid ${C.primary}`, borderRadius: '50%', margin: '0 auto 14px', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: C.textMuted, fontWeight: 600 }}>Chargement...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '32px' }}>
          <button onClick={() => navigate('/dashboard/employee')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: C.surface, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: '9px', cursor: 'pointer', fontWeight: 600, color: C.textMuted, fontSize: '13px', marginBottom: '20px', fontFamily: font }}>
            ← Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: C.text }}>
                Nouvelle demande
              </h1>
              <p style={{ margin: 0, color: C.textMuted, fontSize: '14px' }}>
                Choisissez le type de demande que vous souhaitez soumettre
              </p>
            </div>
            <span style={{ background: C.primary + '15', color: C.primary, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {templates.length} type{templates.length > 1 ? 's' : ''} disponible{templates.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', background: '#fee2e2', color: '#991b1b', fontWeight: 600, border: '1px solid #fecaca', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Recherche + filtres ── */}
        <div style={{ background: C.surface, borderRadius: '14px', padding: '16px 20px', border: `1px solid ${C.border}`, marginBottom: '24px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: C.textLight, fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un type de demande..."
              style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '10px', border: `1.5px solid ${C.border}`, fontSize: '14px', boxSizing: 'border-box', outline: 'none', background: '#f8fafc', fontFamily: font, color: C.text, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {types.map(t => {
              const cfg = TYPE_CONFIG[t];
              const isActive = filter === t;
              return (
                <button key={t} onClick={() => setFilter(t)}
                  style={{ padding: '5px 14px', borderRadius: '20px', border: `1.5px solid ${isActive ? (cfg?.color || C.primary) : C.border}`, background: isActive ? (cfg?.bg || '#ede9fe') : C.surface, color: isActive ? (cfg?.color || C.primary) : C.textMuted, fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: font, transition: 'all .15s' }}>
                  {t === 'all' ? 'Tous' : cfg?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Liste ── */}
        {filtered.length === 0 ? (
          <div style={{ background: C.surface, borderRadius: '16px', padding: '60px 40px', textAlign: 'center', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: C.text, margin: '0 0 8px', fontFamily: font }}>Aucun type de demande disponible</h3>
            <p style={{ color: C.textMuted, margin: 0, fontSize: '14px' }}>
              {search ? `Aucun résultat pour "${search}"` : 'Contactez votre administrateur.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(template => {
              const inferredType = inferType(template);
              const cfg = TYPE_CONFIG[inferredType] || TYPE_CONFIG.confirmation_only;
              const stepsCount = template.steps?.length || 0;

              return (
                <div key={template._id}
                  // ✅ FIX BUG 1 : passer l'_id du workflow template (pas templateId)
                  onClick={() => navigate('/dashboard/employee/submit-request?template=' + template._id)}
                  style={{ background: C.surface, borderRadius: '14px', border: `1.5px solid ${C.border}`, padding: '18px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 1px 4px rgba(15,23,42,0.04)', transition: 'all .15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.boxShadow = `0 4px 16px ${cfg.color}22`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.04)'; e.currentTarget.style.transform = 'none'; }}>

                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                    {cfg.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.text, fontFamily: font }}>{template.name}</h3>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: C.textMuted, lineHeight: 1.4 }}>
                      {template.description || cfg.desc}
                    </p>
                    {stepsCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        {template.steps.map((step, i) => (
                          <React.Fragment key={i}>
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>{step.name}</span>
                            {i < stepsCount - 1 && <span style={{ color: C.textLight, fontSize: '11px' }}>→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color, fontSize: '16px', flexShrink: 0, fontWeight: 700 }}>
                    →
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeRequestList;
