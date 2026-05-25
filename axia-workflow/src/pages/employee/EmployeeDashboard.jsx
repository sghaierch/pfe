import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import workflowService from '../../services/workflowService';
import NotificationBell from '../../components/NotificationBell';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:   '#4f46e5',
  primary2:  '#7c3aed',
  success:   '#059669',
  danger:    '#dc2626',
  warning:   '#d97706',
  info:      '#0891b2',
  bg:        '#f1f5f9',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  text:      '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
};
const font = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const card = { background: C.surface, borderRadius: '16px', border: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(15,23,42,0.06)' };
const btn = (bg, color, outline = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '10px 20px', borderRadius: '10px', border: outline ? `1.5px solid ${bg}` : 'none',
  background: outline ? 'transparent' : bg, color: outline ? bg : color,
  fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'opacity .15s', fontFamily: font,
});
const badge = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 10px', borderRadius: '20px',
  fontSize: '11px', fontWeight: 700, background: bg, color,
});

// ─── SignatureCanvas ──────────────────────────────────────────────────────────
const SignatureCanvas = ({ value, onChange }) => {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);
  const [mode, setMode] = useState('draw');
  useEffect(() => { const ctx = ref.current?.getContext('2d'); if (!ctx) return; ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }, []);
  const pos = (e, c) => { const r = c.getBoundingClientRect(); const cx = e.touches ? e.touches[0].clientX : e.clientX; const cy = e.touches ? e.touches[0].clientY : e.clientY; return { x: cx - r.left, y: cy - r.top }; };
  const start = e => { e.preventDefault(); drawing.current = true; const p = pos(e, ref.current); const ctx = ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw  = e => { e.preventDefault(); if (!drawing.current) return; const p = pos(e, ref.current); const ctx = ref.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setEmpty(false); };
  const stop  = e => { e.preventDefault(); if (!drawing.current) return; drawing.current = false; onChange(ref.current.toDataURL('image/png')); };
  const clear = () => { ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height); setEmpty(true); onChange(''); };
  return (
    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden', background: '#fafbfc' }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#f8fafc' }}>
        {['draw','type'].map(m => <button key={m} type="button" onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px', fontFamily: font, background: mode === m ? C.primary : 'transparent', color: mode === m ? '#fff' : C.textMuted }}>{m === 'draw' ? '✏️ Dessiner' : '⌨️ Taper'}</button>)}
      </div>
      {mode === 'draw' ? (
        <div>
          <canvas ref={ref} width={400} height={120} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderTop: `1px solid #f1f5f9` }}>
            <span style={{ fontSize: '11px', color: C.textLight }}>{empty ? 'Signez dans la zone ci-dessus' : '✓ Signature dessinée'}</span>
            <button type="button" onClick={clear} style={{ ...btn(C.danger, '#fff', true), padding: '2px 10px', fontSize: '11px' }}>Effacer</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px' }}>
          <input type="text" value={typeof value === 'string' && !value.startsWith('data:') ? value : ''} onChange={e => onChange(e.target.value)} placeholder="Tapez votre nom complet" style={{ width: '100%', padding: '10px', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontFamily: 'cursive', fontSize: '18px', boxSizing: 'border-box', outline: 'none' }} />
        </div>
      )}
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = ({ user, logout, navigate }) => {
  const roleName = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase();
  return (
    <nav style={{ background: '#1e293b', padding: '0 28px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.18)', fontFamily: font }}>
      <span style={{ color: '#fff', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.5px' }}>
        <span style={{ color: '#818cf8' }}>Axia</span>Workflow
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/dashboard/employee/new-request')} style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: font }}>
          + Nouvelle demande
        </button>
        <NotificationBell />
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 12px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>{initials || '?'}</div>
          <div>
            <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>{user?.firstName} {user?.lastName}</p>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px', lineHeight: 1.2 }}>{user?.jobTitle || roleName}</p>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.3)', padding: '8px 14px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', fontFamily: font }}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    active:    { bg: '#eff6ff', color: '#1d4ed8', label: 'En cours',  dot: '#3b82f6' },
    completed: { bg: '#f0fdf4', color: '#059669', label: 'Approuvée', dot: '#059669' },
    rejected:  { bg: '#fff5f5', color: '#dc2626', label: 'Refusée',   dot: '#dc2626' },
    draft:     { bg: '#f8fafc', color: '#64748b', label: 'Brouillon', dot: '#94a3b8' },
    archived:  { bg: '#f8fafc', color: '#94a3b8', label: 'Archivé',   dot: '#cbd5e1' },
  }[status] || { bg: '#f8fafc', color: '#64748b', label: status, dot: '#94a3b8' };
  return (
    <span style={{ ...badge(config.bg, config.color), gap: '5px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
      {config.label}
    </span>
  );
};

// ─── StepsProgress ────────────────────────────────────────────────────────────
const StepsProgress = ({ steps }) => {
  const total = steps?.length || 0;
  const done  = steps?.filter(s => s.status === 'completed').length || 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {(steps || []).map((step, i) => {
          const color = step.status === 'completed' ? C.success : step.status === 'in_progress' ? C.primary : step.status === 'rejected' ? C.danger : '#e2e8f0';
          const textColor = step.status === 'pending' ? C.textLight : '#fff';
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '52px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, color: textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                  {step.status === 'completed' ? '✓' : step.status === 'rejected' ? '✗' : i + 1}
                </div>
                <span style={{ fontSize: '9px', color: C.textLight, textAlign: 'center', maxWidth: '50px', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.name}</span>
              </div>
              {i < steps.length - 1 && <div style={{ height: '2px', width: '12px', background: step.status === 'completed' ? C.success : '#e2e8f0', flexShrink: 0, marginBottom: '12px' }} />}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '4px', background: '#f1f5f9', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: pct + '%', background: `linear-gradient(90deg, ${C.primary}, ${C.primary2})`, borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: C.textMuted }}>{pct}%</span>
        <span style={{ fontSize: '11px', color: C.textLight }}>{done}/{total}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VUE DEMANDEUR — section "Mes demandes"
// ─────────────────────────────────────────────────────────────────────────────
const RequesterSection = ({ myRequests, loadingRequests, navigate }) => {
  const [filter, setFilter] = useState('all');

  const stats = {
    total:    myRequests.length,
    active:   myRequests.filter(w => w.status === 'active').length,
    done:     myRequests.filter(w => w.status === 'completed').length,
    rejected: myRequests.filter(w => w.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? myRequests
    : filter === 'active'    ? myRequests.filter(w => w.status === 'active')
    : filter === 'completed' ? myRequests.filter(w => w.status === 'completed')
    : myRequests.filter(w => w.status === 'rejected');

  const statCards = [
    { label: 'Total',    value: stats.total,    color: C.primary, bg: '#ede9fe', key: 'all' },
    { label: 'En cours', value: stats.active,   color: C.warning, bg: '#fef3c7', key: 'active' },
    { label: 'Validées', value: stats.done,     color: C.success, bg: '#dcfce7', key: 'completed' },
    { label: 'Refusées', value: stats.rejected, color: C.danger,  bg: '#fee2e2', key: 'rejected' },
  ];

  return (
    <div>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {statCards.map(s => (
          <div key={s.key} onClick={() => setFilter(s.key)} style={{ ...card, padding: '18px 16px', cursor: 'pointer', border: `2px solid ${filter === s.key ? s.color : C.border}`, transition: 'all .15s' }}>
            <p style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: s.color, fontFamily: font }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '12px', color: C.textMuted, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {statCards.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${filter === s.key ? s.color : C.border}`, background: filter === s.key ? s.bg : C.surface, color: filter === s.key ? s.color : C.textMuted, fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: font }}>
            {s.label}{filter === s.key ? ` (${s.value})` : ''}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loadingRequests ? (
        <div style={{ ...card, padding: '40px', textAlign: 'center' }}>
          <p style={{ color: C.textMuted, fontWeight: 600 }}>⏳ Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: '60px 40px', textAlign: 'center' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>📭</p>
          <h3 style={{ margin: '0 0 8px', color: C.text, fontFamily: font }}>Aucune demande</h3>
          <p style={{ margin: '0 0 24px', color: C.textMuted, fontSize: '14px' }}>
            {filter !== 'all' ? 'Aucune demande dans cette catégorie.' : "Vous n'avez pas encore soumis de demande."}
          </p>
          <button onClick={() => navigate('/dashboard/employee/new-request')} style={{ ...btn(`linear-gradient(135deg, ${C.primary}, ${C.primary2})`, '#fff'), padding: '12px 24px', borderRadius: '10px', fontSize: '14px' }}>
            + Faire une demande
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(wf => {
            const overdue = wf.dueDate && new Date(wf.dueDate) < new Date() && wf.status === 'active';
            const borderColor = wf.status === 'completed' ? C.success : wf.status === 'rejected' ? C.danger : overdue ? C.danger : C.primary;
            return (
              <div key={wf._id} style={{ ...card, padding: '20px 24px', borderLeft: `4px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.text, fontFamily: font }}>{wf.name}</h3>
                      {(wf.businessDocInfo?.number) && <span style={badge('#ede9fe', C.primary)}>{wf.businessDocInfo.number}</span>}
                    </div>
                    {wf.dueDate && <span style={{ fontSize: '12px', color: overdue ? C.danger : C.textMuted }}>Échéance : {new Date(wf.dueDate).toLocaleDateString('fr-FR')}{overdue ? ' ⚠️' : ''}</span>}
                  </div>
                  <StatusBadge status={wf.status} />
                </div>

                {/* Étape en cours */}
                {wf.status === 'active' && wf.steps?.[wf.currentStep] && (
                  <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', borderLeft: `3px solid ${C.primary}` }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1d4ed8', fontWeight: 700 }}>
                      ⏳ En attente de : {wf.steps[wf.currentStep].assignedPostName || wf.steps[wf.currentStep].assignedPost || 'Responsable'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: C.textMuted }}>
                      Étape {wf.currentStep + 1} : {wf.steps[wf.currentStep].name}
                    </p>
                  </div>
                )}

                {/* Motif rejet */}
                {wf.status === 'rejected' && wf.history?.length > 0 && (() => {
                  const r = [...wf.history].reverse().find(h => h.action?.includes('rejected'));
                  return r ? (
                    <div style={{ background: '#fff5f5', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', borderLeft: `3px solid ${C.danger}` }}>
                      <p style={{ margin: '0 0 2px', fontSize: '12px', color: C.danger, fontWeight: 700 }}>❌ Demande refusée</p>
                      {r.comment && <p style={{ margin: 0, fontSize: '12px', color: C.textMuted }}>Motif : {r.comment}</p>}
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textLight }}>Par : {r.byName}</p>
                    </div>
                  ) : null;
                })()}

                {/* Succès */}
                {wf.status === 'completed' && (
                  <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', borderLeft: `3px solid ${C.success}` }}>
                    <p style={{ margin: 0, fontSize: '12px', color: C.success, fontWeight: 700 }}>🎉 Demande approuvée</p>
                  </div>
                )}

                <StepsProgress steps={wf.steps} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VUE VALIDATEUR — section "Mes tâches à valider"
// ─────────────────────────────────────────────────────────────────────────────
const TasksSection = ({ user, tasks, loading, onComplete, onReject, saving, formValues, setFormValues, checklists, setChecklists, comments, setComments, fileRefs, onUpload, uploading, msg }) => {

  const renderField = (field, wfId) => {
    const value = formValues[wfId]?.[field.id] ?? '';
    const base = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1.5px solid ${C.border}`, fontSize: '14px', boxSizing: 'border-box', fontFamily: font, outline: 'none' };
    const lbl = <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: C.textMuted, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}{field.required && <span style={{ color: C.danger, marginLeft: '3px' }}>*</span>}</label>;
    const onChange = val => setFormValues(p => ({ ...p, [wfId]: { ...p[wfId], [field.id]: val } }));
    if (field.type === 'signature') return <div key={field.id} style={{ marginBottom: '14px' }}>{lbl}<SignatureCanvas value={value} onChange={onChange} /></div>;
    if (field.type === 'select')   return <div key={field.id} style={{ marginBottom: '14px' }}>{lbl}<select value={value} onChange={e => onChange(e.target.value)} style={{ ...base, appearance: 'auto' }}><option value="">-- Choisir --</option>{(field.options || []).map((o, i) => <option key={i} value={o}>{o}</option>)}</select></div>;
    if (field.type === 'textarea') return <div key={field.id} style={{ marginBottom: '14px' }}>{lbl}<textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...base, resize: 'vertical' }} /></div>;
    if (field.type === 'checkbox') return <div key={field.id} style={{ marginBottom: '14px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={value === true || value === 'true'} onChange={e => onChange(e.target.checked)} style={{ width: '16px', height: '16px' }} /><span style={{ fontWeight: 600, fontSize: '13px' }}>{field.label}{field.required && <span style={{ color: C.danger }}> *</span>}</span></label></div>;
    return <div key={field.id} style={{ marginBottom: '14px' }}>{lbl}<input type={field.type === 'date' ? 'date' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={field.label} style={base} /></div>;
  };

  if (!loading && tasks.length === 0) return (
    <div style={{ ...card, padding: '48px 40px', textAlign: 'center' }}>
      <p style={{ fontSize: '40px', margin: '0 0 12px' }}>✅</p>
      <h3 style={{ margin: '0 0 6px', color: C.text, fontFamily: font }}>Aucune tâche en attente</h3>
      <p style={{ margin: 0, color: C.textMuted, fontSize: '14px' }}>Toutes les demandes ont été traitées !</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Message feedback */}
      {msg && (() => {
        const isSuccess = msg.startsWith('SUCCESS'); const isWarn = msg.startsWith('WARN');
        const bg = isSuccess ? '#dcfce7' : isWarn ? '#fef3c7' : '#fee2e2';
        const color = isSuccess ? '#166534' : isWarn ? '#92400e' : '#991b1b';
        return <div style={{ padding: '12px 16px', borderRadius: '10px', fontWeight: 600, background: bg, color, fontSize: '14px', fontFamily: font }}>{msg.replace(/^(SUCCESS|WARN|ERREUR)\s?/, '')}</div>;
      })()}

      {tasks.map(task => {
        const wfId   = task.workflowId;
        const step   = task.step;
        const checks = checklists[wfId] || [];
        const hasForm  = step.form?.fields?.length > 0;
        const hasCheck = checks.length > 0;
        const isSaving = saving === wfId;
        const isUrgent = task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 24 * 3600 * 1000);

        return (
          <div key={wfId} style={{ ...card, padding: '0', border: `2px solid ${isUrgent ? C.danger : C.primary}`, overflow: 'hidden' }}>
            {/* En-tête */}
            <div style={{ padding: '18px 24px', background: isUrgent ? '#fff5f5' : '#f8f9ff', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {isUrgent && <span style={badge('#fee2e2', C.danger)}>🔴 URGENT</span>}
                  {task.businessDocNumber && <span style={badge('#ede9fe', C.primary)}>{task.businessDocNumber}</span>}
                </div>
                <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 800, color: C.text, fontFamily: font }}>{task.workflowName}</h2>
                <p style={{ margin: '0 0 2px', fontSize: '13px', color: C.primary, fontWeight: 600 }}>Étape {task.stepIndex + 1} : {step.name}</p>
                {step.description && <p style={{ margin: 0, fontSize: '12px', color: C.textLight }}>{step.description}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <span style={badge('#eff6ff', '#1d4ed8')}>En attente</span>
                {task.dueDate && <span style={{ fontSize: '11px', color: isUrgent ? C.danger : C.textMuted, fontWeight: 600 }}>📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}{isUrgent ? ' ⚠️' : ''}</span>}
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Données soumises par l'employé */}
              {task.step0Fields?.filter(f => f.data !== null && f.data !== undefined && f.data !== '').length > 0 && (
                <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', border: '1px solid #bae6fd' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📋 Données soumises par l'employé</p>
                  {task.step0Fields.filter(f => f.data !== null && f.data !== undefined && f.data !== '').map(f => {
                    if (f.type === 'table' && Array.isArray(f.data) && f.data.length > 0) {
                      const cols = f.columns || [];
                      return (
                        <div key={f.id} style={{ marginBottom: '10px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>📦 {f.label}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: cols.map(() => '1fr').join(' '), gap: '8px', padding: '6px 10px', background: '#e0f2fe', borderRadius: '6px 6px 0 0' }}>
                            {cols.map(c => <span key={c.id} style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>{c.label}</span>)}
                          </div>
                          {f.data.map((row, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: cols.map(() => '1fr').join(' '), gap: '8px', padding: '8px 10px', background: i % 2 === 0 ? '#fff' : '#f8fafc', border: '1px solid #e0f2fe', borderTop: 'none' }}>
                              {cols.map(c => <span key={c.id} style={{ fontSize: '13px', color: C.text }}>{row[c.id] ?? '—'}</span>)}
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div key={f.id} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.textMuted, minWidth: '130px', flexShrink: 0 }}>{f.label} :</span>
                        <span style={{ fontSize: '13px', color: C.text }}>{typeof f.data === 'boolean' ? (f.data ? '✅ Oui' : '❌ Non') : String(f.data)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Historique */}
              {task.history?.length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', border: `1px solid ${C.border}` }}>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>📜 Historique</p>
                  {task.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: i < task.history.length - 1 ? '8px' : 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.action?.includes('completed') ? C.success : h.action?.includes('rejected') ? C.danger : C.primary, flexShrink: 0, marginTop: '4px' }} />
                      <div>
                        <span style={{ fontSize: '12px', color: '#374151', fontWeight: 700 }}>{h.byName}</span>
                        <span style={{ fontSize: '12px', color: C.textMuted, marginLeft: '6px' }}>{h.action === 'workflow_started' ? 'a démarré' : h.action?.includes('completed') ? 'a validé' : h.action?.includes('rejected') ? 'a rejeté' : h.action}</span>
                        {h.stepName && <span style={{ fontSize: '12px', color: C.textLight }}> — {h.stepName}</span>}
                        {h.comment && <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.textMuted, fontStyle: 'italic' }}>"{h.comment}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire */}
              {hasForm && (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '18px', marginBottom: '16px', border: `1px solid ${C.border}` }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: font }}>
                    <span style={badge(C.primary, '#fff')}>Formulaire</span> Remplissez les champs requis
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0 20px' }}>
                    {step.form.fields.map(field => renderField(field, wfId))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {hasCheck && (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '18px', marginBottom: '16px', border: `1px solid ${C.border}` }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: font }}>
                    <span style={badge('#7c3aed', '#fff')}>Checklist</span> {checks.filter(i => i.checked).length}/{checks.length} éléments
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {checks.map((item, i) => (
                      <div key={item.id || i} onClick={() => setChecklists(prev => { const u = [...(prev[wfId] || [])]; u[i] = { ...u[i], checked: !u[i].checked }; return { ...prev, [wfId]: u }; })}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', background: item.checked ? '#f0fdf4' : '#fff', border: `1px solid ${item.checked ? '#86efac' : C.border}`, userSelect: 'none' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: `2px solid ${item.checked ? C.success : '#d1d5db'}`, background: item.checked ? C.success : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.checked && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: item.checked ? '#166534' : '#374151', textDecoration: item.checked ? 'line-through' : 'none', flex: 1 }}>{item.label}</span>
                        {item.required && <span style={{ fontSize: '11px', color: item.checked ? C.success : C.danger, fontWeight: 700 }}>{item.checked ? 'OK' : 'REQUIS'}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload */}
              <div onClick={() => fileRefs.current[wfId]?.click()} style={{ background: '#f8fafc', borderRadius: '10px', border: `2px dashed ${C.border}`, padding: '14px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.primary}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <input type="file" ref={el => { fileRefs.current[wfId] = el; }} onChange={e => onUpload(e, task)} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" />
                {uploading === wfId ? <p style={{ margin: 0, color: C.primary, fontWeight: 600, fontSize: '13px' }}>Upload en cours...</p> : <p style={{ margin: 0, color: C.textMuted, fontWeight: 600, fontSize: '13px' }}>📎 Cliquez pour joindre un document</p>}
              </div>

              {/* Commentaire */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 600, color: C.text, marginBottom: '6px', fontSize: '13px', fontFamily: font }}>
                  Commentaire <span style={{ color: C.textLight, fontWeight: 400 }}>(obligatoire pour rejeter)</span>
                </label>
                <textarea value={comments[wfId] || ''} onChange={e => setComments(prev => ({ ...prev, [wfId]: e.target.value }))} rows={2} placeholder="Votre commentaire..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${C.border}`, fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: font, outline: 'none' }} />
              </div>

              {/* Boutons action */}
              <div style={{ display: 'flex', gap: '12px' }}>
                {step.claims?.canValidate !== false && (
                  <button onClick={() => onComplete(task)} disabled={!!saving} style={{ flex: 1, padding: '13px', borderRadius: '10px', background: isSaving ? '#e2e8f0' : C.success, color: isSaving ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: font }}>
                    {isSaving ? 'En cours...' : '✅ Valider l\'étape'}
                  </button>
                )}
                {step.claims?.canReject !== false && (
                  <button onClick={() => onReject(task)} disabled={!!saving} style={{ padding: '13px 24px', borderRadius: '10px', background: '#fee2e2', color: C.danger, border: `1px solid #fecaca`, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: font }}>
                    ❌ Rejeter
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL — avec onglets organisés
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab,       setActiveTab]       = useState('requests'); // 'requests' | 'tasks'
  const [tasks,           setTasks]           = useState([]);
  const [myRequests,      setMyRequests]       = useState([]);
  const [loading,         setLoading]          = useState(true);
  const [loadingRequests, setLoadingRequests]  = useState(false);
  const [saving,          setSaving]           = useState(null);
  const [msg,             setMsg]              = useState('');
  const [formValues,      setFormValues]       = useState({});
  const [checklists,      setChecklists]       = useState({});
  const [comments,        setComments]         = useState({});
  const [uploading,       setUploading]        = useState(null);
  const fileRefs = useRef({});

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 6000); };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await workflowService.getMyRequests?.();
      if (res?.data?.workflows) setMyRequests(res.data.workflows);
    } catch (_) { setMyRequests([]); }
    finally { setLoadingRequests(false); }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const tasksRes = await workflowService.getMyTasks();
      const fetchedTasks = tasksRes.data?.tasks || [];

      // Enrichir les tâches avec les données step0
      const enriched = await Promise.all(fetchedTasks.map(async (task) => {
        try {
          const wfRes = await workflowService.getById(task.workflowId);
          const wf    = wfRes?.data?.workflow;
          if (!wf) return task;
          const step0Fields = wf.steps?.[0]?.form?.fields || [];
          let docInfo = null, businessDocNumber = null;
          if (wf.businessDoc) {
            const chainRes = await workflowService.getDocumentChain(task.workflowId).catch(() => null);
            const chain    = chainRes?.data?.chain || [];
            const lastDoc  = chain[chain.length - 1];
            businessDocNumber = lastDoc?.number || null;
            docInfo = lastDoc ? { demandeur: lastDoc.demandeur, depot: lastDoc.depot, priorite: lastDoc.priorite, lignes: lastDoc.lignes || [] } : null;
          }
          return { ...task, businessDocNumber, docInfo, step0Fields };
        } catch (_) { return task; }
      }));

      setTasks(enriched);

      // Si on a des tâches, switcher sur l'onglet tâches automatiquement
      if (enriched.length > 0) setActiveTab('tasks');

      // Init forms/checklists
      const initForms = {}, initChecks = {}, initComments = {};
      fetchedTasks.forEach(t => {
        const key = t.workflowId;
        initForms[key] = {};
        initComments[key] = '';
        (t.step.form?.fields || []).forEach(f => { initForms[key][f.id] = f.value || ''; });
        initChecks[key] = (t.step.checklist || []).map(item => ({ ...item }));
      });
      setFormValues(initForms);
      setChecklists(initChecks);
      setComments(initComments);

      fetchMyRequests();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleComplete = async (task) => {
    const wfId = task.workflowId, step = task.step;
    const fVals = formValues[wfId] || {}, checks = checklists[wfId] || [];
    const missing = (step.form?.fields || []).filter(f => f.required && !fVals[f.id]);
    if (missing.length > 0) { showMsg('ERREUR Champs obligatoires manquants : ' + missing.map(f => f.label).join(', ')); return; }
    const missingChecks = checks.filter(i => i.required && !i.checked);
    if (missingChecks.length > 0) { showMsg('ERREUR Checklist incomplète : ' + missingChecks.map(i => i.label).join(', ')); return; }
    setSaving(wfId);
    try {
      await workflowService.completeStep(wfId, { comment: comments[wfId] || '', formData: fVals, checklistData: checks });
      showMsg('SUCCESS Étape validée avec succès !');
      fetchAll();
    } catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(null); }
  };

  const handleReject = async (task) => {
    const wfId = task.workflowId;
    if (!comments[wfId]?.trim()) { showMsg('ERREUR Un commentaire est requis pour rejeter'); return; }
    setSaving(wfId + '_reject');
    try {
      await workflowService.rejectStep(wfId, { comment: comments[wfId] });
      showMsg('WARN Étape rejetée');
      fetchAll();
    } catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(null); }
  };

  const handleUpload = async (e, task) => {
    const file = e.target.files[0]; if (!file) return;
    const wfId = task.workflowId; setUploading(wfId);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('workflowId', wfId); fd.append('stepIndex', String(task.stepIndex));
      await workflowService.uploadDocument(fd);
      showMsg('SUCCESS Document joint avec succès !');
    } catch (err) { showMsg('ERREUR upload : ' + (err.response?.data?.message || err.message)); }
    finally { setUploading(null); e.target.value = ''; }
  };

  const taskProps = { user, tasks, loading, onComplete: handleComplete, onReject: handleReject, saving, formValues, setFormValues, checklists, setChecklists, comments, setComments, fileRefs, onUpload: handleUpload, uploading, msg };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, fontFamily: font }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: `4px solid ${C.border}`, borderTop: `4px solid ${C.primary}`, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: C.textMuted, fontWeight: 600, fontSize: '15px' }}>Chargement de votre espace...</p>
      </div>
    </div>
  );

  const tabs = [
    { key: 'requests', label: 'Mes demandes',     icon: '📋', count: myRequests.length,  color: C.primary },
    { key: 'tasks',    label: 'Tâches à valider', icon: '✅', count: tasks.length,       color: tasks.length > 0 ? C.success : C.textMuted },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: font }}>
      <Navbar user={user} logout={logout} navigate={navigate} />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* ── Bienvenue ── */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: C.text }}>
              Bonjour, {user?.firstName} 👋
            </h1>
            <p style={{ margin: 0, color: C.textMuted, fontSize: '14px' }}>
              Poste : <strong style={{ color: C.text }}>{user?.jobTitle || 'Non défini'}</strong>
              {tasks.length > 0 && (
                <span style={{ marginLeft: '10px', ...badge('#fef3c7', C.warning) }}>
                  {tasks.length} tâche{tasks.length > 1 ? 's' : ''} en attente ⏳
                </span>
              )}
            </p>
          </div>
          <button onClick={() => navigate('/dashboard/employee/new-request')} style={{ ...btn(`linear-gradient(135deg, ${C.primary}, ${C.primary2})`, '#fff'), padding: '11px 22px', borderRadius: '10px', fontSize: '14px', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
            + Nouvelle demande
          </button>
        </div>

        {/* ── Onglets ── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: C.surface, padding: '4px', borderRadius: '12px', border: `1px solid ${C.border}`, width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ padding: '10px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', fontFamily: font, display: 'flex', alignItems: 'center', gap: '7px', transition: 'all .15s',
                background: activeTab === tab.key ? tab.color === C.success ? '#f0fdf4' : '#ede9fe' : 'transparent',
                color: activeTab === tab.key ? tab.color : C.textMuted,
                boxShadow: activeTab === tab.key ? `0 1px 6px ${tab.color}33` : 'none',
              }}>
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span style={{ background: tab.count > 0 && tab.key === 'tasks' ? C.success : C.primary, color: '#fff', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Contenu onglet actif ── */}
        {activeTab === 'requests' && (
          <RequesterSection
            myRequests={myRequests}
            loadingRequests={loadingRequests}
            navigate={navigate}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksSection {...taskProps} />
        )}

      </div>
    </div>
  );
};

export default EmployeeDashboard;
