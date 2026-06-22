import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import profileService from '../../../services/profileService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconUser    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconLock    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconMail    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPhone   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.49 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconBriefcase = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconSave    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconKey     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IconAlert   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconCheck   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconEye     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEyeOff  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IconLoader  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

const B = '#2563EB';

// ── Password strength ──────────────────────────────────────────────────────
const getStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 10) score++;
  if ((pwd.match(/\d/g)||[]).length >= 5) score++;
  if ((pwd.match(/[a-zA-Z]/g)||[]).length >= 3) score++;
  if ((pwd.match(/[*\-\/+]/g)||[]).length >= 2) score++;
  return score; // 0-4
};
const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

// ── InputField component ───────────────────────────────────────────────────
const InputField = ({ label, icon, type='text', value, onChange, placeholder, disabled, hint, required, showToggle }) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = showToggle ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ display:'flex', flexDirection:'column', marginBottom:'18px', flex:1 }}>
      {/* Fixed height label (20px) so paired fields always align */}
      <label style={{ height:'20px', fontSize:'11px', fontWeight:700, color:'#64748B', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:'5px' }}>
        {icon && <span style={{color: B}}>{icon}</span>}
        {label}{required && <span style={{color:'#EF4444'}}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box',
            padding: showToggle ? '10px 42px 10px 14px' : '10px 14px',
            borderRadius:'9px',
            border: focused ? `2px solid ${B}` : '1.5px solid #E2E8F0',
            fontSize:'14px', color: disabled ? '#94A3B8' : '#0F172A',
            outline:'none', transition:'border-color 0.15s, box-shadow 0.15s',
            background: disabled ? '#F8FAFC' : '#fff',
            cursor: disabled ? 'not-allowed' : 'text',
            boxShadow: focused ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
            fontFamily:"'Inter',sans-serif",
          }}
        />
        {showToggle && (
          <button type="button" onClick={() => setShow(!show)}
            style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex', alignItems:'center' }}>
            {show ? <IconEyeOff/> : <IconEye/>}
          </button>
        )}
      </div>
      {hint && <p style={{ margin:'5px 0 0', fontSize:'11px', color:'#94A3B8', lineHeight:1.5 }}>{hint}</p>}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const UserProfile = () => {
  const { user, login } = useAuth();

  const [info, setInfo]             = useState({ firstName:'', lastName:'', phoneNumber:'', jobTitle:'' });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg]       = useState(null);

  const [pwd, setPwd]               = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg]         = useState(null);

  const isMustChange = !!user?.mustChangePassword;
  const strength = getStrength(pwd.newPassword);

  useEffect(() => {
    profileService.getMe().then(res => {
      const u = res.data?.user || {};
      setInfo({ firstName: u.firstName||'', lastName: u.lastName||'', phoneNumber: u.phoneNumber||'', jobTitle: u.jobTitle||'' });
    }).catch(()=>{});
  }, []);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true); setInfoMsg(null);
    try {
      const res = await profileService.updateMe(info);
      const updatedUser = res.data?.user;
      const stored = JSON.parse(localStorage.getItem('user')||'{}');
      const merged = { ...stored, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      login(localStorage.getItem('token'), merged);
      setInfoMsg({ type:'success', text:'Profil mis à jour avec succès.' });
    } catch (err) {
      setInfoMsg({ type:'error', text: err.message||'Erreur lors de la mise à jour.' });
    } finally { setInfoLoading(false); }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault(); setPwdMsg(null);
    if (pwd.newPassword !== pwd.confirmPassword)
      return setPwdMsg({ type:'error', text:'Les mots de passe ne correspondent pas.' });
    const regex = /^(?=(?:.*\d){5,})(?=(?:.*[a-zA-Z]){3,})(?=(?:.*[*\-\/+]){2,}).{10,}$/;
    if (!regex.test(pwd.newPassword))
      return setPwdMsg({ type:'error', text:'Minimum 10 caractères : 5 chiffres, 3 lettres, 2 symboles (* - / +)' });
    setPwdLoading(true);
    try {
      await profileService.changePassword(pwd.currentPassword, pwd.newPassword);
      const stored = JSON.parse(localStorage.getItem('user')||'{}');
      const merged = { ...stored, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(merged));
      login(localStorage.getItem('token'), merged);
      setPwd({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setPwdMsg({ type:'success', text:'Mot de passe modifié avec succès.' });
    } catch (err) {
      setPwdMsg({ type:'error', text: err.message||'Erreur lors du changement.' });
    } finally { setPwdLoading(false); }
  };

  const initials = `${info.firstName?.charAt(0)||''}${info.lastName?.charAt(0)||''}`.toUpperCase();

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .up-btn:hover { background: #1D4ED8 !important; box-shadow: 0 6px 18px rgba(37,99,235,0.4) !important; transform: translateY(-1px); }
        .up-btn:disabled { opacity: 0.7 !important; cursor: not-allowed !important; transform: none !important; }
        .up-card { transition: box-shadow 0.2s; }
        .up-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.08) !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'960px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── Must-change banner ── */}
        {isMustChange && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626', borderRadius:'10px', padding:'14px 18px', marginBottom:'24px', fontSize:'14px', fontWeight:600, animation:'slideIn 0.3s ease' }}>
            <IconAlert/> Vous devez changer votre mot de passe temporaire avant de continuer.
          </div>
        )}

        {/* ── Profile header ── */}
        <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'32px', padding:'24px 28px', background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ width:'68px', height:'68px', borderRadius:'16px', background:`linear-gradient(135deg, ${B}, #0EA5E9)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', fontWeight:800, flexShrink:0, boxShadow:'0 4px 14px rgba(37,99,235,0.35)', letterSpacing:'-1px' }}>
            {initials || '?'}
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:800, color:'#0F172A', letterSpacing:'-0.3px' }}>
              {info.firstName} {info.lastName}
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', color:'#64748B' }}>
                <IconMail/> {user?.email}
              </span>
              {info.jobTitle && (
                <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', color:'#64748B' }}>
                  <IconBriefcase/> {info.jobTitle}
                </span>
              )}
              {user?.role?.name && (
                <span style={{ padding:'3px 10px', borderRadius:'20px', background:'#EFF6FF', color:B, fontSize:'12px', fontWeight:700, border:'1px solid #BFDBFE' }}>
                  {user.role.name}
                </span>
              )}
            </div>
          </div>
          {!isMustChange && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'8px', background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A', fontSize:'12px', fontWeight:600, flexShrink:0 }}>
              <IconCheck/> Compte actif
            </div>
          )}
        </div>

        {/* ── Two column grid — align-items:stretch so both cards are same height ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'20px', alignItems:'start' }}>

          {/* ── Card: Infos personnelles ── */}
          <div className="up-card" style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', padding:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column' }}>
            {/* Card header */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', paddingBottom:'16px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'#EFF6FF', border:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:B }}>
                <IconUser/>
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:'15px', fontWeight:800, color:'#0F172A' }}>Informations personnelles</h2>
                <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>Vos informations de profil</p>
              </div>
            </div>

            <form onSubmit={handleInfoSubmit} style={{ display:'flex', flexDirection:'column', flex:1 }}>
              <div style={{ display:'flex', gap:'14px' }}>
                {/* Both fields share same icon size so labels are identical height */}
                <InputField label="Prénom" icon={<IconUser/>} value={info.firstName} onChange={e=>setInfo({...info,firstName:e.target.value})} required/>
                <InputField label="Nom"    icon={<IconUser/>} value={info.lastName}  onChange={e=>setInfo({...info,lastName:e.target.value})}  required/>
              </div>
              <InputField label="Poste / Titre" icon={<IconBriefcase/>} value={info.jobTitle} onChange={e=>setInfo({...info,jobTitle:e.target.value})} placeholder="Ex : Chef de projet"/>
              <InputField label="Téléphone" icon={<IconPhone/>} value={info.phoneNumber} onChange={e=>setInfo({...info,phoneNumber:e.target.value})} placeholder="+216 XX XXX XXX"/>
              <InputField label="Email" icon={<IconMail/>} value={user?.email||''} disabled/>
              <div style={{ flex:1 }}/>{/* spacer — pushes button to bottom */}

              {infoMsg && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 14px', borderRadius:'9px', marginBottom:'14px', animation:'slideIn 0.25s ease', ...(infoMsg.type==='success' ? { background:'#F0FDF4', border:'1.5px solid #BBF7D0', color:'#16A34A' } : { background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626' }) }}>
                  {infoMsg.type==='success' ? <IconCheck/> : <IconAlert/>}
                  <span style={{fontSize:'13px', fontWeight:500}}>{infoMsg.text}</span>
                </div>
              )}

              <button type="submit" className="up-btn" disabled={infoLoading}
                style={{ width:'100%', padding:'12px', background:B, color:'#fff', border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 14px rgba(37,99,235,0.3)', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                {infoLoading ? <><IconLoader/> Enregistrement…</> : <><IconSave/> Enregistrer les modifications</>}
              </button>
            </form>
          </div>

          {/* ── Card: Mot de passe ── */}
          <div className="up-card" style={{ background:'#fff', borderRadius:'16px', border: isMustChange ? '1.5px solid #FECACA' : '1.5px solid #E2E8F0', padding:'28px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column' }}>
            {/* Card header */}
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', paddingBottom:'16px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background: isMustChange ? '#FEF2F2' : '#EFF6FF', border: isMustChange ? '1px solid #FECACA' : '1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color: isMustChange ? '#DC2626' : B }}>
                <IconLock/>
              </div>
              <div>
                <h2 style={{ margin:0, fontSize:'15px', fontWeight:800, color:'#0F172A' }}>Changer le mot de passe</h2>
                <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>Sécurité de votre compte</p>
              </div>
            </div>

            {isMustChange && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 14px', borderRadius:'9px', marginBottom:'20px', background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626', fontSize:'13px', fontWeight:500 }}>
                <IconAlert/> Votre compte utilise un mot de passe temporaire. Veuillez le modifier maintenant.
              </div>
            )}

            <form onSubmit={handlePwdSubmit} style={{ display:'flex', flexDirection:'column', flex:1 }}>
              <InputField label="Mot de passe actuel" icon={<IconKey/>} value={pwd.currentPassword} onChange={e=>setPwd({...pwd,currentPassword:e.target.value})} required showToggle/>

              <InputField label="Nouveau mot de passe" icon={<IconLock/>} value={pwd.newPassword} onChange={e=>setPwd({...pwd,newPassword:e.target.value})} placeholder="Mot de passe sécurisé" required showToggle
                hint="Min. 10 caractères · 5 chiffres · 3 lettres · 2 symboles (* - / +)"/>

              {/* Strength bar */}
              {pwd.newPassword && (
                <div style={{ marginTop:'-10px', marginBottom:'16px' }}>
                  <div style={{ display:'flex', gap:'4px', marginBottom:'5px' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: strength >= i ? strengthColor[strength] : '#E2E8F0', transition:'background 0.3s' }}/>
                    ))}
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:600, color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
                </div>
              )}

              <InputField label="Confirmer le mot de passe" icon={<IconLock/>} value={pwd.confirmPassword} onChange={e=>setPwd({...pwd,confirmPassword:e.target.value})} required showToggle/>

              {/* Match indicator */}
              {pwd.newPassword && pwd.confirmPassword && (
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'-10px', marginBottom:'16px', fontSize:'12px', fontWeight:600, color: pwd.newPassword===pwd.confirmPassword ? '#16A34A' : '#DC2626' }}>
                  {pwd.newPassword===pwd.confirmPassword ? <><IconCheck/> Les mots de passe correspondent</> : <><IconAlert/> Ne correspondent pas</>}
                </div>
              )}

              {pwdMsg && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'11px 14px', borderRadius:'9px', marginBottom:'14px', animation:'slideIn 0.25s ease', ...(pwdMsg.type==='success' ? { background:'#F0FDF4', border:'1.5px solid #BBF7D0', color:'#16A34A' } : { background:'#FEF2F2', border:'1.5px solid #FECACA', color:'#DC2626' }) }}>
                  {pwdMsg.type==='success' ? <IconCheck/> : <IconAlert/>}
                  <span style={{fontSize:'13px', fontWeight:500}}>{pwdMsg.text}</span>
                </div>
              )}

              <div style={{ flex:1 }}/>{/* spacer — aligns button with left card */}
              <button type="submit" className="up-btn" disabled={pwdLoading}
                style={{ width:'100%', padding:'12px', background:B, color:'#fff', border:'none', borderRadius:'9px', fontSize:'14px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', boxShadow:'0 4px 14px rgba(37,99,235,0.3)', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                {pwdLoading ? <><IconLoader/> Modification…</> : <><IconKey/> Modifier le mot de passe</>}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
};

export default UserProfile;
