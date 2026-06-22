import React, { useEffect, useState, useMemo } from 'react';
import departmentService from '../../../services/departmentService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBuilding  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 22V12h6v10M3 9h18"/></svg>;
const IconBriefcase = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconEdit      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPlus      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSave      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconX         = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconSearch    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconChevronD  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IconChevronU  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const IconLoader    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

const B  = '#2563EB';
const G  = '#16A34A'; // green for posts

// ── Shared input style ─────────────────────────────────────────────────────
const getInp = (focused) => ({
  width:'100%', boxSizing:'border-box', padding:'9px 13px', borderRadius:'9px',
  border: focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

const SInput = ({ value, onChange, placeholder }) => {
  const [f, setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={getInp(f)}/>;
};

// ── Field label ────────────────────────────────────────────────────────────
const Lbl = ({ children, required }) => (
  <label style={{ height:'18px', display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px' }}>
    {children}{required && <span style={{color:'#EF4444'}}>*</span>}
  </label>
);

// ── Main ───────────────────────────────────────────────────────────────────
const DepartmentsList = () => {
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState('');
  const [search,       setSearch]       = useState('');
  const [expandedDept, setExpandedDept] = useState(null);
  const [deptPosts,    setDeptPosts]    = useState({});
  const [loadingPosts, setLoadingPosts] = useState({});

  const [deptForm,    setDeptForm]    = useState({ name:'' });
  const [editingDept, setEditingDept] = useState(null);
  const [savingDept,  setSavingDept]  = useState(false);

  const [postForm,       setPostForm]       = useState({ name:'', description:'' });
  const [editingPost,    setEditingPost]    = useState(null);
  const [savingPost,     setSavingPost]     = useState(false);
  const [activePostDept, setActivePostDept] = useState(null);

  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.data?.data?.departments || []);
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const fetchPostsForDept = async (deptId) => {
    setLoadingPosts(p => ({...p, [deptId]:true}));
    try {
      const res = await departmentService.getPostsByDepartment(deptId);
      setDeptPosts(p => ({...p, [deptId]: res.data?.data?.posts || []}));
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoadingPosts(p => ({...p, [deptId]:false})); }
  };

  const handleExpandDept = (deptId) => {
    if (expandedDept === deptId) { setExpandedDept(null); }
    else { setExpandedDept(deptId); fetchPostsForDept(deptId); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(()=>setMsg(''), 3500); };

  const handleDeptSubmit = async () => {
    if (!deptForm.name.trim()) { showMsg('ERREUR Nom requis'); return; }
    setSavingDept(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept, deptForm);
        showMsg('SUCCESS Département modifié !');
      } else {
        await departmentService.createDepartment(deptForm);
        showMsg('SUCCESS Département créé !');
      }
      setDeptForm({ name:'' }); setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSavingDept(false); }
  };

  const handleDeptEdit = (dept) => { setEditingDept(dept._id); setDeptForm({ name: dept.name }); };

  const handlePostSubmit = async (deptId) => {
    if (!postForm.name.trim()) { showMsg('ERREUR Nom du poste requis'); return; }
    setSavingPost(true);
    try {
      if (editingPost) {
        await departmentService.updatePost(editingPost, postForm);
        showMsg('SUCCESS Poste modifié !');
      } else {
        await departmentService.createPost(deptId, postForm);
        showMsg('SUCCESS Poste créé !');
      }
      setPostForm({ name:'', description:'' }); setEditingPost(null); setActivePostDept(null);
      fetchPostsForDept(deptId); fetchDepartments();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSavingPost(false); }
  };

  const handlePostEdit = (post, deptId) => {
    setEditingPost(post._id);
    setPostForm({ name: post.name, description: post.description||'' });
    setActivePostDept(deptId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === 'dept') {
        await departmentService.deleteDepartment(deleteModal.item._id);
        showMsg('SUCCESS Département supprimé');
        fetchDepartments();
      } else {
        await departmentService.deletePost(deleteModal.item._id);
        showMsg('SUCCESS Poste supprimé');
        fetchPostsForDept(deleteModal.deptId);
        fetchDepartments();
      }
      setDeleteModal(null);
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Search filter ──────────────────────────────────────────────────────
  const filteredDepts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter(d => d.name?.toLowerCase().includes(q));
  }, [departments, search]);

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  // ── Avatar colors ──────────────────────────────────────────────────────
  const COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#DC2626','#0891B2'];
  const deptColor = (name) => COLORS[(name?.charCodeAt(0)||0) % COLORS.length];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes expandIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .dept-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
        .dept-header:hover { background: #F8FAFC !important; }
        .dept-action-btn:hover { opacity:0.85; transform:translateY(-1px); }
        .post-add-btn:hover { border-color: ${B} !important; color: ${B} !important; background: #EFF6FF !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1100px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── Delete Modal ── */}
        {deleteModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
            <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'400px', width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', textAlign:'center' }}>
              <div style={{ width:'52px', height:'52px', borderRadius:'13px', background:'#FEF2F2', border:'1.5px solid #FECACA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', color:'#DC2626' }}>
                <IconTrash/>
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:'17px', fontWeight:800, color:'#0F172A' }}>
                Supprimer {deleteModal.type === 'dept' ? 'le département' : 'le poste'}
              </h3>
              <p style={{ margin:'0 0 24px', color:'#64748B', fontSize:'14px', lineHeight:1.6 }}>
                Voulez-vous vraiment supprimer <strong style={{color:'#0F172A'}}>{deleteModal.item.name}</strong> ?
                {deleteModal.type === 'dept' && ' Tous les postes associés seront désassociés.'}
              </p>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setDeleteModal(null)} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', fontWeight:600, cursor:'pointer', fontSize:'14px', color:'#475569', fontFamily:"'Inter',sans-serif" }}>Annuler</button>
                <button onClick={handleDeleteConfirm} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#DC2626', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'14px', fontFamily:"'Inter',sans-serif" }}>Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px' }}>Départements & Postes</h1>
          <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>
            <strong style={{color:'#0F172A'}}>{departments.length}</strong> département(s) dans votre organisation
          </p>
        </div>

        {/* ── Toast ── */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'20px', alignItems:'start' }}>

          {/* ── Left: Form card ── */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background: editingDept ? '#FFF7ED' : '#EFF6FF', border: editingDept ? '1px solid #FED7AA' : '1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color: editingDept ? '#EA580C' : B }}>
                {editingDept ? <IconEdit/> : <IconPlus/>}
              </div>
              <h2 style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#0F172A' }}>
                {editingDept ? 'Modifier département' : 'Nouveau département'}
              </h2>
            </div>

            <div style={{ marginBottom:'16px' }}>
              <Lbl required>Nom du département</Lbl>
              <SInput value={deptForm.name} onChange={e=>setDeptForm({name:e.target.value})} placeholder="Ex : Ressources Humaines"/>
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={handleDeptSubmit} disabled={savingDept}
                style={{ flex:1, padding:'10px', borderRadius:'9px', border:'none', background:B, color:'#fff', fontWeight:700, fontSize:'14px', cursor:savingDept?'not-allowed':'pointer', opacity:savingDept?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', boxShadow:'0 4px 12px rgba(37,99,235,0.25)', fontFamily:"'Inter',sans-serif" }}>
                {savingDept ? <><IconLoader/>…</> : editingDept ? <><IconSave/>Sauvegarder</> : <><IconPlus/>Créer</>}
              </button>
              {editingDept && (
                <button onClick={() => { setEditingDept(null); setDeptForm({name:''}); }}
                  style={{ padding:'10px 12px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', display:'flex', alignItems:'center', fontFamily:"'Inter',sans-serif" }}>
                  <IconX/>
                </button>
              )}
            </div>
          </div>

          {/* ── Right: List ── */}
          <div>
            {/* Search bar */}
            <div style={{ background:'#fff', borderRadius:'12px', border:'1.5px solid #E2E8F0', padding:'12px 16px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ position:'relative', flex:1 }}>
                <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}>
                  <IconSearch/>
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un département…"
                  style={{ width:'100%', boxSizing:'border-box', padding:'9px 36px 9px 36px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', background:'#F8FAFC', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
                  onFocus={e => { e.target.style.borderColor=B; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background='#fff'; }}
                  onBlur={e  => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; e.target.style.background='#F8FAFC'; }}
                />
                {search && (
                  <button onClick={()=>setSearch('')}
                    style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
                    <IconX/>
                  </button>
                )}
              </div>
              <span style={{ fontSize:'13px', color:'#94A3B8', whiteSpace:'nowrap', flexShrink:0 }}>
                <strong style={{color:'#0F172A'}}>{filteredDepts.length}</strong> / {departments.length}
              </span>
            </div>

            {/* Department cards */}
            {loading ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'14px', background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0' }}>
                <IconLoader/> Chargement…
              </div>
            ) : filteredDepts.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', padding:'64px', textAlign:'center' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:B }}><IconBuilding/></div>
                {search
                  ? <><p style={{margin:'0 0 4px',fontWeight:700,color:'#0F172A',fontSize:'15px'}}>Aucun résultat pour « {search} »</p><p style={{margin:0,color:'#94A3B8',fontSize:'13px'}}>Essayez un autre nom.</p></>
                  : <><p style={{margin:'0 0 4px',fontWeight:700,color:'#0F172A',fontSize:'15px'}}>Aucun département</p><p style={{margin:0,color:'#94A3B8',fontSize:'13px'}}>Créez votre premier département.</p></>
                }
              </div>
            ) : (
              filteredDepts.map(dept => {
                const posts      = deptPosts[dept._id] || [];
                const isExpanded = expandedDept === dept._id;
                const dc         = deptColor(dept.name);
                const initials   = dept.name?.slice(0,2).toUpperCase();

                return (
                  <div key={dept._id} className="dept-card"
                    style={{ background:'#fff', borderRadius:'14px', marginBottom:'10px', border:'1.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)', transition:'box-shadow 0.2s' }}>

                    {/* Dept header row */}
                    <div className="dept-header"
                      style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px', borderBottom: isExpanded ? '1.5px solid #F1F5F9' : 'none', cursor:'pointer', background: isExpanded ? '#F8FBFF' : '#fff', transition:'background 0.15s' }}
                      onClick={() => handleExpandDept(dept._id)}
                    >
                      {/* Avatar */}
                      <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${dc}15`, border:`1.5px solid ${dc}30`, display:'flex', alignItems:'center', justifyContent:'center', color:dc, fontSize:'13px', fontWeight:800, flexShrink:0 }}>
                        {initials}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:0, fontWeight:700, fontSize:'15px', color:'#0F172A' }}>{dept.name}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'2px' }}>
                          <span style={{color:'#94A3B8'}}><IconBriefcase/></span>
                          <span style={{ fontSize:'12px', color:'#94A3B8' }}>{dept.postCount ?? 0} poste(s)</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:'6px', alignItems:'center' }} onClick={e=>e.stopPropagation()}>
                        <button className="dept-action-btn" onClick={() => handleDeptEdit(dept)}
                          style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#EFF6FF', color:B, border:'1.5px solid #BFDBFE', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Modifier">
                          <IconEdit/>
                        </button>
                        <button className="dept-action-btn" onClick={() => setDeleteModal({ type:'dept', item:dept })}
                          style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }} title="Supprimer">
                          <IconTrash/>
                        </button>
                      </div>

                      {/* Chevron */}
                      <div style={{ color:'#94A3B8', display:'flex', flexShrink:0, marginLeft:'4px', transition:'transform 0.2s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)' }}>
                        {isExpanded ? <IconChevronU/> : <IconChevronD/>}
                      </div>
                    </div>

                    {/* Expanded posts */}
                    {isExpanded && (
                      <div style={{ padding:'16px 18px', animation:'expandIn 0.2s ease' }}>

                        {loadingPosts[dept._id] ? (
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#94A3B8', fontSize:'13px', marginBottom:'12px' }}>
                            <IconLoader/> Chargement des postes…
                          </div>
                        ) : posts.length === 0 && !(activePostDept === dept._id || editingPost) ? (
                          <p style={{ color:'#94A3B8', fontSize:'13px', margin:'0 0 12px', display:'flex', alignItems:'center', gap:'5px' }}>
                            <IconBriefcase/> Aucun poste dans ce département
                          </p>
                        ) : (
                          <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                            {posts.map(post => (
                              <div key={post._id}
                                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'#F8FAFC', borderRadius:'10px', border:'1.5px solid #E2E8F0' }}>
                                <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:B, flexShrink:0 }}>
                                  <IconBriefcase/>
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <p style={{ margin:0, fontWeight:700, fontSize:'13px', color:'#0F172A' }}>{post.name}</p>
                                  {post.description && <p style={{ margin:0, fontSize:'11px', color:'#94A3B8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{post.description}</p>}
                                </div>
                                <button className="dept-action-btn" onClick={() => handlePostEdit(post, dept._id)}
                                  style={{ width:'28px', height:'28px', borderRadius:'7px', background:'#EFF6FF', color:B, border:'1.5px solid #BFDBFE', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}>
                                  <IconEdit/>
                                </button>
                                <button className="dept-action-btn" onClick={() => setDeleteModal({ type:'post', item:post, deptId:dept._id })}
                                  style={{ width:'28px', height:'28px', borderRadius:'7px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s', flexShrink:0 }}>
                                  <IconTrash/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline post form */}
                        {(activePostDept === dept._id || editingPost) ? (
                          <div style={{ background:'#F8FAFC', borderRadius:'10px', padding:'14px 16px', border:'1.5px solid #E2E8F0', animation:'slideIn 0.2s ease' }}>
                            <p style={{ margin:'0 0 12px', fontWeight:800, fontSize:'13px', color:'#0F172A', display:'flex', alignItems:'center', gap:'6px' }}>
                              {editingPost ? <><IconEdit/> Modifier le poste</> : <><IconPlus/> Nouveau poste</>}
                            </p>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'12px' }}>
                              <div>
                                <Lbl required>Nom</Lbl>
                                <SInput value={postForm.name} onChange={e=>setPostForm(p=>({...p,name:e.target.value}))} placeholder="Ex : Développeur Senior"/>
                              </div>
                              <div>
                                <Lbl>Description</Lbl>
                                <SInput value={postForm.description} onChange={e=>setPostForm(p=>({...p,description:e.target.value}))} placeholder="Optionnel"/>
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:'8px' }}>
                              <button onClick={() => handlePostSubmit(dept._id)} disabled={savingPost}
                                style={{ flex:1, padding:'9px', borderRadius:'8px', border:'none', background:G, color:'#fff', fontWeight:700, fontSize:'13px', cursor:savingPost?'not-allowed':'pointer', opacity:savingPost?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontFamily:"'Inter',sans-serif" }}>
                                {savingPost ? <><IconLoader/>…</> : editingPost ? <><IconSave/>Sauvegarder</> : <><IconPlus/>Ajouter</>}
                              </button>
                              <button onClick={() => { setActivePostDept(null); setEditingPost(null); setPostForm({name:'',description:''}); }}
                                style={{ padding:'9px 13px', borderRadius:'8px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
                                <IconX/> Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button className="post-add-btn" onClick={() => setActivePostDept(dept._id)}
                            style={{ width:'100%', padding:'9px', borderRadius:'9px', border:'1.5px dashed #E2E8F0', background:'#F8FAFC', color:'#94A3B8', cursor:'pointer', fontWeight:600, fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                            <IconPlus/> Ajouter un poste
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DepartmentsList;