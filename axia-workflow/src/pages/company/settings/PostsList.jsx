import React, { useState, useEffect } from 'react';
import userService from '../../../services/userService';
import departmentService from '../../../services/departmentService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBriefcase = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconBuilding  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 22V12h6v10M3 9h18"/></svg>;
const IconEdit      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="10" y2="17"/><line x1="14" y1="12" x2="14" y2="17"/></svg>;
const IconPlus      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSave      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconX         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconAlignLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="13" y1="18" x2="3" y2="18"/></svg>;
const IconSearch    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const B = '#2563EB';

const getInpStyle = (focused) => ({
  width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px',
  border: focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

const SInput = ({ value, onChange, placeholder, disabled }) => {
  const [f, setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...getInpStyle(f), opacity:disabled?0.6:1}}/>;
};
const STextarea = ({ value, onChange, placeholder, rows=3 }) => {
  const [f, setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...getInpStyle(f), resize:'vertical'}}/>;
};
const SSelect = ({ value, onChange, children }) => {
  const [f, setF] = useState(false);
  return <select value={value} onChange={onChange}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInpStyle(f), cursor:'pointer'}}>{children}</select>;
};

const Field = ({ label, icon, children, required }) => (
  <div style={{marginBottom:'16px'}}>
    <label style={{height:'20px', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px'}}>
      <span style={{color:B}}>{icon}</span>{label}{required&&<span style={{color:'#EF4444'}}>*</span>}
    </label>
    {children}
  </div>
);

const PostsList = () => {
  const [posts,       setPosts]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [form,        setForm]        = useState({ name:'', description:'', department:'' });
  const [editing,     setEditing]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [postsRes, deptsRes] = await Promise.all([
          userService.getPosts(),
          departmentService.getDepartments(),
        ]);
        setPosts(postsRes.data?.posts || []);
        setDepartments(deptsRes.data?.data?.departments || []);
      } catch (err) {
        showMsg('ERREUR ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await userService.getPosts();
      setPosts(res.data?.posts || []);
    } catch {}
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3500); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { showMsg('ERREUR Nom du poste requis'); return; }
    setSaving(true);
    try {
      if (editing) {
        await userService.updatePost(editing, form);
        showMsg('SUCCESS Poste modifié avec succès !');
      } else {
        await userService.createPost(form);
        showMsg('SUCCESS Poste créé avec succès !');
      }
      setForm({ name:'', description:'', department:'' });
      setEditing(null);
      fetchPosts();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleEdit = (post) => {
    setEditing(post._id);
    setForm({ name:post.name, description:post.description||'', department: post.department ? post.department.toString() : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArchive = async () => {
    if (!deleteModal) return;
    try {
      await userService.archivePost(deleteModal._id);
      showMsg('SUCCESS Poste archivé');
      setDeleteModal(null);
      fetchPosts();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  const filteredPosts = posts.filter(p => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.departmentName?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .post-row:hover { background: #F8FAFC !important; }
        .post-action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1100px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* Delete/Archive Modal */}
        {deleteModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
            <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'400px', width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', textAlign:'center' }}>
              <div style={{ width:'52px', height:'52px', borderRadius:'13px', background:'#FFF7ED', border:'1.5px solid #FED7AA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', color:'#F59E0B' }}>
                <IconTrash/>
              </div>
              <h3 style={{ margin:'0 0 8px', fontSize:'17px', fontWeight:800, color:'#0F172A' }}>Archiver le poste</h3>
              <p style={{ margin:'0 0 24px', color:'#64748B', fontSize:'14px', lineHeight:1.6 }}>
                Voulez-vous vraiment archiver <strong style={{color:'#0F172A'}}>{deleteModal.name}</strong> ?
                Les utilisateurs avec ce poste ne seront plus assignés automatiquement.
              </p>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={() => setDeleteModal(null)} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', fontWeight:600, cursor:'pointer', fontSize:'14px', color:'#475569', fontFamily:"'Inter',sans-serif" }}>
                  Annuler
                </button>
                <button onClick={handleArchive} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#F59E0B', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'14px', fontFamily:"'Inter',sans-serif" }}>
                  Archiver
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px' }}>Postes</h1>
            <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>
              <strong style={{color:'#0F172A'}}>{posts.length}</strong> poste(s) dans votre organisation
            </p>
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'20px', alignItems:'start' }}>

          {/* ── Form card ── */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            {/* Card header */}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'22px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background: editing ? '#FFF7ED' : '#EFF6FF', border: editing ? '1px solid #FED7AA' : '1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color: editing ? '#EA580C' : B }}>
                {editing ? <IconEdit/> : <IconPlus/>}
              </div>
              <h2 style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#0F172A' }}>
                {editing ? 'Modifier le poste' : 'Nouveau poste'}
              </h2>
            </div>

            <Field label="Nom du poste" icon={<IconBriefcase/>} required>
              <SInput value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ex : Directeur RH"/>
            </Field>

            <Field label="Département" icon={<IconBuilding/>}>
              <SSelect value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
                <option value="">— Aucun —</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </SSelect>
            </Field>

            <Field label="Description" icon={<IconAlignLeft/>}>
              <STextarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Description optionnelle…"/>
            </Field>

            <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:B, color:'#fff', fontWeight:700, fontSize:'14px', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', boxShadow:'0 4px 12px rgba(37,99,235,0.3)', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
                {saving ? <><IconLoader/> …</> : editing ? <><IconSave/> Sauvegarder</> : <><IconPlus/> Créer</>}
              </button>
              {editing && (
                <button onClick={() => { setEditing(null); setForm({name:'',description:'',department:''}); }}
                  style={{ padding:'11px 14px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', display:'flex', alignItems:'center', gap:'5px', fontFamily:"'Inter',sans-serif" }}>
                  <IconX/> Annuler
                </button>
              )}
            </div>
          </div>

          {/* ── List card ── */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
            {/* Search bar */}
            <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #E2E8F0', background:'#fff', display:'flex', alignItems:'center', gap:'12px', justifyContent:'space-between' }}>
              <div style={{ position:'relative', flex:1, maxWidth:'360px' }}>
                <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}>
                  <IconSearch/>
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher poste, département…"
                  style={{ width:'100%', boxSizing:'border-box', padding:'9px 36px 9px 38px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', background:'#F8FAFC', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = B; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; e.target.style.background = '#fff'; }}
                  onBlur={e  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
                    <IconX/>
                  </button>
                )}
              </div>
              <span style={{ fontSize:'13px', color:'#94A3B8', whiteSpace:'nowrap' }}>
                <strong style={{color:'#0F172A'}}>{filteredPosts.length}</strong> / {posts.length} poste(s)
              </span>
            </div>

            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 2fr auto', gap:'12px', padding:'11px 20px', background:'#F8FAFC', borderBottom:'1.5px solid #E2E8F0' }}>
              {['Poste', 'Département', 'Description', 'Actions'].map(h => (
                <div key={h} style={{ fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</div>
              ))}
            </div>

            {loading ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'14px' }}>
                <IconLoader/> Chargement…
              </div>
            ) : filteredPosts.length === 0 ? (
              <div style={{ padding:'64px', textAlign:'center' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:B }}>
                  <IconBriefcase/>
                </div>
                {search
                  ? <><p style={{ margin:'0 0 4px', fontWeight:700, color:'#0F172A', fontSize:'15px' }}>Aucun résultat pour « {search} »</p><p style={{ margin:0, color:'#94A3B8', fontSize:'13px' }}>Essayez un autre nom ou département.</p></>
                  : <><p style={{ margin:'0 0 4px', fontWeight:700, color:'#0F172A', fontSize:'15px' }}>Aucun poste créé</p><p style={{ margin:0, color:'#94A3B8', fontSize:'13px' }}>Utilisez le formulaire pour créer le premier.</p></>
                }
              </div>
            ) : filteredPosts.map(post => (
              <div key={post._id} className="post-row" style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 2fr auto', gap:'12px', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #F1F5F9', background:'#fff', transition:'background 0.15s' }}>
                {/* Name */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:B, flexShrink:0 }}>
                    <IconBriefcase/>
                  </div>
                  <span style={{ fontWeight:700, color:'#0F172A', fontSize:'14px' }}>{post.name}</span>
                </div>

                {/* Dept badge */}
                <div>
                  {post.departmentName
                    ? <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', background:'#EFF6FF', color:B, border:'1px solid #BFDBFE', fontSize:'12px', fontWeight:600 }}>
                        <IconBuilding/> {post.departmentName}
                      </span>
                    : <span style={{color:'#CBD5E1'}}>—</span>
                  }
                </div>

                {/* Description */}
                <div style={{ color:'#64748B', fontSize:'13px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {post.description || <span style={{color:'#CBD5E1'}}>—</span>}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:'6px' }}>
                  <button className="post-action-btn" onClick={() => handleEdit(post)}
                    style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#EFF6FF', color:B, border:'1.5px solid #BFDBFE', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    title="Modifier">
                    <IconEdit/>
                  </button>
                  <button className="post-action-btn" onClick={() => setDeleteModal(post)}
                    style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#FFF7ED', color:'#F59E0B', border:'1.5px solid #FED7AA', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    title="Archiver">
                    <IconTrash/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PostsList;