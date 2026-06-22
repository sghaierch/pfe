import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/userService';
import departmentService from '../../../services/departmentService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconArrowL    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconUser      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconMail      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconLock      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconShield    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconBuilding  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 22V12h6v10M3 9h18"/></svg>;
const IconBriefcase = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconPhone     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.49 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconPlus      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconLoader    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconEye       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconWarn      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

const B = '#2563EB';

// ── Inline field error ──────────────────────────────────────────────────────
const FieldError = ({ msg }) => msg ? (
  <p style={{ margin:'4px 0 0', fontSize:'12px', color:'#DC2626', display:'flex', alignItems:'center', gap:'4px', fontWeight:500 }}>
    <IconWarn/> {msg}
  </p>
) : null;

// ── Field wrapper ──────────────────────────────────────────────────────────
const Field = ({ label, icon, required, children, hint, error }) => (
  <div style={{ display:'flex', flexDirection:'column', marginBottom:'18px', flex:1 }}>
    <label style={{ height:'20px', display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>
      <span style={{color:B}}>{icon}</span>{label}{required && <span style={{color:'#EF4444'}}>*</span>}
    </label>
    {children}
    {error ? <FieldError msg={error}/> : hint && <p style={{margin:'5px 0 0', fontSize:'11px', color:'#94A3B8', lineHeight:1.5}}>{hint}</p>}
  </div>
);

// ── Base styles ────────────────────────────────────────────────────────────
const getInpStyle = (focused, hasError) => ({
  width:'100%', boxSizing:'border-box', padding:'10px 14px',
  borderRadius:'9px',
  border: hasError ? '1.5px solid #EF4444' : focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused && !hasError ? `0 0 0 3px rgba(37,99,235,0.1)` : hasError && focused ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

// ── Smart input — disables browser autocomplete via random name ────────────
const SInput = ({ fieldKey, value, onChange, placeholder, disabled, hasError }) => {
  const [focused, setFocused] = useState(false);
  // Random autocomplete name defeats browser autofill on sensitive fields
  const autoName = `axia_${fieldKey}_${Math.random().toString(36).slice(2,6)}`;
  return (
    <input
      name={autoName}
      autoComplete="off"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...getInpStyle(focused, hasError), opacity: disabled ? 0.6 : 1 }}
    />
  );
};

const SSelect = ({ value, onChange, children, disabled, hasError }) => {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...getInpStyle(focused, hasError), opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </select>
  );
};

// ── Password input — new-password autocomplete hint stops browser fill ─────
const SPassword = ({ value, onChange, hasError }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{position:'relative'}}>
      <input
        name="axia_new_password"
        autoComplete="new-password"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="Minimum 8 caractères"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...getInpStyle(focused, hasError), paddingRight:'42px' }}
      />
      <button type="button" onClick={() => setShow(!show)}
        style={{position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#94A3B8',cursor:'pointer',display:'flex',padding:'2px'}}>
        {show ? <IconEyeOff/> : <IconEye/>}
      </button>
    </div>
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

// ── Main component ─────────────────────────────────────────────────────────
const CompanyUserCreate = () => {
  const navigate    = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [posts,       setPosts]       = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [serverErr,   setServerErr]   = useState('');

  // Per-field errors
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'',
    password:'', role:'', department:'',
    jobTitle:'', phoneNumber:'',
  });

  useEffect(() => {
    // Wrap form in a fake <form autoComplete="off"> by adding a hidden dummy input
    // trick: mount a hidden input first so browser autofill targets it instead
    Promise.all([userService.getRoles(), departmentService.getDepartments()])
      .then(([r, d]) => {
        setRoles(r.data?.data?.roles || r.data?.roles || []);
        setDepartments(d.data?.data?.departments || []);
      }).catch(console.error);
  }, []);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    // Clear field error on change
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

  // ── Validation → returns errors object ────────────────────────────────
  const isEmployee = form.role === 'employee';

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())  e.firstName  = 'Le prénom est requis';
    if (!form.lastName.trim())   e.lastName   = 'Le nom est requis';
    if (!form.email.trim())      e.email      = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Adresse email invalide';
    if (!form.password)          e.password   = 'Le mot de passe est requis';
    else if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    if (!form.role)              e.role       = 'Veuillez choisir un rôle';
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
      await userService.create(form);
      navigate('/dashboard/company/users', { state: { success: 'Utilisateur créé avec succès !' } });
    } catch (err) {
      setServerErr(err.response?.data?.message || err.message || 'Une erreur est survenue.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        /* Hide Chrome autofill yellow background */
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px white inset !important; }
      `}</style>

      {/* Hidden dummy inputs trick — makes browser autofill land here instead of real fields */}
      <div style={{position:'absolute',left:'-9999px',opacity:0,pointerEvents:'none'}} aria-hidden="true">
        <input type="text" name="username_fake" tabIndex="-1"/>
        <input type="password" name="password_fake" tabIndex="-1"/>
      </div>

      <div style={{ padding:'32px', maxWidth:'720px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'28px' }}>
          <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
            <IconArrowL/> Retour
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px' }}>Nouvel utilisateur</h1>
            <p style={{ margin:'2px 0 0', fontSize:'13px', color:'#64748B' }}>Créer un compte pour un membre de l'équipe</p>
          </div>
        </div>

        {/* Server-level error */}
        {serverErr && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease' }}>
            <IconWarn/> {serverErr}
          </div>
        )}

        {/* ── Section : Identité ── */}
        <SectionCard title="Identité" icon={<IconUser/>}>
          <div style={{ display:'flex', gap:'14px' }}>
            <Field label="Prénom" icon={<IconUser/>} required error={errors.firstName}>
              <SInput fieldKey="firstName" value={form.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="Ahmed" hasError={!!errors.firstName}/>
            </Field>
            <Field label="Nom" icon={<IconUser/>} required error={errors.lastName}>
              <SInput fieldKey="lastName" value={form.lastName} onChange={e=>set('lastName',e.target.value)} placeholder="Ben Ali" hasError={!!errors.lastName}/>
            </Field>
          </div>
          <Field label="Email" icon={<IconMail/>} required error={errors.email}>
            <SInput fieldKey="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="ahmed@société.com" hasError={!!errors.email}/>
          </Field>
          <Field label="Téléphone" icon={<IconPhone/>}>
            {/* autoComplete="tel" + unique name prevent browser from filling this with email */}
            <div style={{position:'relative'}}>
              <input
                name="axia_phone"
                autoComplete="tel"
                type="tel"
                value={form.phoneNumber}
                onChange={e=>set('phoneNumber',e.target.value)}
                placeholder="+216 XX XXX XXX"
                style={getInpStyle(false, false)}
                onFocus={e=>{ e.target.style.borderColor=B; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={e=>{ e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none'; }}
              />
            </div>
          </Field>
        </SectionCard>

        {/* ── Section : Accès & Rôle ── */}
        <SectionCard title="Accès & Rôle" icon={<IconShield/>}>
          <Field label="Mot de passe" icon={<IconLock/>} required error={errors.password} hint={!errors.password ? "Transmettez ce mot de passe à l'employé pour sa première connexion." : ''}>
            <SPassword value={form.password} onChange={e=>set('password',e.target.value)} hasError={!!errors.password}/>
          </Field>
          <Field label="Rôle" icon={<IconShield/>} required error={errors.role}>
            <SSelect value={form.role} onChange={e=>set('role',e.target.value)} hasError={!!errors.role}>
              <option value="">— Choisir un rôle —</option>
              {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </SSelect>
          </Field>
        </SectionCard>

        {/* ── Section : Poste & Département ── */}
        <SectionCard
          title={isEmployee ? "Poste & Département *" : "Poste & Département"}
          icon={<IconBuilding/>}
        >
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
                {/* BUG FIX: "— Choisir un poste —" only appears as placeholder when no dept selected;
                    when dept is selected it should NOT be an option the user can pick → disabled + hidden */}
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

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width:'100%', padding:'13px', borderRadius:'10px', background:B, color:'#fff', border:'none', fontWeight:700, fontSize:'15px', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 16px rgba(37,99,235,0.35)', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
        >
          {saving ? <><IconLoader/> Création en cours…</> : <><IconPlus/> Créer l'utilisateur</>}
        </button>
      </div>
    </>
  );
};

export default CompanyUserCreate;