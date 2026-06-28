import React, { useState, useEffect, useMemo } from 'react';
import API from '../../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconFile      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconEdit      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconArchive   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="10" y2="17"/><line x1="14" y1="12" x2="14" y2="17"/></svg>;
const IconPlus      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSave      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconX         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconSearch    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconLoader    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconHash      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
const IconWarn      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconGear      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconEye       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconAlignLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/></svg>;

const B = '#2563EB';

// ── Input styles ───────────────────────────────────────────────────────────
const getInp = (focused, hasError) => ({
  width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px',
  border: hasError ? '1.5px solid #EF4444' : focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused && !hasError ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

const SInput = ({ value, onChange, placeholder, maxLength }) => {
  const [f, setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={getInp(f)}/>;
};
const SSelect = ({ value, onChange, children }) => {
  const [f, setF] = useState(false);
  return <select value={value} onChange={onChange}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInp(f), cursor:'pointer'}}>{children}</select>;
};
const STextarea = ({ value, onChange, placeholder, rows=2 }) => {
  const [f, setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...getInp(f), resize:'vertical'}}/>;
};

const Lbl = ({ icon, children, required }) => (
  <label style={{ height:'20px', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>
    {icon && <span style={{color:B}}>{icon}</span>}{children}{required && <span style={{color:'#EF4444'}}>*</span>}
  </label>
);

const Field = ({ label, icon, required, children, hint }) => (
  <div style={{ marginBottom:'16px' }}>
    <Lbl icon={icon} required={required}>{label}</Lbl>
    {children}
    {hint && <p style={{ margin:'5px 0 0', fontSize:'11px', color:'#94A3B8', lineHeight:1.5, display:'flex', alignItems:'center', gap:'4px' }}>{hint}</p>}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const DocumentTypesPage = () => {
  const [types,       setTypes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [editing,     setEditing]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal,   setViewModal]   = useState(null);
  const [wfOfType,    setWfOfType]    = useState([]);
  const [wfLoading,   setWfLoading]   = useState(false);
  const [search,      setSearch]      = useState('');

  // ✅ Le type de document ne contient plus de référence workflow.
  // C'est le workflow qui choisit son type de document.
  const emptyForm = { name:'', prefix:'', digits:3, description:'' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await API.get('/document-types');
        setTypes(res.data?.data?.documentTypes || []);
      } catch (err) {
        showMsg('ERREUR ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    init();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await API.get('/document-types');
      setTypes(res.data?.data?.documentTypes || []);
    } catch {}
  };

  const openView = async (type) => {
    setViewModal(type);
    setWfOfType([]);
    setWfLoading(true);
    try {
      const res = await API.get('/workflows');
      const all = res.data?.data?.workflows || [];
      // ✅ Seulement les TEMPLATES (isTemplate:true), pas les instances/demandes
      const filtered = all.filter(w =>
        w.isTemplate === true && (
          w.docType === type._id ||
          (w.docType && (w.docType._id === type._id || String(w.docType) === String(type._id)))
        )
      );
      setWfOfType(filtered);
    } catch { setWfOfType([]); }
    finally { setWfLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(()=>setMsg(''), 3500); };
  const set = (key, val) => setForm(p => ({...p, [key]: val}));

  const getExample = () => {
    if (!form.prefix) return '—';
    const year = new Date().getFullYear().toString().slice(-2);
    return `${form.prefix.toUpperCase()}${year}-${'1'.padStart(form.digits, '0')}`;
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.prefix.trim()) {
      showMsg('ERREUR Nom et préfixe sont obligatoires'); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await API.patch('/document-types/' + editing, form);
        showMsg('SUCCESS Type modifié !');
      } else {
        await API.post('/document-types', form);
        showMsg('SUCCESS Type créé !');
      }
      setForm(emptyForm); setEditing(null);
      fetchTypes();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleEdit = (type) => {
    setEditing(type._id);
    // ✅ Plus de defaultWorkflow ici
    setForm({ name:type.name, prefix:type.prefix, digits:type.digits, description:type.description||'' });
  };

// Toggle rapide du statut (clic direct sur le badge, sans confirmation)
  const handleToggleStatus = async (type) => {
    try {
      await API.patch('/document-types/' + type._id, { isActive: !type.isActive });
      setTypes(prev => prev.map(t => t._id === type._id ? { ...t, isActive: !t.isActive } : t));
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

  // Archivage formel (icône + confirmation) — distinct du simple toggle
  const handleArchive = async () => {
    if (!deleteModal) return;
    try {
      await API.patch('/document-types/' + deleteModal._id + '/archive');
      showMsg('SUCCESS Type archivé');
      setDeleteModal(null); fetchTypes();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Search filter ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return types;
    return types.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.prefix?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [types, search]);

  // ── Avatar color per prefix ────────────────────────────────────────────
  const COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#0891B2'];
  const prefixColor = (p) => COLORS[(p?.charCodeAt(0)||0) % COLORS.length];

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .dt-row:hover { background: #F8FAFC !important; }
        .dt-action-btn:hover { opacity:0.85; transform:translateY(-1px); }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1200px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── View Modal ── */}
        {viewModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)', padding:'20px' }}>
            <div style={{ background:'#fff', borderRadius:'24px', width:'100%', maxWidth:'680px', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.25)' }}>

              {/* Header modale */}
              <div style={{ padding:'28px 28px 20px', borderBottom:'1.5px solid #F1F5F9', display:'flex', alignItems:'flex-start', gap:'16px', flexShrink:0 }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:`${prefixColor(viewModal.prefix)}15`, border:`1.5px solid ${prefixColor(viewModal.prefix)}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'18px', color:prefixColor(viewModal.prefix), letterSpacing:'1px' }}>{viewModal.prefix}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:900, color:'#0F172A' }}>{viewModal.name}</h2>
                  {viewModal.description && <p style={{ margin:'0 0 10px', fontSize:'13px', color:'#64748B', lineHeight:1.5 }}>{viewModal.description}</p>}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 12px', borderRadius:'20px', background:`${prefixColor(viewModal.prefix)}12`, color:prefixColor(viewModal.prefix), fontSize:'12px', fontWeight:700, border:`1px solid ${prefixColor(viewModal.prefix)}25` }}>
                      # Préfixe : {viewModal.prefix}
                    </span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 12px', borderRadius:'20px', background:'#F0FDF4', color:'#16A34A', fontSize:'12px', fontWeight:700, border:'1px solid #BBF7D0' }}>
                      🔢 {viewModal.digits} chiffres
                    </span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 12px', borderRadius:'20px', background:'#EFF6FF', color:'#2563EB', fontSize:'12px', fontWeight:700, border:'1px solid #BFDBFE', fontFamily:'monospace' }}>
                      Ex : {viewModal.example || `${viewModal.prefix}26-001`}
                    </span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background: viewModal.isActive ? '#F0FDF4' : '#FEF2F2', color: viewModal.isActive ? '#16A34A' : '#DC2626', border: viewModal.isActive ? '1px solid #BBF7D0' : '1px solid #FECACA' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: viewModal.isActive ? '#16A34A' : '#DC2626', display:'inline-block' }}/>
                      {viewModal.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setViewModal(null)}
                  style={{ width:'36px', height:'36px', borderRadius:'10px', border:'1.5px solid #E2E8F0', background:'#F8FAFC', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', flexShrink:0 }}>
                  <IconX/>
                </button>
              </div>

              {/* Body scrollable */}
              <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

                {/* Section workflows */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:'#2563EB', flexShrink:0 }}>
                    <IconGear/>
                  </div>
                  <div>
                    <p style={{ margin:0, fontWeight:800, fontSize:'14px', color:'#0F172A' }}>Workflows associés</p>
                    <p style={{ margin:0, fontSize:'12px', color:'#64748B' }}>Workflows utilisant ce type de document</p>
                  </div>
                  {!wfLoading && (
                    <span style={{ marginLeft:'auto', background:'#EFF6FF', color:'#2563EB', padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1px solid #BFDBFE' }}>
                      {wfOfType.length} workflow(s)
                    </span>
                  )}
                </div>

                {wfLoading ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'32px', color:'#94A3B8', fontSize:'13px' }}>
                    <IconLoader/> Chargement des workflows…
                  </div>
                ) : wfOfType.length === 0 ? (
                  <div style={{ padding:'28px', textAlign:'center', background:'#F8FAFC', borderRadius:'12px', border:'1.5px dashed #E2E8F0' }}>
                    <p style={{ margin:'0 0 4px', fontSize:'24px' }}>📋</p>
                    <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'14px', color:'#374151' }}>Aucun workflow lié</p>
                    <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>Créez un workflow et associez-lui ce type depuis l'éditeur.</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {wfOfType.map(wf => {
                      const statusColors = {
                        draft:     { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A', label:'Brouillon' },
                        active:    { bg:'#F0FDF4', color:'#16A34A', border:'#BBF7D0', label:'Actif' },
                        completed: { bg:'#EFF6FF', color:'#2563EB', border:'#BFDBFE', label:'Terminé' },
                        archived:  { bg:'#F8FAFC', color:'#64748B', border:'#E2E8F0', label:'Archivé' },
                        rejected:  { bg:'#FEF2F2', color:'#DC2626', border:'#FECACA', label:'Rejeté' },
                      };
                      const sc = statusColors[wf.status] || statusColors.draft;
                      return (
                        <div key={wf._id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', background:'#fff', borderRadius:'12px', border:'1.5px solid #E2E8F0', transition:'border-color 0.15s' }}>
                          <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:'#2563EB', flexShrink:0 }}>
                            <IconGear/>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'14px', color:'#0F172A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{wf.name}</p>
                            <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ fontSize:'11px', color:'#94A3B8' }}>{wf.steps?.length || 0} étape(s)</span>
                              {wf.isTemplate && <span style={{ background:'#F5F3FF', color:'#7C3AED', padding:'1px 8px', borderRadius:'10px', fontSize:'10px', fontWeight:700, border:'1px solid #EDE9FE' }}>Workflow</span>}
                            </div>
                          </div>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, flexShrink:0 }}>
                            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:sc.color, display:'inline-block' }}/>
                            {sc.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding:'16px 28px', borderTop:'1.5px solid #F1F5F9', display:'flex', justifyContent:'flex-end', gap:'10px', flexShrink:0 }}>
                <button onClick={() => { setViewModal(null); handleEdit(viewModal); }}
                  style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'10px', border:'1.5px solid #E2E8F0', background:'#F8FAFC', cursor:'pointer', fontWeight:600, fontSize:'14px', color:'#475569', fontFamily:"'Inter',sans-serif" }}>
                  <IconEdit/> Modifier
                </button>
                <button onClick={() => setViewModal(null)}
                  style={{ padding:'10px 24px', borderRadius:'10px', border:'none', background:'#2563EB', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:'14px', fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 12px rgba(37,99,235,0.3)' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Modal ── */}
        {deleteModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
            <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'400px', width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', textAlign:'center' }}>
              <div style={{ width:'52px', height:'52px', borderRadius:'13px', background:'#FEF9EC', border:'1.5px solid #FDE68A', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', color:'#D97706' }}>
                <IconWarn/>
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:'17px', fontWeight:800, color:'#0F172A' }}>Archiver ce type ?</h3>
              <p style={{ margin:'0 0 24px', color:'#64748B', fontSize:'14px', lineHeight:1.6 }}>
                <strong style={{color:'#0F172A'}}>{deleteModal.name}</strong> sera archivé.
                Les documents existants ne seront pas supprimés.
              </p>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={()=>setDeleteModal(null)} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', fontWeight:600, cursor:'pointer', fontSize:'14px', color:'#475569', fontFamily:"'Inter',sans-serif" }}>Annuler</button>
                <button onClick={handleArchive} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#F59E0B', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'14px', fontFamily:"'Inter',sans-serif" }}>Archiver</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px' }}>Types de documents</h1>
          <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>
            <strong style={{color:'#0F172A'}}>{types.length}</strong> type(s) · Numérotation automatique par type
          </p>
        </div>

        {/* ── Toast ── */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
          </div>
        )}

<div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'20px', alignItems:'start' }}>
          {/* ── Left: Form card ── */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'22px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background: editing ? '#FFF7ED' : '#EFF6FF', border: editing ? '1px solid #FED7AA' : '1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color: editing ? '#EA580C' : B }}>
                {editing ? <IconEdit/> : <IconPlus/>}
              </div>
              <h2 style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#0F172A' }}>
                {editing ? 'Modifier le type' : 'Nouveau type'}
              </h2>
            </div>

            <Field label="Nom du document" icon={<IconFile/>} required>
              <SInput value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex : Demande de Congé"/>
            </Field>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
              <div>
                <Lbl icon={<IconHash/>} required>Préfixe</Lbl>
                <SInput value={form.prefix} onChange={e=>set('prefix',e.target.value.toUpperCase())} placeholder="DC" maxLength={10}/>
              </div>
              <div>
                <Lbl icon={<IconHash/>}>Nb chiffres</Lbl>
                <SSelect value={form.digits} onChange={e=>set('digits',Number(e.target.value))}>
                  {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} chiffres</option>)}
                </SSelect>
              </div>
            </div>

            {/* Live preview */}
            <div style={{ marginBottom:'16px', padding:'12px 14px', background:'#F0FDF4', borderRadius:'9px', border:'1.5px solid #BBF7D0', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'11px', fontWeight:700, color:'#16A34A', textTransform:'uppercase', letterSpacing:'0.06em' }}>Aperçu :</span>
              <span style={{ fontFamily:'monospace', fontSize:'15px', fontWeight:800, color:'#16A34A', letterSpacing:'0.5px' }}>{getExample()}</span>
            </div>

            <Field label="Description" icon={<IconAlignLeft/>}>
              <STextarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Description optionnelle…"/>
            </Field>

            {/* ✅ INFO : le lien avec le workflow se fait côté workflow */}
            <div style={{ marginBottom:'16px', padding:'11px 13px', background:'#EFF6FF', borderRadius:'9px', border:'1.5px solid #BFDBFE', fontSize:'12px', color:'#1E40AF', display:'flex', gap:'8px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'14px', flexShrink:0 }}>💡</span>
              <span>Le workflow associé se configure dans l'éditeur de workflow, pas ici. Un workflow choisit son type de document.</span>
            </div>

            <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:B, color:'#fff', fontWeight:700, fontSize:'14px', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', boxShadow:'0 4px 12px rgba(37,99,235,0.3)', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
                {saving ? <><IconLoader/>…</> : editing ? <><IconSave/>Sauvegarder</> : <><IconPlus/>Créer</>}
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm(emptyForm); }}
                  style={{ padding:'11px 13px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', display:'flex', alignItems:'center', fontFamily:"'Inter',sans-serif" }}>
                  <IconX/>
                </button>
              )}
            </div>
          </div>

          {/* ── Right: List card ── */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>

            {/* Search bar */}
            <div style={{ padding:'13px 20px', borderBottom:'1.5px solid #E2E8F0', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ position:'relative', flex:1 }}>
                <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}>
                  <IconSearch/>
                </span>
                <input
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                  placeholder="Rechercher nom, préfixe…"
                  style={{ width:'100%', boxSizing:'border-box', padding:'9px 36px 9px 38px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', background:'#F8FAFC', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
                  onFocus={e=>{ e.target.style.borderColor=B; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background='#fff'; }}
                  onBlur={e=>{ e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; e.target.style.background='#F8FAFC'; }}
                />
                {search && (
                  <button onClick={()=>setSearch('')}
                    style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
                    <IconX/>
                  </button>
                )}
              </div>
              <span style={{ fontSize:'13px', color:'#94A3B8', whiteSpace:'nowrap' }}>
                <strong style={{color:'#0F172A'}}>{filtered.length}</strong> / {types.length}
              </span>
            </div>

            {/* ✅ Table header — sans colonne Workflow */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 0.8fr 1fr 0.7fr 112px', gap:'12px', padding:'11px 20px', background:'#F8FAFC', borderBottom:'1.5px solid #E2E8F0' }}>
              {['Nom', 'Préfixe', 'Exemple', 'Statut', 'Actions'].map(h => (
                <div key={h} style={{ fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'14px' }}>
                <IconLoader/> Chargement…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding:'64px', textAlign:'center' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:B }}>
                  <IconFile/>
                </div>
                {search
                  ? <><p style={{margin:'0 0 4px',fontWeight:700,color:'#0F172A',fontSize:'15px'}}>Aucun résultat pour « {search} »</p><p style={{margin:0,color:'#94A3B8',fontSize:'13px'}}>Essayez un autre terme.</p></>
                  : <><p style={{margin:'0 0 4px',fontWeight:700,color:'#0F172A',fontSize:'15px'}}>Aucun type de document</p><p style={{margin:0,color:'#94A3B8',fontSize:'13px'}}>Créez votre premier type.</p></>
                }
              </div>
            ) : filtered.map(type => {
              const pc = prefixColor(type.prefix);
              return (
               <div key={type._id} className="dt-row"
                  style={{ display:'grid', gridTemplateColumns:'2fr 0.8fr 1fr 0.7fr 112px', gap:'12px', alignItems:'center', padding:'13px 20px', borderBottom:'1px solid #F1F5F9', background:'#fff', transition:'background 0.15s' }}>

                  {/* Name */}
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${pc}12`, border:`1.5px solid ${pc}25`, display:'flex', alignItems:'center', justifyContent:'center', color:pc, flexShrink:0 }}>
                      <IconFile/>
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:0, fontWeight:700, fontSize:'14px', color:'#0F172A', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{type.name}</p>
                      {type.description && <p style={{ margin:'1px 0 0', fontSize:'11px', color:'#94A3B8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{type.description}</p>}
                    </div>
                  </div>

                  {/* Prefix badge */}
                  <div>
                    <span style={{ display:'inline-block', padding:'4px 10px', borderRadius:'7px', background:`${pc}12`, color:pc, fontSize:'12px', fontWeight:800, fontFamily:'monospace', border:`1px solid ${pc}25` }}>
                      {type.prefix}
                    </span>
                  </div>

                  {/* Example */}
                  <div style={{ fontFamily:'monospace', fontSize:'13px', color:'#16A34A', fontWeight:700 }}>
                    {type.example || '—'}
                  </div>

                  {/* Status */}
{/* Status — cliquable, bascule directement sans confirmation */}
                  <div>
                    <span onClick={() => handleToggleStatus(type)} title="Cliquer pour changer le statut"
                      style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, cursor:'pointer', userSelect:'none', background: type.isActive ? '#F0FDF4' : '#FEF2F2', color: type.isActive ? '#16A34A' : '#DC2626', border: type.isActive ? '1px solid #BBF7D0' : '1px solid #FECACA' }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: type.isActive ? '#16A34A' : '#DC2626', display:'inline-block' }}/>
                      {type.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'6px' }}>
                    <button className="dt-action-btn" onClick={() => openView(type)}
                      style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#F0FDF4', color:'#16A34A', border:'1.5px solid #BBF7D0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Voir les détails">
                      <IconEye/>
                    </button>
                    <button className="dt-action-btn" onClick={() => handleEdit(type)}
                      style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#EFF6FF', color:B, border:'1.5px solid #BFDBFE', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Modifier">
                      <IconEdit/>
                    </button>
                    <button className="dt-action-btn" onClick={() => setDeleteModal(type)}
                      style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#FFF7ED', color:'#F59E0B', border:'1.5px solid #FED7AA', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Archiver">
                      <IconArchive/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentTypesPage;