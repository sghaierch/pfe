import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import workflowService from '../../services/workflowService';
import NotificationBell from '../../components/NotificationBell';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  blue:    '#2563EB', blue2:   '#1D4ED8', blueSoft: '#EFF6FF', blueBorder: '#BFDBFE',
  green:   '#16A34A', greenSoft:'#F0FDF4', greenBorder:'#BBF7D0',
  red:     '#DC2626', redSoft:  '#FEF2F2', redBorder:  '#FECACA',
  amber:   '#D97706', amberSoft:'#FFFBEB', amberBorder:'#FDE68A',
  slate:   '#0F172A', slateM:   '#475569', slateL:     '#94A3B8',
  bg:      '#F1F5F9', surface:  '#FFFFFF', border:     '#E2E8F0',
};
const font = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const card = { background:T.surface, borderRadius:'16px', border:`1px solid ${T.border}`, boxShadow:'0 1px 6px rgba(15,23,42,0.06)' };

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IPlus    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ICheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IX       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ISearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ILoader  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IClock   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IArrowR  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const ILogout  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IClipboard = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const ITask    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const IFolder  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IAttach  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const IUpload  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const IUser    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ISortAsc = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;

// ── SignatureCanvas ────────────────────────────────────────────────────────
const SignatureCanvas = ({ value, onChange }) => {
  const ref = useRef(null); const drawing = useRef(false);
  const [empty, setEmpty] = useState(true); const [mode, setMode] = useState('draw');
  useEffect(() => { const ctx = ref.current?.getContext('2d'); if (!ctx) return; ctx.strokeStyle=T.slate; ctx.lineWidth=2; ctx.lineCap='round'; ctx.lineJoin='round'; }, []);
  const pos = (e, c) => { const r=c.getBoundingClientRect(); const cx=e.touches?e.touches[0].clientX:e.clientX; const cy=e.touches?e.touches[0].clientY:e.clientY; return {x:cx-r.left,y:cy-r.top}; };
  const start = e => { e.preventDefault(); drawing.current=true; const p=pos(e,ref.current); const ctx=ref.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  const draw  = e => { e.preventDefault(); if(!drawing.current)return; const p=pos(e,ref.current); const ctx=ref.current.getContext('2d'); ctx.lineTo(p.x,p.y); ctx.stroke(); setEmpty(false); };
  const stop  = e => { e.preventDefault(); if(!drawing.current)return; drawing.current=false; onChange(ref.current.toDataURL('image/png')); };
  const clear = () => { ref.current.getContext('2d').clearRect(0,0,ref.current.width,ref.current.height); setEmpty(true); onChange(''); };
  return (
    <div style={{ border:`1.5px solid ${T.border}`, borderRadius:'10px', overflow:'hidden', background:'#FAFAFA' }}>
      <div style={{ display:'flex', borderBottom:`1px solid ${T.border}`, background:T.bg }}>
        {[{k:'draw',l:'Dessiner'},{k:'type',l:'Taper'}].map(m=>(
          <button key={m.k} type="button" onClick={()=>setMode(m.k)} style={{ flex:1, padding:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'12px', fontFamily:font, background:mode===m.k?T.blue:'transparent', color:mode===m.k?'#fff':T.slateM }}>{m.l}</button>
        ))}
      </div>
      {mode==='draw' ? (
        <div>
          <canvas ref={ref} width={400} height={120} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} style={{ display:'block', width:'100%', cursor:'crosshair', touchAction:'none' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 12px', borderTop:`1px solid #F1F5F9` }}>
            <span style={{ fontSize:'11px', color:T.slateL, display:'flex', alignItems:'center', gap:'5px' }}>{empty?'Signez dans la zone ci-dessus':<><ICheck/><span style={{color:T.green,fontWeight:600}}>Signature dessinée</span></>}</span>
            <button type="button" onClick={clear} style={{ padding:'3px 10px', borderRadius:'7px', border:`1.5px solid ${T.redBorder}`, background:T.redSoft, color:T.red, cursor:'pointer', fontSize:'11px', fontWeight:700, fontFamily:font }}>Effacer</button>
          </div>
        </div>
      ) : (
        <div style={{ padding:'12px' }}>
          <input type="text" value={typeof value==='string'&&!value.startsWith('data:')?value:''} onChange={e=>onChange(e.target.value)} placeholder="Tapez votre nom complet" style={{ width:'100%', padding:'10px', border:`1.5px solid ${T.border}`, borderRadius:'8px', fontFamily:'cursive', fontSize:'18px', boxSizing:'border-box', outline:'none', color:T.slate }}/>
        </div>
      )}
    </div>
  );
};

// ── Navbar ────────────────────────────────────────────────────────────────
const Navbar = ({ user, logout }) => {
  const initials = ((user?.firstName?.[0]||'')+(user?.lastName?.[0]||'')).toUpperCase();
  return (
    <nav style={{ background:'#0F172A', padding:'0 28px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,0.2)', fontFamily:font }}>
      <span style={{ color:'#fff', fontWeight:900, fontSize:'20px', letterSpacing:'-0.5px' }}><span style={{ color:T.blue }}>Axia</span>Workflow</span>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <NotificationBell/>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 12px', background:'rgba(255,255,255,0.07)', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:`linear-gradient(135deg,${T.blue},#7C3AED)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'13px', flexShrink:0 }}>{initials||'?'}</div>
          <div>
            <p style={{ margin:0, color:'#fff', fontSize:'13px', fontWeight:700, lineHeight:1.2 }}>{user?.firstName} {user?.lastName}</p>
            <p style={{ margin:0, color:'#94A3B8', fontSize:'11px', lineHeight:1.2 }}>{user?.jobTitle||'Employé'}</p>
          </div>
        </div>
        <button onClick={logout} style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(220,38,38,0.15)', color:'#FCA5A5', border:'1px solid rgba(220,38,38,0.3)', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:700, fontSize:'13px', fontFamily:font }}>
          <ILogout/> Déconnexion
        </button>
      </div>
    </nav>
  );
};

// ── StatusBadge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    active:    {bg:T.blueSoft,  color:'#1D4ED8', dot:'#3B82F6', label:'En cours'},
    completed: {bg:T.greenSoft, color:T.green,   dot:T.green,   label:'Approuvée'},
    rejected:  {bg:T.redSoft,   color:T.red,     dot:T.red,     label:'Refusée'},
    draft:     {bg:'#F8FAFC',   color:T.slateM,  dot:T.slateL,  label:'Brouillon'},
    archived:  {bg:'#F8FAFC',   color:T.slateL,  dot:'#CBD5E1', label:'Archivé'},
  }[status]||{bg:'#F8FAFC',color:T.slateM,dot:T.slateL,label:status};
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:cfg.bg, color:cfg.color, padding:'4px 11px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${cfg.dot}25` }}>
      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:cfg.dot, flexShrink:0 }}/>
      {cfg.label}
    </span>
  );
};

// ── StepsProgress ─────────────────────────────────────────────────────────
const StepsProgress = ({ steps }) => {
  const total=steps?.length||0, done=steps?.filter(s=>s.status==='completed').length||0, pct=total>0?Math.round((done/total)*100):0;
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'3px', marginBottom:'8px', overflowX:'auto', paddingBottom:'2px' }}>
        {(steps||[]).map((step,i) => {
          const bg=step.status==='completed'?T.green:step.status==='in_progress'?T.blue:step.status==='rejected'?T.red:'#E2E8F0';
          const color=step.status==='pending'?T.slateL:'#fff';
          return (
            <React.Fragment key={i}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:'50px' }}>
                <div style={{ width:'22px', height:'22px', borderRadius:'6px', background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800 }}>
                  {step.status==='completed'?<ICheck/>:step.status==='rejected'?<IX/>:<span style={{fontSize:'10px'}}>{i+1}</span>}
                </div>
                <span style={{ fontSize:'9px', color:T.slateL, textAlign:'center', maxWidth:'48px', marginTop:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.name}</span>
              </div>
              {i<steps.length-1&&<div style={{ height:'2px', width:'12px', background:step.status==='completed'?T.green:'#E2E8F0', flexShrink:0, marginBottom:'12px' }}/>}
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <div style={{ flex:1, height:'5px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
          <div style={{ height:'100%', width:pct+'%', background:`linear-gradient(90deg,${T.blue},${T.blue2})`, borderRadius:'3px', transition:'width 0.4s ease' }}/>
        </div>
        <span style={{ fontSize:'11px', fontWeight:700, color:T.slateM }}>{pct}%</span>
        <span style={{ fontSize:'11px', color:T.slateL }}>{done}/{total}</span>
      </div>
    </div>
  );
};

// ── RequesterSection ──────────────────────────────────────────────────────
const RequesterSection = ({ myRequests, loadingRequests, navigate }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [search, setSearch] = useState('');

  const stats = { total:myRequests.length, active:myRequests.filter(w=>w.status==='active').length, done:myRequests.filter(w=>w.status==='completed').length, rejected:myRequests.filter(w=>w.status==='rejected').length };

  const statCards = [
    { label:'Total',    value:stats.total,    color:T.blue,  bg:T.blueSoft,  border:T.blueBorder,  key:'all',       icon:<IFolder/> },
    { label:'En cours', value:stats.active,   color:T.amber, bg:T.amberSoft, border:T.amberBorder, key:'active',    icon:<IClock/> },
    { label:'Validées', value:stats.done,     color:T.green, bg:T.greenSoft, border:T.greenBorder, key:'completed', icon:<ICheck/> },
    { label:'Refusées', value:stats.rejected, color:T.red,   bg:T.redSoft,   border:T.redBorder,   key:'rejected',  icon:<IX/> },
  ];

  const filtered = filter==='all'?myRequests:myRequests.filter(w=>w.status===filter);
  const searched = filtered.filter(wf=>!search||wf.name?.toLowerCase().includes(search.toLowerCase())||wf.docNumber?.toLowerCase().includes(search.toLowerCase()));
  const sorted   = [...searched].sort((a,b)=>sortBy==='recent'?new Date(b.createdAt||0)-new Date(a.createdAt||0):sortBy==='urgent'?(a.dueDate?new Date(a.dueDate):new Date('2099-01-01'))-(b.dueDate?new Date(b.dueDate):new Date('2099-01-01')):new Date(a.createdAt||0)-new Date(b.createdAt||0));

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
        {statCards.map(s=>(
          <div key={s.key} onClick={()=>setFilter(s.key)} style={{ ...card, padding:'18px 16px', cursor:'pointer', border:`1.5px solid ${filter===s.key?s.color:T.border}`, transition:'all .15s', background:filter===s.key?s.bg:T.surface }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:s.bg, border:`1.5px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, marginBottom:'10px' }}>{s.icon}</div>
            <p style={{ margin:'0 0 4px', fontSize:'28px', fontWeight:900, color:s.color, fontFamily:font, lineHeight:1 }}>{s.value}</p>
            <p style={{ margin:0, fontSize:'12px', color:T.slateM, fontWeight:600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:1, minWidth:'220px' }}>
          <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:T.slateL, pointerEvents:'none', display:'flex' }}><ISearch/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par numéro ou nom…"
            style={{ width:'100%', boxSizing:'border-box', padding:'9px 14px 9px 36px', borderRadius:'9px', border:`1.5px solid ${T.border}`, fontSize:'13px', fontFamily:font, outline:'none', background:T.surface, color:T.slate }}
            onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        {/* Filter pills */}
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {statCards.map(s=>(
            <button key={s.key} onClick={()=>setFilter(s.key)}
              style={{ padding:'6px 14px', borderRadius:'20px', border:`1.5px solid ${filter===s.key?s.color:T.border}`, background:filter===s.key?s.bg:T.surface, color:filter===s.key?s.color:T.slateM, fontWeight:700, fontSize:'12px', cursor:'pointer', fontFamily:font, transition:'all .15s' }}>
              {s.label}{filter===s.key?` (${s.value})`:''}
            </button>
          ))}
        </div>
        {/* Sort */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', border:`1.5px solid ${T.border}`, borderRadius:'9px', background:T.surface, cursor:'pointer' }}>
          <ISortAsc/>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ border:'none', outline:'none', fontSize:'12px', fontWeight:600, color:T.slateM, fontFamily:font, background:'transparent', cursor:'pointer' }}>
            <option value="recent">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="urgent">Plus urgent</option>
          </select>
        </div>
      </div>

      {loadingRequests ? (
        <div style={{ ...card, padding:'40px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', color:T.slateM }}>
          <ILoader/> Chargement…
        </div>
      ) : sorted.length===0 ? (
        <div style={{ ...card, padding:'60px 40px', textAlign:'center' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:T.blue }}><IFolder/></div>
          <h3 style={{ margin:'0 0 8px', color:T.slate, fontFamily:font, fontWeight:800 }}>Aucune demande</h3>
          <p style={{ margin:'0 0 20px', color:T.slateM, fontSize:'14px' }}>{search?`Aucun résultat pour "${search}"`:filter!=='all'?'Aucune demande dans cette catégorie.':'Vous n\'avez pas encore soumis de demande.'}</p>
          <button onClick={()=>navigate('/dashboard/employee/new-request')} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'11px 22px', borderRadius:'10px', background:T.blue, color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontSize:'14px', fontFamily:font, boxShadow:`0 4px 14px ${T.blue}40` }}>
            <IPlus/> Faire une demande
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {sorted.map(wf => {
            const overdue = wf.dueDate&&new Date(wf.dueDate)<new Date()&&wf.status==='active';
            const lColor  = wf.status==='completed'?T.green:wf.status==='rejected'?T.red:overdue?T.red:T.blue;
            return (
              <div key={wf._id} onClick={()=>navigate('/dashboard/employee/requests/'+wf._id)}
                style={{ ...card, padding:'18px 22px', borderLeft:`4px solid ${lColor}`, cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.boxShadow=`0 4px 18px ${T.blue}18`; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 1px 6px rgba(15,23,42,0.06)'; e.currentTarget.style.transform='none'; }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                      <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:T.slate, fontFamily:font }}>{wf.name}</h3>
                      {wf.docNumber&&<span style={{ background:'#E0E7FF', color:T.blue, padding:'3px 9px', borderRadius:'6px', fontSize:'12px', fontWeight:800, fontFamily:'monospace', border:'1px solid #C7D2FE' }}>{wf.docNumber}</span>}
                    </div>
                    {wf.dueDate&&<span style={{ fontSize:'12px', color:overdue?T.red:T.slateM, display:'inline-flex', alignItems:'center', gap:'4px' }}><IClock/> {new Date(wf.dueDate).toLocaleDateString('fr-FR')}{overdue&&' · En retard'}</span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                    <StatusBadge status={wf.status}/>
                    <span style={{ color:T.slateL }}><IArrowR/></span>
                  </div>
                </div>
                {/* Info band */}
                {wf.status==='active'&&wf.steps?.[wf.currentStep]&&(
                  <div style={{ background:T.blueSoft, borderRadius:'8px', padding:'9px 14px', marginBottom:'12px', border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', gap:'8px' }}>
                    <IClock/>
                    <div>
                      <p style={{ margin:0, fontSize:'12px', color:'#1D4ED8', fontWeight:700 }}>En attente de : {wf.steps[wf.currentStep].assignedPostName||wf.steps[wf.currentStep].assignedPost||'Responsable'}</p>
                      <p style={{ margin:'1px 0 0', fontSize:'11px', color:T.slateM }}>Étape {wf.currentStep+1} / {wf.steps.length} · {wf.steps[wf.currentStep].name}</p>
                    </div>
                  </div>
                )}
                {wf.status==='rejected'&&wf.history?.length>0&&(()=>{const r=[...wf.history].reverse().find(h=>h.action?.includes('rejected'));return r?(<div style={{ background:T.redSoft, borderRadius:'8px', padding:'9px 14px', marginBottom:'12px', border:`1.5px solid ${T.redBorder}`, display:'flex', alignItems:'center', gap:'8px' }}><IAlert/><div><p style={{ margin:0, fontSize:'12px', color:T.red, fontWeight:700 }}>Demande refusée</p>{r.comment&&<p style={{ margin:'1px 0 0', fontSize:'11px', color:T.slateM }}>Motif : {r.comment}</p>}</div></div>):null;})()}
                {wf.status==='completed'&&(<div style={{ background:T.greenSoft, borderRadius:'8px', padding:'9px 14px', marginBottom:'12px', border:`1.5px solid ${T.greenBorder}`, display:'flex', alignItems:'center', gap:'8px', color:T.green }}><ICheck/><p style={{ margin:0, fontSize:'12px', fontWeight:700 }}>Demande approuvée</p></div>)}
                <StepsProgress steps={wf.steps}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── TasksSection ──────────────────────────────────────────────────────────
const TasksSection = ({ tasks, loading, onComplete, onReject, saving, formValues, setFormValues, checklists, setChecklists, comments, setComments, fileRefs, onUpload, uploading, msg }) => {
  const renderField = (field, wfId, task) => {
    const value    = formValues[wfId]?.[field.id]??'';
    const base     = { width:'100%', padding:'9px 12px', borderRadius:'9px', border:`1.5px solid ${T.border}`, fontSize:'14px', boxSizing:'border-box', fontFamily:font, outline:'none', color:T.slate };
    const lbl      = <label style={{ display:'block', fontWeight:700, fontSize:'11px', color:T.slateM, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{field.label}{field.required&&<span style={{ color:T.red, marginLeft:'3px' }}>*</span>}</label>;
    const onChange = val=>setFormValues(p=>({...p,[wfId]:{...p[wfId],[field.id]:val}}));
    if (field.type==='signature') return <div key={field.id} style={{ marginBottom:'14px' }}>{lbl}<SignatureCanvas value={value} onChange={onChange}/></div>;
    if (field.type==='select')   return <div key={field.id} style={{ marginBottom:'14px' }}>{lbl}<select value={value} onChange={e=>onChange(e.target.value)} style={{ ...base, cursor:'pointer' }}><option value="">— Choisir —</option>{(field.options||[]).map((o,i)=><option key={i} value={o}>{o}</option>)}</select></div>;
    if (field.type==='textarea') return <div key={field.id} style={{ marginBottom:'14px' }}>{lbl}<textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{ ...base, resize:'vertical' }}/></div>;
    if (field.type==='checkbox') return <div key={field.id} style={{ marginBottom:'14px' }}><label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}><input type="checkbox" checked={value===true||value==='true'} onChange={e=>onChange(e.target.checked)} style={{ width:'16px', height:'16px', accentColor:T.blue }}/><span style={{ fontWeight:600, fontSize:'13px', color:T.slate }}>{field.label}{field.required&&<span style={{ color:T.red }}> *</span>}</span></label></div>;
    if (field.type==='table') {
      const rows=Array.isArray(value)?value:[]; const extraCols=field.extraColumns||[]; const extraColIds=new Set(extraCols.map(c=>c.id));
      const step0TableField=(task?.step0Fields||[]).find(f0=>f0.type==='table');
      const inheritedCols=(step0TableField?.columns||[]).filter(c=>!extraColIds.has(c.id));
      const allCols=[...inheritedCols,...extraCols];
      if (allCols.length===0) return <div key={field.id} style={{ marginBottom:'14px' }}>{lbl}<p style={{ color:T.slateM,fontSize:'13px' }}>Aucune colonne configurée.</p></div>;
      const gridCols=allCols.map(c=>c.type==='number'?'120px':'1fr').join(' ');
      return (
        <div key={field.id} style={{ marginBottom:'20px', gridColumn:'1 / -1' }}>
          {lbl}
          <div style={{ border:`1.5px solid #BAE6FD`, borderRadius:'10px', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:gridCols, gap:'8px', padding:'8px 12px', background:'#E0F2FE' }}>
              {inheritedCols.map(c=><span key={c.id} style={{ fontSize:'11px', fontWeight:700, color:'#0369A1', textTransform:'uppercase' }}>{c.label} 🔒</span>)}
              {extraCols.map(c=><span key={c.id} style={{ fontSize:'11px', fontWeight:700, color:T.blue, textTransform:'uppercase' }}>{c.label} ✎</span>)}
            </div>
            {rows.length===0?<div style={{ padding:'12px', color:T.slateM, fontSize:'13px', textAlign:'center', background:'#fff' }}>Aucune donnée propagée.</div>:rows.map((row,ri)=>(
              <div key={ri} style={{ display:'grid', gridTemplateColumns:gridCols, gap:'8px', padding:'8px 12px', background:ri%2===0?'#fff':'#F8FAFC', alignItems:'center', borderTop:`1px solid #BAE6FD` }}>
                {inheritedCols.map(c=><span key={c.id} style={{ fontSize:'13px', color:T.slate }}>{row[c.id]??'—'}</span>)}
                {extraCols.map(c=><input key={c.id} type={c.type==='number'?'number':'text'} min={c.type==='number'?'0':undefined} value={row[c.id]??''} placeholder={c.label} onChange={e=>{ const newRows=rows.map((r,i)=>i===ri?{...r,[c.id]:c.type==='number'?(e.target.value===''?'':parseFloat(e.target.value)):e.target.value}:r); onChange(newRows); }} style={{ ...base, padding:'6px 10px', border:`1.5px solid ${T.blue}40`, background:'#F0F9FF' }}/>)}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return <div key={field.id} style={{ marginBottom:'14px' }}>{lbl}<input type={field.type==='date'?'date':field.type==='number'?'number':'text'} value={value} onChange={e=>onChange(e.target.value)} placeholder={field.label} style={base}/></div>;
  };

  if (!loading&&tasks.length===0) return (
    <div style={{ ...card, padding:'56px 40px', textAlign:'center' }}>
      <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:T.greenSoft, border:`1.5px solid ${T.greenBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:T.green }}><ITask/></div>
      <h3 style={{ margin:'0 0 6px', color:T.slate, fontFamily:font, fontWeight:800 }}>Tout est traité !</h3>
      <p style={{ margin:0, color:T.slateM, fontSize:'14px' }}>Aucune tâche en attente de validation.</p>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
      {msg&&(()=>{ const ok=msg.startsWith('SUCCESS'),warn=msg.startsWith('WARN'); return <div style={{ padding:'12px 16px', borderRadius:'10px', fontWeight:600, background:ok?T.greenSoft:warn?T.amberSoft:T.redSoft, color:ok?T.green:warn?T.amber:T.red, fontSize:'14px', border:`1.5px solid ${ok?T.greenBorder:warn?T.amberBorder:T.redBorder}`, display:'flex', alignItems:'center', gap:'8px' }}>{ok?<ICheck/>:warn?<IAlert/>:<IAlert/>}{msg.replace(/^(SUCCESS|WARN|ERREUR)\s?/,'')}</div>; })()}
      {tasks.map(task => {
        const wfId=task.workflowId, step=task.step, checks=checklists[wfId]||[];
        const hasForm=step.form?.fields?.length>0, hasCheck=checks.length>0, isSaving=saving===wfId;
        const isUrgent=task.dueDate&&new Date(task.dueDate)<new Date(Date.now()+24*3600*1000);
        return (
          <div key={wfId} style={{ ...card, padding:'0', border:`2px solid ${isUrgent?T.red:T.blue}`, overflow:'hidden' }}>
            {/* Task header */}
            <div style={{ padding:'18px 24px', background:isUrgent?T.redSoft:T.blueSoft, borderBottom:`1.5px solid ${isUrgent?T.redBorder:T.blueBorder}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap' }}>
                  {isUrgent&&<span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:T.red, color:'#fff', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700 }}><IAlert/> URGENT</span>}
                  {task.docNumber&&<span style={{ background:'#E0E7FF', color:T.blue, padding:'3px 10px', borderRadius:'6px', fontSize:'12px', fontWeight:800, fontFamily:'monospace', border:'1px solid #C7D2FE' }}>{task.docNumber}</span>}
                </div>
                <h2 style={{ margin:'0 0 4px', fontSize:'17px', fontWeight:800, color:T.slate, fontFamily:font }}>{task.workflowName}</h2>
                <p style={{ margin:'0 0 2px', fontSize:'13px', color:isUrgent?T.red:T.blue, fontWeight:600 }}>Étape {task.stepIndex+1} : {step.name}</p>
                {step.description&&<p style={{ margin:0, fontSize:'12px', color:T.slateL }}>{step.description}</p>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:T.blueSoft, color:'#1D4ED8', padding:'4px 11px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${T.blueBorder}` }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#3B82F6' }}/>En attente
                </span>
                {task.dueDate&&<span style={{ fontSize:'11px', color:isUrgent?T.red:T.slateM, fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}><IClock/> {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>}
              </div>
            </div>

            <div style={{ padding:'20px 24px' }}>
              {/* Step0 data */}
              {task.step0Fields?.filter(f=>f.data!==null&&f.data!==undefined&&f.data!=='').length>0&&(
                <div style={{ background:'#F0F9FF', borderRadius:'10px', padding:'14px 18px', marginBottom:'16px', border:'1.5px solid #BAE6FD' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                    <IUser/><p style={{ margin:0, fontSize:'11px', fontWeight:800, color:'#0369A1', textTransform:'uppercase', letterSpacing:'0.06em' }}>Données soumises par l'employé</p>
                  </div>
                  {task.step0Fields.filter(f=>f.data!==null&&f.data!==undefined&&f.data!=='').map(f => {
                    if (f.type==='table'&&Array.isArray(f.data)&&f.data.length>0) {
                      const cols=f.columns||[];
                      return (<div key={f.id} style={{ marginBottom:'10px' }}><p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:700, color:'#374151' }}>{f.label}</p><div style={{ border:'1.5px solid #BAE6FD', borderRadius:'8px', overflow:'hidden' }}><div style={{ display:'grid', gridTemplateColumns:cols.map(()=>'1fr').join(' '), gap:'8px', padding:'6px 10px', background:'#E0F2FE' }}>{cols.map(c=><span key={c.id} style={{ fontSize:'11px', fontWeight:700, color:'#0369A1' }}>{c.label}</span>)}</div>{f.data.map((row,i)=><div key={i} style={{ display:'grid', gridTemplateColumns:cols.map(()=>'1fr').join(' '), gap:'8px', padding:'8px 10px', background:i%2===0?'#fff':'#F8FAFC' }}>{cols.map(c=><span key={c.id} style={{ fontSize:'13px', color:T.slate }}>{row[c.id]??'—'}</span>)}</div>)}</div></div>);
                    }
                    return (<div key={f.id} style={{ display:'flex', gap:'8px', marginBottom:'5px', alignItems:'flex-start' }}><span style={{ fontSize:'12px', fontWeight:700, color:T.slateM, minWidth:'130px', flexShrink:0 }}>{f.label} :</span><span style={{ fontSize:'13px', color:T.slate }}>{typeof f.data==='boolean'?(f.data?'✓ Oui':'✗ Non'):String(f.data)}</span></div>);
                  })}
                </div>
              )}

              {/* History */}
              {task.history?.length>0&&(
                <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'14px 18px', marginBottom:'16px', border:`1.5px solid ${T.border}` }}>
                  <p style={{ margin:'0 0 10px', fontSize:'11px', fontWeight:800, color:T.slateM, textTransform:'uppercase', letterSpacing:'0.06em' }}>Historique</p>
                  {task.history.map((h,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:i<task.history.length-1?'8px':0 }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:h.action?.includes('completed')?T.green:h.action?.includes('rejected')?T.red:T.blue, flexShrink:0, marginTop:'5px' }}/>
                      <div>
                        <span style={{ fontSize:'12px', color:'#374151', fontWeight:700 }}>{h.byName}</span>
                        <span style={{ fontSize:'12px', color:T.slateM, marginLeft:'6px' }}>{h.action==='workflow_started'?'a démarré':h.action?.includes('completed')?'a validé':h.action?.includes('rejected')?'a rejeté':h.action}</span>
                        {h.stepName&&<span style={{ fontSize:'12px', color:T.slateL }}> — {h.stepName}</span>}
                        {h.comment&&<p style={{ margin:'2px 0 0', fontSize:'11px', color:T.slateM, fontStyle:'italic' }}>"{h.comment}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form */}
              {hasForm&&(
                <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'18px', marginBottom:'16px', border:`1.5px solid ${T.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                    <span style={{ background:T.blue, color:'#fff', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', fontWeight:800, letterSpacing:'0.05em' }}>FORMULAIRE</span>
                    <span style={{ fontSize:'13px', fontWeight:600, color:T.slate }}>Remplissez les champs requis</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0 20px' }}>
                    {step.form.fields.map(field=>renderField(field,wfId,task))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {hasCheck&&(
                <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'18px', marginBottom:'16px', border:`1.5px solid ${T.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                    <span style={{ background:'#7C3AED', color:'#fff', padding:'3px 9px', borderRadius:'6px', fontSize:'11px', fontWeight:800, letterSpacing:'0.05em' }}>CHECKLIST</span>
                    <span style={{ fontSize:'13px', fontWeight:600, color:T.slate }}>{checks.filter(i=>i.checked).length}/{checks.length} éléments</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {checks.map((item,i)=>(
                      <div key={item.id||i} onClick={()=>setChecklists(prev=>{const u=[...(prev[wfId]||[])];u[i]={...u[i],checked:!u[i].checked};return{...prev,[wfId]:u};})}
                        style={{ display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', padding:'10px 14px', borderRadius:'9px', background:item.checked?T.greenSoft:'#fff', border:`1.5px solid ${item.checked?T.greenBorder:T.border}`, userSelect:'none', transition:'all .15s' }}>
                        <div style={{ width:'20px', height:'20px', borderRadius:'6px', border:`2px solid ${item.checked?T.green:'#D1D5DB'}`, background:item.checked?T.green:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'#fff' }}>
                          {item.checked&&<ICheck/>}
                        </div>
                        <span style={{ fontSize:'14px', fontWeight:600, color:item.checked?'#166534':'#374151', textDecoration:item.checked?'line-through':'none', flex:1 }}>{item.label}</span>
                        {item.required&&<span style={{ fontSize:'11px', color:item.checked?T.green:T.red, fontWeight:700 }}>{item.checked?'OK':'REQUIS'}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload */}
              <div onClick={()=>fileRefs.current[wfId]?.click()} style={{ background:'#F8FAFC', borderRadius:'10px', border:`2px dashed ${T.border}`, padding:'14px', textAlign:'center', marginBottom:'16px', cursor:'pointer', transition:'all .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blue;e.currentTarget.style.background=T.blueSoft;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background='#F8FAFC';}}>
                <input type="file" ref={el=>{fileRefs.current[wfId]=el;}} onChange={e=>onUpload(e,task)} style={{ display:'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"/>
                {uploading===wfId
                  ?<p style={{ margin:0,color:T.blue,fontWeight:600,fontSize:'13px',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px' }}><ILoader/>Upload en cours…</p>
                  :<p style={{ margin:0,color:T.slateM,fontWeight:600,fontSize:'13px',display:'flex',alignItems:'center',justifyContent:'center',gap:'7px' }}><IAttach/>Joindre un document</p>
                }
              </div>

              {/* Comment */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontWeight:700, color:T.slate, marginBottom:'7px', fontSize:'12px', fontFamily:font, textTransform:'uppercase', letterSpacing:'0.06em' }}>Commentaire <span style={{ color:T.slateL, fontWeight:400, textTransform:'none', fontSize:'11px' }}>(obligatoire pour rejeter)</span></label>
                <textarea value={comments[wfId]||''} onChange={e=>setComments(prev=>({...prev,[wfId]:e.target.value}))} rows={2} placeholder="Votre commentaire…"
                  style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px', border:`1.5px solid ${T.border}`, fontSize:'14px', resize:'vertical', fontFamily:font, outline:'none', color:T.slate }}/>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:'12px' }}>
                {step.claims?.canValidate!==false&&(
                  <button onClick={()=>onComplete(task)} disabled={!!saving} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', borderRadius:'10px', background:isSaving?'#E2E8F0':T.green, color:isSaving?'#94A3B8':'#fff', border:'none', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:'14px', fontFamily:font, boxShadow:isSaving?'none':`0 4px 14px ${T.green}40` }}>
                    {isSaving?<><ILoader/>En cours…</>:<><ICheck/>Valider l'étape</>}
                  </button>
                )}
                {step.claims?.canReject!==false&&(
                  <button onClick={()=>onReject(task)} disabled={!!saving} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'13px 24px', borderRadius:'10px', background:T.redSoft, color:T.red, border:`1.5px solid ${T.redBorder}`, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:'14px', fontFamily:font }}>
                    <IX/>Rejeter
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

// ── EmployeeDashboard ─────────────────────────────────────────────────────
const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab,       setActiveTab]      = useState('requests');
  const [tasks,           setTasks]          = useState([]);
  const [myRequests,      setMyRequests]     = useState([]);
  const [loading,         setLoading]        = useState(true);
  const [loadingRequests, setLoadingRequests]= useState(false);
  const [saving,          setSaving]         = useState(null);
  const [msg,             setMsg]            = useState('');
  const [formValues,      setFormValues]     = useState({});
  const [checklists,      setChecklists]     = useState({});
  const [comments,        setComments]       = useState({});
  const [uploading,       setUploading]      = useState(null);
  const fileRefs = useRef({});
  const showMsg = text => { setMsg(text); setTimeout(()=>setMsg(''),6000); };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try { const res=await workflowService.getMyRequests?.(); if(res?.data?.workflows)setMyRequests(res.data.workflows); }
    catch{setMyRequests([]);} finally{setLoadingRequests(false);}
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const tasksRes=await workflowService.getMyTasks();
      const fetchedTasks=tasksRes.data?.tasks||[];
      const enriched=await Promise.all(fetchedTasks.map(async task=>{
        try {
          const wfRes=await workflowService.getById(task.workflowId);
          const wf=wfRes?.data?.workflow; if(!wf)return task;
          const step0FormFields=wf.steps?.[0]?.form?.fields||[], step0FormData=wf.steps?.[0]?.formData||{};
          const step0Fields=step0FormFields.map(f=>({...f,data:step0FormData[f.id]!==undefined?step0FormData[f.id]:(f.data??null)}));
          return {...task,step0Fields,docNumber:wf.docNumber||task.docNumber};
        } catch{return task;}
      }));
      setTasks(enriched);
      if(enriched.length>0)setActiveTab('tasks');
      const initForms={},initChecks={},initComments={};
      enriched.forEach(t=>{
        const key=t.workflowId; initForms[key]={}; initComments[key]='';
        const step0TableField=(t.step0Fields||[]).find(f0=>f0.type==='table');
        const step0Rows=Array.isArray(step0TableField?.data)?step0TableField.data:[];
        (t.step.form?.fields||[]).forEach(f=>{
          if(f.type==='table'){
            const extraCols=f.extraColumns||[], extraColIds=extraCols.map(c=>c.id), propagated=Array.isArray(f.data)?f.data:[];
            let merged;
            if(step0Rows.length>0){merged=step0Rows.map((baseRow,i)=>{const extraData=propagated[i]||{},filtered={};extraColIds.forEach(id=>{filtered[id]=extraData[id]??'';});return{...baseRow,...filtered};});}
            else{merged=propagated;}
            initForms[key][f.id]=merged;
          } else{initForms[key][f.id]=f.data??f.value??'';}
        });
        initChecks[key]=(t.step.checklist||[]).map(item=>({...item}));
      });
      setFormValues(initForms);setChecklists(initChecks);setComments(initComments);
      fetchMyRequests();
    } catch(err){showMsg('ERREUR '+(err.response?.data?.message||err.message));}
    finally{setLoading(false);}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user]);

  useEffect(()=>{fetchAll();},[fetchAll]);

  const handleComplete = async task=>{
    const wfId=task.workflowId,step=task.step,fVals=formValues[wfId]||{},checks=checklists[wfId]||[];
    const missing=(step.form?.fields||[]).filter(f=>f.required&&!fVals[f.id]);
    if(missing.length>0){showMsg('ERREUR Champs obligatoires manquants : '+missing.map(f=>f.label).join(', '));return;}
    const missingChecks=checks.filter(i=>i.required&&!i.checked);
    if(missingChecks.length>0){showMsg('ERREUR Checklist incomplète : '+missingChecks.map(i=>i.label).join(', '));return;}
    setSaving(wfId);
    try{await workflowService.completeStep(wfId,{comment:comments[wfId]||'',formData:fVals,checklistData:checks});showMsg('SUCCESS Étape validée avec succès !');fetchAll();}
    catch(err){showMsg('ERREUR '+(err.response?.data?.message||err.message));}finally{setSaving(null);}
  };
  const handleReject = async task=>{
    const wfId=task.workflowId;
    if(!comments[wfId]?.trim()){showMsg('ERREUR Un commentaire est requis pour rejeter');return;}
    setSaving(wfId+'_reject');
    try{await workflowService.rejectStep(wfId,{comment:comments[wfId]});showMsg('WARN Étape rejetée');fetchAll();}
    catch(err){showMsg('ERREUR '+(err.response?.data?.message||err.message));}finally{setSaving(null);}
  };
  const handleUpload = async(e,task)=>{
    const file=e.target.files[0]; if(!file)return;
    const wfId=task.workflowId; setUploading(wfId);
    try{const fd=new FormData();fd.append('file',file);fd.append('workflowId',wfId);fd.append('stepIndex',String(task.stepIndex));await workflowService.uploadDocument(fd);showMsg('SUCCESS Document joint !');}
    catch(err){showMsg('ERREUR upload : '+(err.response?.data?.message||err.message));}finally{setUploading(null);e.target.value='';}
  };

  const taskProps={tasks,loading,onComplete:handleComplete,onReject:handleReject,saving,formValues,setFormValues,checklists,setChecklists,comments,setComments,fileRefs,onUpload:handleUpload,uploading,msg};

  if(loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:T.bg, fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:'48px', height:'48px', border:`3px solid ${T.border}`, borderTop:`3px solid ${T.blue}`, borderRadius:'50%', margin:'0 auto 16px', animation:'spin 0.8s linear infinite' }}/>
        <p style={{ color:T.slateM, fontWeight:600, fontSize:'15px' }}>Chargement de votre espace…</p>
      </div>
    </div>
  );

  const TABS = [
    { key:'requests', label:'Mes demandes',     icon:<IClipboard/>, count:myRequests.length, ac:T.blue },
    { key:'tasks',    label:'Tâches à valider', icon:<ITask/>,      count:tasks.length,      ac:tasks.length>0?T.green:T.slateM },
  ];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .emp-tab:hover{opacity:0.85}`}</style>
      <Navbar user={user} logout={logout}/>
      <div style={{ maxWidth:'980px', margin:'0 auto', padding:'32px 24px 60px' }}>

        {/* Page header */}
        <div style={{ marginBottom:'28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ margin:'0 0 5px', fontSize:'24px', fontWeight:900, color:T.slate, display:'flex', alignItems:'center', gap:'10px' }}>
              Bonjour, {user?.firstName}
              <span style={{ width:'34px', height:'34px', borderRadius:'10px', background:'#FEF3C7', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
                </svg>
              </span>
            </h1>
            <p style={{ margin:0, color:T.slateM, fontSize:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
              <IUser/> {user?.jobTitle||'Employé'}
              {tasks.length>0&&<span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:T.amberSoft, color:T.amber, padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:700, border:`1px solid ${T.amberBorder}` }}><IClock/>{tasks.length} tâche{tasks.length>1?'s':''} en attente</span>}
            </p>
          </div>
          <button onClick={()=>navigate('/dashboard/employee/new-request')} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'11px 22px', borderRadius:'10px', background:T.blue, color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', fontFamily:font, boxShadow:`0 4px 14px ${T.blue}40`, transition:'all .15s' }}>
            <IPlus/> Nouvelle demande
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', marginBottom:'24px', background:T.surface, padding:'4px', borderRadius:'12px', border:`1.5px solid ${T.border}`, width:'fit-content' }}>
          {TABS.map(tab=>(
            <button key={tab.key} className="emp-tab" onClick={()=>setActiveTab(tab.key)}
              style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'14px', fontFamily:font, transition:'all .15s', background:activeTab===tab.key?(tab.key==='tasks'&&tasks.length>0?T.greenSoft:T.blueSoft):'transparent', color:activeTab===tab.key?tab.ac:T.slateM, boxShadow:activeTab===tab.key?`0 1px 6px ${tab.ac}25`:'none' }}>
              <span style={{color:activeTab===tab.key?tab.ac:'#94A3B8'}}>{tab.icon}</span>
              {tab.label}
              {tab.count>0&&<span style={{ background:tab.ac, color:'#fff', padding:'1px 8px', borderRadius:'10px', fontSize:'11px', fontWeight:800 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {activeTab==='requests'&&<RequesterSection myRequests={myRequests} loadingRequests={loadingRequests} navigate={navigate}/>}
        {activeTab==='tasks'&&<TasksSection {...taskProps}/>}
      </div>
    </div>
  );
};

export default EmployeeDashboard;