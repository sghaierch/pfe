import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import templateService   from '../../../services/templateService';
import workflowService   from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';
import projectService    from '../../../services/projectService';
import API from '../../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconGlobe   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconLock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconX       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconUsers   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconArrowR  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

const B = '#2563EB';

const TYPE_LABELS = {
  validation_confirmation: { label:'Validation + Confirmation', color:B,        bg:'#EFF6FF' },
  confirmation_only:       { label:'Juste Confirmation',        color:'#16A34A', bg:'#F0FDF4' },
  automatic:               { label:'Automatique',               color:'#D97706', bg:'#FFFBEB' },
};
const ROLE_CONFIG = {
  employe:      { color:'#0891B2', bg:'#E0F2FE', label:'Employé'      },
  validateur:   { color:B,         bg:'#EFF6FF', label:'Validateur'   },
  confirmateur: { color:'#16A34A', bg:'#F0FDF4', label:'Confirmateur' },
  manager:      { color:'#7C3AED', bg:'#F5F3FF', label:'Manager'      },
  finance:      { color:'#D97706', bg:'#FFFBEB', label:'Finance'      },
  responsable:  { color:'#DC2626', bg:'#FEF2F2', label:'Responsable'  },
  rh:           { color:'#0F766E', bg:'#CCFBF1', label:'RH'           },
  direction:    { color:'#92400E', bg:'#FEF9C3', label:'Direction'    },
};

// ── Palette couleurs pour les types de documents ──────────────────────────
const DOC_COLORS = ['#2563EB','#D97706','#7C3AED','#16A34A','#0891B2','#DB2777','#EA580C','#65A30D'];

