import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import workflowService from '../../../services/workflowService';
import DocumentsSection from '../../../components/DocumentsSection';
import ReactFlow, { Background, Controls, MiniMap, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconEdit     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconArchive  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const IconGlobe    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconLock     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconSave     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconUpload   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const IconRefresh  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconBot      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="12" y1="3" x2="12" y2="7"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/></svg>;
const IconUsers    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconClock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconXSm      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const B = '#2563EB';

// ── SignatureCanvas ────────────────────────────────────────────────────────
const SignatureCanvas = ({ value, onChange }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mode, setMode] = useState('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };
  const startDraw = (e) => { e.preventDefault(); isDrawing.current = true; const c = canvasRef.current; const ctx = c.getContext('2d'); const p = getPos(e,c); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const draw = (e) => { e.preventDefault(); if (!isDrawing.current) return; const c = canvasRef.current; const ctx = c.getContext('2d'); const p = getPos(e,c); ctx.lineTo(p.x,p.y); ctx.stroke(); setIsEmpty(false); };
  const stopDraw = (e) => { e.preventDefault(); if (!isDrawing.current) return; isDrawing.current = false; onChange(canvasRef.current.toDataURL('image/png')); };
  const clearCanvas = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0,0,c.width,c.height); setIsEmpty(true); onChange(''); };

  return (
    <div style={{ border:'1.5px solid #E2E8F0', borderRadius:'10px', overflow:'hidden', background:'#fff' }}>
      <div style={{ display:'flex', borderBottom:'1.5px solid #E2E8F0', background:'#F8FAFC' }}>
        {[{key:'draw',label:'Dessiner'},{key:'type',label:'Taper'}].map(m => (
          <button key={m.key} type="button" onClick={()=>setMode(m.key)}
            style={{ flex:1, padding:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'12px', background:mode===m.key?B:'transparent', color:mode===m.key?'#fff':'#64748B', fontFamily:"'Inter',sans-serif" }}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'draw' ? (
        <div>
          <canvas ref={canvasRef} width={400} height={120} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} style={{ display:'block', width:'100%', cursor:'crosshair', touchAction:'none' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', borderTop:'1.5px solid #F1F5F9' }}>
            <span style={{ fontSize:'11px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'5px' }}>
              {isEmpty ? 'Signez dans la zone ci-dessus' : <><IconCheck/><span style={{color:'#16A34A',fontWeight:600}}>Signature dessinée</span></>}
            </span>
            <button type="button" onClick={clearCanvas} style={{ padding:'3px 10px', borderRadius:'7px', border:'1.5px solid #FECACA', background:'#FEF2F2', color:'#DC2626', cursor:'pointer', fontSize:'11px', fontWeight:700, fontFamily:"'Inter',sans-serif" }}>Effacer</button>
          </div>
        </div>
      ) : (
        <div style={{ padding:'14px' }}>
          <input type="text" value={typeof value==='string'&&!value.startsWith('data:')?value:''} onChange={e=>onChange(e.target.value)} placeholder="Tapez votre nom complet"
            style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:'9px', fontFamily:'cursive', fontSize:'20px', color:'#0F172A', boxSizing:'border-box', outline:'none' }}/>
          <p style={{ margin:'6px 0 0', fontSize:'11px', color:'#94A3B8' }}>Votre nom complet fera office de signature</p>
        </div>
      )}
    </div>
  );
};

// ── Délai helpers ──────────────────────────────────────────────────────────
const parseDelaiMs = (delai) => {
  if (!delai) return null;
  const m = delai.trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?)\s*(h|heure|heures|j|jour|jours|d|min|minute|minutes)$/);
  if (!m) return null;
  const val = parseFloat(m[1].replace(',','.'));
  const unit = m[2];
  if (unit==='min'||unit==='minute'||unit==='minutes') return val*60*1000;
  if (unit==='h'||unit==='heure'||unit==='heures') return val*3600*1000;
  return val*86400*1000;
};
const getDelaiInfo = (step, workflow) => {
  if (!step?.delai) return null;
  const delaiMs = parseDelaiMs(step.delai);
  if (!delaiMs) return { label: step.delai, depasse: false, restant: null };
  const start = step.startedAt ? new Date(step.startedAt) : new Date(workflow?.createdAt);
  const deadline = new Date(start.getTime() + delaiMs);
  const now = new Date();
  const depasse = now > deadline;
  const diffMs = Math.abs(deadline - now);
  const diffH = Math.floor(diffMs/3600000);
  const diffMin = Math.floor((diffMs%3600000)/60000);
  const restant = depasse
    ? (diffH>0?`${diffH}h ${diffMin}min de retard`:`${diffMin}min de retard`)
    : (diffH>0?`${diffH}h ${diffMin}min restantes`:`${diffMin}min restantes`);
  return { label:step.delai, depasse, restant, deadline };
};

// ── ReactFlow nodes ────────────────────────────────────────────────────────
const StepNode = ({ data }) => {
  const cfgMap = {
    completed:   { bg:'#F0FDF4', border:'#16A34A', color:'#16A34A', icon:'✓', label:'Validée'    },
    in_progress: { bg:'#EFF6FF', border:B,          color:B,          icon:'⟳', label:'En cours'   },
    rejected:    { bg:'#FEF2F2', border:'#DC2626',  color:'#DC2626',  icon:'✗', label:'Rejetée'    },
    pending:     { bg:'#F8FAFC', border:'#CBD5E1',  color:'#94A3B8',  icon:'',  label:'En attente' },
  };
  const cfg = cfgMap[data.status] || cfgMap.pending;
  const isActive = data.status === 'in_progress';
  return (
    <div style={{ background:cfg.bg, border:`2px solid ${cfg.border}`, borderRadius:'12px', padding:'12px 16px', minWidth:'160px', maxWidth:'200px', boxShadow:isActive?`0 0 0 4px ${cfg.border}30,0 4px 12px rgba(0,0,0,0.1)`:'0 2px 6px rgba(0,0,0,0.06)', position:'relative', fontFamily:"'Inter',sans-serif" }}>
      {isActive && <div style={{ position:'absolute', top:'-8px', right:'-8px', background:'#FBBF24', borderRadius:'50%', width:'18px', height:'18px', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', color:'#000', fontWeight:700 }}>!</div>}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
        <div style={{ width:'26px', height:'26px', borderRadius:'8px', background:cfg.border, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'12px', flexShrink:0 }}>
          {cfg.icon || data.order}
        </div>
        <span style={{ fontSize:'11px', fontWeight:700, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, padding:'1px 7px', borderRadius:'20px' }}>{cfg.label}</span>
      </div>
      <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'13px', color:'#0F172A', lineHeight:1.3 }}>{data.name}</p>
      {data.accessLabel && (
        <div style={{ display:'inline-flex', alignItems:'center', padding:'2px 7px', borderRadius:'20px', marginBottom:'4px', background:data.accessBg, border:`1px solid ${data.accessColor}30` }}>
          <span style={{ fontSize:'10px', fontWeight:700, color:data.accessColor }}>{data.accessLabel}</span>
        </div>
      )}
      {(data.assignedToName||data.assignedPost||data.assignedRole) && (
        <p style={{ margin:'0 0 2px', fontSize:'11px', color:'#64748B', display:'flex', alignItems:'center', gap:'4px' }}>
          <IconUsers/>{data.assignedToName||data.assignedPost||data.assignedRole}
        </p>
      )}
      {data.completedAt && <p style={{ margin:'4px 0 0', fontSize:'10px', color:'#16A34A', fontWeight:600 }}>✓ {new Date(data.completedAt).toLocaleDateString('fr-FR')}</p>}
    </div>
  );
};
const TerminalNode = ({ data }) => (
  <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:data.isEnd?(data.allDone?'#16A34A':'#E2E8F0'):'#16A34A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', border:'3px solid #fff' }}>
    {data.isEnd?(data.allDone?'🏁':'⬜'):'🚀'}
  </div>
);
const allNodeTypes = { stepNode: StepNode, terminalNode: TerminalNode };

