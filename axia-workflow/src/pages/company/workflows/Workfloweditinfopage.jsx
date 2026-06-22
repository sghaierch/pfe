import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import workflowService   from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';
import projectService    from '../../../services/projectService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconSave    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconUsers   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconLock    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconArrowR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconEdit    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const B = '#2563EB';

const DOC_TYPES = [
  { value:'',   label:'Aucun (workflow simple)'     },
  { value:'DA', label:"DA — Demande d'achat",  color:'#2563EB' },
  { value:'BS', label:'BS — Bon de sortie',    color:'#D97706' },
  { value:'DF', label:'DF — Facturation',      color:'#7C3AED' },
  { value:'BR', label:'BR — Bon de réception', color:'#16A34A' },
];

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
    style={{...getInp(f,color), cursor:'pointer'}}>{children}</select>;
};
const Lbl = ({ children, required }) => (
  <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>
    {children}{required && <span style={{color:'#EF4444'}}>*</span>}
  </label>
);
const SectionCard = ({ number, title, subtitle, children, color=B }) => (
  <div style={{ marginBottom:'24px', paddingBottom:'24px', borderBottom:'1.5px solid #F1F5F9' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:subtitle?'6px':'18px' }}>
      <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'13px', flexShrink:0 }}>{number}</div>
      <h2 style={{ margin:0, fontSize:'15px', fontWeight:800, color:'#0F172A' }}>{title}</h2>
    </div>
    {subtitle && <p style={{ margin:'0 0 18px 38px', fontSize:'13px', color:'#64748B', lineHeight:1.6 }}>{subtitle}</p>}
    {children}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const WorkflowEditInfoPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const [form, setForm] = useState({ name:'', description:'', projectId:'', dueDate:'', docType:'', postMapping:{} });

  useEffect(() => {
    const load = async () => {
      try {
        const [wfRes, postsData, projRes] = await Promise.all([
          workflowService.getById(id),
          departmentService.getAllPosts(),
          projectService.getAll ? projectService.getAll() : { data:{ projects:[] } },
        ]);
        const wf    = wfRes?.data?.workflow;
        const projs = projRes?.data?.projects || projRes?.data?.data?.projects || [];
        if (!wf) { setMsg('ERREUR Workflow introuvable'); setLoading(false); return; }
        if (wf.status !== 'draft') { setMsg('ERREUR Ce workflow est déjà démarré. Seuls les brouillons sont modifiables.'); setLoading(false); return; }
        setWorkflow(wf); setProjects(projs); setAllPosts(postsData||[]);
        const mapping = {};
        (wf.steps||[]).forEach(step => { mapping[step.postSlot||('slot_'+step.order)] = step.assignedPost||''; });
        setForm({ name:wf.name||'', description:wf.description||'', projectId:wf.project?._id||wf.project||'', dueDate:wf.dueDate?wf.dueDate.slice(0,10):'', docType:wf.docType||'', postMapping:mapping });
      } catch (err) { setMsg('ERREUR '+(err.response?.data?.message||err.message)); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setMsg('ERREUR Nom du workflow requis'); return; }
    const updatedSteps = (workflow.steps||[]).map(step => {
      const key = step.postSlot||('slot_'+step.order);
      const np = form.postMapping[key]||step.assignedPost||'';
      return { ...step, assignedPost:np, assignedPostName:np };
    });
    setSaving(true); setMsg('');
    try {
      await workflowService.update(id, { name:form.name, description:form.description, project:form.projectId||undefined, dueDate:form.dueDate||null, docType:form.docType||'', steps:updatedSteps });
      const oldPid = workflow?.project?._id||workflow?.project;
      if (form.projectId && form.projectId !== oldPid) {
        try { await workflowService.moveToProject(id, form.projectId); } catch {}
      }
      setMsg('SUCCESS Workflow mis à jour !');
      const pid = form.projectId||workflow?.project?._id||workflow?.project;
      setTimeout(() => { if (pid) navigate('/dashboard/company/projects/'+pid); else navigate('/dashboard/company/workflows/'+id); }, 1200);
    } catch (err) { setMsg('ERREUR '+(err.response?.data?.message||err.message)); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px', fontFamily:"'Inter',sans-serif" }}>
      <IconLoader/> Chargement…
    </div>
  );

  if (!workflow) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:'center', background:'#fff', padding:'40px', borderRadius:'20px', boxShadow:'0 8px 32px rgba(0,0,0,0.1)', maxWidth:'460px', border:'1.5px solid #E2E8F0' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#FEF2F2', border:'1.5px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', color:'#DC2626' }}><IconAlert/></div>
        <h2 style={{ color:'#DC2626', margin:'0 0 12px', fontWeight:800 }}>Modification impossible</h2>
        <p style={{ color:'#64748B', margin:'0 0 24px', lineHeight:1.6 }}>{msg.replace('ERREUR ','')}</p>
        <button onClick={()=>navigate(-1)} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 22px', borderRadius:'9px', background:B, color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
          <IconArrowL/> Retour
        </button>
      </div>
    </div>
  );

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText = msg.replace(/^(ERREUR|SUCCESS)\s?/,'');
  const isAuto = workflow?.templateType === 'automatic';

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
            <h1 style={{ margin:'0 0 5px', fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px', display:'flex', alignItems:'center', gap:'8px' }}>
              <IconEdit/> Modifier le workflow
            </h1>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#FFFBEB', color:'#D97706', padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1px solid #FDE68A' }}>
              Brouillon — modifications autorisées
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
              <div><Lbl required>Nom du workflow</Lbl><SInput value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ex : Validation achats"/></div>
              <div><Lbl>Projet</Lbl>
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

          {/* ── Section 2 : Type documentaire ── */}
          <SectionCard number="2" title="Type documentaire" subtitle="Associez un type de document à ce workflow.">
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              {DOC_TYPES.map(dt => {
                const isSel = form.docType === dt.value;
                return (
                  <button key={dt.value} onClick={()=>setForm(p=>({...p,docType:dt.value}))}
                    style={{ padding:'10px 18px', borderRadius:'10px', border:`1.5px solid ${isSel?(dt.color||B):'#E2E8F0'}`, background:isSel?(dt.color?dt.color+'12':'#EFF6FF'):'#F8FAFC', color:isSel?(dt.color||B):'#64748B', fontWeight:isSel?700:500, fontSize:'13px', cursor:'pointer', fontFamily:"'Inter',sans-serif", transition:'all 0.15s', boxShadow:isSel?`0 2px 8px ${dt.color||B}25`:'none' }}>
                    {dt.label}
                  </button>
                );
              })}
            </div>
            {form.docType && (
              <div style={{ marginTop:'14px', padding:'12px 14px', background:'#EFF6FF', borderRadius:'9px', border:'1.5px solid #BFDBFE', fontSize:'12px', color:'#1D4ED8', fontWeight:500 }}>
                Le document <strong>{form.docType}XXXXX</strong> sera créé automatiquement.
                {form.docType==='DA' && ' Transformation : DA → DAC → BS → DF → BR'}
                {form.docType==='BS' && ' Transformation : BS → DF → BR'}
                {form.docType==='DF' && ' Transformation : DF → BR'}
                {form.docType==='BR' && ' Document final de la chaîne.'}
              </div>
            )}
          </SectionCard>

          {/* ── Section 3 : Postes responsables ── */}
          {!isAuto && (workflow.steps||[]).length > 0 && (
            <SectionCard number="3" title="Postes responsables" subtitle="Réassignez les postes responsables de chaque étape.">
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {(workflow.steps||[]).map((step, i) => {
                  const key = step.postSlot||('slot_'+step.order);
                  const isEmp = i === 0;
                  const stepColor = isEmp ? '#0891B2' : B;
                  const stepBg    = isEmp ? '#E0F2FE' : '#EFF6FF';
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px 18px', background:isEmp?'#E0F2FE':'#F8FAFC', borderRadius:'12px', border:`1.5px solid ${isEmp?'#7DD3FC':'#E2E8F0'}` }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:stepColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'14px', flexShrink:0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:'0 0 3px', fontWeight:800, fontSize:'14px', color:'#0F172A' }}>{step.name}</p>
                        {step.description && <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>{step.description}</p>}
                        {step.delai && <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#7C3AED' }}>⏱ Délai : {step.delai}</p>}
                      </div>
                      <span style={{ color:'#CBD5E1', display:'flex', flexShrink:0 }}><IconArrowR/></span>

                      {isEmp ? (
                        <div style={{ minWidth:'240px', padding:'12px 14px', background:'#fff', borderRadius:'10px', border:'1.5px solid #7DD3FC' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'4px' }}>
                            <IconUsers/>
                            {(workflow.allowedPosts?.length>0) ? (
                              <span style={{ fontSize:'12px', fontWeight:700, color:'#0891B2' }}>Postes autorisés :</span>
                            ) : (
                              <span style={{ fontSize:'13px', fontWeight:700, color:'#16A34A' }}>Tous les employés</span>
                            )}
                          </div>
                          {(workflow.allowedPosts?.length>0) && (
                            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                              {workflow.allowedPosts.map(p=><span key={p} style={{ background:'#E0F2FE', color:'#0891B2', padding:'2px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:700 }}>{p}</span>)}
                            </div>
                          )}
                          <p style={{ margin:'4px 0 0', fontSize:'10px', color:'#94A3B8' }}>Assignée automatiquement au demandeur</p>
                        </div>
                      ) : (
                        <div style={{ minWidth:'240px' }}>
                          <SSelect value={form.postMapping[key]||''} onChange={e=>setForm(p=>({...p,postMapping:{...p.postMapping,[key]:e.target.value}}))}>
                            <option value="">— Choisir un poste —</option>
                            {allPosts.map(p=><option key={p._id} value={p.name}>{p.name}{p.departmentName?` (${p.departmentName})`:''}</option>)}
                          </SSelect>
                          {form.postMapping[key]
                            ? <p style={{ margin:'5px 0 0', fontSize:'12px', color:'#16A34A', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}><IconCheck/> {form.postMapping[key]}</p>
                            : <p style={{ margin:'5px 0 0', fontSize:'12px', color:'#D97706', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}><IconAlert/> Non assigné</p>
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Submit */}
          <div style={{ display:'flex', gap:'12px' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', borderRadius:'10px', background:saving?'#E2E8F0':B, color:saving?'#94A3B8':'#fff', border:'none', fontWeight:700, fontSize:'15px', cursor:saving?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", boxShadow:saving?'none':`0 4px 16px ${B}40`, transition:'all 0.15s' }}>
              {saving ? <><IconLoader/> Sauvegarde…</> : <><IconSave/> Sauvegarder les modifications</>}
            </button>
            <button onClick={()=>navigate(-1)} disabled={saving}
              style={{ padding:'13px 24px', borderRadius:'10px', background:'#F8FAFC', color:'#475569', border:'1.5px solid #E2E8F0', fontWeight:600, fontSize:'14px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkflowEditInfoPage;