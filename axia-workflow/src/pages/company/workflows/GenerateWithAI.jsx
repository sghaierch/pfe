import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import workflowService from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';
import API from '../../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconSave    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconPlay    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconGlobe   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconLock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconX       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconUsers   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconSparkle = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.88 5.63L19 10l-5.12 1.37L12 17l-1.88-5.63L5 10l5.12-1.37L12 3z"/></svg>;
const IconEdit    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const B = '#2563EB';

const EXEMPLES = [
  "Workflow de demande de congé : l'employé soumet, le RH valide, le directeur financier confirme",
  "Workflow d'achat matériel : le responsable IT vérifie, le directeur financier approuve le budget",
  "Workflow de recrutement : RH filtre les CVs, manager technique valide, directeur général approuve",
  "Workflow de note de frais : l'employé soumet les justificatifs, le comptable vérifie, le DG approuve",
];

const FIELD_TYPE_ICONS  = { text:'T', number:'123', date:'D', select:'L', textarea:'TT', file:'F', checkbox:'CB', signature:'SG', table:'TB', auto_number:'#', auto_user:'@', auto_status:'~' };
const FIELD_TYPE_LABELS = { text:'Texte', number:'Nombre', date:'Date', select:'Liste', textarea:'Zone texte', file:'Fichier', checkbox:'Case', signature:'Signature', table:'Tableau', auto_number:'N° Auto', auto_user:'Demandeur', auto_status:'Statut Auto' };

const getInp = (focused) => ({
  width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:'9px',
  border: focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'13px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'all 0.15s',
});
const SSelect = ({ value, onChange, children, disabled }) => {
  const [f, setF] = useState(false);
  return <select value={value} onChange={onChange} disabled={disabled}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInp(f), cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.6:1}}>{children}</select>;
};

const GenerateWithAI = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  const [description,  setDescription]  = useState('');
  const [generating,   setGenerating]   = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState('');
  const [posts,        setPosts]        = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [starting,     setStarting]     = useState(false);
  const [savedMsg,     setSavedMsg]     = useState('');
  const [editingStep,  setEditingStep]  = useState(null);
  const [allowedPosts,  setAllowedPosts]  = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [docTypeId,     setDocTypeId]     = useState('');

  useEffect(() => {
    departmentService.getAllPosts().then(p=>setPosts(p||[])).catch(()=>setPosts([]));
    API.get('/document-types')
      .then(r => {
        const all = r.data?.data?.documentTypes || [];
        // ✅ isActive peut être absent — on garde tout sauf les explicitement inactifs
        setDocumentTypes(all.filter(dt => dt.isActive !== false));
        console.log('[GenerateWithAI] documentTypes chargés:', all.length);
      })
      .catch(err => console.error('[GenerateWithAI] Erreur chargement types:', err));
  }, []);

  const handleGenerate = async () => {
    if (!description.trim())              { setError('Décrivez votre processus métier'); return; }
    if (description.trim().length < 20)   { setError('Description trop courte — donnez plus de détails'); return; }
    setGenerating(true); setError(''); setResult(null);
    try {
      const generated = await workflowService.generateWithAI(description, posts);
      if (generated.steps) {
        generated.steps = generated.steps.map((step, si) => ({
          ...step,
          form: { fields: (step.form?.fields||[]).map((f,fi)=>({...f,id:'f_'+si+'_'+fi+'_'+Date.now()})) },
          checklist: (step.checklist||[]).map((c,ci)=>({...c,id:'c_'+si+'_'+ci+'_'+Date.now()})),
          claims: step.claims||{canValidate:true,canReject:true,canModify:false,canView:true},
        }));
      }
      setResult(generated);
    } catch (err) { setError('Erreur lors de la génération : '+err.message); }
    finally { setGenerating(false); }
  };

  const buildSteps = (res) => res.steps.map((s,i) => ({
    name:s.name||'Étape '+(i+1), description:s.description||'', order:i,
    assignedTo:null, assignedToName:'', assignedRole:'', assignedPost:s.assignedPost||'', assignedPostName:s.assignedPost||'',
    delai:s.delai||'', type:'etape',
    form:{ fields:(s.form?.fields||[]).map(f=>({...f, options:Array.isArray(f.options)?f.options:[], columns:Array.isArray(f.columns)?f.columns:[], inheritTableFrom:f.inheritTableFrom||'', extraColumns:Array.isArray(f.extraColumns)?f.extraColumns:[] })) },
    checklist:(s.checklist||[]).map(c=>({...c,checked:false})), status:'pending',
    claims:s.claims||{canValidate:true,canReject:true,canModify:false,canView:true},
  }));

  const handleSave = async () => {
    if (!docTypeId) { setSavedMsg('ERREUR Veuillez choisir un type de document avant de sauvegarder'); setTimeout(()=>setSavedMsg(''),3000); return; }
    const invalidSteps = result.steps.filter((s,i) => i > 0 && (!s.assignedPost || !posts.find(p=>p.name===s.assignedPost)));
    if (invalidSteps.length > 0) { setSavedMsg('ERREUR Étapes sans poste valide : ' + invalidSteps.map(s=>s.name).join(', ')); setTimeout(()=>setSavedMsg(''),4000); return; }
    if (!result) return;
    setSaving(true);
    try {
      await workflowService.create({ name:result.workflowName||'Workflow IA', description:result.description||description, projectId, isTemplate:true, docType:docTypeId||null, steps:buildSteps(result), allowedPosts, visibility:allowedPosts.length>0?'restricted':'global', allowedRoles:[] });
      setSavedMsg('SUCCESS');
      setTimeout(()=>navigate('/dashboard/company/projects/'+projectId), 1500);
    } catch (err) { setError('Erreur sauvegarde : '+err.message); }
    finally { setSaving(false); }
  };

  const handleSaveAndStart = async () => {
    if (!docTypeId) { setSavedMsg('ERREUR Veuillez choisir un type de document avant de démarrer'); setTimeout(()=>setSavedMsg(''),3000); return; }
    const invalidSteps = result.steps.filter((s,i) => i > 0 && (!s.assignedPost || !posts.find(p=>p.name===s.assignedPost)));
    if (invalidSteps.length > 0) { setSavedMsg('ERREUR Étapes sans poste valide : ' + invalidSteps.map(s=>s.name).join(', ')); setTimeout(()=>setSavedMsg(''),4000); return; }
    if (!result) return;
    setStarting(true);
    try {
      const res = await workflowService.create({ name:result.workflowName||'Workflow IA', description:result.description||description, projectId, isTemplate:true, docType:docTypeId||null, steps:buildSteps(result), allowedPosts, visibility:allowedPosts.length>0?'restricted':'global', allowedRoles:[] });
      const wfId = res?.data?.workflow?._id;
      if (wfId) await workflowService.start(wfId);
      setSavedMsg('SUCCESS');
      setTimeout(()=>navigate('/dashboard/company/projects/'+projectId), 1500);
    } catch (err) { setError('Erreur : '+err.message); }
    finally { setStarting(false); }
  };

  const updateStep   = (si,key,val) => setResult(p=>{ const s=[...p.steps]; s[si]={...s[si],[key]:val}; return {...p,steps:s}; });
  const updateField  = (si,fi,key,val) => setResult(p=>{ const s=[...p.steps]; const f=[...s[si].form.fields]; f[fi]={...f[fi],[key]:val}; s[si]={...s[si],form:{fields:f}}; return {...p,steps:s}; });
  const removeField  = (si,fi) => setResult(p=>{ const s=[...p.steps]; s[si].form.fields=s[si].form.fields.filter((_,i)=>i!==fi); return {...p,steps:s}; });
  const removeStep   = (si) => setResult(p=>({...p,steps:p.steps.filter((_,i)=>i!==si)}));
  const addColumn    = (si,fi) => setResult(p=>{ const s=[...p.steps]; const f=[...s[si].form.fields]; const c=[...(f[fi].columns||[])]; c.push({id:'col_'+Date.now(),label:'Colonne '+(c.length+1),type:'text'}); f[fi]={...f[fi],columns:c}; s[si]={...s[si],form:{fields:f}}; return {...p,steps:s}; });
  const updateColumn = (si,fi,ci,key,val) => setResult(p=>{ const s=[...p.steps]; const f=[...s[si].form.fields]; const c=[...(f[fi].columns||[])]; c[ci]={...c[ci],[key]:val}; f[fi]={...f[fi],columns:c}; s[si]={...s[si],form:{fields:f}}; return {...p,steps:s}; });
  const removeColumn = (si,fi,ci) => setResult(p=>{ const s=[...p.steps]; const f=[...s[si].form.fields]; f[fi]={...f[fi],columns:(f[fi].columns||[]).filter((_,i)=>i!==ci)}; s[si]={...s[si],form:{fields:f}}; return {...p,steps:s}; });

  const busy = saving || starting;

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .ex-btn:hover { border-color: ${B} !important; color: ${B} !important; background: #EFF6FF !important; }
        .field-row:hover { background: #F8FAFC !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'960px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'28px', flexWrap:'wrap' }}>
          <button onClick={()=>navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
            <IconArrowL/> Retour
          </button>
          <div>
            <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#2563EB,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}><IconSparkle/></span>
              Générer un workflow avec l'IA
            </h1>
            <p style={{ margin:'3px 0 0 46px', fontSize:'13px', color:'#64748B' }}>
              Décrivez votre processus en français — l'IA crée les étapes, formulaires et checklists automatiquement
            </p>
          </div>
        </div>

        {/* ── Success toast ── */}
        {savedMsg === 'SUCCESS' && (
          <div style={{ display:'flex', alignItems:'center', gap:'9px', padding:'13px 18px', borderRadius:'10px', marginBottom:'20px', background:'#F0FDF4', border:'1.5px solid #BBF7D0', color:'#16A34A', fontWeight:700, fontSize:'14px', animation:'slideIn 0.3s ease' }}>
            <IconCheck/> Workflow créé avec succès ! Redirection…
          </div>
        )}

        {/* ── Input zone ── */}
        <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', border:'1.5px solid #E2E8F0', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', marginBottom:'20px' }}>
          <label style={{ display:'block', fontWeight:800, fontSize:'15px', color:'#0F172A', marginBottom:'10px' }}>
            Décrivez votre processus métier
          </label>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={5}
            placeholder="Ex: Je veux un workflow de demande de congé. L'employé soumet une demande avec le nombre de jours et la date. Le directeur RH valide avec un avis. Ensuite le directeur financier confirme le budget."
            style={{ ...getInp(false), fontSize:'15px', lineHeight:1.6, resize:'vertical', padding:'12px 14px' }}
            onFocus={e=>{e.target.style.borderColor=B;e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)';}}
            onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';}}
          />

          {/* Examples */}
          <div style={{ marginTop:'12px' }}>
            <p style={{ margin:'0 0 8px', fontSize:'12px', color:'#94A3B8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em' }}>Exemples — cliquez pour utiliser :</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {EXEMPLES.map((ex,i) => (
                <button key={i} className="ex-btn" onClick={()=>setDescription(ex)}
                  style={{ padding:'5px 13px', borderRadius:'20px', border:'1.5px solid #E2E8F0', background:'#F8FAFC', color:'#64748B', cursor:'pointer', fontSize:'12px', fontWeight:500, transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                  {ex.substring(0,40)}…
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'14px', padding:'10px 14px', background:'#FEF2F2', color:'#DC2626', borderRadius:'9px', fontSize:'13px', fontWeight:600, border:'1.5px solid #FECACA' }}>
              <IconAlert/> {error}
            </div>
          )}

          <button onClick={handleGenerate} disabled={generating || !description.trim()}
            style={{ marginTop:'18px', width:'100%', padding:'14px', borderRadius:'10px', border:'none', cursor:generating||!description.trim()?'not-allowed':'pointer', fontWeight:700, fontSize:'15px', background:generating||!description.trim()?'#E2E8F0':'linear-gradient(135deg,#2563EB,#7C3AED)', color:generating||!description.trim()?'#94A3B8':'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontFamily:"'Inter',sans-serif", boxShadow:generating||!description.trim()?'none':'0 4px 16px rgba(37,99,235,0.4)', transition:'all 0.2s' }}>
            {generating ? <><IconLoader/> L'IA analyse votre description…</> : <><IconSparkle/> Générer le workflow avec l'IA</>}
          </button>
        </div>

        {/* ── Result ── */}
        {result && (
          <div style={{ animation:'fadeUp 0.3s ease' }}>

            {/* Result header */}
            <div style={{ background:'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius:'16px', padding:'22px 28px', marginBottom:'16px', color:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'14px' }}>
                <div>
                  <p style={{ margin:'0 0 4px', fontSize:'11px', opacity:0.8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Workflow généré par l'IA</p>
                  <h2 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:900 }}>{result.workflowName}</h2>
                  {result.description && <p style={{ margin:0, fontSize:'13px', opacity:0.85 }}>{result.description}</p>}
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <button onClick={handleGenerate} disabled={generating}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'9px', border:'1.5px solid rgba(255,255,255,0.4)', background:'transparent', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
                    <IconRefresh/> Régénérer
                  </button>
                  <button onClick={handleSave} disabled={busy}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'9px', border:'1.5px solid rgba(255,255,255,0.4)', background:'transparent', color:'#fff', cursor:busy?'not-allowed':'pointer', fontWeight:600, fontSize:'13px', opacity:busy?0.6:1, fontFamily:"'Inter',sans-serif" }}>
                    {saving ? <IconLoader/> : <IconSave/>} {saving?'Sauvegarde…':'Brouillon'}
                  </button>
                  <button onClick={handleSaveAndStart} disabled={busy}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 18px', borderRadius:'9px', border:'none', background:'#fff', color:'#2563EB', cursor:busy?'not-allowed':'pointer', fontWeight:800, fontSize:'13px', opacity:busy?0.7:1, fontFamily:"'Inter',sans-serif" }}>
                    {starting ? <><IconLoader/> Démarrage…</> : <><IconPlay/> Créer et démarrer</>}
                  </button>
                </div>
              </div>
              <div style={{ display:'flex', gap:'10px', marginTop:'14px', flexWrap:'wrap' }}>
                {[
                  `${result.steps?.length} étapes`,
                  `${result.steps?.reduce((a,s)=>a+(s.form?.fields?.length||0),0)} champs`,
                  result.visibility==='global' ? 'Global' : 'Restreint',
                ].map((t,i) => (
                  <span key={i} style={{ background:'rgba(255,255,255,0.18)', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:600 }}>{t}</span>
                ))}
              </div>

            </div>

            {/* Access section */}
            {/* ── Bloc Type de document — style identique à Accès employés ── */}
            <div style={{ background:'#fff', borderRadius:'14px', border: docTypeId ? '1.5px solid #BBF7D0' : '1.5px solid #FECACA', padding:'18px 22px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'8px', background: docTypeId ? '#F0FDF4' : '#FEF2F2', border: docTypeId ? '1px solid #BBF7D0' : '1px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>
                  📄
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontWeight:700, fontSize:'14px', color:'#0F172A' }}>Type de document <span style={{color:'#EF4444'}}>*</span></p>
                  <p style={{ margin:0, fontSize:'12px', color:'#64748B' }}>Détermine la numérotation automatique des demandes</p>
                </div>
                {docTypeId && (() => {
                  const sel = documentTypes.find(dt => dt._id === docTypeId);
                  if (!sel) return null;
                  return (
                    <span style={{ fontFamily:'monospace', background:'#EFF6FF', color:'#2563EB', padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:800, border:'1.5px solid #BFDBFE' }}>
                      {sel.prefix}
                    </span>
                  );
                })()}
              </div>
              {documentTypes.length === 0 ? (
                <div style={{ padding:'10px 14px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'9px', fontSize:'13px', color:'#92400E' }}>
                  ⚠️ Aucun type de document actif — créez-en un dans <strong>Types de documents</strong> d'abord.
                </div>
              ) : (
                <select
                  value={docTypeId}
                  onChange={e => setDocTypeId(e.target.value)}
                  style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px', border: docTypeId ? '1.5px solid #16A34A' : '1.5px solid #E2E8F0', fontSize:'14px', color: docTypeId ? '#0F172A' : '#94A3B8', outline:'none', background:'#fff', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontWeight: docTypeId ? 600 : 400, transition:'all 0.15s' }}
                >
                  <option value="" disabled hidden>— Choisir un type de document —</option>
                  {documentTypes.map(dt => (
                    <option key={dt._id} value={dt._id}>{dt.prefix} — {dt.name}</option>
                  ))}
                </select>
              )}
              {!docTypeId && (
                <p style={{ margin:'8px 0 0', fontSize:'12px', color:'#EF4444', fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }}>
                  ⚠️ Obligatoire — sans type de document, aucun numéro ne sera généré
                </p>
              )}
            </div>

            <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #BFDBFE', padding:'18px 22px', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:`${B}15`, border:`1.5px solid #BFDBFE`, display:'flex', alignItems:'center', justifyContent:'center', color:B }}><IconUsers/></div>
                <div>
                  <p style={{ margin:0, fontWeight:700, fontSize:'14px', color:'#0F172A' }}>Accès employés</p>
                  <p style={{ margin:0, fontSize:'12px', color:'#64748B' }}>Qui peut soumettre des demandes via ce workflow ?</p>
                </div>
                <span style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:'5px', background:allowedPosts.length>0?'#F5F3FF':'#F0FDF4', color:allowedPosts.length>0?'#7C3AED':'#16A34A', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700 }}>
                  {allowedPosts.length>0 ? <><IconLock/> Restreint</> : <><IconGlobe/> Global</>}
                </span>
              </div>
              <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginBottom:'10px', padding:'10px 12px', background:'#F8FAFC', borderRadius:'9px', border:'1.5px solid #E2E8F0', minHeight:'40px', alignItems:'center' }}>
                {allowedPosts.length===0
                  ? <span style={{ fontSize:'13px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'5px' }}><IconGlobe/> Tous les employés peuvent soumettre</span>
                  : allowedPosts.map(p => (
                      <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#EFF6FF', color:B, padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1.5px solid #BFDBFE' }}>
                        {p}
                        <button onClick={()=>setAllowedPosts(prev=>prev.filter(x=>x!==p))}
                          style={{ background:'#DBEAFE', border:'none', color:B, cursor:'pointer', width:'15px', height:'15px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}>
                          <IconX/>
                        </button>
                      </span>
                    ))
                }
              </div>
              <SSelect value="" onChange={e=>{ const v=e.target.value; if(v&&!allowedPosts.includes(v)) setAllowedPosts(prev=>[...prev,v]); }}>
                <option value="">+ Restreindre à un poste spécifique…</option>
                {posts.filter(p=>!allowedPosts.includes(p.name)).map(p=><option key={p._id} value={p.name}>{p.name}{p.departmentName?` (${p.departmentName})`:''}</option>)}
              </SSelect>
            </div>

            {/* Steps */}
            {result.steps?.map((step, si) => (
              <div key={si} style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', marginBottom:'14px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', animation:'fadeUp 0.2s ease' }}>
                {/* Step header */}
                <div style={{ padding:'14px 18px', background:'#F8FAFC', borderBottom:'1.5px solid #E2E8F0', display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'9px', background: si===0?'#0891B2':B, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'14px', flexShrink:0 }}>{si+1}</div>
                  <div style={{ flex:1 }}>
                    {editingStep === si ? (
                      <input value={step.name} onChange={e=>updateStep(si,'name',e.target.value)} autoFocus onBlur={()=>setEditingStep(null)}
                        style={{ ...getInp(true), fontWeight:700, fontSize:'15px', padding:'4px 9px', width:'auto', minWidth:'200px' }}/>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <h3 style={{ margin:0, fontSize:'15px', fontWeight:800, color:'#0F172A' }}>{step.name}</h3>
                        <button onClick={()=>setEditingStep(si)} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', fontSize:'11px', fontWeight:600, fontFamily:"'Inter',sans-serif" }}>
                          <IconEdit/> Renommer
                        </button>
                      </div>
                    )}
                    {step.description && <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#64748B' }}>{step.description}</p>}
                  </div>
                  <button onClick={()=>removeStep(si)}
                    style={{ display:'flex', alignItems:'center', gap:'5px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', padding:'5px 11px', borderRadius:'8px', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:"'Inter',sans-serif" }}>
                    <IconTrash/> Supprimer
                  </button>
                </div>

                <div style={{ padding:'18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>
                  {/* Left: config */}
                  <div>
                    <div style={{ marginBottom:'14px' }}>
                      <label style={{ display:'block', fontWeight:700, fontSize:'11px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Poste responsable</label>
                      {si === 0 ? (
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', borderRadius:'9px', border:'1.5px solid #BBF7D0', background:'#F0FDF4', fontSize:'13px', fontWeight:600, color:'#16A34A' }}>
                          <IconUsers/> {allowedPosts.length > 0 ? allowedPosts.join(', ') + ' (soumission)' : 'Tous les employés (soumission)'}
                        </div>
                      ) : (
                        <div>
                          {step.assignedPost && !posts.find(p => p.name === step.assignedPost) && (
                            <div style={{ marginBottom:'8px', padding:'8px 12px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'8px', fontSize:'12px', color:'#92400E', display:'flex', alignItems:'center', gap:'7px' }}>
                              ⚠️ <span>Le poste <strong>"{step.assignedPost}"</strong> suggéré par l'IA n'existe pas — choisissez un poste réel.</span>
                            </div>
                          )}
                          <SSelect value={posts.find(p=>p.name===step.assignedPost) ? step.assignedPost : ''} onChange={e=>updateStep(si,'assignedPost',e.target.value)}>
                            <option value="">— Choisir un poste —</option>
                            {posts.map(p=><option key={p._id} value={p.name}>{p.name}{p.departmentName?` (${p.departmentName})`:''}</option>)}
                          </SSelect>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom:'14px' }}>
                      <label style={{ display:'block', fontWeight:700, fontSize:'11px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Délai</label>
                      <SSelect value={step.delai||''} onChange={e=>updateStep(si,'delai',e.target.value)}>
                        <option value="">Sans délai</option>
                        <option value="1j">1 jour</option>
                        <option value="2j">2 jours</option>
                        <option value="3j">3 jours</option>
                        <option value="1s">1 semaine</option>
                        <option value="2s">2 semaines</option>
                      </SSelect>
                    </div>

                    {/* Claims */}
                    <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'12px 14px', border:'1.5px solid #E2E8F0' }}>
                      <p style={{ margin:'0 0 10px', fontWeight:700, fontSize:'11px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>Permissions</p>
                      {si === 0 ? (
                        <div style={{ fontSize:'12px', color:'#94A3B8', lineHeight:1.7 }}>
                          <div>— Peut valider <span style={{fontSize:'10px'}}>(désactivé — étape employé)</span></div>
                          <div>— Peut rejeter <span style={{fontSize:'10px'}}>(désactivé — étape employé)</span></div>
                          <div style={{color:'#16A34A',fontWeight:600}}>✓ Peut voir</div>
                        </div>
                      ) : (
                        [{key:'canValidate',label:'Peut valider',color:'#16A34A'},{key:'canReject',label:'Peut rejeter',color:'#DC2626'},{key:'canView',label:'Peut voir',color:B}].map(c => (
                          <label key={c.key} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', cursor:'pointer' }}>
                            <input type="checkbox" checked={step.claims?.[c.key]!==false} onChange={e=>updateStep(si,'claims',{...(step.claims||{}),[c.key]:e.target.checked})}/>
                            <span style={{ fontSize:'12px', fontWeight:600, color:c.color }}>{c.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: form fields */}
                  <div>
                    <p style={{ margin:'0 0 10px', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                      Formulaire — {step.form?.fields?.length||0} champ(s)
                    </p>
                    {(step.form?.fields||[]).map((field, fi) => (
                      <div key={field.id} style={{ marginBottom:'7px' }}>
                        <div className="field-row" style={{ display:'flex', gap:'6px', alignItems:'center', padding:'8px 10px', background:field.type==='table'?'#F0F9FF':field.readOnly?'#F5F3FF':'#F8FAFC', borderRadius:'8px', border:`1.5px solid ${field.type==='table'?'#BAE6FD':field.readOnly?'#DDD6FE':'#E2E8F0'}`, transition:'background 0.15s' }}>
                          <span style={{ background:field.type==='table'?'#E0F2FE':field.readOnly?'#EDE9FE':'#EFF6FF', color:field.type==='table'?'#0284C7':field.readOnly?'#7C3AED':B, padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:800, flexShrink:0 }}>
                            {FIELD_TYPE_ICONS[field.type]||field.type}
                          </span>
                          <input value={field.label} onChange={e=>updateField(si,fi,'label',e.target.value)} disabled={field.readOnly}
                            style={{ flex:1, padding:'3px 7px', borderRadius:'6px', border:'1.5px solid #E2E8F0', fontSize:'12px', background:field.readOnly?'#F1F5F9':'#fff', color:'#0F172A', outline:'none', fontFamily:"'Inter',sans-serif" }}/>
                          <select value={field.type} onChange={e=>updateField(si,fi,'type',e.target.value)} disabled={field.readOnly}
                            style={{ padding:'3px 5px', borderRadius:'6px', border:'1.5px solid #E2E8F0', fontSize:'11px', background:'#fff', fontFamily:"'Inter',sans-serif" }}>
                            {Object.keys(FIELD_TYPE_LABELS).map(t=><option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>)}
                          </select>
                          {!field.readOnly && (
                            <label style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'10px', color:'#64748B', cursor:'pointer', flexShrink:0, fontWeight:600 }}>
                              <input type="checkbox" checked={field.required||false} onChange={e=>updateField(si,fi,'required',e.target.checked)}/> Req.
                            </label>
                          )}
                          {field.readOnly && <span style={{ fontSize:'10px', color:'#7C3AED', fontWeight:800, flexShrink:0 }}>AUTO</span>}
                          <button onClick={()=>removeField(si,fi)}
                            style={{ width:'22px', height:'22px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', borderRadius:'6px', cursor:'pointer', fontWeight:800, fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            ×
                          </button>
                        </div>

                        {/* Select options */}
                        {field.type==='select' && !field.readOnly && (
                          <div style={{ marginTop:'4px', marginLeft:'14px', padding:'9px 12px', background:'#FAFAFA', borderRadius:'8px', border:'1.5px solid #E2E8F0' }}>
                            <p style={{ margin:'0 0 5px', fontSize:'11px', fontWeight:700, color:'#64748B' }}>Options (séparées par virgule)</p>
                            <input value={(field.options||[]).join(', ')} onChange={e=>updateField(si,fi,'options',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
                              placeholder="Approuvé, Refusé, En attente"
                              style={{ width:'100%', boxSizing:'border-box', padding:'5px 9px', borderRadius:'7px', border:'1.5px solid #E2E8F0', fontSize:'12px', fontFamily:"'Inter',sans-serif" }}/>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginTop:'6px' }}>
                              {(field.options||[]).map((opt,oi)=><span key={oi} style={{ background:'#EFF6FF', color:B, padding:'2px 9px', borderRadius:'10px', fontSize:'10px', fontWeight:700 }}>{opt}</span>)}
                            </div>
                          </div>
                        )}

                        {/* Table columns */}
                        {field.type==='table' && (
                          <div style={{ marginTop:'6px', marginLeft:'14px', padding:'10px 12px', background:'#E0F2FE', borderRadius:'8px', border:'1.5px solid #BAE6FD' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                              <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'#0284C7' }}>Colonnes ({(field.columns||[]).length})</p>
                              <button onClick={()=>addColumn(si,fi)} style={{ padding:'2px 10px', borderRadius:'6px', border:'1px dashed #0284C7', background:'transparent', color:'#0284C7', cursor:'pointer', fontSize:'11px', fontWeight:700, fontFamily:"'Inter',sans-serif" }}>+ Colonne</button>
                            </div>
                            {(field.columns||[]).map((col,ci)=>(
                              <div key={col.id} style={{ display:'flex', gap:'5px', alignItems:'center', marginBottom:'5px' }}>
                                <input value={col.label} onChange={e=>updateColumn(si,fi,ci,'label',e.target.value)} placeholder="Nom colonne" style={{ flex:1, padding:'4px 7px', borderRadius:'6px', border:'1.5px solid #93C5FD', fontSize:'11px', fontFamily:"'Inter',sans-serif" }}/>
                                <select value={col.type||'text'} onChange={e=>updateColumn(si,fi,ci,'type',e.target.value)} style={{ padding:'4px 5px', borderRadius:'6px', border:'1.5px solid #93C5FD', fontSize:'11px', fontFamily:"'Inter',sans-serif" }}>
                                  <option value="text">Texte</option>
                                  <option value="number">Nombre</option>
                                  <option value="date">Date</option>
                                </select>
                                <button onClick={()=>removeColumn(si,fi,ci)} style={{ width:'22px', height:'22px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', borderRadius:'6px', cursor:'pointer', fontWeight:800, fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Checklist */}
                    {(step.checklist||[]).length > 0 && (
                      <div style={{ marginTop:'12px' }}>
                        <p style={{ margin:'0 0 7px', fontWeight:700, fontSize:'11px', color:'#7C3AED', textTransform:'uppercase', letterSpacing:'0.07em' }}>Checklist — {step.checklist.length} tâche(s)</p>
                        {step.checklist.map((item,ci)=>(
                          <div key={item.id} style={{ display:'flex', gap:'7px', alignItems:'center', padding:'6px 10px', background:'#F5F3FF', borderRadius:'8px', marginBottom:'5px', border:'1.5px solid #EDE9FE' }}>
                            <span style={{ width:'14px', height:'14px', borderRadius:'3px', border:'1.5px solid #7C3AED', flexShrink:0 }}/>
                            <span style={{ flex:1, fontSize:'12px', color:'#374151', fontWeight:500 }}>{item.label}</span>
                            {item.required && <span style={{ fontSize:'10px', color:'#DC2626', fontWeight:800 }}>REQUIS</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom actions */}
            <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'8px' }}>
              <button onClick={()=>{ setResult(null); setDescription(''); }}
                style={{ padding:'12px 22px', borderRadius:'10px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'14px', fontFamily:"'Inter',sans-serif" }}>
                Recommencer
              </button>
              <button onClick={handleSave} disabled={busy}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'12px 22px', borderRadius:'10px', border:`1.5px solid ${B}`, background:'#EFF6FF', color:B, cursor:busy?'not-allowed':'pointer', fontWeight:700, fontSize:'14px', opacity:busy?0.7:1, fontFamily:"'Inter',sans-serif" }}>
                {saving ? <><IconLoader/> Sauvegarde…</> : <><IconSave/> Brouillon</>}
              </button>
              <button onClick={handleSaveAndStart} disabled={busy}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'12px 28px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#16A34A,#047857)', color:'#fff', cursor:busy?'not-allowed':'pointer', fontWeight:800, fontSize:'14px', opacity:busy?0.7:1, fontFamily:"'Inter',sans-serif", boxShadow:'0 4px 16px rgba(22,163,74,0.35)' }}>
                {starting ? <><IconLoader/> Démarrage…</> : <><IconPlay/> Créer et démarrer</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GenerateWithAI;