const buildGraphFromSteps = (steps, canvasNodes, canvasEdges, allowedPosts=[]) => {
  const isValidNode = (n) => n&&n.id&&n.position&&typeof n.position.x==='number'&&typeof n.position.y==='number';
  const edgeColor = (step) => step?.status==='completed'?'#16A34A':step?.status==='rejected'?'#DC2626':step?.status==='in_progress'?B:'#CBD5E1';

  if (canvasNodes?.length>0&&canvasNodes.every(isValidNode)) {
    const enriched = canvasNodes.map(n => {
      if (n.type==='stepNode') {
        const si = n.data?.stepIndex??(n.data?.order!=null?n.data.order-1:-1);
        const step = steps[si]||steps.find(s=>s.name===n.data?.name);
        if (step) return { ...n, position:{x:Number(n.position.x),y:Number(n.position.y)}, data:{...n.data, status:step.status, completedAt:step.completedAt, assignedToName:step.assignedToName, assignedPost:step.assignedPost, assignedRole:step.assignedRole, delai:step.delai, ...(si===0?{accessLabel:allowedPosts.length>0?'🔒 '+allowedPosts.slice(0,2).join(', ')+(allowedPosts.length>2?` +${allowedPosts.length-2}`:''):'🌍 Tous les employés', accessColor:allowedPosts.length>0?'#7C3AED':'#16A34A', accessBg:allowedPosts.length>0?'#F5F3FF':'#F0FDF4'}:{}) } };
      }
      return { ...n, position:{x:Number(n.position.x),y:Number(n.position.y)} };
    });
    const enrichedEdges = (canvasEdges||[]).map(e=>({...e, animated:steps[parseInt(e.source?.replace('step-',''))]?.status==='in_progress', style:{stroke:B,strokeWidth:2}, markerEnd:{type:MarkerType.ArrowClosed,color:B}}));
    return { nodes:enriched, edges:enrichedEdges };
  }

  const GAP_X=240, START_X=60, Y=80;
  const nodes = [
    { id:'start', type:'terminalNode', position:{x:START_X,y:Y}, data:{isEnd:false}, draggable:false },
    ...steps.map((step,i) => ({ id:`step-${i}`, type:'stepNode', position:{x:START_X+GAP_X*(i+1),y:Y-30}, data:{...step,order:i+1,stepIndex:i, ...(i===0?{accessLabel:allowedPosts.length>0?'🔒 '+allowedPosts.slice(0,2).join(', ')+(allowedPosts.length>2?` +${allowedPosts.length-2}`:''):'🌍 Tous les employés',accessColor:allowedPosts.length>0?'#7C3AED':'#16A34A',accessBg:allowedPosts.length>0?'#F5F3FF':'#F0FDF4'}:{})} })),
    { id:'end', type:'terminalNode', position:{x:START_X+GAP_X*(steps.length+1),y:Y}, data:{isEnd:true,allDone:steps.every(s=>s.status==='completed')}, draggable:false },
  ];
  const mkEdge = (id,src,tgt,step) => ({ id, source:src, target:tgt, animated:step?.status==='in_progress', style:{stroke:edgeColor(step),strokeWidth:2}, markerEnd:{type:MarkerType.ArrowClosed,color:edgeColor(step)} });
  const edges = [
    mkEdge('e-start-0','start','step-0',steps[0]),
    ...steps.slice(0,-1).map((step,i)=>mkEdge(`e-${i}-${i+1}`,`step-${i}`,`step-${i+1}`,step)),
    mkEdge('e-last-end',`step-${steps.length-1}`,'end',steps[steps.length-1]),
  ];
  return { nodes, edges };
};

