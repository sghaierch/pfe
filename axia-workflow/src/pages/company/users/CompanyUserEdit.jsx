import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userService from '../../../services/userService';
import departmentService from '../../../services/departmentService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconUser      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconShield    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconBuilding  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 22V12h6v10M3 9h18"/></svg>;
const IconBriefcase = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconPhone     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.49 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconSave      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconLoader    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconWarn      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const B = '#2563EB';

const getInpStyle = (focused, hasError) => ({
  width:'100%', boxSizing:'border-box', padding:'10px 14px',
  borderRadius:'9px',
  border: hasError ? '1.5px solid #EF4444' : focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused && !hasError ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

const FieldError = ({ msg }) => msg ? (
  <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#DC2626', display:'flex', alignItems:'center', gap:'4px', fontWeight:500 }}>
    <IconWarn/> {msg}
  </p>
) : null;

const Field = ({ label, icon, required, children, hint, error }) => (
  <div style={{ display:'flex', flexDirection:'column', marginBottom:'18px', flex:1 }}>
    <label style={{ height:'20px', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>
      <span style={{color:B}}>{icon}</span>{label}{required&&<span style={{color:'#EF4444'}}>*</span>}
    </label>
    {children}
    {error ? <FieldError msg={error}/> : hint && <p style={{margin:'5px 0 0',fontSize:'11px',color:'#94A3B8',lineHeight:1.5}}>{hint}</p>}
  </div>
);

const SInput = ({ fieldKey, value, onChange, placeholder, disabled, hasError }) => {
  const [f, setF] = useState(false);
  return (
    <input
      name={`axia_${fieldKey}`}
      autoComplete="off"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...getInpStyle(f, hasError), opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
    />
  );
};

const SSelect = ({ value, onChange, children, disabled, hasError }) => {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...getInpStyle(f, hasError), opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </select>
  );
};

const SectionCard = ({ title, icon, children }) => (
  <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'24px', marginBottom:'16px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
      <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#EFF6FF', border:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:B }}>{icon}</div>
      <h3 style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#0F172A' }}>{title}</h3>
    </div>
    {children}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────
const CompanyUserEdit = () => {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [departments, setDepartments] = useState([]);
  const [posts,       setPosts]       = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [serverErr,   setServerErr]   = useState('');
  const [errors,      setErrors]      = useState({});

  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'',
    roleId:'', department:'', jobTitle:'',
    phoneNumber:'', isActive:true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, rolesRes, deptsRes] = await Promise.all([
          userService.getById(id),
          userService.getRoles(),
          departmentService.getDepartments(),
        ]);
        const u = userRes.data?.user || userRes.user;
        const deps = deptsRes.data?.data?.departments || [];
        setRoles(rolesRes.data?.roles || []);
        setDepartments(deps);
        if (u) {
          const deptId = typeof u.department === 'object' ? u.department?._id : u.department;
          if (deptId) {
            try {
              const p = await departmentService.getPostsByDepartment(deptId);
              setPosts(p.data?.data?.posts || []);
            } catch {}
          }
          setForm({
            firstName:   u.firstName   || '',
            lastName:    u.lastName    || '',
            email:       u.email       || '',
            roleId:      u.role?._id   || u.role || '',
            department:  deptId        || '',
            jobTitle:    u.jobTitle    || '',
            phoneNumber: u.phoneNumber || '',
            isActive:    u.isActive    !== false,
          });
        }
      } catch (err) {
        setServerErr('Erreur chargement : ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  };

  const handleDeptChange = async (deptId) => {
    set('department', deptId);
    set('jobTitle', '');
    setPosts([]);
    if (!deptId) return;
    try {
      const res = await departmentService.getPostsByDepartment(deptId);
      setPosts(res.data?.data?.posts || []);
    } catch { setPosts([]); }
  };

  const isEmployee = form.roleId === 'employee';

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Le prénom est requis';
    if (!form.lastName.trim())  e.lastName  = 'Le nom est requis';
    if (!form.email.trim())     e.email     = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Adresse email invalide';
    if (!form.roleId)           e.roleId    = 'Veuillez choisir un rôle';
    // Département + Poste obligatoires pour les employés
    if (isEmployee && !form.department) e.department = 'Le département est requis pour un employé';
    if (isEmployee && form.department && !form.jobTitle) e.jobTitle = 'Le poste est requis pour un employé';
    return e;
  };

  const handleSubmit = async () => {
    setServerErr('');
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      await userService.update(id, {
        firstName:   form.firstName,
        lastName:    form.lastName,
        email:       form.email,
        roleId:      form.roleId,
        department:  form.department  || undefined,
        jobTitle:    form.jobTitle    || undefined,
        phoneNumber: form.phoneNumber || undefined,
        isActive:    form.isActive,
      });
      navigate('/dashboard/company/users', { state: { success: 'Utilisateur modifié avec succès !' } });
    } catch (err) {
      setServerErr(err.response?.data?.message || err.message || 'Une erreur est survenue.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#94A3B8', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'14px' }}>
      <IconLoader/> Chargement…
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px white inset !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'720px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'28px' }}>
          <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
            <IconArrowL/> Retour
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px' }}>Modifier l'utilisateur</h1>
            <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#64748B' }}>{form.firstName} {form.lastName} · {form.email}</p>
          </div>
        </div>

        {serverErr && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease' }}>
            <IconWarn/> {serverErr}
          </div>
        )}

        {/* Identité */}
        <SectionCard title="Identité" icon={<IconUser/>}>
          <div style={{ display:'flex', gap:'14px' }}>
            <Field label="Prénom" icon={<IconUser/>} required error={errors.firstName}>
              <SInput fieldKey="firstName" value={form.firstName} onChange={e=>set('firstName',e.target.value)} hasError={!!errors.firstName}/>
            </Field>
            <Field label="Nom" icon={<IconUser/>} required error={errors.lastName}>
              <SInput fieldKey="lastName" value={form.lastName} onChange={e=>set('lastName',e.target.value)} hasError={!!errors.lastName}/>
            </Field>
          </div>
          <Field label="Email" icon={<IconMail/>} required error={errors.email}>
            <SInput fieldKey="email" value={form.email} onChange={e=>set('email',e.target.value)} hasError={!!errors.email}/>
          </Field>
          <Field label="Téléphone" icon={<IconPhone/>}>
            <input
              name="axia_phone_edit"
              autoComplete="tel"
              type="tel"
              value={form.phoneNumber}
              onChange={e=>set('phoneNumber',e.target.value)}
              placeholder="+216 XX XXX XXX"
              style={getInpStyle(false, false)}
              onFocus={e=>{ e.target.style.borderColor=B; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e=>{ e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
            />
          </Field>
        </SectionCard>

        {/* Rôle & Accès */}
        <SectionCard title="Rôle & Accès" icon={<IconShield/>}>
          <Field label="Rôle" icon={<IconShield/>} required error={errors.roleId}>
            <SSelect value={form.roleId} onChange={e=>set('roleId',e.target.value)} hasError={!!errors.roleId}>
              <option value="">— Choisir un rôle —</option>
              {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </SSelect>
          </Field>

          {/* Animated toggle */}
          <div style={{ padding:'14px 16px', background:'#F8FAFC', borderRadius:'10px', border:'1.5px solid #E2E8F0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }} onClick={() => set('isActive', !form.isActive)}>
              <div style={{ width:'44px', height:'24px', borderRadius:'12px', background: form.isActive ? B : '#CBD5E1', transition:'background 0.2s', position:'relative', flexShrink:0 }}>
                <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#fff', position:'absolute', top:'3px', left: form.isActive ? '23px' : '3px', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
              </div>
              <div>
                <p style={{ margin:0, fontWeight:700, fontSize:'14px', color:'#0F172A' }}>
                  Compte {form.isActive ? 'actif' : 'désactivé'}
                </p>
                <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>
                  {form.isActive ? "L'utilisateur peut se connecter" : "L'accès est bloqué"}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Poste & Département */}
        <SectionCard title={isEmployee ? "Poste & Département *" : "Poste & Département"} icon={<IconBuilding/>}>
          <div style={{ display:'flex', gap:'14px' }}>
            <Field label="Département" icon={<IconBuilding/>} required={isEmployee} error={errors.department}>
              <SSelect value={form.department} onChange={e=>handleDeptChange(e.target.value)} hasError={!!errors.department}>
                <option value="">— Choisir —</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </SSelect>
            </Field>
            <Field label="Poste" icon={<IconBriefcase/>} required={isEmployee && !!form.department} error={errors.jobTitle} hint={!form.department ? "Choisissez d'abord un département" : ''}>
              <SSelect
                value={form.jobTitle}
                onChange={e=>set('jobTitle',e.target.value)}
                disabled={!form.department || posts.length === 0}
                hasError={!!errors.jobTitle}
              >
                {!form.department
                  ? <option value="">— Choisir un poste —</option>
                  : posts.length === 0
                    ? <option value="">Aucun poste disponible</option>
                    : <>
                        <option value="" disabled hidden>— Choisir un poste —</option>
                        {posts.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                      </>
                }
              </SSelect>
            </Field>
          </div>
        </SectionCard>

        <button onClick={handleSubmit} disabled={saving}
          style={{ width:'100%', padding:'13px', borderRadius:'10px', background:B, color:'#fff', border:'none', fontWeight:700, fontSize:'15px', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 16px rgba(37,99,235,0.35)', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
          {saving ? <><IconLoader/> Sauvegarde…</> : <><IconSave/> Sauvegarder les modifications</>}
        </button>
      </div>
    </>
  );
};

export default CompanyUserEdit;