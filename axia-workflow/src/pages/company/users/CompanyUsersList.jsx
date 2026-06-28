import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import userService from '../../../services/userService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconArchive = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconShield  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconPlus    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconCheck   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconX       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconMail    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.49 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;

const B = '#2563EB';

// ── Role config ────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  company_admin: { label: 'Admin',    bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#2563EB' },
  manager:       { label: 'Manager',  bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', dot: '#16A34A' },
  employee:      { label: 'Employé',  bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', dot: '#64748B' },
};
const getRoleConfig = (name) => ROLE_CONFIG[name] || ROLE_CONFIG.employee;

// ── Avatar ─────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 38 }) => {
  const initials = `${user.firstName?.charAt(0)||''}${user.lastName?.charAt(0)||''}`.toUpperCase();
  const colors = ['#2563EB','#7C3AED','#DB2777','#D97706','#059669','#DC2626'];
  const color = colors[(user.firstName?.charCodeAt(0)||0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'10px', background:`${color}18`, border:`1.5px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, fontSize: size * 0.34, fontWeight:800, flexShrink:0 }}>
      {initials || '?'}
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────
const DeleteModal = ({ user, onConfirm, onCancel, loading }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
    <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'400px', width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.25)', textAlign:'center' }}>
      <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#FFFBEB', border:'1.5px solid #FDE68A', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'#D97706' }}>
        <IconArchive />
      </div>
      <h3 style={{ margin:'0 0 8px', fontSize:'18px', fontWeight:800, color:'#0F172A' }}>Archiver l'utilisateur</h3>
      <p style={{ margin:'0 0 24px', color:'#64748B', fontSize:'14px', lineHeight:1.6 }}>
        Voulez-vous vraiment archiver <strong style={{color:'#0F172A'}}>{user.firstName} {user.lastName}</strong> ? Il ne pourra plus se connecter mais ses données seront conservées.
      </p>
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={onCancel} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', fontWeight:600, cursor:'pointer', fontSize:'14px', color:'#475569', fontFamily:"'Inter',sans-serif" }}>
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#D97706', color:'#fff', fontWeight:700, cursor:loading?'not-allowed':'pointer', fontSize:'14px', opacity:loading?0.7:1, fontFamily:"'Inter',sans-serif" }}>
          {loading ? 'Archivage…' : 'Archiver'}
        </button>
      </div>
    </div>
  </div>
);

// ── User Card (row) ────────────────────────────────────────────────────────
const UserRow = ({ u, isSelf, onDelete }) => {
  const roleName = u.role?.name || 'employee';
  const rc = getRoleConfig(roleName);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1.2fr 1fr auto', gap:'12px', alignItems:'center', padding:'14px 20px', borderBottom:'1px solid #F1F5F9', background: hovered ? '#F8FAFC' : '#fff', transition:'background 0.15s' }}
    >
      {/* Name + email */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', minWidth:0 }}>
        <Avatar user={u} />
        <div style={{ minWidth:0 }}>
          <p style={{ margin:0, fontWeight:700, color:'#0F172A', fontSize:'14px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {u.firstName} {u.lastName}
            {isSelf && <span style={{ marginLeft:'6px', fontSize:'10px', fontWeight:700, color:B, background:'#EFF6FF', padding:'2px 6px', borderRadius:'4px' }}>Moi</span>}
          </p>
          <p style={{ margin:'2px 0 0', color:'#94A3B8', fontSize:'12px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'flex', alignItems:'center', gap:'4px' }}>
            <IconMail/> {u.email}
          </p>
        </div>
      </div>

      {/* Job + dept */}
      <div style={{ minWidth:0 }}>
        <p style={{ margin:0, fontSize:'13px', color:'#334155', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.jobTitle || <span style={{color:'#CBD5E1'}}>—</span>}</p>
        <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94A3B8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.department?.name || ''}</p>
      </div>

      {/* Phone */}
      <div style={{ fontSize:'12px', color:'#64748B', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'4px' }}>
        {u.phoneNumber ? <><IconPhone/> {u.phoneNumber}</> : <span style={{color:'#CBD5E1'}}>—</span>}
      </div>

      {/* Role badge */}
      <div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>
          <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:rc.dot, display:'inline-block' }}/>
          {rc.label}
        </span>
      </div>

      {/* Status */}
      <div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:600, background: u.isActive ? '#F0FDF4' : '#FEF2F2', color: u.isActive ? '#16A34A' : '#DC2626', border: u.isActive ? '1px solid #BBF7D0' : '1px solid #FECACA' }}>
          {u.isActive ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
        <Link to={`/dashboard/company/users/edit/${u._id}`} title="Modifier"
          style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#EFF6FF', color:B, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', border:'1.5px solid #BFDBFE', transition:'all 0.15s' }}>
          <IconEdit/>
        </Link>
          {!isSelf && (
          <button onClick={() => onDelete(u)} title="Archiver"
            style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#FFFBEB', color:'#D97706', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #FDE68A', cursor:'pointer', transition:'all 0.15s' }}>
            <IconArchive/>
          </button>
        )}
      </div>
    </div>
  );
};

// ── Section header ─────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, count, color }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 20px', background:`${color}08`, borderBottom:`1.5px solid ${color}20` }}>
    <span style={{ color }}>{icon}</span>
    <span style={{ fontSize:'13px', fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:'0.06em' }}>{title}</span>
    <span style={{ padding:'2px 8px', borderRadius:'10px', background:color, color:'#fff', fontSize:'11px', fontWeight:700 }}>{count}</span>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const CompanyUsersList = () => {
  const { user }      = useAuth();
  const location      = useLocation();
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState(location.state?.success ? 'SUCCESS ' + location.state.success : '');
  const [deleting,    setDeleting]    = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [search,      setSearch]      = useState('');
  const [tab,         setTab]         = useState('all'); // 'all' | 'admins' | 'employees'

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    if (msg) { const t = setTimeout(() => setMsg(''), 4000); return () => clearTimeout(t); }
  }, [msg]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data?.users || []);
    } catch (err) {
      setMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

const handleArchiveConfirm = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await userService.archive(deleteModal._id);
      setMsg('SUCCESS Utilisateur archivé avec succès');
      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      setMsg('ERREUR ' + (err.response?.data?.message || err.message));
      setDeleteModal(null);
    } finally { setDeleting(false); }
  };

  // ── Filtering ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      const matchSearch = !q ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.jobTitle?.toLowerCase().includes(q) ||
        u.department?.name?.toLowerCase().includes(q);
      const roleName = u.role?.name || 'employee';
      const isAdmin = roleName === 'company_admin' || roleName === 'manager';
      const matchTab = tab === 'all' || (tab === 'admins' ? isAdmin : !isAdmin);
      return matchSearch && matchTab;
    });
  }, [users, search, tab]);

  const admins    = filtered.filter(u => { const r = u.role?.name||'employee'; return r==='company_admin'||r==='manager'; });
  const employees = filtered.filter(u => { const r = u.role?.name||'employee'; return r!=='company_admin'&&r!=='manager'; });
  const adminCount    = users.filter(u => { const r=u.role?.name||'employee'; return r==='company_admin'||r==='manager'; }).length;
  const employeeCount = users.filter(u => { const r=u.role?.name||'employee'; return r!=='company_admin'&&r!=='manager'; }).length;

  const msgIsSuccess = msg.startsWith('SUCCESS');
  const msgText = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  const TABS = [
    { key:'all',       label:'Tous',       count: users.length },
    { key:'admins',    label:'Admins',     count: adminCount },
    { key:'employees', label:'Employés',   count: employeeCount },
  ];

  return (
    <>
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .ul-search-input:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
        .ul-tab:hover { background: #F1F5F9 !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1200px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

       {deleteModal && <DeleteModal user={deleteModal} onConfirm={handleArchiveConfirm} onCancel={() => setDeleteModal(null)} loading={deleting}/>}


        {/* ── Page header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px' }}>Utilisateurs</h1>
            <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>
              
            </p>
          </div>
          <Link to="/dashboard/company/users/create" style={{ display:'flex', alignItems:'center', gap:'8px', background:B, color:'#fff', padding:'10px 20px', borderRadius:'10px', textDecoration:'none', fontWeight:700, fontSize:'14px', boxShadow:'0 4px 14px rgba(37,99,235,0.3)', whiteSpace:'nowrap' }}>
            <IconPlus/> Nouvel utilisateur
          </Link>
        </div>

        {/* ── Toast ── */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease', ...(msgIsSuccess ? {background:'#F0FDF4', border:'1.5px solid #BBF7D0', color:'#16A34A'} : {background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626'}) }}>
            {msgIsSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
          </div>
        )}

        {/* ── Toolbar: Tabs + Search ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', marginBottom:'16px', flexWrap:'wrap' }}>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'6px', padding:'4px', background:'#F1F5F9', borderRadius:'10px' }}>
            {TABS.map(({ key, label, count }) => {
              const active = tab === key;
              return (
                <button key={key} className="ul-tab" onClick={() => setTab(key)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 16px', borderRadius:'7px', border:'none', cursor:'pointer', fontWeight: active ? 700 : 500, fontSize:'13px', background: active ? '#fff' : 'transparent', color: active ? '#0F172A' : '#64748B', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                  {key === 'admins' && <span style={{color:'#2563EB'}}><IconShield/></span>}
                  {key === 'employees' && <span style={{color:'#64748B'}}><IconUsers/></span>}
                  {label}
                  <span style={{ padding:'1px 7px', borderRadius:'8px', fontSize:'11px', fontWeight:700, background: active ? B : '#E2E8F0', color: active ? '#fff' : '#64748B', transition:'all 0.15s' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position:'relative', minWidth:'300px', flex:'0 0 auto' }}>
            <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none' }}><IconSearch/></span>
            <input
              className="ul-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher nom, email, poste…"
              style={{ width:'100%', boxSizing:'border-box', minWidth:'300px', padding:'9px 36px 9px 38px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
                <IconX/>
              </button>
            )}
          </div>
        </div>

        {/* ── Table header ── */}
        <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1.2fr 1fr auto', gap:'12px', padding:'11px 20px', background:'#F8FAFC', borderBottom:'1.5px solid #E2E8F0' }}>
            {['Utilisateur', 'Poste / Département', 'Téléphone', 'Rôle', 'Statut', 'Actions'].map(h => (
              <div key={h} style={{ fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:'60px', textAlign:'center', color:'#94A3B8', fontSize:'14px' }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'60px', textAlign:'center' }}>
              <p style={{ color:'#94A3B8', fontSize:'15px', margin:0 }}>{search ? `Aucun résultat pour « ${search} »` : 'Aucun utilisateur dans cette catégorie.'}</p>
            </div>
          ) : (
            <>
              {/* Admins section */}
              {(tab === 'all' || tab === 'admins') && admins.length > 0 && (
                <>
                  <SectionHeader icon={<IconShield/>} title="Admins & Managers" count={admins.length} color="#2563EB"/>
                  {admins.map(u => <UserRow key={u._id} u={u} isSelf={u._id === user?._id} onDelete={setDeleteModal}/>)}
                </>
              )}
              {/* Employees section */}
              {(tab === 'all' || tab === 'employees') && employees.length > 0 && (
                <>
                  <SectionHeader icon={<IconUsers/>} title="Employés" count={employees.length} color="#475569"/>
                  {employees.map(u => <UserRow key={u._id} u={u} isSelf={u._id === user?._id} onDelete={setDeleteModal}/>)}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p style={{ textAlign:'right', margin:'12px 0 0', fontSize:'12px', color:'#94A3B8' }}>
            {filtered.length} utilisateur(s) affiché(s) sur {users.length}
          </p>
        )}
      </div>
    </>
  );
};

export default CompanyUsersList;