const WorkflowGraph = ({ steps, currentStep, canvasNodes: savedNodes, canvasEdges: savedEdges, allowedPosts=[] }) => {
  const { nodes:initNodes, edges:initEdges } = React.useMemo(() => buildGraphFromSteps(steps||[],savedNodes,savedEdges,allowedPosts), [steps,savedNodes,savedEdges,allowedPosts]);
  const [nodes,,onNodesChange] = useNodesState(initNodes);
  const [edges,,onEdgesChange] = useEdgesState(initEdges);
  if (!steps||steps.length===0) return <div style={{ padding:'40px', textAlign:'center', color:'#94A3B8' }}>Aucune étape à afficher</div>;
  return (
    <div style={{ height:'420px', borderRadius:'12px', overflow:'hidden', border:'1.5px solid #E2E8F0' }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={allNodeTypes} fitView fitViewOptions={{padding:0.2}} minZoom={0.3} maxZoom={2}>
        <Background color="#F1F5F9" gap={20} size={1}/>
        <Controls showInteractive={false}/>
        <MiniMap nodeColor={n=>{ if(n.type==='terminalNode')return'#16A34A'; const s=n.data?.status; return s==='completed'?'#16A34A':s==='in_progress'?B:s==='rejected'?'#DC2626':'#CBD5E1'; }} style={{ borderRadius:'10px', border:'1.5px solid #E2E8F0' }}/>
      </ReactFlow>
    </div>
  );
};

// ── HistoryTimeline ────────────────────────────────────────────────────────
const HistoryTimeline = ({ history }) => {
  if (!history||history.length===0) return null;
  const cfgMap = {
    workflow_started:   { color:B,        label:'Workflow démarré',  icon:<IconBot/> },
    step_completed:     { color:'#16A34A', label:'Étape validée',    icon:<IconCheck/> },
    step_rejected:      { color:'#DC2626', label:'Étape rejetée',    icon:<IconX/> },
    workflow_completed: { color:'#16A34A', label:'Workflow terminé', icon:<IconCheck/> },
  };
  return (
    <div style={{ position:'relative', paddingLeft:'28px' }}>
      <div style={{ position:'absolute', left:'13px', top:'12px', bottom:'12px', width:'2px', background:'#E2E8F0' }}/>
      {[...history].reverse().map((h,i) => {
        const cfg = cfgMap[h.action]||{color:'#94A3B8',label:h.action,icon:'•'};
        const isFirst = i===0;
        return (
          <div key={i} style={{ position:'relative', marginBottom:'16px', paddingLeft:'22px' }}>
            <div style={{ position:'absolute', left:'-15px', top:'10px', width:'22px', height:'22px', borderRadius:'50%', background:isFirst?cfg.color:'#fff', border:`2px solid ${cfg.color}`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, color:isFirst?'#fff':cfg.color }}>
              {React.cloneElement(isFirst?cfg.icon:<span style={{width:'6px',height:'6px',borderRadius:'50%',background:cfg.color,display:'block'}}/>)}
            </div>
            <div style={{ background:isFirst?cfg.color+'10':'#F8FAFC', border:`1.5px solid ${isFirst?cfg.color+'30':'#E2E8F0'}`, borderRadius:'10px', padding:'12px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'13px', color:isFirst?cfg.color:'#0F172A' }}>{cfg.label}{h.stepName&&` — "${h.stepName}"`}</p>
                  {h.byName&&<p style={{ margin:'0 0 3px', fontSize:'12px', color:'#64748B' }}>Par <strong>{h.byName}</strong></p>}
                  {h.comment&&<div style={{ marginTop:'6px', padding:'8px 10px', background:'#fff', borderRadius:'7px', border:'1.5px solid #E2E8F0' }}><p style={{ margin:0, fontSize:'12px', color:'#374151', fontStyle:'italic' }}>"{h.comment}"</p></div>}
                </div>
                <p style={{ margin:0, fontSize:'11px', color:'#94A3B8', whiteSpace:'nowrap' }}>{new Date(h.date).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── WorkflowAnalysis ───────────────────────────────────────────────────────
const WorkflowAnalysis = ({ workflow }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleAnalyze = async () => {
    setLoading(true); setError('');
    try { const res = await workflowService.analyzeWorkflow(workflow); setAnalysis(res.data); }
    catch (err) { setError('Erreur analyse : '+(err.response?.data?.message||err.message)); }
    finally { setLoading(false); }
  };

  const typeConfig = {
    warning: { bg:'#FFFBEB', border:'#FDE68A', color:'#92400E' },
    success: { bg:'#F0FDF4', border:'#BBF7D0', color:'#16A34A' },
    danger:  { bg:'#FEF2F2', border:'#FECACA', color:'#DC2626' },
    info:    { bg:'#EFF6FF', border:'#BFDBFE', color:'#1D4ED8' },
  };
  const priorityBadge = {
    haute:   { bg:'#FEF2F2', color:'#DC2626' },
    moyenne: { bg:'#FFFBEB', color:'#D97706' },
    info:    { bg:'#EFF6FF', color:'#1D4ED8' },
  };
  const scoreColor = !analysis?'#94A3B8':analysis.score>=75?'#16A34A':analysis.score>=50?'#D97706':'#DC2626';

  return (
    <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'24px', marginBottom:'24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h2 style={{ margin:'0 0 4px', fontSize:'16px', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px' }}><IconBot/> Analyse IA du workflow</h2>
          <p style={{ margin:0, fontSize:'13px', color:'#64748B' }}>Recommandations personnalisées basées sur les données réelles</p>
        </div>
        <button onClick={handleAnalyze} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'9px', background:loading?'#E2E8F0':B, color:loading?'#94A3B8':'#fff', border:'none', fontWeight:700, fontSize:'13px', cursor:loading?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", boxShadow:loading?'none':`0 4px 12px ${B}40` }}>
          {loading?<><IconLoader/> Analyse…</>:<><IconRefresh/> Analyser</>}
        </button>
      </div>

      {error&&<div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 14px', background:'#FEF2F2', color:'#DC2626', borderRadius:'9px', marginBottom:'16px', fontWeight:600, border:'1.5px solid #FECACA' }}><IconAlert/>{error}</div>}

      {!analysis&&!loading&&(
        <div style={{ textAlign:'center', padding:'48px 20px', color:'#94A3B8' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#EFF6FF', border:`1.5px solid #BFDBFE`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:B }}><IconBot/></div>
          <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'14px', color:'#0F172A' }}>Cliquez sur "Analyser" pour obtenir des recommandations</p>
          <p style={{ margin:0, fontSize:'12px' }}>L'IA analysera les étapes, délais, historique et points de blocage</p>
        </div>
      )}

      {loading&&(
        <div style={{ textAlign:'center', padding:'48px 20px', color:B }}>
          <IconLoader/><p style={{ margin:'12px 0 4px', fontWeight:600, color:'#0F172A' }}>Analyse en cours…</p>
          <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>L'IA examine votre workflow</p>
        </div>
      )}

      {analysis&&!loading&&(
        <div>
          <div style={{ display:'flex', gap:'18px', marginBottom:'24px', flexWrap:'wrap' }}>
            <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'20px', textAlign:'center', minWidth:'120px', border:'1.5px solid #E2E8F0' }}>
              <div style={{ fontSize:'36px', fontWeight:900, color:scoreColor, lineHeight:1 }}>{analysis.score}</div>
              <div style={{ fontSize:'11px', color:'#64748B', marginTop:'4px', fontWeight:600 }}>Score /100</div>
              <div style={{ marginTop:'8px', height:'6px', background:'#E2E8F0', borderRadius:'3px' }}>
                <div style={{ height:'100%', width:analysis.score+'%', background:scoreColor, borderRadius:'3px', transition:'width 1s' }}/>
              </div>
            </div>
            <div style={{ flex:1, background:'#F8FAFC', borderRadius:'12px', padding:'20px', border:'1.5px solid #E2E8F0', display:'flex', alignItems:'center' }}>
              <p style={{ margin:0, fontSize:'14px', color:'#374151', fontStyle:'italic', lineHeight:1.7 }}>"{analysis.resume}"</p>
            </div>
          </div>
          <h3 style={{ margin:'0 0 12px', fontSize:'14px', fontWeight:700, color:'#0F172A' }}>Recommandations ({analysis.suggestions?.length||0})</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {(analysis.suggestions||[]).map((s,i) => {
              const tc = typeConfig[s.type]||typeConfig.info;
              const pb = priorityBadge[s.priorite]||priorityBadge.info;
              return (
                <div key={i} style={{ padding:'14px 16px', borderRadius:'10px', background:tc.bg, border:`1.5px solid ${tc.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px' }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'13px', color:tc.color }}>{s.titre}</p>
                      <p style={{ margin:0, fontSize:'13px', color:'#374151', lineHeight:1.6 }}>{s.detail}</p>
                    </div>
                    <span style={{ background:pb.bg, color:pb.color, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, flexShrink:0 }}>{s.priorite||'Info'}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:'14px', textAlign:'right' }}>
            <button onClick={handleAnalyze} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 16px', borderRadius:'8px', background:'#F1F5F9', color:'#64748B', border:'1.5px solid #E2E8F0', fontWeight:600, fontSize:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
              <IconRefresh/> Relancer l'analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── SectionCard ────────────────────────────────────────────────────────────
const SCard = ({ children, style={} }) => (
  <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'24px', marginBottom:'20px', ...style }}>
    {children}
  </div>
);

// ── WorkflowDetail ─────────────────────────────────────────────────────────
const WorkflowDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workflow,   setWorkflow]   = useState(null);
  const [documents,  setDocuments]  = useState([]);
  const [allPosts,   setAllPosts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [comment,    setComment]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [formValues, setFormValues] = useState({});
  const [checklist,  setChecklist]  = useState([]);
  const [activeTab,  setActiveTab]  = useState('progression');
  const [visForm,    setVisForm]    = useState({ visibility:'global', allowedRoles:[], allowedPosts:[] });
  const [visSaving,  setVisSaving]  = useState(false);
  const [visMsg,     setVisMsg]     = useState('');
  const [archiving,  setArchiving]  = useState(false);
  const fileInputRef = useRef();

  const roleName      = typeof user?.role==='object'?user?.role?.name:user?.role;
  const isAdmin       = roleName==='company_admin'||user?.isCompanyAdmin;
  const currentUserId = user?._id?.toString();

  useEffect(() => { fetchData(); loadPosts(); }, [id]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, docsRes] = await Promise.all([workflowService.getById(id), workflowService.getDocuments(id)]);
      const wf = res.data?.workflow;
      setWorkflow(wf);
      setDocuments(docsRes?.documents||docsRes?.data?.documents||[]);
      if (wf?.steps?.[wf.currentStep]) {
        const step = wf.steps[wf.currentStep];
        const initForm = {};
        (step.form?.fields||[]).forEach(f=>{ initForm[f.id]=f.data??''; });
        setFormValues(initForm);
        setChecklist((step.checklist||[]).map(item=>({...item})));
      }
      if (wf) setVisForm({ visibility:wf.visibility||'global', allowedRoles:wf.allowedRoles||[], allowedPosts:wf.allowedPosts||[] });
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadPosts = async () => {
    try { const m = await import('../../../services/departmentService'); setAllPosts(await m.default.getAllPosts()||[]); }
    catch { setAllPosts([]); }
  };

  const showMsg = (t) => { setMsg(t); setTimeout(()=>setMsg(''),4000); };

  const handleSaveVisibility = async () => {
    setVisSaving(true); setVisMsg('');
    try { await workflowService.updateVisibility(id,visForm); setVisMsg('SUCCESS Droits d\'accès mis à jour !'); fetchData(); }
    catch(err) { setVisMsg('ERREUR '+(err.response?.data?.message||err.message)); }
    finally { setVisSaving(false); }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archiver ce workflow ?')) return;
    setArchiving(true);
    try { await workflowService.archive(id); showMsg('SUCCESS Workflow archivé !'); fetchData(); }
    catch(err) { showMsg('ERREUR '+(err.response?.data?.message||err.message)); }
    finally { setArchiving(false); }
  };

  const handleFormChange = (fieldId,value) => setFormValues(prev=>({...prev,[fieldId]:value}));
  const handleChecklistToggle = (index) => setChecklist(prev=>{ const u=[...prev]; u[index]={...u[index],checked:!u[index].checked}; return u; });

  const handleComplete = async () => {
    const step = workflow.steps[workflow.currentStep];
    const missing = (step.form?.fields||[]).filter(f=>f.required&&(!formValues[f.id]||formValues[f.id]===''));
    if (missing.length>0) { showMsg('ERREUR Champs obligatoires : '+missing.map(f=>f.label).join(', ')); return; }
    const missingCk = checklist.filter(i=>i.required&&!i.checked);
    if (missingCk.length>0) { showMsg('ERREUR Checklist incomplète : '+missingCk.map(i=>i.label).join(', ')); return; }
    setSaving(true);
    try { await workflowService.completeStep(id,{comment,formData:formValues,checklistData:checklist}); setComment(''); setFormValues({}); setChecklist([]); showMsg('SUCCESS Étape validée !'); fetchData(); }
    catch(err) { showMsg('ERREUR : '+(err.response?.data?.message||err.message)); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    if (!comment.trim()) { showMsg('ERREUR Un commentaire est requis pour rejeter'); return; }
    setSaving(true);
    try { await workflowService.rejectStep(id,{comment}); setComment(''); showMsg('WARN Étape rejetée'); fetchData(); }
    catch(err) { showMsg('ERREUR : '+(err.response?.data?.message||err.message)); }
    finally { setSaving(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',file); fd.append('workflowId',id); fd.append('stepIndex',String(workflow.currentStep));
      await workflowService.uploadDocument(fd);
      showMsg('SUCCESS Document uploadé !'); fetchData();
    } catch(err) { showMsg('ERREUR upload : '+(err.response?.data?.message||err.message)); }
    finally { setUploading(false); e.target.value=''; }
  };

  const renderField = (field) => {
    const value = formValues[field.id]!==undefined?formValues[field.id]:'';
    const inpStyle = { width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', fontFamily:"'Inter',sans-serif" };
    const labelEl = <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>{field.label}{field.required&&<span style={{color:'#EF4444'}}>*</span>}</label>;

    if (['auto_number','auto_user','auto_status'].includes(field.type)) {
      const autoVal = field.type==='auto_user'?(user?.firstName+' '+user?.lastName):field.type==='auto_status'?'En cours':(value||'Généré automatiquement');
      return <div key={field.id} style={{marginBottom:'14px'}}>{labelEl}<div style={{...inpStyle,background:'#F8FAFC',color:'#64748B',border:'1.5px dashed #E2E8F0',display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'12px',color:'#94A3B8'}}>⚙</span><span>{autoVal}</span></div></div>;
    }
    if (field.type==='table') {
      const columns = field.columns||[];
      const rows = Array.isArray(value)?value:[{}];
      const updateRow = (ri,colId,val) => { const u=[...rows]; u[ri]={...u[ri],[colId]:val}; handleFormChange(field.id,u); };
      return (
        <div key={field.id} style={{marginBottom:'14px'}}>
          {labelEl}
          <div style={{overflowX:'auto',border:'1.5px solid #E2E8F0',borderRadius:'10px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
              <thead><tr style={{background:'#F8FAFC'}}>{columns.map(c=><th key={c.id} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#374151',borderBottom:'1.5px solid #E2E8F0',fontSize:'12px'}}>{c.label}{c.required&&<span style={{color:'#EF4444'}}> *</span>}</th>)}<th style={{padding:'8px 12px',width:'40px',borderBottom:'1.5px solid #E2E8F0'}}></th></tr></thead>
              <tbody>{rows.map((row,ri)=><tr key={ri} style={{borderBottom:'1px solid #F1F5F9'}}>{columns.map(c=><td key={c.id} style={{padding:'6px 8px'}}><input type={c.type==='number'?'number':c.type==='date'?'date':'text'} value={row[c.id]||''} onChange={e=>updateRow(ri,c.id,e.target.value)} style={{width:'100%',padding:'5px 8px',borderRadius:'7px',border:'1.5px solid #E2E8F0',fontSize:'12px',boxSizing:'border-box',outline:'none'}}/></td>)}<td style={{padding:'6px 8px',textAlign:'center'}}>{rows.length>1&&<button onClick={()=>handleFormChange(field.id,rows.filter((_,i)=>i!==ri))} style={{background:'#FEF2F2',color:'#DC2626',border:'1.5px solid #FECACA',width:'24px',height:'24px',borderRadius:'6px',cursor:'pointer',fontWeight:800,fontSize:'12px'}}>×</button>}</td></tr>)}</tbody>
            </table>
          </div>
          <button onClick={()=>handleFormChange(field.id,[...rows,{}])} style={{marginTop:'6px',padding:'5px 14px',borderRadius:'7px',border:`1.5px dashed ${B}`,background:'#EFF6FF',color:B,cursor:'pointer',fontSize:'12px',fontWeight:700,fontFamily:"'Inter',sans-serif"}}>+ Ajouter une ligne</button>
        </div>
      );
    }
    if (field.type==='file') return <div key={field.id} style={{marginBottom:'14px'}}>{labelEl}<input type="file" onChange={e=>handleFormChange(field.id,e.target.files[0]?.name||'')} style={{...inpStyle,padding:'6px'}}/></div>;
    if (field.type==='signature') return <div key={field.id} style={{marginBottom:'14px'}}>{labelEl}<SignatureCanvas value={value} onChange={val=>handleFormChange(field.id,val)}/></div>;
    if (field.type==='select') return <div key={field.id} style={{marginBottom:'14px'}}>{labelEl}<select value={value} onChange={e=>handleFormChange(field.id,e.target.value)} style={{...inpStyle,cursor:'pointer'}}><option value="">— Choisir —</option>{(field.options||[]).map((opt,i)=><option key={i} value={opt}>{opt}</option>)}</select></div>;
    if (field.type==='textarea') return <div key={field.id} style={{marginBottom:'14px'}}>{labelEl}<textarea value={value} onChange={e=>handleFormChange(field.id,e.target.value)} rows={3} style={{...inpStyle,resize:'vertical'}}/></div>;
    if (field.type==='checkbox') return <div key={field.id} style={{marginBottom:'14px'}}><label style={{display:'flex',alignItems:'center',gap:'10px',cursor:'pointer'}}><input type="checkbox" checked={value===true||value==='true'} onChange={e=>handleFormChange(field.id,e.target.checked)} style={{width:'18px',height:'18px',accentColor:B}}/><span style={{fontWeight:700,fontSize:'12px',color:'#374151',textTransform:'uppercase',letterSpacing:'0.07em'}}>{field.label}{field.required&&<span style={{color:'#EF4444'}}>*</span>}</span></label></div>;
    return <div key={field.id} style={{marginBottom:'14px'}}>{labelEl}<input type={field.type==='date'?'date':field.type==='number'?'number':'text'} value={value} onChange={e=>handleFormChange(field.id,e.target.value)} style={inpStyle}/></div>;
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px', fontFamily:"'Inter',sans-serif" }}>
      <IconLoader/> Chargement…
    </div>
  );
  if (!workflow) return <div style={{ padding:'40px', color:'#64748B', fontFamily:"'Inter',sans-serif" }}>Workflow non trouvé</div>;

  // ── Computed values ────────────────────────────────────────────────────────
  const activeStep    = workflow.steps?.[workflow.currentStep]||null;
  const isActive      = workflow.status==='active';
  const isCompleted   = workflow.status==='completed';
  const isRejected    = workflow.status==='rejected';
  const userPost      = user?.jobTitle||'';
  const assignedTo    = activeStep?.assignedTo?.toString();
  const assignedRole  = activeStep?.assignedRole;
  const assignedPost  = activeStep?.assignedPost;
  const isAssignedToMe   = assignedTo&&assignedTo===currentUserId;
  const isAssignedByRole = !assignedTo&&assignedRole&&assignedRole===roleName;
  const isAssignedByPost = !assignedTo&&assignedPost&&assignedPost.toLowerCase().trim()===userPost.toLowerCase().trim();
  const canAct           = !isAdmin&&(isAssignedToMe||isAssignedByRole||isAssignedByPost);
  const stepClaims       = activeStep?.claims||{canValidate:true,canReject:true,canModify:false,canView:true};
  const isCreator        = workflow?.createdBy?._id?.toString()===currentUserId||workflow?.createdBy?.toString()===currentUserId;
  const isStep0ByCreator = isCreator&&workflow?.currentStep===0;
  const canValidateStep  = (canAct||isStep0ByCreator)&&(isStep0ByCreator||stepClaims.canValidate!==false);
  const canRejectStep    = canAct&&stepClaims.canReject!==false;
  const totalSteps = workflow.steps?.length||0;
  const doneSteps  = workflow.steps?.filter(s=>s.status==='completed').length||0;
  const progress   = totalSteps>0?Math.round((doneSteps/totalSteps)*100):0;
  const hasForm      = activeStep?.form?.fields?.length>0;
  const hasChecklist = checklist.length>0;

  const statusMap = { active:{bg:'#EFF6FF',color:'#1D4ED8',label:'Actif',dot:'#3B82F6'}, completed:{bg:'#F0FDF4',color:'#16A34A',label:'Terminé',dot:'#22C55E'}, rejected:{bg:'#FEF2F2',color:'#DC2626',label:'Rejeté',dot:'#EF4444'}, draft:{bg:'#F8FAFC',color:'#64748B',label:'Brouillon',dot:'#94A3B8'} };
  const ss = statusMap[workflow.status]||statusMap.draft;

  const isSuccess = msg.startsWith('SUCCESS');
  const isWarn    = msg.startsWith('WARN');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR|WARN)\s?/,'');

  const IconProgression = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  const IconGraph       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
  const IconHistory     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>;
  const IconDocs        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
  const IconAI          = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="12" y1="3" x2="12" y2="7"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/></svg>;
  const IconAccess      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

  const TABS = [
    { key:'progression', label:'Progression',   icon:<IconProgression/> },
    { key:'graphe',      label:'Graphe visuel', icon:<IconGraph/> },
    { key:'historique',  label:'Historique',    icon:<IconHistory/>, count:workflow.history?.length||0 },
    ...(documents.length>0?[{ key:'documents', label:'Documents', icon:<IconDocs/>, count:documents.length }]:[]),
    { key:'ia',          label:'Analyse IA',    icon:<IconAI/> },
    ...(isAdmin?[{ key:'acces', label:'Accès',  icon:<IconAccess/> }]:[]),
  ];

  const visMsgSuccess = visMsg.startsWith('SUCCESS');
  const visMsgText    = visMsg.replace(/^(SUCCESS|ERREUR)\s?/,'');

  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:0.8;transform:scale(1.05)} }
        .wfd-tab-btn:hover { background:#F1F5F9!important; color:#0F172A!important; }
      `}</style>
      <div style={{ padding:'32px', maxWidth:'1000px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── Toast ── */}
        {msg && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:9999, display:'flex', alignItems:'center', gap:'9px', padding:'13px 18px', borderRadius:'12px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.25s ease', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', ...(isSuccess?{background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'}:isWarn?{background:'#FFFBEB',border:'1.5px solid #FDE68A',color:'#92400E'}:{background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess?<IconCheck/>:isWarn?<IconAlert/>:<IconAlert/>} {msgText}
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', marginBottom:'24px', flexWrap:'wrap' }}>
          <button onClick={()=>{ const pid=workflow?.project?._id||workflow?.project; if(pid)navigate('/dashboard/company/projects/'+pid); else navigate(-1); }}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif", flexShrink:0 }}>
            <IconArrowL/> Retour
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'8px' }}>
              <h1 style={{ margin:0, fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px' }}>{workflow.name}</h1>
              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:ss.bg, color:ss.color, padding:'4px 11px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:`1px solid ${ss.dot}25` }}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:ss.dot}}/>{ss.label}
              </span>
              {workflow.docNumber && (
                <span style={{ background:'#EFF6FF', color:B, padding:'4px 12px', borderRadius:'7px', fontSize:'13px', fontWeight:800, fontFamily:'monospace', border:'1.5px solid #BFDBFE' }}>
                  {workflow.docNumber}
                </span>
              )}
              {/* Visibility badge */}
              {workflow.allowedPosts?.length>0 ? (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'12px', color:'#7C3AED', fontWeight:700, display:'flex', alignItems:'center', gap:'4px' }}><IconLock/> Visible par :</span>
                  {workflow.allowedPosts.map(p=><span key={p} style={{ background:'#F5F3FF', color:'#7C3AED', padding:'2px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1px solid #DDD6FE' }}>{p}</span>)}
                </div>
              ) : (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#F0FDF4', color:'#16A34A', padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1px solid #BBF7D0' }}>
                  <IconGlobe/> Tous les employés
                </span>
              )}
              {/* Admin actions */}
              {isAdmin&&workflow.status==='draft'&&(
                <button onClick={()=>navigate('/dashboard/company/workflows/'+workflow._id+'/edit')}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', background:'#EFF6FF', color:B, border:`1.5px solid #BFDBFE`, fontWeight:700, cursor:'pointer', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
                  <IconEdit/> Modifier
                </button>
              )}
              {isAdmin&&['completed','rejected','draft'].includes(workflow.status)&&(
                <button onClick={handleArchive} disabled={archiving}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'8px', background:archiving?'#E2E8F0':'#F8FAFC', color:archiving?'#94A3B8':'#475569', border:'1.5px solid #E2E8F0', fontWeight:700, cursor:archiving?'not-allowed':'pointer', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
                  {archiving?<IconLoader/>:<IconArchive/>} Archiver
                </button>
              )}
            </div>
            {/* Progress */}
            {workflow.status!=='draft'&&workflow.isTemplate!==true&&(
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ flex:1, height:'6px', background:'#F1F5F9', borderRadius:'3px', maxWidth:'300px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:progress+'%', background:isCompleted?'#16A34A':isRejected?'#DC2626':B, borderRadius:'3px', transition:'width 0.5s' }}/>
                </div>
                <span style={{ fontSize:'12px', fontWeight:700, color:'#64748B' }}>{progress}% — {doneSteps}/{totalSteps} étapes</span>
                {workflow.dueDate&&<span style={{ fontSize:'12px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'4px' }}><IconClock/>{new Date(workflow.dueDate).toLocaleDateString('fr-FR')}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:'2px', background:'#F1F5F9', padding:'4px', borderRadius:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
          {TABS.map(tab => {
            const active = activeTab===tab.key;
            return (
              <button key={tab.key} className="wfd-tab-btn" onClick={()=>setActiveTab(tab.key)}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight:active?700:500, fontSize:'13px', background:active?'#fff':'transparent', color:active?'#0F172A':'#64748B', boxShadow:active?'0 1px 6px rgba(0,0,0,0.1)':'none', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                <span style={{color:active?B:'#94A3B8',display:'flex',flexShrink:0}}>{tab.icon}</span>
                {tab.label}
                {tab.count!==undefined&&<span style={{ padding:'1px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:700, background:active?B:'#E2E8F0', color:active?'#fff':'#64748B', transition:'all 0.15s' }}>{tab.count}</span>}
              </button>
            );
          })}
        </div>

        {/* ── TAB: Progression ── */}
        {activeTab==='progression' && (
          <SCard>
            {/* Step timeline */}
            <div style={{ display:'flex', alignItems:'flex-start', overflowX:'auto', paddingBottom:'8px', marginBottom:'28px', paddingTop:'8px' }}>
              {(workflow.steps||[]).map((step,i) => {
                const isComp = step.status==='completed';
                const isInProg = step.status==='in_progress';
                const isRej  = step.status==='rejected';
                const isPend = step.status==='pending';
                const bg    = isComp?'#16A34A':isInProg?B:isRej?'#DC2626':'#F1F5F9';
                const color = isPend?'#94A3B8':'#fff';
                const lc    = isInProg?B:isComp?'#16A34A':isRej?'#DC2626':'#94A3B8';
                const lineColor = isComp?'#16A34A':isRej?'#DC2626':'#E2E8F0';
                return (
                  <React.Fragment key={i}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, minWidth:'100px' }}>
                      {/* Circle with glow */}
                      <div style={{ position:'relative', marginBottom:'12px' }}>
                        {isInProg && <div style={{ position:'absolute', inset:'-6px', borderRadius:'50%', background:`${B}18`, animation:'pulse 2s ease-in-out infinite' }}/>}
                        <div style={{ position:'relative', width:'52px', height:'52px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'18px', background:bg, color, boxShadow: isInProg?`0 0 0 3px #fff, 0 0 0 5px ${B}, 0 8px 20px ${B}40`:isComp?`0 4px 14px rgba(22,163,74,0.4)`:isRej?`0 4px 14px rgba(220,38,38,0.3)`:'0 2px 8px rgba(0,0,0,0.08)', transition:'all 0.3s' }}>
                          {isComp
                            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : isRej
                              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              : <span style={{fontSize:'17px',fontWeight:900}}>{i+1}</span>
                          }
                        </div>
                        {isInProg && (
                          <div style={{ position:'absolute', top:'-2px', right:'-2px', width:'16px', height:'16px', borderRadius:'50%', background:'#FBBF24', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          </div>
                        )}
                      </div>
                      {/* Status badge */}
                      <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:700, marginBottom:'6px', background: isComp?'#F0FDF4':isInProg?'#EFF6FF':isRej?'#FEF2F2':'#F8FAFC', color:lc, border:`1px solid ${lc}30` }}>
                        {isComp?'Validée':isInProg?'En cours':isRej?'Rejetée':'En attente'}
                      </span>
                      <span style={{ fontSize:'12px', fontWeight:700, textAlign:'center', maxWidth:'100px', color:'#0F172A', lineHeight:1.3 }}>{step.name}</span>
                      <span style={{ fontSize:'10px', color:i===0?'#0369A1':'#94A3B8', marginTop:'4px', fontWeight:i===0?700:400, textAlign:'center', display:'flex', alignItems:'center', gap:'3px' }}>
                        {i===0&&<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                        {i===0?(workflow.allowedPosts?.length>0?workflow.allowedPosts[0]+(workflow.allowedPosts.length>1?' +'+(workflow.allowedPosts.length-1):''):'Tous les employés'):(step.assignedToName||step.assignedPost||'')}
                      </span>
                    </div>
                    {i<workflow.steps.length-1&&(
                      <div style={{ display:'flex', alignItems:'center', flex:0.4, minWidth:'24px', marginBottom:'52px', paddingTop:'26px', position:'relative' }}>
                        <div style={{ width:'100%', height:'3px', background:lineColor, borderRadius:'2px', position:'relative', overflow:'visible' }}>
                          {isComp && <div style={{ position:'absolute', right:'-6px', top:'-4px', color:lineColor }}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Admin step detail */}
            {isAdmin&&(
              <div style={{ borderTop:'1.5px solid #F1F5F9', paddingTop:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  <h3 style={{ margin:0, fontSize:'12px', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>Détail des étapes</h3>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {(workflow.steps||[]).map((step,i) => {
                    const scMap = {
                      completed:   {bg:'#F0FDF4',border:'#BBF7D0',color:'#16A34A',label:'Validée',   dotColor:'#22C55E'},
                      in_progress: {bg:'#EFF6FF',border:'#BFDBFE',color:B,         label:'En cours',  dotColor:'#3B82F6'},
                      rejected:    {bg:'#FEF2F2',border:'#FECACA',color:'#DC2626', label:'Rejetée',   dotColor:'#EF4444'},
                      pending:     {bg:'#F8FAFC',border:'#E2E8F0',color:'#94A3B8', label:'En attente',dotColor:'#CBD5E1'},
                    };
                    const sc = scMap[step.status]||scMap.pending;
                    const isFirst = i===0;
                    return (
                      <div key={i} style={{ padding:'16px 18px', borderRadius:'12px', background:sc.bg, border:`1.5px solid ${sc.border}`, display:'flex', alignItems:'flex-start', gap:'14px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                        {/* Step number circle */}
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: step.status==='completed'?'#16A34A':step.status==='in_progress'?B:step.status==='rejected'?'#DC2626':'#E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'14px', color: step.status==='pending'?'#94A3B8':'#fff', flexShrink:0, boxShadow: step.status==='in_progress'?`0 3px 10px ${B}40`:step.status==='completed'?'0 3px 10px rgba(22,163,74,0.3)':'none' }}>
                          {step.status==='completed'
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : step.status==='rejected'
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              : <span>{i+1}</span>
                          }
                        </div>
                        {/* Content */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', marginBottom:'6px' }}>
                            <p style={{ margin:0, fontWeight:800, fontSize:'14px', color:'#0F172A' }}>{step.name}</p>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fff', color:sc.color, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1.5px solid ${sc.border}`, flexShrink:0 }}>
                              <span style={{width:'5px',height:'5px',borderRadius:'50%',background:sc.dotColor}}/>
                              {sc.label}
                            </span>
                          </div>
                          {/* Assignment info */}
                          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                            {isFirst ? (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:workflow.allowedPosts?.length>0?'#F5F3FF':'#E0F2FE', color:workflow.allowedPosts?.length>0?'#7C3AED':'#0369A1', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700 }}>
                                {workflow.allowedPosts?.length>0
                                  ? <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>{workflow.allowedPosts.join(', ')}</>
                                  : <><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Tous les employés</>
                                }
                              </span>
                            ) : (
                              <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fff', color:'#64748B', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, border:'1px solid #E2E8F0' }}>
                                <IconUsers/>
                                {step.assignedToName||step.assignedPost||step.assignedRole||<span style={{color:'#D97706'}}>Non assigné</span>}
                              </span>
                            )}
                            {step.completedAt&&(
                              <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', color:'#94A3B8', fontWeight:500 }}>
                                <IconClock/>{new Date(step.completedAt).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                          {step.comment&&<div style={{ marginTop:'8px', padding:'8px 12px', background:'#fff', borderRadius:'8px', border:'1px solid #E2E8F0' }}><p style={{ margin:0, fontSize:'12px', color:'#64748B', fontStyle:'italic' }}>"{step.comment}"</p></div>}
                          {(step.form?.fields||[]).filter(f=>f.type==='signature'&&f.data).map(f=>(
                            <div key={f.id} style={{marginTop:'8px'}}>
                              <p style={{margin:'0 0 4px',fontSize:'11px',color:'#94A3B8',fontWeight:600}}>{f.label} :</p>
                              {f.data?.startsWith('data:')?<img src={f.data} alt="sig" style={{maxHeight:'60px',border:'1.5px solid #E2E8F0',borderRadius:'7px',background:'#fff',padding:'4px'}}/>:<span style={{fontFamily:'cursive',fontSize:'20px',color:'#0F172A'}}>{f.data}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </SCard>
        )}

        {/* ── TAB: Graphe ── */}
        {activeTab==='graphe' && (
          <SCard>
            <h2 style={{ margin:'0 0 18px', fontSize:'16px', fontWeight:800, color:'#0F172A' }}>Visualisation graphique du processus</h2>
            <WorkflowGraph steps={workflow.steps} currentStep={workflow.currentStep} canvasNodes={workflow.canvasNodes} canvasEdges={workflow.canvasEdges} allowedPosts={workflow.allowedPosts||[]}/>
            <div style={{ display:'flex', gap:'16px', marginTop:'18px', paddingTop:'16px', borderTop:'1.5px solid #F1F5F9', flexWrap:'wrap' }}>
              {[{color:'#16A34A',label:'Validée'},{color:B,label:'En cours'},{color:'#DC2626',label:'Rejetée'},{color:'#CBD5E1',label:'En attente'}].map(l=>(
                <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'12px', height:'12px', borderRadius:'4px', background:l.color }}/>
                  <span style={{ fontSize:'12px', color:'#64748B', fontWeight:500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </SCard>
        )}

        {/* ── TAB: Historique ── */}
        {activeTab==='historique' && (
          <SCard>
            <h2 style={{ margin:'0 0 20px', fontSize:'16px', fontWeight:800, color:'#0F172A' }}>Historique détaillé</h2>
            {(workflow.history||[]).length===0
              ? <p style={{ color:'#94A3B8', textAlign:'center', padding:'40px 0', fontSize:'14px' }}>Aucune action enregistrée</p>
              : <HistoryTimeline history={workflow.history}/>
            }
          </SCard>
        )}

        {/* ── TAB: Documents ── */}
        {activeTab==='documents' && (
          <SCard>
            <DocumentsSection documents={documents} steps={workflow.steps||[]} title={`Documents (${documents.length})`}/>
          </SCard>
        )}

        {/* ── TAB: Analyse IA ── */}
        {activeTab==='ia' && <WorkflowAnalysis workflow={workflow}/>}

        {/* ── TAB: Accès ── */}
        {activeTab==='acces' && isAdmin && (
          <SCard>
            <h2 style={{ margin:'0 0 6px', fontSize:'16px', fontWeight:800, color:'#0F172A', display:'flex', alignItems:'center', gap:'8px' }}><IconLock/> Accès & Visibilité</h2>
            <p style={{ margin:'0 0 22px', fontSize:'13px', color:'#64748B' }}>Contrôlez qui peut voir et interagir avec ce workflow.</p>

            {visMsg && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', borderRadius:'9px', marginBottom:'16px', fontWeight:600, fontSize:'13px', ...(visMsgSuccess?{background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'}:{background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
                {visMsgSuccess?<IconCheck/>:<IconAlert/>} {visMsgText}
              </div>
            )}

            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Mode de visibilité</label>
              <div style={{ display:'flex', gap:'12px' }}>
                {[{value:'global',label:'Global',icon:<IconGlobe/>,desc:"Visible par tous les employés",color:'#16A34A',bg:'#F0FDF4',border:'#BBF7D0'},{value:'restricted',label:'Restreint',icon:<IconLock/>,desc:"Visible uniquement par les postes configurés",color:'#7C3AED',bg:'#F5F3FF',border:'#DDD6FE'}].map(opt => {
                  const isSel = visForm.visibility===opt.value;
                  return (
                    <div key={opt.value} onClick={()=>setVisForm(p=>({...p,visibility:opt.value,...(opt.value==='global'?{allowedPosts:[],allowedRoles:[]}:{})}))}
                      style={{ flex:1, padding:'14px 16px', borderRadius:'12px', cursor:'pointer', border:`1.5px solid ${isSel?opt.border:'#E2E8F0'}`, background:isSel?opt.bg:'#F8FAFC', transition:'all 0.15s' }}>
                      <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'14px', color:isSel?opt.color:'#374151', display:'flex', alignItems:'center', gap:'6px' }}><span style={{color:isSel?opt.color:'#94A3B8'}}>{opt.icon}</span>{opt.label}</p>
                      <p style={{ margin:0, fontSize:'12px', color:'#64748B' }}>{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {visForm.visibility==='restricted' && (
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Postes autorisés</label>
                <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginBottom:'10px', padding:'10px 12px', background:'#F8FAFC', borderRadius:'9px', border:'1.5px solid #E2E8F0', minHeight:'42px', alignItems:'center' }}>
                  {(visForm.allowedPosts||[]).length===0
                    ? <span style={{ fontSize:'13px', color:'#94A3B8' }}>Aucun poste sélectionné</span>
                    : (visForm.allowedPosts||[]).map(p=>(
                        <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#F5F3FF', color:'#7C3AED', padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:'1.5px solid #DDD6FE' }}>
                          {p}
                          <button onClick={()=>setVisForm(prev=>({...prev,allowedPosts:prev.allowedPosts.filter(x=>x!==p)}))}
                            style={{ background:'#EDE9FE', border:'none', color:'#7C3AED', cursor:'pointer', width:'15px', height:'15px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}>
                            <IconXSm/>
                          </button>
                        </span>
                      ))
                  }
                </div>
                <select value="" onChange={e=>{ const v=e.target.value; if(v&&!(visForm.allowedPosts||[]).includes(v)) setVisForm(prev=>({...prev,allowedPosts:[...(prev.allowedPosts||[]),v]})); }}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'13px', color:'#0F172A', background:'#fff', cursor:'pointer', fontFamily:"'Inter',sans-serif", outline:'none' }}>
                  <option value="">+ Ajouter un poste autorisé…</option>
                  {allPosts.filter(p=>!(visForm.allowedPosts||[]).includes(p.name)).map(p=><option key={p._id} value={p.name}>{p.name}</option>)}
                </select>
                <div style={{ marginTop:'10px', padding:'10px 14px', background:'#FFFBEB', borderRadius:'9px', border:'1.5px solid #FDE68A', display:'flex', alignItems:'center', gap:'8px' }}>
                  <IconAlert/><p style={{ margin:0, fontSize:'12px', color:'#92400E', fontWeight:600 }}>Seuls les employés avec les postes listés pourront soumettre des demandes via ce workflow.</p>
                </div>
              </div>
            )}

            <button onClick={handleSaveVisibility} disabled={visSaving}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 22px', borderRadius:'10px', background:visSaving?'#E2E8F0':B, color:visSaving?'#94A3B8':'#fff', border:'none', fontWeight:700, cursor:visSaving?'not-allowed':'pointer', fontSize:'14px', fontFamily:"'Inter',sans-serif", boxShadow:visSaving?'none':`0 4px 12px ${B}40` }}>
              {visSaving?<><IconLoader/>Sauvegarde…</>:<><IconSave/>Sauvegarder les droits</>}
            </button>
          </SCard>
        )}

        {/* ── Action Panel (canAct) ── */}
        {isActive && activeStep && canAct && (
          <SCard style={{ border:`2px solid ${B}`, boxShadow:`0 4px 20px ${B}15` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
              <h2 style={{ margin:0, fontSize:'18px', fontWeight:800, color:'#0F172A' }}>Étape en cours : <span style={{color:B}}>{activeStep.name}</span></h2>
              {(() => {
                const info = getDelaiInfo(activeStep,workflow);
                if (!info) return null;
                if (info.depasse) return (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FEF2F2', border:'1.5px solid #FECACA', padding:'8px 14px', borderRadius:'9px' }}>
                    <span style={{color:'#DC2626',display:'flex'}}><IconAlert/></span>
                    <div><p style={{margin:0,fontWeight:800,fontSize:'13px',color:'#DC2626'}}>Délai dépassé !</p><p style={{margin:0,fontSize:'12px',color:'#DC2626'}}>{info.restant}</p></div>
                  </div>
                );
                return (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#FFFBEB', border:'1.5px solid #FDE68A', padding:'8px 14px', borderRadius:'9px' }}>
                    <span style={{color:'#D97706',display:'flex'}}><IconClock/></span>
                    <div><p style={{margin:0,fontWeight:700,fontSize:'13px',color:'#92400E'}}>{info.restant}</p><p style={{margin:0,fontSize:'11px',color:'#92400E'}}>Limite : {info.deadline?.toLocaleString('fr-FR')}</p></div>
                  </div>
                );
              })()}
            </div>

            {/* Form */}
            {hasForm && (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'20px', marginBottom:'16px', border:'1.5px solid #E2E8F0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                  <span style={{ background:B, color:'#fff', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', fontWeight:800, letterSpacing:'0.05em' }}>FORMULAIRE</span>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'#0F172A' }}>Remplissez les champs requis</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'0 20px' }}>
                  {activeStep.form.fields.map(field=>renderField(field))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {hasChecklist && (
              <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'20px', marginBottom:'16px', border:'1.5px solid #E2E8F0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <span style={{ background:'#7C3AED', color:'#fff', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', fontWeight:800, letterSpacing:'0.05em' }}>CHECKLIST</span>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'#0F172A' }}>{checklist.filter(i=>i.checked).length}/{checklist.length} complètes</span>
                </div>
                {checklist.map((item,i)=>(
                  <div key={item.id||i} onClick={()=>handleChecklistToggle(i)}
                    style={{ display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'10px 14px', borderRadius:'10px', marginBottom:'6px', background:item.checked?'#F0FDF4':'#fff', border:`1.5px solid ${item.checked?'#BBF7D0':'#E2E8F0'}`, userSelect:'none' }}>
                    <div style={{ width:'22px', height:'22px', borderRadius:'6px', border:`2px solid ${item.checked?'#16A34A':'#D1D5DB'}`, background:item.checked?'#16A34A':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {item.checked&&<span style={{color:'#fff',display:'flex'}}><IconCheck/></span>}
                    </div>
                    <span style={{ flex:1, fontSize:'14px', fontWeight:600, color:item.checked?'#16A34A':'#374151', textDecoration:item.checked?'line-through':'none' }}>{item.label}</span>
                    {item.required&&<span style={{ fontSize:'11px', color:item.checked?'#16A34A':'#DC2626', fontWeight:700 }}>{item.checked?'OK':'REQUIS'}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Upload */}
            <div onClick={()=>!uploading&&fileInputRef.current?.click()}
              style={{ background:'#F8FAFC', borderRadius:'10px', border:`2px dashed #E2E8F0`, padding:'16px', textAlign:'center', marginBottom:'16px', cursor:'pointer' }}>
              <input type="file" ref={fileInputRef} onChange={handleUpload} style={{display:'none'}} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"/>
              {uploading
                ? <p style={{ color:B, fontWeight:700, margin:0, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}><IconLoader/>Upload en cours…</p>
                : <p style={{ color:'#64748B', margin:0, fontWeight:600, fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}><IconUpload/>Ajouter un document (max 50 MB)</p>
              }
            </div>

            {/* Comment */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>
                Commentaire <span style={{color:'#94A3B8',fontSize:'11px',fontWeight:400,textTransform:'none'}}>(optionnel pour valider, obligatoire pour rejeter)</span>
              </label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Votre commentaire…" rows={3}
                style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', resize:'vertical', fontFamily:"'Inter',sans-serif", outline:'none' }}/>
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:'12px' }}>
              {canValidateStep && (
                <button onClick={handleComplete} disabled={saving}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', borderRadius:'10px', background:saving?'#E2E8F0':'#16A34A', color:saving?'#94A3B8':'#fff', border:'none', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:'15px', fontFamily:"'Inter',sans-serif", boxShadow:saving?'none':'0 4px 14px rgba(22,163,74,0.35)' }}>
                  {saving?<><IconLoader/>En cours…</>:<><IconCheck/>Valider l'étape</>}
                </button>
              )}
              {canRejectStep && (
                <button onClick={handleReject} disabled={saving}
                  style={{ display:'flex', alignItems:'center', gap:'7px', padding:'13px 24px', borderRadius:'10px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:'14px', fontFamily:"'Inter',sans-serif" }}>
                  <IconX/> Rejeter
                </button>
              )}
              {canAct&&!canValidateStep&&!canRejectStep&&(
                <div style={{ padding:'12px', background:'#FFFBEB', borderRadius:'9px', textAlign:'center', color:'#92400E', fontWeight:600, fontSize:'13px', width:'100%', border:'1.5px solid #FDE68A' }}>
                  Vous pouvez voir cette étape mais vous n'avez pas les permissions pour agir.
                </div>
              )}
            </div>
          </SCard>
        )}

        {/* ── Not assigned message ── */}
        {isActive && activeStep && !isAdmin && !canAct && (
          <SCard style={{ textAlign:'center' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:'#94A3B8' }}><IconClock/></div>
            <h3 style={{ margin:'0 0 8px', color:'#0F172A', fontWeight:800 }}>Cette étape n'est pas assignée à vous</h3>
            <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>L'étape "<strong>{activeStep.name}</strong>" est assignée à {activeStep.assignedToName||activeStep.assignedPost||activeStep.assignedRole||"quelqu'un d'autre"}.</p>
          </SCard>
        )}

        {/* ── Final status ── */}
        {(isCompleted||isRejected) && (
          <SCard style={{ border:`2px solid ${isCompleted?'#16A34A':'#DC2626'}`, background:isCompleted?'#F0FDF4':'#FEF2F2', textAlign:'center' }}>
            <h3 style={{ color:isCompleted?'#16A34A':'#DC2626', margin:'0 0 8px', fontSize:'20px', fontWeight:900 }}>
              {isCompleted?'Workflow terminé avec succès':'Workflow rejeté'}
            </h3>
            {(workflow.completedAt||workflow.updatedAt)&&(
              <p style={{ color:'#64748B', margin:0, fontSize:'14px' }}>Le {new Date(workflow.completedAt||workflow.updatedAt).toLocaleString('fr-FR')}</p>
            )}
          </SCard>
        )}
      </div>
    </>
  );
};

export default WorkflowDetail;