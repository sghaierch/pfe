import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import projectService from '../../../services/projectService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconFolder  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconFolder2 = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconArchive = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const IconTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconEye     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconPlus    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconX       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconCalendar= () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconWarn    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const B = '#2563EB';

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active:    { label: 'Actif',    bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E', border: '#BBF7D0' },
  archived:  { label: 'Archivé', bg: '#F8FAFC', color: '#64748B', dot: '#94A3B8', border: '#E2E8F0' },
  completed: { label: 'Terminé', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', border: '#BFDBFE' },
};

const COLORS = ['#2563EB','#7C3AED','#059669','#DC2626','#D97706','#0891B2','#DB2777','#EA580C'];

// ── StatusBadge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.active;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:s.bg, color:s.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${s.border}` }}>
      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:s.dot }}/>
      {s.label}
    </span>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, children, width = '480px' }) => {
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(5px)' }}>
      <div style={{ background:'#fff', borderRadius:'20px', padding:'36px', width, maxWidth:'95vw', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', animation:'fadeUp 0.18s ease', fontFamily:"'Inter',-apple-system,sans-serif" }}>
        {children}
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const ProjectsList = () => {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [search,      setSearch]      = useState('');
  const [filterStatus,setFilterStatus]= useState('all');

  const [showCreate,  setShowCreate]  = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [showDelete,  setShowDelete]  = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [selected,    setSelected]    = useState(null);

  const EMPTY = { name:'', description:'', color: B };
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data?.projects || []);
    } catch (err) { showMsg(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(''), 3500);
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await projectService.create(form);
      showMsg('Projet créé avec succès');
      setShowCreate(false); setForm(EMPTY); fetchProjects();
    } catch (err) { showMsg(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const openEdit = (p) => { setSelected(p); setForm({ name:p.name, description:p.description||'', color:p.color||B }); setShowEdit(true); };
  const handleEdit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await projectService.update(selected._id, form);
      showMsg('Projet modifié'); setShowEdit(false); fetchProjects();
    } catch (err) { showMsg(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const openArchive = (p) => { setSelected(p); setShowArchive(true); };
  const handleArchive = async () => {
    setSaving(true);
    try {
      await projectService.update(selected._id, { status:'archived' });
      showMsg('Projet archivé'); setShowArchive(false); fetchProjects();
    } catch (err) { showMsg(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const openDelete = (p) => { setSelected(p); setShowDelete(true); };
  const handleDelete = async () => {
    setSaving(true);
    try {
      await projectService.delete(selected._id);
      showMsg('Projet supprimé'); setShowDelete(false); fetchProjects();
    } catch (err) { showMsg(err.message, 'error'); }
    finally { setSaving(false); }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter(p => {
      const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [projects, search, filterStatus]);

  const counts = useMemo(() => ({
    all:       projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived:  projects.filter(p => p.status === 'archived').length,
  }), [projects]);

  // ── Shared input/btn styles ────────────────────────────────────────────────
  const inpStyle = {
    width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px',
    border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A',
    outline:'none', fontFamily:"'Inter',sans-serif", transition:'border-color 0.15s, box-shadow 0.15s',
  };
  const onFocus = e => { e.target.style.borderColor=B; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; };
  const onBlur  = e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; };

  // ── ProjectForm ────────────────────────────────────────────────────────────
  const ProjectForm = () => (
    <div>
      <div style={{marginBottom:'18px'}}>
        <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Nom du projet *</label>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex : Construction Tour A" autoFocus style={inpStyle} onFocus={onFocus} onBlur={onBlur}/>
      </div>
      <div style={{marginBottom:'18px'}}>
        <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'7px' }}>Description</label>
        <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description du projet…" rows="3" style={{...inpStyle,resize:'vertical'}} onFocus={onFocus} onBlur={onBlur}/>
      </div>
      <div style={{marginBottom:'6px'}}>
        <label style={{ display:'block', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'10px' }}>Couleur</label>
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
          {COLORS.map(color => (
            <div key={color} onClick={()=>setForm({...form,color})} style={{ width:'32px', height:'32px', borderRadius:'8px', background:color, cursor:'pointer', border: form.color===color ? '3px solid #0F172A' : '3px solid transparent', boxShadow: form.color===color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none', transition:'all 0.15s' }}/>
          ))}
        </div>
      </div>
    </div>
  );

  const BtnPrimary = ({ onClick, disabled, color=B, shadow, children }) => (
    <button onClick={onClick} disabled={disabled} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'11px 22px', borderRadius:'10px', background:color, color:'#fff', border:'none', cursor:disabled?'not-allowed':'pointer', fontWeight:700, fontSize:'14px', opacity:disabled?0.7:1, boxShadow:shadow||`0 4px 14px ${color}55`, fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
      {children}
    </button>
  );
  const BtnSecondary = ({ onClick, children }) => (
    <button onClick={onClick} style={{ padding:'11px 20px', borderRadius:'10px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'14px', color:'#475569', fontFamily:"'Inter',sans-serif" }}>
      {children}
    </button>
  );

  const isSuccess = msg && msg.type !== 'error';

  return (
    <div style={{ padding:'32px', minHeight:'100vh', background:'#F8FAFC', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes slideIn{ from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .proj-card { animation: fadeUp 0.22s ease both; transition: all 0.22s ease; }
        .proj-card:hover { transform: translateY(-4px) !important; box-shadow: 0 14px 36px rgba(0,0,0,0.1) !important; }
        .proj-action-btn { transition: all 0.15s; }
        .proj-action-btn:hover { opacity: 0.85; transform: scale(1.06); }
        .filter-tab:hover { background: #F1F5F9 !important; }
      `}</style>

      {/* ── Toast ── */}
      {msg && (
        <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:9999, padding:'13px 18px', borderRadius:'12px', fontWeight:600, fontSize:'14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', animation:'slideIn 0.25s ease', display:'flex', alignItems:'center', gap:'9px', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
          {isSuccess ? <IconCheck/> : <IconAlert/>} {msg.text}
        </div>
      )}

      {/* ── Page header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px', flexWrap:'wrap', gap:'16px' }}>
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:900, color:'#0F172A', margin:0, letterSpacing:'-0.5px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${B}15`, border:`1.5px solid ${B}25`, display:'inline-flex', alignItems:'center', justifyContent:'center', color:B }}>
              <IconFolder/>
            </span>
            Mes Projets
          </h1>
          <p style={{ color:'#94A3B8', margin:'5px 0 0', fontSize:'14px' }}>
            <strong style={{color:'#0F172A'}}>{projects.length}</strong> projet(s) au total
          </p>
        </div>
        <BtnPrimary onClick={()=>{ setForm(EMPTY); setShowCreate(true); }}>
          <IconPlus/> Nouveau projet
        </BtnPrimary>
      </div>

      {/* ── Toolbar: filter tabs + search ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', marginBottom:'24px', flexWrap:'wrap' }}>
        {/* Filter tabs */}
        <div style={{ display:'flex', gap:'4px', padding:'4px', background:'#F1F5F9', borderRadius:'12px' }}>
          {[
            { key:'all',       label:'Tous',     count: counts.all },
            { key:'active',    label:'Actifs',   count: counts.active },
            { key:'completed', label:'Terminés', count: counts.completed },
            { key:'archived',  label:'Archivés', count: counts.archived },
          ].map(({ key, label, count }) => {
            const active = filterStatus === key;
            return (
              <button key={key} className="filter-tab" onClick={()=>setFilterStatus(key)}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight:active?700:500, fontSize:'13px', background:active?'#fff':'transparent', color:active?'#0F172A':'#64748B', boxShadow:active?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                {label}
                <span style={{ padding:'1px 7px', borderRadius:'10px', fontSize:'11px', fontWeight:700, background:active?B:'#E2E8F0', color:active?'#fff':'#64748B', transition:'all 0.15s' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position:'relative', minWidth:'280px' }}>
          <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}>
            <IconSearch/>
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un projet…"
            style={{ width:'100%', boxSizing:'border-box', padding:'9px 36px 9px 38px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
            onFocus={onFocus} onBlur={onBlur}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
              <IconX/>
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'80px', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px' }}>
          <IconLoader/> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 40px', background:'#fff', borderRadius:'20px', border:'1.5px solid #E2E8F0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'#EFF6FF', border:`1.5px solid ${B}25`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:B }}>
            <IconFolder2/>
          </div>
          {search || filterStatus !== 'all'
            ? <><h3 style={{color:'#0F172A',fontWeight:800,margin:'0 0 8px'}}>Aucun résultat</h3><p style={{color:'#64748B',marginBottom:'24px'}}>Essayez d'autres termes ou filtres.</p><button onClick={()=>{setSearch('');setFilterStatus('all')}} style={{padding:'9px 20px',borderRadius:'9px',border:`1.5px solid ${B}`,color:B,background:'#fff',cursor:'pointer',fontWeight:600,fontFamily:"'Inter',sans-serif"}}>Réinitialiser les filtres</button></>
            : <><h3 style={{color:'#0F172A',fontWeight:800,margin:'0 0 8px'}}>Aucun projet</h3><p style={{color:'#64748B',marginBottom:'24px'}}>Créez votre premier projet pour commencer.</p><BtnPrimary onClick={()=>{ setForm(EMPTY); setShowCreate(true); }}><IconPlus/> Créer un projet</BtnPrimary></>
          }
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:'18px' }}>
            {filtered.map((project, i) => (
              <div key={project._id} className="proj-card"
                style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #F1F5F9', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', animationDelay:`${i*0.04}s` }}>
                {/* Color top bar */}
                <div style={{ height:'4px', background:`linear-gradient(90deg, ${project.color||B}, ${project.color||B}99)` }}/>

                <div style={{ padding:'22px', flex:1, display:'flex', flexDirection:'column' }}>
                  {/* Header row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${project.color||B}15`, border:`1.5px solid ${project.color||B}25`, display:'flex', alignItems:'center', justifyContent:'center', color:project.color||B }}>
                      <IconFolder2/>
                    </div>
                    <StatusBadge status={project.status}/>
                  </div>

                  {/* Name + description */}
                  <h3 style={{ margin:'0 0 6px', fontSize:'16px', fontWeight:800, color:'#0F172A', letterSpacing:'-0.2px' }}>
                    {project.name}
                  </h3>
                  <p style={{ margin:'0 0 16px', color:'#94A3B8', fontSize:'13px', lineHeight:1.6, flex:1 }}>
                    {project.description || 'Aucune description'}
                  </p>

                  {/* Date */}
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color:'#CBD5E1', marginBottom:'18px' }}>
                    <IconCalendar/> Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'7px', borderTop:'1px solid #F1F5F9', paddingTop:'16px', alignItems:'center' }}>
                    {/* Voir — primary */}
                    <button className="proj-action-btn" onClick={()=>navigate(`/dashboard/company/projects/${project._id}`)}
                      style={{ flex:1, padding:'9px', borderRadius:'9px', background:`${project.color||B}`, color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:`0 3px 10px ${project.color||B}40` }}>
                      <IconEye/> Voir
                    </button>
                    {/* Edit */}
                    <button className="proj-action-btn" onClick={()=>openEdit(project)} title="Modifier"
                      style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#EFF6FF', color:B, border:`1.5px solid #BFDBFE`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <IconEdit/>
                    </button>
                    {/* Archive */}
                    {project.status !== 'archived' && (
                      <button className="proj-action-btn" onClick={()=>openArchive(project)} title="Archiver"
                        style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#FFFBEB', color:'#D97706', border:'1.5px solid #FDE68A', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <IconArchive/>
                      </button>
                    )}
                    {/* Delete */}
                    <button className="proj-action-btn" onClick={()=>openDelete(project)} title="Supprimer"
                      style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <IconTrash/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'right', marginTop:'14px', fontSize:'12px', color:'#94A3B8' }}>
            <strong style={{color:'#0F172A'}}>{filtered.length}</strong> projet(s) affiché(s) sur {projects.length}
          </p>
        </>
      )}

      {/* ── MODAL Créer ── */}
      <Modal open={showCreate} onClose={()=>setShowCreate(false)}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#EFF6FF', border:`1.5px solid #BFDBFE`, display:'flex', alignItems:'center', justifyContent:'center', color:B }}><IconFolder2/></div>
          <h2 style={{ margin:0, color:'#0F172A', fontWeight:900, fontSize:'18px' }}>Nouveau projet</h2>
        </div>
        <ProjectForm/>
        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'8px' }}>
          <BtnSecondary onClick={()=>setShowCreate(false)}>Annuler</BtnSecondary>
          <BtnPrimary onClick={handleCreate} disabled={saving||!form.name.trim()}>
            {saving ? <><IconLoader/> Création…</> : <><IconCheck/> Créer le projet</>}
          </BtnPrimary>
        </div>
      </Modal>

      {/* ── MODAL Modifier ── */}
      <Modal open={showEdit} onClose={()=>setShowEdit(false)}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#F0FDF4', border:'1.5px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', color:'#16A34A' }}><IconEdit/></div>
          <h2 style={{ margin:0, color:'#0F172A', fontWeight:900, fontSize:'18px' }}>Modifier le projet</h2>
        </div>
        <ProjectForm/>
        <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', marginTop:'8px' }}>
          <BtnSecondary onClick={()=>setShowEdit(false)}>Annuler</BtnSecondary>
          <BtnPrimary onClick={handleEdit} disabled={saving||!form.name.trim()} color="#16A34A">
            {saving ? <><IconLoader/> Enregistrement…</> : <><IconCheck/> Enregistrer</>}
          </BtnPrimary>
        </div>
      </Modal>

      {/* ── MODAL Archiver ── */}
      <Modal open={showArchive} onClose={()=>setShowArchive(false)} width="420px">
        <div style={{ textAlign:'center' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#FFFBEB', border:'1.5px solid #FDE68A', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#D97706' }}><IconArchive/></div>
          <h2 style={{ margin:'0 0 10px', color:'#0F172A', fontWeight:800, fontSize:'17px' }}>Archiver ce projet ?</h2>
          <p style={{ color:'#64748B', marginBottom:'28px', lineHeight:1.6, fontSize:'14px' }}>
            Le projet <strong style={{color:'#0F172A'}}>"{selected?.name}"</strong> sera archivé et ne sera plus visible dans la liste principale.
          </p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
            <BtnSecondary onClick={()=>setShowArchive(false)}>Annuler</BtnSecondary>
            <BtnPrimary onClick={handleArchive} disabled={saving} color="#D97706">
              {saving ? <><IconLoader/>…</> : <><IconArchive/> Archiver</>}
            </BtnPrimary>
          </div>
        </div>
      </Modal>

      {/* ── MODAL Supprimer ── */}
      <Modal open={showDelete} onClose={()=>setShowDelete(false)} width="420px">
        <div style={{ textAlign:'center' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#FEF2F2', border:'1.5px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#DC2626' }}><IconWarn/></div>
          <h2 style={{ margin:'0 0 10px', color:'#DC2626', fontWeight:800, fontSize:'17px' }}>Supprimer ce projet ?</h2>
          <p style={{ color:'#64748B', marginBottom:'28px', lineHeight:1.6, fontSize:'14px' }}>
            Le projet <strong style={{color:'#0F172A'}}>"{selected?.name}"</strong> sera définitivement supprimé. Cette action est <strong>irréversible</strong>.
          </p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
            <BtnSecondary onClick={()=>setShowDelete(false)}>Annuler</BtnSecondary>
            <BtnPrimary onClick={handleDelete} disabled={saving} color="#DC2626">
              {saving ? <><IconLoader/>…</> : <><IconTrash/> Supprimer</>}
            </BtnPrimary>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectsList;