import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectService  from '../../../services/projectService';
import workflowService from '../../../services/workflowService';
import WorkflowEditor  from '../workflows/WorkflowEditor';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconGear     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconList     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const IconPlay     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconPause    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="4" x2="6" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/></svg>;
const IconEdit     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconEye      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconTrash    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const IconPlus     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSparkle  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.88 5.63L19 10l-5.12 1.37L12 17l-1.88-5.63L5 10l5.12-1.37L12 3z"/></svg>;
const IconCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconUsers    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconGlobe    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconLock     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconSearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconXSm      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const B = '#2563EB';

const STATUS_MAP = {
  draft:     { bg:'#F8FAFC', color:'#64748B', dot:'#94A3B8', border:'#E2E8F0', label:'Brouillon' },
  active:    { bg:'#EFF6FF', color:'#1D4ED8', dot:'#3B82F6', border:'#BFDBFE', label:'Actif'     },
  completed: { bg:'#F0FDF4', color:'#16A34A', dot:'#22C55E', border:'#BBF7D0', label:'Terminé'   },
  rejected:  { bg:'#FEF2F2', color:'#DC2626', dot:'#EF4444', border:'#FECACA', label:'Rejeté'    },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:s.bg, color:s.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${s.border}` }}>
    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:s.dot }}/>{s.label}
  </span>;
};

const ConfirmDialog = ({ dialog, onConfirm, onCancel }) => {
  if (!dialog) return null;
  const config = {
    delete:     { Icon: IconTrash,   iconBg:'#FEF2F2', iconColor:'#DC2626', iconBorder:'#FECACA', title:'Supprimer le workflow',  btnColor:'#DC2626', btnLabel:'Supprimer',  desc: <>Supprimer <strong>{dialog.wf.name}</strong> ? Cette action est <strong>irréversible</strong>.</> },
    deactivate: { Icon: IconPause,   iconBg:'#FFFBEB', iconColor:'#D97706', iconBorder:'#FDE68A', title:'Désactiver le workflow', btnColor:'#D97706', btnLabel:'Désactiver', desc: <>Désactiver <strong>{dialog.wf.name}</strong> ? Les employés ne pourront plus soumettre de demandes.</> },
    start:      { Icon: IconPlay,    iconBg:'#F0FDF4', iconColor:'#16A34A', iconBorder:'#BBF7D0', title:'Démarrer le workflow',   btnColor:'#16A34A', btnLabel:'Démarrer',   desc: <>Démarrer <strong>{dialog.wf.name}</strong> ? Il sera visible par tous les employés.</> },
  }[dialog.type];
  const { Icon } = config;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff', borderRadius:'20px', padding:'36px 32px', width:'420px', maxWidth:'95vw', textAlign:'center', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', fontFamily:"'Inter',sans-serif" }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:config.iconBg, border:`1.5px solid ${config.iconBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:config.iconColor }}><Icon/></div>
        <h2 style={{ margin:'0 0 10px', fontSize:'18px', fontWeight:800, color:'#0F172A' }}>{config.title}</h2>
        <p style={{ margin:'0 0 28px', fontSize:'14px', color:'#64748B', lineHeight:1.7 }}>{config.desc}</p>
        <div style={{ display:'flex', gap:'12px' }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'1.5px solid #E2E8F0', background:'#fff', color:'#475569', fontWeight:700, fontSize:'14px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Annuler</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background:config.btnColor, color:'#fff', fontWeight:700, fontSize:'14px', cursor:'pointer', fontFamily:"'Inter',sans-serif", boxShadow:`0 4px 12px ${config.btnColor}55` }}>{config.btnLabel}</button>
        </div>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project,       setProject]       = useState(null);
  const [workflows,     setWorkflows]     = useState([]);
  const [instances,     setInstances]     = useState([]);
  const [activeTab,     setActiveTab]     = useState('workflows');
  const [loading,       setLoading]       = useState(true);
  const [showEditor,    setShowEditor]    = useState(false);
  const [step1,         setStep1]         = useState(false);
  const [,              setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [msg,           setMsg]           = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [searchWf,      setSearchWf]      = useState('');
  const [searchDem,     setSearchDem]     = useState('');

  const wfNameRef = useRef('');
  const wfDescRef = useRef('');
  const wfDueRef  = useRef('');

  useEffect(() => { fetchData(); }, [id]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await projectService.getById(id);
      setProject(res.project ?? null);
      setWorkflows(res.templates || []);
      setInstances(res.instances || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };

  const confirmStart = async () => {
    const wf = confirmDialog.wf; setConfirmDialog(null);
    try { await workflowService.start(wf._id); showMsg('SUCCESS Workflow démarré !'); fetchData(); }
    catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
  };
  const confirmDeactivate = async () => {
    const wf = confirmDialog.wf; setConfirmDialog(null);
    try { await workflowService.deactivate(wf._id); showMsg('SUCCESS Workflow désactivé.'); fetchData(); }
    catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
  };
  const handleDelete = (wf) => {
    if (wf.status !== 'draft') { showMsg('ERREUR Seuls les brouillons peuvent être supprimés.'); return; }
    setConfirmDialog({ type:'delete', wf });
  };
  const confirmDelete = async () => {
    const wf = confirmDialog.wf; setConfirmDialog(null); setDeleting(wf._id);
    try { await workflowService.delete(wf._id); showMsg('SUCCESS Workflow supprimé.'); fetchData(); }
    catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
    finally { setDeleting(null); }
  };

  const handleEditorSave = async ({ steps, visibility='global', allowedRoles=[], allowedPosts=[] }) => {
    if (!wfNameRef.current.trim()) { alert('Donnez un nom au workflow'); return; }
    setSaving(true);
    try {
      await workflowService.create({ name:wfNameRef.current, description:wfDescRef.current, dueDate:wfDueRef.current, projectId:id, isTemplate:true, steps, visibility, allowedRoles, allowedPosts });
      showMsg('SUCCESS Workflow créé !');
      setShowEditor(false); setStep1(false);
      wfNameRef.current = ''; wfDescRef.current = ''; wfDueRef.current = '';
      fetchData();
    } catch (err) { showMsg('ERREUR ' + err.message); }
    finally { setSaving(false); }
  };

  const filteredWf = useMemo(() => {
    const q = searchWf.toLowerCase().trim();
    if (!q) return workflows;
    return workflows.filter(wf =>
      wf.name?.toLowerCase().includes(q) ||
      wf.status?.toLowerCase().includes(q) ||
      wf.steps?.some(s => s.name?.toLowerCase().includes(q))
    );
  }, [workflows, searchWf]);

  const filteredDem = useMemo(() => {
    const q = searchDem.toLowerCase().trim();
    if (!q) return instances;
    return instances.filter(inst =>
      inst.name?.toLowerCase().includes(q) ||
      inst.status?.toLowerCase().includes(q) ||
      inst.docNumber?.toLowerCase().includes(q) ||
      inst.submittedBy?.firstName?.toLowerCase().includes(q) ||
      inst.submittedBy?.lastName?.toLowerCase().includes(q)
    );
  }, [instances, searchDem]);

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px', fontFamily:"'Inter',sans-serif" }}>
      <IconLoader/> Chargement…
    </div>
  );
  if (!project) return <div style={{ padding:'40px', fontFamily:"'Inter',sans-serif", color:'#64748B' }}>Projet non trouvé</div>;

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');
  const pc = project.color || B;

  const inpStyle = { width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', fontFamily:"'Inter',sans-serif" };

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .wf-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.08) !important; }
        input:focus, textarea:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
      `}</style>

      {showEditor && (
        <WorkflowEditor projectId={id} onSave={handleEditorSave} onCancel={()=>{ setShowEditor(false); setStep1(false); }}/>
      )}

      {!showEditor && (
        <>
          <ConfirmDialog dialog={confirmDialog}
            onConfirm={confirmDialog?.type==='delete' ? confirmDelete : confirmDialog?.type==='deactivate' ? confirmDeactivate : confirmStart}
            onCancel={()=>setConfirmDialog(null)}/>

          <div style={{ padding:'32px', fontFamily:"'Inter',-apple-system,sans-serif" }}>

            {msg && (
              <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:9999, padding:'13px 18px', borderRadius:'12px', fontWeight:600, fontSize:'14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', animation:'slideIn 0.25s ease', display:'flex', alignItems:'center', gap:'9px', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
                {isSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
              </div>
            )}

            {/* ── Header ── */}
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'32px', flexWrap:'wrap' }}>
              <button onClick={()=>navigate('/dashboard/company/projects')}
                style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
                <IconArrowL/> Retour
              </button>
              <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:pc, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'18px', flexShrink:0, boxShadow:`0 4px 12px ${pc}55` }}>
                {project.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.4px' }}>{project.name}</h1>
                <p style={{ margin:'3px 0 0', color:'#64748B', fontSize:'14px' }}>{project.description || ''}</p>
              </div>
            </div>

            {/* ── Step1 Modal ── */}
            {step1 && (
              <div onClick={e=>e.target===e.currentTarget&&setStep1(false)}
                style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(5px)' }}>
                <div style={{ background:'#fff', borderRadius:'20px', padding:'36px', width:'500px', maxWidth:'95vw', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', animation:'fadeUp 0.2s ease', fontFamily:"'Inter',sans-serif" }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'#EFF6FF', border:`1.5px solid #BFDBFE`, display:'flex', alignItems:'center', justifyContent:'center', color:B }}><IconGear/></div>
                    <h2 style={{ margin:0, color:'#0F172A', fontWeight:900, fontSize:'18px' }}>Nouveau workflow</h2>
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block',fontWeight:700,fontSize:'12px',color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'7px'}}>Description</label>
                    <input defaultValue="" onChange={e=>wfDescRef.current=e.target.value} placeholder="Description…" style={inpStyle}/>
                  </div>
                  <div style={{marginBottom:'28px'}}>
                    <label style={{display:'block',fontWeight:700,fontSize:'12px',color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'7px'}}>Date d'échéance</label>
                    <input type="date" defaultValue={new Date().toISOString().split('T')[0]} onChange={e=>wfDueRef.current=e.target.value} style={inpStyle}/>
                  </div>
                  <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
                    <button onClick={()=>{setStep1(false);wfNameRef.current='';wfDescRef.current='';wfDueRef.current='';}}
                      style={{padding:'10px 20px',borderRadius:'9px',border:'1.5px solid #E2E8F0',background:'#fff',cursor:'pointer',fontWeight:600,color:'#475569',fontFamily:"'Inter',sans-serif"}}>
                      Annuler
                    </button>
                    <button onClick={()=>{ if(!wfNameRef.current.trim())return; setStep1(false); setShowEditor(true); }}
                      style={{display:'flex',alignItems:'center',gap:'7px',padding:'10px 22px',borderRadius:'9px',background:B,color:'#fff',border:'none',cursor:'pointer',fontWeight:700,fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 12px ${B}55`}}>
                      <IconGear/> Ouvrir l'éditeur
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', marginBottom:'24px', flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:'4px', padding:'4px', background:'#F1F5F9', borderRadius:'12px' }}>
                {[
                  { key:'workflows', label:'Workflows', icon:<IconGear/>,  count: workflows.length },
                  { key:'demandes',  label:'Demandes',  icon:<IconList/>,  count: instances.length  },
                ].map(tab => {
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                      style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 18px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight:active?700:500, fontSize:'14px', background:active?'#fff':'transparent', color:active?'#0F172A':'#64748B', boxShadow:active?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                      <span style={{color:active?B:'#94A3B8'}}>{tab.icon}</span>
                      {tab.label}
                      <span style={{padding:'1px 8px',borderRadius:'10px',fontSize:'11px',fontWeight:700,background:active?B:'#E2E8F0',color:active?'#fff':'#64748B',transition:'all 0.15s'}}>{tab.count}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ position:'relative', width:'280px', flexShrink:0 }}>
                <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}><IconSearch/></span>
                {activeTab === 'workflows' ? (
                  <input key="wf-search" value={searchWf} onChange={e=>setSearchWf(e.target.value)} placeholder="Rechercher un workflow…"
                    style={{ width:'100%', boxSizing:'border-box', padding:'8px 32px 8px 36px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'13px', color:'#0F172A', outline:'none', background:'#F8FAFC', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
                    onFocus={e=>{e.target.style.borderColor=B;e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)';e.target.style.background='#fff';}}
                    onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';e.target.style.background='#F8FAFC';}}/>
                ) : (
                  <input key="dem-search" value={searchDem} onChange={e=>setSearchDem(e.target.value)} placeholder="Rechercher une demande, un numéro…"
                    style={{ width:'100%', boxSizing:'border-box', padding:'8px 32px 8px 36px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'13px', color:'#0F172A', outline:'none', background:'#F8FAFC', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
                    onFocus={e=>{e.target.style.borderColor=B;e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)';e.target.style.background='#fff';}}
                    onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';e.target.style.background='#F8FAFC';}}/>
                )}
                {(activeTab === 'workflows' ? searchWf : searchDem) && (
                  <button onClick={() => activeTab === 'workflows' ? setSearchWf('') : setSearchDem('')}
                    style={{ position:'absolute', right:'9px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
                    <IconXSm/>
                  </button>
                )}
              </div>
            </div>

            {/* ── WORKFLOWS TAB ── */}
            {activeTab === 'workflows' && (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
                  <h2 style={{margin:0,fontSize:'18px',fontWeight:800,color:'#0F172A'}}>Workflows <span style={{color:'#94A3B8',fontWeight:500,fontSize:'16px'}}>({workflows.length})</span></h2>
                  <div style={{display:'flex',gap:'10px'}}>
                    <button onClick={()=>navigate(`/dashboard/company/projects/${id}/generate-ai`)}
                      style={{display:'flex',alignItems:'center',gap:'7px',background:'linear-gradient(135deg,#2563EB,#7C3AED)',color:'#fff',border:'none',padding:'10px 18px',borderRadius:'9px',fontWeight:700,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif",boxShadow:'0 4px 12px rgba(37,99,235,0.35)'}}>
                      <IconSparkle/> Générer avec l'IA
                    </button>
                    <button onClick={()=>setStep1(true)}
                      style={{display:'flex',alignItems:'center',gap:'7px',background:B,color:'#fff',border:'none',padding:'10px 18px',borderRadius:'9px',fontWeight:700,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 12px ${B}55`}}>
                      <IconPlus/> Nouveau workflow
                    </button>
                  </div>
                </div>

                {workflows.length === 0 ? (
                  <div style={{textAlign:'center',padding:'64px',background:'#fff',borderRadius:'16px',border:'1.5px solid #E2E8F0',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
                    <div style={{width:'56px',height:'56px',borderRadius:'14px',background:'#EFF6FF',border:`1.5px solid #BFDBFE`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:B}}><IconGear/></div>
                    <p style={{color:'#64748B',marginBottom:'20px',fontSize:'15px',fontWeight:500}}>Aucun workflow dans ce projet</p>
                    <button onClick={()=>setStep1(true)} style={{display:'inline-flex',alignItems:'center',gap:'7px',background:B,color:'#fff',border:'none',padding:'10px 22px',borderRadius:'9px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                      <IconPlus/> Créer le premier workflow
                    </button>
                  </div>
                ) : filteredWf.length === 0 ? (
                  <div style={{textAlign:'center',padding:'48px',background:'#fff',borderRadius:'14px',border:'1.5px solid #E2E8F0'}}>
                    <p style={{margin:'0 0 8px',fontWeight:700,color:'#0F172A',fontSize:'15px'}}>Aucun résultat pour « {searchWf} »</p>
                    <p style={{margin:'0 0 16px',color:'#94A3B8',fontSize:'13px'}}>Essayez un autre nom ou statut.</p>
                    <button onClick={()=>setSearchWf('')} style={{padding:'7px 16px',borderRadius:'8px',border:`1.5px solid ${B}`,color:B,background:'#fff',cursor:'pointer',fontWeight:600,fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>Effacer la recherche</button>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                    {filteredWf.map(wf => (
                      <div key={wf._id} className="wf-card"
                        style={{background:'#fff',borderRadius:'14px',border:'1.5px solid #E2E8F0',padding:'20px 24px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',transition:'all 0.2s'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px',flexWrap:'wrap'}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px',flexWrap:'wrap'}}>
                              <h3 style={{margin:0,fontSize:'16px',fontWeight:800,color:'#0F172A'}}>{wf.name}</h3>
                              <StatusBadge status={wf.status}/>
                            </div>
                            {wf.steps?.length > 0 && (
                              <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap',marginBottom:'12px'}}>
                                {wf.steps.map((step, i) => {
                                  const stepColor = step.status==='completed'?'#16A34A':step.status==='in_progress'?B:step.status==='rejected'?'#DC2626':'#E2E8F0';
                                  const textColor = step.status==='pending'?'#94A3B8':'#fff';
                                  return (
                                    <div key={i} style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                      <div title={step.name} style={{width:'28px',height:'28px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,background:stepColor,color:textColor,flexShrink:0}}>
                                        {step.status==='completed'?'✓':step.status==='rejected'?'✕':String(i+1)}
                                      </div>
                                      <span style={{fontSize:'11px',color:'#94A3B8',maxWidth:'60px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{step.name}</span>
                                      {i < wf.steps.length-1 && <div style={{width:'14px',height:'2px',background:'#E2E8F0',flexShrink:0}}/>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
                              <span style={{fontSize:'12px',color:'#94A3B8'}}>
                                Étape {(wf.currentStep||0)+1} / {wf.steps?.length||0}
                                {wf.dueDate && ` · Échéance : ${new Date(wf.dueDate).toLocaleDateString('fr-FR')}`}
                              </span>
                              {wf.allowedPosts?.length > 0 ? (
                                <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                                  <span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'#2563EB',fontWeight:700}}><IconLock/> Accès restreint :</span>
                                  {wf.allowedPosts.map(p => (
                                    <span key={p} style={{background:'#EFF6FF',color:B,padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:'1px solid #BFDBFE'}}>{p}</span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{display:'inline-flex',alignItems:'center',gap:'4px',background:'#F0FDF4',color:'#16A34A',padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:'1px solid #BBF7D0'}}>
                                  <IconGlobe/> Tous les employés
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{display:'flex',gap:'7px',alignItems:'center',flexShrink:0,flexWrap:'wrap'}}>
                            {wf.status==='draft' && (
                              <button onClick={()=>setConfirmDialog({type:'start',wf})}
                                style={{display:'flex',alignItems:'center',gap:'6px',background:'#16A34A',color:'#fff',border:'none',padding:'8px 16px',borderRadius:'9px',fontWeight:700,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif",boxShadow:'0 3px 10px rgba(22,163,74,0.35)'}}>
                                <IconPlay/> Démarrer
                              </button>
                            )}
                            {wf.status==='active' && (
                              <button onClick={()=>setConfirmDialog({type:'deactivate',wf})}
                                style={{display:'flex',alignItems:'center',gap:'6px',background:'#fff',color:'#D97706',border:'1.5px solid #FDE68A',padding:'8px 16px',borderRadius:'9px',fontWeight:700,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>
                                <IconPause/> Désactiver
                              </button>
                            )}
                            {wf.status==='draft' && (
                              <button onClick={()=>navigate(`/dashboard/company/workflows/${wf._id}/edit-info`)}
                                style={{display:'flex',alignItems:'center',gap:'6px',background:'#EFF6FF',color:B,border:`1.5px solid #BFDBFE`,padding:'8px 14px',borderRadius:'9px',fontWeight:700,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>
                                <IconEdit/> Modifier
                              </button>
                            )}
                            <button onClick={()=>navigate(`/dashboard/company/workflows/${wf._id}`)}
                              style={{display:'flex',alignItems:'center',gap:'6px',background:'#F8FAFC',color:'#475569',border:'1.5px solid #E2E8F0',padding:'8px 14px',borderRadius:'9px',fontWeight:600,cursor:'pointer',fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>
                              <IconEye/> Voir
                            </button>
                            {['draft','completed','rejected'].includes(wf.status) && (
                              <button onClick={()=>handleDelete(wf)} disabled={deleting===wf._id}
                                style={{width:'36px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',background:'#FEF2F2',color:'#DC2626',border:'1.5px solid #FECACA',borderRadius:'9px',fontWeight:700,cursor:deleting===wf._id?'not-allowed':'pointer',opacity:deleting===wf._id?0.5:1}}>
                                {deleting===wf._id ? <IconLoader/> : <IconTrash/>}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {workflows.length > 0 && filteredWf.length > 0 && (
                  <p style={{textAlign:'right',marginTop:'12px',fontSize:'12px',color:'#94A3B8'}}>
                    <strong style={{color:'#0F172A'}}>{filteredWf.length}</strong> / {workflows.length} workflow(s)
                  </p>
                )}
              </>
            )}

            {/* ── DEMANDES TAB ── */}
            {activeTab === 'demandes' && (
              <div>
                <h2 style={{margin:'0 0 20px',fontSize:'18px',fontWeight:800,color:'#0F172A'}}>Demandes <span style={{color:'#94A3B8',fontWeight:500,fontSize:'16px'}}>({instances.length})</span></h2>

                {instances.length === 0 ? (
                  <div style={{textAlign:'center',padding:'64px',background:'#fff',borderRadius:'16px',border:'1.5px solid #E2E8F0'}}>
                    <div style={{width:'56px',height:'56px',borderRadius:'14px',background:'#F8FAFC',border:'1.5px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:'#94A3B8'}}><IconList/></div>
                    <p style={{color:'#64748B',fontSize:'15px',fontWeight:500}}>Aucune demande soumise pour ce projet</p>
                  </div>
                ) : filteredDem.length === 0 ? (
                  <div style={{textAlign:'center',padding:'48px',background:'#fff',borderRadius:'14px',border:'1.5px solid #E2E8F0'}}>
                    <p style={{margin:'0 0 8px',fontWeight:700,color:'#0F172A',fontSize:'15px'}}>Aucun résultat pour « {searchDem} »</p>
                    <p style={{margin:'0 0 16px',color:'#94A3B8',fontSize:'13px'}}>Essayez un autre nom, numéro ou statut.</p>
                    <button onClick={()=>setSearchDem('')} style={{padding:'7px 16px',borderRadius:'8px',border:`1.5px solid ${B}`,color:B,background:'#fff',cursor:'pointer',fontWeight:600,fontSize:'13px',fontFamily:"'Inter',sans-serif"}}>Effacer la recherche</button>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                    {filteredDem.map(inst => {
                      const total = inst.steps?.length || 0;
                      const done  = inst.steps?.filter(s=>s.status==='completed').length || 0;
                      const pct   = total > 0 ? Math.round((done/total)*100) : 0;
                      const curStep = inst.steps?.[inst.currentStep||0] || null;
                      const dotColor = inst.status==='active'?B:inst.status==='completed'?'#16A34A':inst.status==='rejected'?'#DC2626':'#94A3B8';
                      return (
                        <div key={inst._id} className="wf-card"
                          style={{background:'#fff',borderRadius:'14px',border:'1.5px solid #E2E8F0',padding:'20px 24px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',transition:'all 0.2s'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'16px'}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',flexWrap:'wrap'}}>
                                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:dotColor,flexShrink:0}}/>
                                <h3 style={{margin:0,fontSize:'15px',fontWeight:800,color:'#0F172A'}}>{inst.name}</h3>
                                <StatusBadge status={inst.status}/>
                                {/* ✅ Badge numéro de document */}
                                {inst.docNumber && (
                                  <span style={{
                                    fontFamily:'monospace',
                                    background:'#F0FDF4',
                                    color:'#16A34A',
                                    padding:'3px 10px',
                                    borderRadius:'20px',
                                    fontSize:'12px',
                                    fontWeight:800,
                                    border:'1.5px solid #BBF7D0',
                                    letterSpacing:'0.5px',
                                  }}>
                                    {inst.docNumber}
                                  </span>
                                )}
                              </div>

                              {/* Progress bar */}
                              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                                <div style={{flex:1,height:'6px',background:'#E2E8F0',borderRadius:'999px',overflow:'hidden'}}>
                                  <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${B},#7C3AED)`,borderRadius:'999px',transition:'width 0.4s'}}/>
                                </div>
                                <span style={{fontSize:'12px',color:'#64748B',whiteSpace:'nowrap',fontWeight:600}}>{pct}% · {done}/{total}</span>
                              </div>

                              {curStep && (
                                <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                                  <span style={{fontSize:'12px',color:'#64748B'}}>Étape : <strong style={{color:B}}>{curStep.name}</strong></span>
                                  {curStep.assignedRole && <span style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',color:'#94A3B8'}}><IconUsers/>{curStep.assignedRole}</span>}
                                  {inst.submittedBy && <span style={{fontSize:'12px',color:'#94A3B8'}}>par {inst.submittedBy.firstName} {inst.submittedBy.lastName}</span>}
                                </div>
                              )}
                            </div>
                            <button onClick={()=>navigate(`/dashboard/company/workflows/${inst._id}`)}
                              style={{display:'flex',alignItems:'center',gap:'6px',background:'#F8FAFC',color:'#475569',border:'1.5px solid #E2E8F0',padding:'8px 16px',borderRadius:'9px',fontWeight:600,cursor:'pointer',fontSize:'13px',flexShrink:0,fontFamily:"'Inter',sans-serif"}}>
                              <IconEye/> Voir
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {instances.length > 0 && filteredDem.length > 0 && (
                  <p style={{textAlign:'right',marginTop:'12px',fontSize:'12px',color:'#94A3B8'}}>
                    <strong style={{color:'#0F172A'}}>{filteredDem.length}</strong> / {instances.length} demande(s)
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ProjectDetail;