// ── Shared input style ─────────────────────────────────────────────────────
const getInp = (focused, color) => ({
  width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px',
  border: focused ? `1.5px solid ${color||B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});
const SInput = ({ value, onChange, placeholder, type='text' }) => {
  const [f, setF] = useState(false);
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={getInp(f)}/>;
};
const SSelect = ({ value, onChange, children, color }) => {
  const [f, setF] = useState(false);
  return <select value={value} onChange={onChange}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInp(f, color), cursor:'pointer'}}>{children}</select>;
};

const Lbl = ({ children, required }) => (
  <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>
    {children}{required && <span style={{color:'#EF4444'}}>*</span>}
  </label>
);

const SectionCard = ({ number, title, subtitle, children, color=B }) => (
  <div style={{ marginBottom:'24px', paddingBottom:'24px', borderBottom:'1.5px solid #F1F5F9' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom: subtitle ? '6px' : '18px' }}>
      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'13px', flexShrink:0 }}>
        {number}
      </div>
      <h2 style={{ margin:0, fontSize:'15px', fontWeight:800, color:'#0F172A' }}>{title}</h2>
    </div>
    {subtitle && <p style={{ margin:'0 0 18px 38px', fontSize:'13px', color:'#64748B', lineHeight:1.6 }}>{subtitle}</p>}
    {children}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const CreateWorkflowFromTemplate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const [allowedPosts, setAllowedPosts] = useState([]);
  const [template,     setTemplate]     = useState(null);
  const [projects,     setProjects]     = useState([]);
  const [allPosts,     setAllPosts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [msg,          setMsg]          = useState('');
  // ✅ Types de documents chargés dynamiquement depuis la DB
  const [documentTypes, setDocumentTypes] = useState([]);

  const [form, setForm] = useState({ name:'', description:'', projectId:'', dueDate:'', documentTypeId:'', postMapping:{} });

  useEffect(() => {
    const load = async () => {
      try {
        const [tmplRes, postsData, projRes, dtRes] = await Promise.all([
          templateService.getById(templateId),
          departmentService.getAllPosts(),
          projectService.getAll ? projectService.getAll() : { data:{ projects:[] } },
          API.get('/document-types'),
        ]);
        // ✅ Seuls les types actifs sont proposés
        setDocumentTypes(dtRes.data?.data?.documentTypes?.filter(dt => dt.isActive !== false) || []);
        const tmpl  = tmplRes.data?.template;
        const projs = projRes?.data?.projects || projRes?.data?.data?.projects || [];
        setTemplate(tmpl); setAllPosts(postsData||[]); setProjects(projs);
        if (tmpl) {
          const mapping = {};
          (tmpl.steps||[]).forEach((step, i) => { if (i !== 0) mapping[i] = ''; });
          setForm(p => ({ ...p, name:tmpl.name, documentTypeId:'', postMapping:mapping }));
        }
      } catch (err) { setMsg('ERREUR ' + (err.response?.data?.message||err.message)); }
      finally { setLoading(false); }
    };
    if (templateId) load();
  }, [templateId]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setMsg('ERREUR Nom du workflow requis'); return; }
    if (!form.projectId)   { setMsg('ERREUR Projet requis');          return; }
    let steps = [];
    if (template.type === 'automatic') {
      const es = template.steps?.[0];
      steps = [
        { name:es?.name||'Demande Employé', description:es?.description||'', order:0, role:'employe', assignedPost:'', assignedPostName:'Tous les employés', assignedTo:null, assignedToName:'', assignedRole:'employe', form:es?.form||{fields:[]}, checklist:[], status:'pending', claims:{canValidate:false,canReject:false,canModify:true,canView:true} },
        { name:'Approbation automatique', description:'Approuvé automatiquement', order:1, role:'system', assignedPost:'AUTO', assignedPostName:'Automatique', assignedTo:null, assignedToName:'', assignedRole:'', form:{fields:[]}, checklist:[], status:'pending', claims:{canValidate:true,canReject:true,canModify:false,canView:true} },
      ];
    } else {
      const emptySlots = Object.entries(form.postMapping).filter(([_,v])=>!v);
      if (emptySlots.length > 0) { setMsg('ERREUR Assignez un poste à chaque étape de validation'); return; }
      steps = (template.steps||[]).map((step, i) => {
        const isEmploye = i === 0;
        const rawPostId = isEmploye ? '' : (form.postMapping[i]||'');
        const postObj   = allPosts.find(p => p._id === rawPostId);
        const postName  = postObj?.name || rawPostId;
        const norm      = postName.toLowerCase().trim();
        return { name:step.name, description:step.description||'', order:i, role:step.role||(isEmploye?'employe':'validateur'), assignedPost:isEmploye?'':norm, assignedPostName:isEmploye?'Tous les employés':postName, assignedTo:null, assignedToName:'', assignedRole:step.role||'', delai:step.delai||0, claims:isEmploye?{canValidate:false,canReject:false,canModify:true,canView:true}:(step.claims||{canValidate:true,canReject:true,canModify:false,canView:true}), form:step.form||{fields:[]}, checklist:(step.checklist||[]).map(c=>({...c,checked:false})), status:'pending' };
      });
    }
    setSaving(true);
    try {
      // ✅ docType envoyé comme ObjectId MongoDB (form.documentTypeId)
      await workflowService.create({ name:form.name, description:form.description, project:form.projectId, dueDate:form.dueDate||null, docType:form.documentTypeId||null, templateId, isTemplate:true, steps, nodes:[], edges:[], allowedPosts, visibility:allowedPosts.length>0?'restricted':'global' });
      navigate('/dashboard/company/projects/' + form.projectId);
    } catch (err) { setMsg('ERREUR ' + (err.response?.data?.message||err.message)); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px', fontFamily:"'Inter',sans-serif" }}>
      <IconLoader/> Chargement…
    </div>
  );
  if (!template) return <div style={{ padding:'40px', color:'#64748B', fontFamily:"'Inter',sans-serif" }}>Template non trouvé</div>;

  const typeInfo = TYPE_LABELS[template.type] || TYPE_LABELS.confirmation_only;
  const validationSteps = (template.steps||[]).map((s,i)=>({...s,_globalIndex:i})).filter(s=>s._globalIndex!==0&&s.role!=='employe');
  const employeStep = template.steps?.[0];
  const isSuccess = msg.startsWith('SUCCESS');
  const msgText = msg.replace(/^(ERREUR|SUCCESS)\s?/,'');

  // ✅ Type de document sélectionné (pour afficher l'aperçu numérotation)
  const selectedDocType = documentTypes.find(dt => dt._id === form.documentTypeId);

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ padding:'32px', maxWidth:'900px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'28px', flexWrap:'wrap' }}>
          <button onClick={()=>navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
            <IconArrowL/> Retour
          </button>
          <div>
            <h1 style={{ margin:'0 0 5px', fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px' }}>Nouveau workflow</h1>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:typeInfo.bg, color:typeInfo.color, padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:`1px solid ${typeInfo.color}25` }}>
              {template.name} — {typeInfo.label}
            </span>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'9px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease', ...(isSuccess?{background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'}:{background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess?<IconCheck/>:<IconAlert/>} {msgText}
          </div>
        )}

        <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1.5px solid #E2E8F0' }}>

          {/* ── Section 1 : Infos générales ── */}
          <SectionCard number="1" title="Informations générales">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              <div><Lbl required>Nom du workflow</Lbl><SInput value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ex : Demande congé Q1 2026"/></div>
              <div><Lbl required>Projet</Lbl>
                <SSelect value={form.projectId} onChange={e=>setForm(p=>({...p,projectId:e.target.value}))}>
                  <option value="">— Choisir un projet —</option>
                  {projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
                </SSelect>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div><Lbl>Description</Lbl><SInput value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Optionnel"/></div>
              <div><Lbl>Échéance</Lbl><SInput type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))}/></div>
            </div>
          </SectionCard>

          {/* ── Section 2 : Type de document ── ✅ NOUVEAU */}
          <SectionCard number="2" title="Type de document" subtitle="Quel type de document cette demande génère-t-elle ? Cela détermine la numérotation automatique.">
            {documentTypes.length === 0 ? (
              <div style={{ padding:'14px 16px', background:'#FFFBEB', border:'1.5px solid #FDE68A', borderRadius:'10px', fontSize:'13px', color:'#92400E', display:'flex', alignItems:'center', gap:'8px' }}>
                ⚠️ Aucun type de document disponible — créez-en un dans <strong style={{marginLeft:'4px'}}>Types de documents</strong> d'abord.
              </div>
            ) : (
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {/* Option Aucun */}
                <button
                  onClick={() => setForm(p=>({...p, documentTypeId:''}))}
                  style={{ padding:'10px 18px', borderRadius:'10px', border:`1.5px solid ${!form.documentTypeId ? B : '#E2E8F0'}`, background:!form.documentTypeId ? '#EFF6FF' : '#F8FAFC', color:!form.documentTypeId ? B : '#64748B', fontWeight:!form.documentTypeId ? 700 : 500, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
                  Aucun type
                </button>
                {/* ✅ Types chargés depuis la DB */}
                {documentTypes.map((dt, idx) => {
                  const color = DOC_COLORS[idx % DOC_COLORS.length];
                  const isSel = form.documentTypeId === dt._id;
                  return (
                    <button key={dt._id}
                      onClick={() => setForm(p=>({...p, documentTypeId: dt._id}))}
                      style={{ padding:'10px 18px', borderRadius:'10px', border:`1.5px solid ${isSel ? color : '#E2E8F0'}`, background: isSel ? color+'18' : '#F8FAFC', color: isSel ? color : '#64748B', fontWeight: isSel ? 700 : 500, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.15s', boxShadow: isSel ? `0 2px 8px ${color}30` : 'none' }}>
                      {dt.prefix} — {dt.name}
                    </button>
                  );
                })}
              </div>
            )}
            {/* ✅ Aperçu numérotation */}
            {selectedDocType && (
              <div style={{ marginTop:'12px', padding:'10px 16px', background:'#EFF6FF', borderRadius:'9px', border:'1.5px solid #BFDBFE', fontSize:'13px', color:'#1D4ED8', fontWeight:500, display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontWeight:800, fontSize:'15px', fontFamily:'monospace' }}>{selectedDocType.prefix}</span>
                <span>— Numérotation automatique · Exemple : <strong>{selectedDocType.prefix}{new Date().getFullYear().toString().slice(-2)}-{'1'.padStart(selectedDocType.digits, '0')}</strong></span>
              </div>
            )}
          </SectionCard>

          {/* ── Section 3 : Circuit d'approbation ── */}
          <SectionCard number="3" title="Circuit d'approbation" subtitle="Aperçu des étapes définies dans le template.">
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', padding:'16px 20px', background:'#F8FAFC', borderRadius:'12px', border:'1.5px solid #E2E8F0' }}>
              {(template.steps||[]).map((step, i) => {
                const rc = ROLE_CONFIG[step.role] || ROLE_CONFIG.validateur;
                return (
                  <React.Fragment key={i}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 14px', background:rc.bg, borderRadius:'10px', border:`1.5px solid ${rc.color}25` }}>
                      <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:rc.color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800, flexShrink:0 }}>{i+1}</div>
                      <div>
                        <p style={{ margin:0, fontWeight:800, fontSize:'12px', color:rc.color }}>{step.name}</p>
                        <p style={{ margin:0, fontSize:'10px', color:'#94A3B8' }}>{step.role==='employe'?'Tous les employés':'Poste à assigner'}</p>
                      </div>
                    </div>
                    {i < template.steps.length-1 && <span style={{color:'#CBD5E1',display:'flex'}}><IconArrowR/></span>}
                  </React.Fragment>
                );
              })}
            </div>
          </SectionCard>

          {/* ── Section 4 : Assignation postes ── */}
          {template.type !== 'automatic' && validationSteps.length > 0 && (
            <SectionCard number="4" title="Assignation des postes" subtitle="Choisissez quel poste sera responsable de chaque étape de validation.">
              {/* Étape employé */}
              <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 18px', background:'#E0F2FE', borderRadius:'12px', border:'1.5px solid #7DD3FC', marginBottom:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'#0891B2', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IconUsers/></div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'14px', color:'#0F172A' }}>{employeStep?.name||'Demande Employé'}</p>
                  <p style={{ margin:0, fontSize:'12px', color:'#0891B2', fontWeight:600 }}>
                    {(employeStep?.allowedPosts?.length>0) ? 'Réservé aux postes : '+employeStep.allowedPosts.join(', ') : 'Accessible à tous les employés'}
                  </p>
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#0891B2', color:'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700 }}>
                  <IconLock/> Fixe
                </span>
              </div>

              {validationSteps.map(step => {
                const rc = ROLE_CONFIG[step.role] || ROLE_CONFIG.validateur;
                const idx = step._globalIndex;
                const selected = form.postMapping[idx] || '';
                const selectedPost = allPosts.find(p => p._id === selected);
                return (
                  <div key={idx} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px 18px', background:'#F8FAFC', borderRadius:'12px', border:`1.5px solid ${selected?rc.color+'40':'#E2E8F0'}`, marginBottom:'10px', transition:'border-color 0.15s' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:rc.bg, border:`1.5px solid ${rc.color}40`, display:'flex', alignItems:'center', justifyContent:'center', color:rc.color, flexShrink:0, fontWeight:800, fontSize:'13px' }}>
                      {idx+1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:'0 0 4px', fontWeight:800, fontSize:'14px', color:'#0F172A' }}>{step.name}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                        <span style={{ background:rc.bg, color:rc.color, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${rc.color}25` }}>{rc.label}</span>
                        {step.description && <span style={{ fontSize:'11px', color:'#94A3B8' }}>{step.description}</span>}
                        {step.delai>0 && <span style={{ fontSize:'11px', color:'#94A3B8' }}>⏱ {step.delai>=1440?Math.round(step.delai/1440)+'j':step.delai>=60?Math.round(step.delai/60)+'h':step.delai+'min'}</span>}
                      </div>
                    </div>
                    <span style={{ color:'#CBD5E1', display:'flex', flexShrink:0 }}><IconArrowR/></span>
                    <div style={{ minWidth:'260px' }}>
                      <SSelect value={selected} onChange={e=>setForm(p=>({...p,postMapping:{...p.postMapping,[idx]:e.target.value}}))}>
                        <option value="">— Choisir un poste —</option>
                        {allPosts.map(p=><option key={p._id} value={p._id}>{p.name}{p.departmentName?` (${p.departmentName})`:''}</option>)}
                      </SSelect>
                      {selected && selectedPost
                        ? <p style={{ margin:'5px 0 0', fontSize:'12px', color:'#16A34A', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}><IconCheck/> {selectedPost.name}</p>
                        : <p style={{ margin:'5px 0 0', fontSize:'12px', color:'#D97706', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}><IconAlert/> Poste requis</p>
                      }
                    </div>
                  </div>
                );
              })}
            </SectionCard>
          )}

          {/* Automatic */}
          {template.type === 'automatic' && (
            <SectionCard number="4" title="Mode automatique">
              <div style={{ padding:'16px 18px', background:'#FFFBEB', borderRadius:'12px', border:'1.5px solid #FDE68A' }}>
                <p style={{ margin:0, fontWeight:700, color:'#92400E', fontSize:'14px' }}>
                  ⚡ Les demandes seront approuvées automatiquement sans intervention humaine.
                </p>
              </div>
            </SectionCard>
          )}

          {/* ── Section 5 : Accès employés ── */}
          <SectionCard number="5" title="Accès employés" subtitle="Définissez quels employés peuvent soumettre ce type de demande." color="#7C3AED">
            <div style={{ display:'flex', gap:'12px', marginBottom:'16px' }}>
              {[
                { value:'global',     label:'Tous les employés',  desc:'Visible par tous',                    icon:<IconGlobe/>,  color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0' },
                { value:'restricted', label:'Postes spécifiques', desc:'Visible par les postes sélectionnés', icon:<IconLock/>,   color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE' },
              ].map(opt => {
                const isSelected = opt.value==='global' ? allowedPosts.length===0 : allowedPosts.length>0;
                return (
                  <div key={opt.value} onClick={()=>{ if(opt.value==='global') setAllowedPosts([]); }}
                    style={{ flex:1, padding:'14px 16px', borderRadius:'12px', cursor:'pointer', border:`1.5px solid ${isSelected?opt.border:'#E2E8F0'}`, background:isSelected?opt.bg:'#F8FAFC', transition:'all 0.15s' }}>
                    <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'14px', color:isSelected?opt.color:'#374151', display:'flex', alignItems:'center', gap:'6px' }}>
                      <span style={{color:isSelected?opt.color:'#94A3B8'}}>{opt.icon}</span>{opt.label}
                    </p>
                    <p style={{ margin:0, fontSize:'12px', color:'#64748B' }}>{opt.desc}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'10px', padding:'12px 14px', background:'#F8FAFC', borderRadius:'10px', border:'1.5px solid #E2E8F0', minHeight:'44px', alignItems:'center' }}>
              {allowedPosts.length === 0
                ? <span style={{ fontSize:'13px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'5px' }}><IconGlobe/> Tous les employés peuvent soumettre</span>
                : allowedPosts.map(p => (
                    <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#F5F3FF', color:'#7C3AED', padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1.5px solid #DDD6FE' }}>
                      {p}
                      <button onClick={()=>setAllowedPosts(prev=>prev.filter(x=>x!==p))}
                        style={{ background:'#EDE9FE', border:'none', color:'#7C3AED', cursor:'pointer', width:'16px', height:'16px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}>
                        <IconX/>
                      </button>
                    </span>
                  ))
              }
            </div>

            <SSelect value="" onChange={e=>{ const v=e.target.value; if(v&&!allowedPosts.includes(v)) setAllowedPosts(prev=>[...prev,v]); }}>
              <option value="">+ Restreindre à un poste spécifique…</option>
              {allPosts.filter(p=>!allowedPosts.includes(p.name)).map(p=><option key={p._id} value={p.name}>{p.name}{p.departmentName?` (${p.departmentName})`:''}</option>)}
            </SSelect>

            {allowedPosts.length > 0 && (
              <div style={{ marginTop:'12px', padding:'12px 14px', background:'#FFFBEB', borderRadius:'9px', border:'1.5px solid #FDE68A', display:'flex', alignItems:'center', gap:'8px' }}>
                <IconAlert/>
                <p style={{ margin:0, fontSize:'12px', color:'#92400E', fontWeight:600 }}>
                  Seuls les employés avec les postes sélectionnés verront ce workflow dans leur liste de demandes.
                </p>
              </div>
            )}
          </SectionCard>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={saving}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'14px', borderRadius:'10px', background:saving?'#E2E8F0':B, color:saving?'#94A3B8':'#fff', border:'none', fontWeight:700, fontSize:'15px', cursor:saving?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", boxShadow:saving?'none':`0 4px 16px ${B}40`, transition:'all 0.15s' }}>
            {saving ? <><IconLoader/> Création en cours…</> : <><IconCheck/> Créer le workflow</>}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateWorkflowFromTemplate;