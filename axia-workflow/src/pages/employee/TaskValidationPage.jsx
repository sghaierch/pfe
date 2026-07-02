import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import workflowService from '../../services/workflowService';

// ── Couleurs ──────────────────────────────────────────────────────────────────
const T = {
  blue:'#2563EB', blueSoft:'#EFF6FF', blueBorder:'#BFDBFE',
  green:'#16A34A', greenSoft:'#F0FDF4', greenBorder:'#BBF7D0',
  red:'#DC2626', redSoft:'#FEF2F2', redBorder:'#FECACA',
  amber:'#D97706', amberSoft:'#FFFBEB', amberBorder:'#FDE68A',
  slate:'#0F172A', slateM:'#475569', slateL:'#94A3B8',
  bg:'#F1F5F9', surface:'#FFFFFF', border:'#E2E8F0',
};
const font = "'Inter',-apple-system,sans-serif";

// ── Icons ──────────────────────────────────────────────────────────────────────
const IArrowL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const ICheck   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IReject  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ILoader  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IUser    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IClip    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;

// ── SignatureCanvas ──────────────────────────────────────────────────────────
const SignatureCanvas = ({ value, onChange }) => {
  const canvasRef = React.useRef(null);
  const isDrawing = React.useRef(false);
  const [isEmpty, setIsEmpty] = React.useState(!value);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, []);
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  };
  const start = (e) => { e.preventDefault(); isDrawing.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw  = (e) => { e.preventDefault(); if (!isDrawing.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setIsEmpty(false); };
  const stop  = (e) => { e.preventDefault(); if (!isDrawing.current) return; isDrawing.current = false; onChange(canvasRef.current.toDataURL()); };
  const clear = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setIsEmpty(true); onChange(''); };
  return (
    <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
      <canvas ref={canvasRef} width={400} height={80}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
        style={{ display: 'block', width: '100%', height: '80px', cursor: 'crosshair', touchAction: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #f0f2f7', background: '#fff' }}>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>
          {isEmpty ? 'Signez dans la zone ci-dessus' : '✅ Signature enregistrée'}
        </span>
        <button type="button" onClick={clear} style={{ padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Effacer</button>
      </div>
    </div>
  );
};

const TaskValidationPage = () => {
  const { id } = useParams(); // workflowId
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workflow,   setWorkflow]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');
  const [comment,    setComment]    = useState('');
  const [formValues, setFormValues] = useState({});
  const [checklist,  setChecklist]  = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workflowService.getById(id);
        const wf  = res.data?.workflow;
        if (!wf) throw new Error('Workflow introuvable');
        setWorkflow(wf);
        // Init checklist depuis l'étape courante
        const step = wf.steps?.[wf.currentStep];
        if (step?.checklist?.length) {
          setChecklist(step.checklist.map(c => ({ ...c, checked: false })));
        }
        // ✅ Init des champs "table" : pré-remplir les lignes héritées de l'étape 0
        const step0Tbl = wf.steps?.[0]?.form?.fields?.find(f => f.type === 'table');
        const initTableValues = {};
        (step?.form?.fields || []).filter(f => f.type === 'table').forEach(f => {
          if (f.inheritTableFrom && Array.isArray(step0Tbl?.data)) {
            initTableValues[f.id] = step0Tbl.data.map(row => ({ ...row }));
          } else {
            initTableValues[f.id] = [{}];
          }
        });
        if (Object.keys(initTableValues).length) {
          setFormValues(prev => ({ ...prev, ...initTableValues }));
        }
      } catch (err) {
        setMsg('Erreur : ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const step = workflow?.steps?.[workflow?.currentStep];
  const step0Fields = workflow?.steps?.[0]?.form?.fields || [];

  // ── Validation ────────────────────────────────────────────────────────────
  const handleValidate = async () => {
    // Vérifier checklist obligatoire
    const missing = checklist.find(c => c.required && !c.checked);
    if (missing) { setMsg('Checklist : "' + missing.label + '" est requis'); return; }
    // Vérifier champs requis
    const reqField = (step?.form?.fields || []).find(f =>
      f.required && !['auto_user','auto_status','auto_number','table'].includes(f.type) &&
      (!formValues[f.id] || String(formValues[f.id]).trim() === '')
    );
    if (reqField) { setMsg('Champ requis : ' + reqField.label); return; }

    setSaving(true); setMsg('');
    try {
      const formData = {};
      (step?.form?.fields || []).forEach(f => {
        if (formValues[f.id] !== undefined) formData[f.id] = formValues[f.id];
      });
      await workflowService.completeStep(id, {
        comment,
        formData,
        checklistData: checklist,
      });
      setMsg('SUCCESS Étape validée avec succès !');
      setTimeout(() => navigate('/dashboard/employee'), 1500);
    } catch (err) {
      setMsg('Erreur : ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  // ── Rejet ─────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!comment.trim()) { setMsg('Un commentaire est obligatoire pour rejeter'); return; }
    setSaving(true); setMsg('');
    try {
      await workflowService.rejectStep(id, { comment });
      setMsg('SUCCESS Étape rejetée.');
      setTimeout(() => navigate('/dashboard/employee'), 1500);
    } catch (err) {
      setMsg('Erreur : ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('workflowId', id);
      fd.append('stepIndex', String(workflow?.currentStep || 0));
      await workflowService.uploadDocument(fd);
    } catch {}
    setUploading(false);
  };

  // ── Rendu d'une valeur soumise par l'employé (section résumé) ──────────────
  const renderStep0Value = (f) => {
    const val = f.data;
    if (f.type === 'table' && Array.isArray(val)) {
      if (val.length === 0) return <span style={{ color:T.slateL, fontStyle:'italic' }}>Tableau vide</span>;
      const cols = f.columns || [];
      return (
        <div style={{ overflowX:'auto', marginTop:'4px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ background:'#fff' }}>
                {cols.map(col => (
                  <th key={col.id} style={{ padding:'6px 10px', textAlign:'left', fontWeight:700, color:'#0369A1', borderBottom:'1.5px solid #BAE6FD', whiteSpace:'nowrap' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {val.map((row, ri) => (
                <tr key={ri} style={{ borderBottom:'1px solid #E0F2FE' }}>
                  {cols.map(col => (
                    <td key={col.id} style={{ padding:'6px 10px', color:T.slate }}>{row[col.id] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (typeof val === 'boolean') return val ? '✓ Oui' : '✗ Non';
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  };

  // ── Rendu champ formulaire ────────────────────────────────────────────────
  const renderField = (field) => {
    const val = formValues[field.id] ?? '';
    const set = (v) => setFormValues(p => ({ ...p, [field.id]: v }));
    const base = { width:'100%', padding:'10px 14px', borderRadius:'9px', border:`1.5px solid ${T.border}`, fontSize:'14px', boxSizing:'border-box', fontFamily:font, outline:'none', color:T.slate };
    const lbl = (
      <label style={{ display:'block', fontWeight:700, fontSize:'11px', color:T.slateM, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {field.label}{field.required && <span style={{ color:T.red, marginLeft:'3px' }}>*</span>}
      </label>
    );
    if (field.type === 'select') return (
      <div key={field.id} style={{ marginBottom:'14px' }}>
        {lbl}
        <select value={val} onChange={e=>set(e.target.value)} style={{ ...base, cursor:'pointer' }}>
          <option value="">— Choisir —</option>
          {(field.options||[]).map((o,i) => <option key={i} value={o}>{o}</option>)}
        </select>
      </div>
    );
    if (field.type === 'textarea') return (
      <div key={field.id} style={{ marginBottom:'14px' }}>
        {lbl}<textarea value={val} onChange={e=>set(e.target.value)} rows={3} style={{ ...base, resize:'vertical' }}/>
      </div>
    );
    if (field.type === 'checkbox') return (
      <div key={field.id} style={{ marginBottom:'14px' }}>
        <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
          <input type="checkbox" checked={val===true||val==='true'} onChange={e=>set(e.target.checked)} style={{ width:'16px', height:'16px', accentColor:T.blue }}/>
          <span style={{ fontWeight:600, fontSize:'13px', color:T.slate }}>{field.label}{field.required && <span style={{ color:T.red }}> *</span>}</span>
        </label>
      </div>
    );
    if (field.type === 'signature') return (
      <div key={field.id} style={{ marginBottom:'14px' }}>
        {lbl}<SignatureCanvas value={val} onChange={set}/>
      </div>
    );
    if (field.type === 'table') {
      // Colonnes héritées de l'étape employé (lecture seule) + colonnes propres à cette étape (éditables)
      const step0Tbl  = step0Fields.find(f => f.type === 'table');
      const baseCols  = field.inheritTableFrom ? (step0Tbl?.columns || []) : [];
      const ownCols   = field.columns || [];
      const allCols   = field.inheritTableFrom ? [...baseCols, ...ownCols] : ownCols;
      const rows      = Array.isArray(val) && val.length ? val : [{}];
      const isBaseCol = (colId) => baseCols.some(c => c.id === colId);

      const updateCell = (ri, colId, cellVal) => {
        const next = rows.map((r, i) => i === ri ? { ...r, [colId]: cellVal } : r);
        set(next);
      };
      const addRow    = () => set([...rows, {}]);
      const removeRow = (ri) => set(rows.filter((_, i) => i !== ri));

      return (
        <div key={field.id} style={{ gridColumn:'1 / -1', marginBottom:'14px' }}>
          {lbl}
          <div style={{ overflowX:'auto', border:`1.5px solid ${T.border}`, borderRadius:'10px' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {allCols.map(col => (
                    <th key={col.id} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, color:T.slateM, borderBottom:`1.5px solid ${T.border}`, whiteSpace:'nowrap' }}>
                      {col.label}{col.required && <span style={{ color:T.red }}> *</span>}
                      {isBaseCol(col.id) && (
                        <span style={{ marginLeft:'6px', fontSize:'9px', fontWeight:700, color:'#0369A1', background:'#E0F2FE', padding:'1px 5px', borderRadius:'4px' }}>hérité</span>
                      )}
                    </th>
                  ))}
                  {!field.inheritTableFrom && <th style={{ width:'32px' }}/>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom:`1px solid ${T.border}` }}>
                    {allCols.map(col => (
                      <td key={col.id} style={{ padding:'4px 6px' }}>
                        {isBaseCol(col.id) ? (
                          <span style={{ display:'block', padding:'6px 8px', color:T.slateM }}>{row[col.id] ?? '—'}</span>
                        ) : (
                          <input
                            type={col.type==='number'?'number':col.type==='date'?'date':'text'}
                            value={row[col.id] ?? ''}
                            onChange={e => updateCell(ri, col.id, e.target.value)}
                            style={{ width:'100%', boxSizing:'border-box', padding:'6px 8px', borderRadius:'6px', border:`1.5px solid ${T.border}`, fontSize:'13px', fontFamily:font, outline:'none' }}
                          />
                        )}
                      </td>
                    ))}
                    {!field.inheritTableFrom && (
                      <td style={{ padding:'4px' }}>
                        <button type="button" onClick={() => removeRow(ri)}
                          style={{ width:'24px', height:'24px', borderRadius:'6px', border:'none', background:T.redSoft, color:T.red, cursor:'pointer', fontWeight:700 }}>×</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!field.inheritTableFrom && (
            <button type="button" onClick={addRow}
              style={{ marginTop:'8px', padding:'6px 14px', borderRadius:'8px', border:`1.5px dashed ${T.border}`, background:'#F8FAFC', color:T.slateM, cursor:'pointer', fontWeight:600, fontSize:'12px', fontFamily:font }}>
              + Ajouter une ligne
            </button>
          )}
        </div>
      );
    }
    return (
      <div key={field.id} style={{ marginBottom:'14px' }}>
        {lbl}
        <input type={field.type==='date'?'date':field.type==='number'?'number':'text'} value={val} onChange={e=>set(e.target.value)} placeholder={field.label} style={base}/>
      </div>
    );
  };

  // ── États ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:T.bg, fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}><ILoader/><p style={{ color:T.slateM, marginTop:'12px', fontWeight:600 }}>Chargement…</p></div>
    </div>
  );

  if (!workflow || !step) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:T.bg, fontFamily:font }}>
      <div style={{ textAlign:'center', background:T.surface, padding:'40px', borderRadius:'16px', border:`1.5px solid ${T.border}` }}>
        <p style={{ color:T.red, fontWeight:700, marginBottom:'16px' }}>{msg || 'Tâche introuvable'}</p>
        <button onClick={() => navigate('/dashboard/employee')} style={{ background:T.blue, color:'#fff', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontFamily:font }}>
          <IArrowL/> Retour
        </button>
      </div>
    </div>
  );

  const isSuccess = msg.startsWith('SUCCESS');
  const stepFields = step.form?.fields?.filter(f => !['auto_user','auto_status','auto_number'].includes(f.type) && !f.readOnly) || [];
  const canValidate = step.claims?.canValidate !== false;
  const canReject   = step.claims?.canReject   !== false;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:font }}>
        <div style={{ maxWidth:'780px', margin:'0 auto', padding:'32px 24px 60px' }}>

          {/* ── Retour ── */}
          <button onClick={() => navigate('/dashboard/employee')}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.surface, border:`1.5px solid ${T.border}`, padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:T.slateM, fontSize:'13px', marginBottom:'24px', fontFamily:font }}>
            <IArrowL/> Retour aux tâches
          </button>

          {/* ── Header ── */}
          <div style={{ background:T.surface, borderRadius:'16px', border:`1.5px solid ${T.border}`, padding:'24px', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
              <div>
                {workflow.docNumber && (
                  <span style={{ display:'inline-block', background:'#E0E7FF', color:T.blue, padding:'3px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:800, fontFamily:'monospace', border:'1px solid #C7D2FE', marginBottom:'8px' }}>
                    {workflow.docNumber}
                  </span>
                )}
                <h1 style={{ margin:'0 0 6px', fontSize:'22px', fontWeight:900, color:T.slate }}>{workflow.name}</h1>
                <p style={{ margin:0, color:T.blue, fontSize:'14px', fontWeight:700 }}>
                  Étape {workflow.currentStep + 1} / {workflow.steps.length} — {step.name}
                </p>
              </div>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.amberSoft, color:T.amber, padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:700, border:`1.5px solid ${T.amberBorder}` }}>
                ⏳ En attente de validation
              </span>
            </div>

            {/* Barre progression */}
            <div style={{ marginTop:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:T.slateM, marginBottom:'6px' }}>
                <span>Progression</span>
                <span style={{ fontWeight:700, color:T.blue }}>{Math.round((workflow.currentStep / workflow.steps.length) * 100)}% — {workflow.currentStep}/{workflow.steps.length} étapes</span>
              </div>
              <div style={{ height:'6px', background:T.border, borderRadius:'999px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(workflow.currentStep / workflow.steps.length) * 100}%`, background:`linear-gradient(90deg, ${T.blue}, #60A5FA)`, borderRadius:'999px', transition:'width 0.3s' }}/>
              </div>
            </div>
          </div>

          {/* ── Message ── */}
          {msg && (
            <div style={{ padding:'12px 16px', borderRadius:'10px', marginBottom:'16px', fontWeight:600, fontSize:'14px', animation:'fadeIn 0.3s ease', ...(isSuccess ? { background:T.greenSoft, color:T.green, border:`1.5px solid ${T.greenBorder}` } : { background:T.redSoft, color:T.red, border:`1.5px solid ${T.redBorder}` }) }}>
              {isSuccess ? <ICheck/> : <IAlert/>} {msg.replace('SUCCESS ', '')}
            </div>
          )}

          {/* ── Données soumises par l'employé ── */}
          {step0Fields.filter(f => f.data !== null && f.data !== undefined && f.data !== '').length > 0 && (
            <div style={{ background:'#F0F9FF', borderRadius:'14px', padding:'20px 24px', marginBottom:'16px', border:'1.5px solid #BAE6FD' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                <IUser/>
                <span style={{ fontSize:'11px', fontWeight:800, color:'#0369A1', textTransform:'uppercase', letterSpacing:'0.08em' }}>Données soumises par l'employé</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'8px 24px' }}>
                {step0Fields.filter(f => f.data !== null && f.data !== undefined && f.data !== '').map(f => (
                  <div key={f.id} style={{ display:'flex', flexDirection:'column', gap:'2px', gridColumn: f.type==='table' ? '1 / -1' : 'auto' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, color:'#0369A1' }}>{f.label}</span>
                    <span style={{ fontSize:'13px', color:T.slate, fontWeight:500 }}>{renderStep0Value(f)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Formulaire validateur ── */}
          {stepFields.length > 0 && (
            <div style={{ background:T.surface, borderRadius:'14px', border:`1.5px solid ${T.border}`, marginBottom:'16px', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${T.border}`, background:'#FAFAFA', display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ background:T.blue, color:'#fff', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', fontWeight:800 }}>FORMULAIRE</span>
                <span style={{ fontSize:'13px', fontWeight:600, color:T.slate }}>Remplissez les champs requis</span>
              </div>
              <div style={{ padding:'20px 24px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'0 20px' }}>
                  {stepFields.map(f => renderField(f))}
                </div>
              </div>
            </div>
          )}

          {/* ── Checklist ── */}
          {checklist.length > 0 && (
            <div style={{ background:T.surface, borderRadius:'14px', border:`1.5px solid ${T.border}`, marginBottom:'16px', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${T.border}`, background:'#FAFAFA', display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ background:'#7C3AED', color:'#fff', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', fontWeight:800 }}>CHECKLIST</span>
                <span style={{ fontSize:'13px', fontWeight:600, color:T.slate }}>{checklist.filter(i=>i.checked).length}/{checklist.length} éléments</span>
              </div>
              <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {checklist.map((item, i) => (
                  <div key={item.id||i}
                    onClick={() => setChecklist(prev => prev.map((c,ci) => ci===i ? {...c, checked:!c.checked} : c))}
                    style={{ display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'12px 16px', borderRadius:'10px', background:item.checked ? T.greenSoft : '#F8FAFC', border:`1.5px solid ${item.checked ? T.greenBorder : T.border}`, transition:'all .15s', userSelect:'none' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'6px', border:`2px solid ${item.checked ? T.green : '#D1D5DB'}`, background:item.checked ? T.green : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff', transition:'all .15s' }}>
                      {item.checked && <ICheck/>}
                    </div>
                    <span style={{ fontSize:'14px', fontWeight:600, color:item.checked ? '#166534' : T.slate, flex:1, textDecoration:item.checked?'line-through':'none' }}>{item.label}</span>
                    {item.required && <span style={{ fontSize:'11px', fontWeight:700, color:item.checked ? T.green : T.red }}>{item.checked ? '✓ OK' : 'REQUIS'}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Joindre document ── */}
          <div style={{ background:T.surface, borderRadius:'14px', border:`2px dashed ${T.border}`, padding:'16px', textAlign:'center', marginBottom:'16px', cursor:'pointer', transition:'all .15s' }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => { e.currentTarget.style.borderColor=T.blue; e.currentTarget.style.background=T.blueSoft; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background=T.surface; }}>
            <input type="file" ref={fileRef} style={{ display:'none' }} onChange={handleUpload} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"/>
            {uploading
              ? <span style={{ color:T.blue, fontWeight:600, fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}><ILoader/> Upload en cours…</span>
              : <span style={{ color:T.slateM, fontWeight:600, fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}><IClip/> Joindre un document</span>
            }
          </div>

          {/* ── Commentaire ── */}
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', fontWeight:700, color:T.slate, marginBottom:'8px', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              Commentaire <span style={{ color:T.slateL, fontWeight:400, textTransform:'none', fontSize:'11px' }}>(obligatoire pour rejeter)</span>
            </label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder="Votre commentaire ou motif de décision…"
              style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', borderRadius:'10px', border:`1.5px solid ${T.border}`, fontSize:'14px', resize:'vertical', fontFamily:font, outline:'none', color:T.slate, background:T.surface }}
              onFocus={e => e.target.style.borderColor = T.blue}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* ── Boutons ── */}
          <div style={{ display:'flex', gap:'12px' }}>
            {canValidate && (
              <button onClick={handleValidate} disabled={saving}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'15px', borderRadius:'12px', background: saving ? '#E2E8F0' : `linear-gradient(135deg, ${T.green}, #15803D)`, color: saving ? T.slateL : '#fff', border:'none', fontWeight:800, fontSize:'15px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily:font, boxShadow: saving ? 'none' : '0 6px 20px rgba(22,163,74,0.35)', transition:'all 0.2s' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
                {saving ? <><ILoader/> En cours…</> : <><ICheck/> Valider l'étape</>}
              </button>
            )}
            {canReject && (
              <button onClick={handleReject} disabled={saving}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'15px 28px', borderRadius:'12px', background:T.redSoft, color:T.red, border:`1.5px solid ${T.redBorder}`, fontWeight:700, fontSize:'14px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily:font, transition:'all 0.15s' }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.background=T.red; e.currentTarget.style.color='#fff'; }}}
                onMouseLeave={e => { e.currentTarget.style.background=T.redSoft; e.currentTarget.style.color=T.red; }}>
                <IReject/> Rejeter
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default TaskValidationPage;