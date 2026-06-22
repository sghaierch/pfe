import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import workflowService from '../../services/workflowService';
import DocumentsSection from '../../components/DocumentsSection';

const T = {
  blue:'#2563EB', blue2:'#3B82F6', blueSoft:'#EFF6FF', blueBorder:'#BFDBFE',
  green:'#16A34A', greenSoft:'#F0FDF4', greenBorder:'#BBF7D0',
  red:'#DC2626',   redSoft:'#FEF2F2',   redBorder:'#FECACA',
  amber:'#D97706', amberSoft:'#FFFBEB', amberBorder:'#FDE68A',
  slate:'#0F172A', slateM:'#475569', slateL:'#94A3B8',
  bg:'#F1F5F9', surface:'#FFFFFF', border:'#E2E8F0',
};
const font = "'Inter',-apple-system,sans-serif";
const fmtDate = d => d ? new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

const IArrowL   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const ICheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IClock    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IBar      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IHist     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>;
const IDoc      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const IUser     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IBriefcase= () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IRocket   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l5-5L7.5 11.5l-3 5z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>;
const ILoader   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

// Status config
const statusCfg = {
  active:    {bg:T.blueSoft,  color:'#1D4ED8', dot:'#3B82F6', label:'En cours'},
  completed: {bg:T.greenSoft, color:T.green,   dot:T.green,   label:'Approuvée'},
  rejected:  {bg:T.redSoft,   color:T.red,     dot:T.red,     label:'Refusée'},
  draft:     {bg:'#F8FAFC',   color:T.slateM,  dot:T.slateL,  label:'Brouillon'},
};
const stepStatusCfg = {
  completed:   {bg:T.greenSoft, border:T.greenBorder, color:T.green,    icon:<ICheck/>},
  in_progress: {bg:T.blueSoft,  border:T.blueBorder,  color:'#1D4ED8',  icon:<IClock/>},
  rejected:    {bg:T.redSoft,   border:T.redBorder,   color:T.red,      icon:<IX/>},
  pending:     {bg:'#F8FAFC',   border:T.border,      color:T.slateL,   icon:<span style={{fontSize:'8px'}}>●</span>},
};
const actionCfg = {
  step_completed:   {icon:<ICheck/>,  color:T.green,   bg:T.greenSoft, label:'Étape validée'},
  step_rejected:    {icon:<IX/>,      color:T.red,     bg:T.redSoft,   label:'Étape rejetée'},
  workflow_started: {icon:<IRocket/>, color:T.blue,    bg:T.blueSoft,  label:'Demande soumise'},
  workflow_completed:{icon:<ICheck/>, color:T.green,   bg:T.greenSoft, label:'Demande approuvée'},
};

const StatusBadge = ({ status }) => {
  const cfg = statusCfg[status]||statusCfg.draft;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:cfg.bg, color:cfg.color, padding:'4px 11px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:`1px solid ${cfg.dot}25` }}><span style={{ width:'6px', height:'6px', borderRadius:'50%', background:cfg.dot, flexShrink:0 }}/>{cfg.label}</span>;
};

const StepsTimeline = ({ steps }) => {
  if (!steps||steps.length===0) return <div style={{ padding:'40px', textAlign:'center', color:T.slateL, fontFamily:font }}>Aucune étape configurée</div>;
  return (
    <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'0' }}>
      {steps.map((step,i) => {
        const sc=stepStatusCfg[step.status]||stepStatusCfg.pending, isLast=i===steps.length-1;
        return (
          <div key={i} style={{ display:'flex', gap:'16px', position:'relative' }}>
            {!isLast&&<div style={{ position:'absolute', left:'19px', top:'40px', width:'2px', height:'calc(100% - 8px)', background:step.status==='completed'?T.green:T.border }}/>}
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', flexShrink:0, background:sc.bg, border:`2px solid ${sc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:sc.color, zIndex:1 }}>{sc.icon}</div>
            <div style={{ flex:1, paddingBottom:isLast?'0':'22px', paddingTop:'8px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' }}>
                <p style={{ margin:0, fontWeight:700, fontSize:'14px', color:T.slate }}>{step.name}</p>
                <span style={{ background:sc.bg, color:sc.color, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${sc.border}` }}>
                  {step.status==='completed'?'Validée':step.status==='in_progress'?'En cours':step.status==='rejected'?'Rejetée':'En attente'}
                </span>
              </div>
              <p style={{ margin:'0 0 4px', fontSize:'12px', color:T.slateM, display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                {step.assignedToName?<><IUser/>{step.assignedToName}</>:step.assignedPost?<><IBriefcase/>{step.assignedPost}</>:step.assignedRole?<><IUser/>{step.assignedRole}</>:<span style={{color:T.slateL}}>Non assigné</span>}
                {step.completedAt&&<><span style={{color:T.slateL}}>·</span><IClock/>{fmtDate(step.completedAt)}</>}
              </p>
              {step.comment&&<div style={{ marginTop:'6px', padding:'8px 12px', background:'#F8FAFC', borderRadius:'8px', border:`1.5px solid ${T.border}` }}><p style={{ margin:0, fontSize:'12px', color:T.slateM, fontStyle:'italic' }}>"{step.comment}"</p></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HistoryTimeline = ({ history }) => {
  if (!history||history.length===0) return <div style={{ padding:'40px', textAlign:'center', color:T.slateL, fontFamily:font }}>Aucune action enregistrée</div>;
  return (
    <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', gap:'10px' }}>
      {[...history].reverse().map((h,i) => {
        const cfg=actionCfg[h.action]||{icon:<IAlert/>,color:T.slateM,bg:'#F8FAFC',label:h.action}, isFirst=i===0;
        return (
          <div key={i} style={{ padding:'12px 14px', borderRadius:'10px', background:isFirst?cfg.bg:'#F8FAFC', border:`1.5px solid ${isFirst?cfg.color+'30':T.border}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:'8px', flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'13px', color:isFirst?cfg.color:T.slate, display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{color:cfg.color}}>{cfg.icon}</span> {cfg.label}{h.stepName&&` — "${h.stepName}"`}
                </p>
                {h.byName&&<p style={{ margin:'0 0 2px', fontSize:'12px', color:T.slateM }}>Par <strong>{h.byName}</strong></p>}
                {h.comment&&<div style={{ marginTop:'6px', padding:'7px 10px', background:'#fff', borderRadius:'7px', border:`1.5px solid ${T.border}` }}><p style={{ margin:0, fontSize:'12px', color:'#374151', fontStyle:'italic' }}>"{h.comment}"</p></div>}
              </div>
              <p style={{ margin:0, fontSize:'11px', color:T.slateL, flexShrink:0, display:'flex', alignItems:'center', gap:'4px' }}><IClock/>{fmtDate(h.date)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EmployeeRequestDetail = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [workflow,  setWorkflow]  = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [activeTab, setActiveTab] = useState('progression');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wfRes,docsRes] = await Promise.all([workflowService.getById(id),workflowService.getDocuments(id)]);
        const wf=wfRes?.data?.workflow, docs=docsRes?.documents||docsRes?.data?.documents||[];
        if (!wf) { setError('Demande introuvable.'); return; }
        setWorkflow(wf); setDocuments(docs);
      } catch (err) { setError(err.response?.data?.message||'Erreur lors du chargement.'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}><ILoader/><p style={{ color:T.slateM, fontWeight:600, margin:'12px 0 0' }}>Chargement…</p></div>
    </div>
  );

  if (error||!workflow) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font }}>
      <div style={{ textAlign:'center', background:T.surface, padding:'48px 40px', borderRadius:'16px', border:`1.5px solid ${T.border}`, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', maxWidth:'440px' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:T.redSoft, border:`1.5px solid ${T.redBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:T.red }}><IAlert/></div>
        <p style={{ margin:'0 0 20px', color:T.slate, fontWeight:600, fontSize:'15px' }}>{error||'Demande introuvable.'}</p>
        <button onClick={()=>navigate('/dashboard/employee')} style={{ padding:'10px 22px', borderRadius:'9px', background:T.blue, color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontFamily:font }}>Retour au tableau de bord</button>
      </div>
    </div>
  );

  const totalSteps=workflow.steps?.length||0, doneSteps=workflow.steps?.filter(s=>s.status==='completed').length||0, pct=totalSteps>0?Math.round((doneSteps/totalSteps)*100):0;
  const isRejected=workflow.status==='rejected', isCompleted=workflow.status==='completed';
  const lastReject=isRejected?[...(workflow.history||[])].reverse().find(h=>h.action?.includes('rejected')):null;
  const overdue=workflow.dueDate&&new Date(workflow.dueDate)<new Date()&&workflow.status==='active';
  const lColor=isCompleted?T.green:isRejected?T.red:T.blue;

  const TABS = [
    { key:'progression', label:'Progression',  icon:<IBar/>  },
    { key:'historique',  label:'Historique',   icon:<IHist/>, count:workflow.history?.length||0 },
    { key:'documents',   label:'Documents',    icon:<IDoc/>,  count:documents.length },
  ];

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .rd-tab:hover{opacity:0.85}`}</style>
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:font }}>
        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'32px 24px 60px' }}>

          <button onClick={()=>navigate('/dashboard/employee')}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.surface, border:`1.5px solid ${T.border}`, padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:T.slateM, fontSize:'13px', marginBottom:'20px', fontFamily:font }}>
            <IArrowL/> Retour
          </button>

          {/* Hero card */}
          <div style={{ background:T.surface, borderRadius:'16px', border:`1.5px solid ${T.border}`, padding:'24px', borderLeft:`5px solid ${lColor}`, marginBottom:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'18px' }}>
              <div>
                <h1 style={{ margin:'0 0 6px', fontSize:'22px', fontWeight:900, color:T.slate }}>{workflow.name}</h1>
                {workflow.description&&<p style={{ margin:'0 0 10px', fontSize:'14px', color:T.slateM }}>{workflow.description}</p>}
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                  <StatusBadge status={workflow.status}/>
                  {workflow.docNumber&&<span style={{ background:'#DBEAFE', color:T.blue, padding:'4px 12px', borderRadius:'7px', fontSize:'13px', fontWeight:800, fontFamily:'monospace', border:`1px solid ${T.blueBorder}` }}>{workflow.docNumber}</span>}
                  {workflow.dueDate&&<span style={{ fontSize:'12px', color:overdue?T.red:T.slateM, display:'inline-flex', alignItems:'center', gap:'4px' }}><IClock/> {new Date(workflow.dueDate).toLocaleDateString('fr-FR')}{overdue&&' · En retard'}</span>}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ margin:'0 0 2px', fontSize:'11px', color:T.slateL }}>Soumise le</p>
                <p style={{ margin:0, fontSize:'13px', fontWeight:600, color:T.slate, display:'flex', alignItems:'center', gap:'4px' }}><IClock/>{fmtDate(workflow.createdAt)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <span style={{ fontSize:'12px', fontWeight:600, color:T.slateM }}>Progression globale</span>
                <span style={{ fontSize:'12px', fontWeight:700, color:lColor }}>{pct}% — {doneSteps}/{totalSteps} étapes</span>
              </div>
              <div style={{ height:'8px', background:'#F1F5F9', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:pct+'%', background:isRejected?T.red:isCompleted?T.green:`linear-gradient(90deg,${T.blue},${T.blue2})`, borderRadius:'4px', transition:'width 0.6s ease' }}/>
              </div>
            </div>

            {/* Status banners */}
            {isCompleted&&(
              <div style={{ marginTop:'16px', background:T.greenSoft, border:`1.5px solid ${T.greenBorder}`, borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', color:T.green }}>
                <ICheck/>
                <div><p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'13px' }}>Demande approuvée !</p>{workflow.completedAt&&<p style={{ margin:0, fontSize:'12px', color:T.slateM }}>Le {fmtDate(workflow.completedAt)}</p>}</div>
              </div>
            )}
            {isRejected&&lastReject&&(
              <div style={{ marginTop:'16px', background:T.redSoft, border:`1.5px solid ${T.redBorder}`, borderRadius:'10px', padding:'12px 16px' }}>
                <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'13px', color:T.red, display:'flex', alignItems:'center', gap:'6px' }}><IX/> Demande refusée</p>
                {lastReject.comment&&<p style={{ margin:'0 0 4px', fontSize:'13px', color:T.slate }}>Motif : {lastReject.comment}</p>}
                <p style={{ margin:0, fontSize:'12px', color:T.slateM }}>Par : {lastReject.byName} · {fmtDate(lastReject.date)}</p>
              </div>
            )}
            {workflow.status==='active'&&workflow.steps?.[workflow.currentStep]&&(
              <div style={{ marginTop:'16px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, borderRadius:'10px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px', color:'#1D4ED8' }}>
                <IClock/>
                <div>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'13px' }}>En attente de : {workflow.steps[workflow.currentStep].assignedPostName||workflow.steps[workflow.currentStep].assignedPost||'Responsable'}</p>
                  <p style={{ margin:0, fontSize:'12px', color:T.slateM }}>Étape {workflow.currentStep+1} / {workflow.steps.length} · {workflow.steps[workflow.currentStep].name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'4px', background:T.surface, padding:'4px', borderRadius:'12px', border:`1.5px solid ${T.border}`, marginBottom:'16px', width:'fit-content' }}>
            {TABS.map(tab=>(
              <button key={tab.key} className="rd-tab" onClick={()=>setActiveTab(tab.key)}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 18px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'13px', fontFamily:font, background:activeTab===tab.key?T.blue:'transparent', color:activeTab===tab.key?'#fff':T.slateM, transition:'all .15s' }}>
                <span style={{color:activeTab===tab.key?'rgba(255,255,255,0.8)':T.slateL}}>{tab.icon}</span>
                {tab.label}
                {tab.count>0&&<span style={{ background:activeTab===tab.key?'rgba(255,255,255,0.25)':T.border, color:activeTab===tab.key?'#fff':T.slateM, padding:'1px 7px', borderRadius:'10px', fontSize:'11px', fontWeight:800 }}>{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ background:T.surface, borderRadius:'14px', border:`1.5px solid ${T.border}`, boxShadow:'0 1px 6px rgba(15,23,42,0.06)', overflow:'hidden' }}>
            {activeTab==='progression'&&(
              <div>
                <div style={{ padding:'16px 24px', borderBottom:`1.5px solid ${T.border}`, display:'flex', alignItems:'center', gap:'8px' }}>
                  <IBar/><h2 style={{ margin:0, fontSize:'15px', fontWeight:700, color:T.slate }}>Étapes de traitement</h2>
                </div>
                <StepsTimeline steps={workflow.steps||[]} currentStep={workflow.currentStep}/>
              </div>
            )}
            {activeTab==='historique'&&(
              <div>
                <div style={{ padding:'16px 24px', borderBottom:`1.5px solid ${T.border}`, display:'flex', alignItems:'center', gap:'8px' }}>
                  <IHist/><h2 style={{ margin:0, fontSize:'15px', fontWeight:700, color:T.slate }}>Historique des actions</h2>
                </div>
                <HistoryTimeline history={workflow.history||[]}/>
              </div>
            )}
            {activeTab==='documents'&&<DocumentsSection documents={documents} steps={workflow.steps||[]} title="Documents associés"/>}
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeRequestDetail;