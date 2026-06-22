import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import API from '../../services/api';

const DEPARTMENTS = ['RH','Finance','Achats','Opérations','Projets','IT','Marketing','Autre'];

const inp = {
  width:'100%', padding:'10px 12px 10px 36px', borderRadius:'9px',
  border:'1.5px solid #e2e8f0', fontSize:'13px', fontFamily:'inherit',
  outline:'none', background:'#f8fafc', color:'#0f172a',
  boxSizing:'border-box', transition:'all .15s',
};
const inpNoIcon = { ...inp, paddingLeft:'12px' };
const lbl = {
  display:'block', fontSize:'11px', fontWeight:700, color:'#374151',
  marginBottom:'5px', textTransform:'uppercase', letterSpacing:'.4px',
};

const InputIcon = ({ icon, children }) => (
  <div style={{ position:'relative' }}>
    <i className={icon} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'14px', pointerEvents:'none' }}></i>
    {children}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName:'', lastName:'', email:'', password:'', confirmPassword:'',
    roleName:'', department:'', jobTitle:'', phoneNumber:'', age:'',
  });
  const [roles, setRoles]               = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error,  setError]              = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  useEffect(() => {
    API.get('/roles/public')
      .then(res => {
        const r = res.data?.data?.roles || [];
        setRoles(r);
        if (r.length > 0) setFormData(p => ({ ...p, roleName: r[0].name }));
      })
      .catch(() => setError('Impossible de charger les rôles.'))
      .finally(() => setRolesLoading(false));
  }, []);

  const handleChange = e => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };
  const focus = e => { e.target.style.borderColor='#2563eb'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,.1)'; };
  const blur  = e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; };

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (!formData.roleName)                                        return setError('Veuillez sélectionner un rôle');
    if (formData.password !== formData.confirmPassword)            return setError('Les mots de passe ne correspondent pas');
    if (formData.password.length < 8)                             return setError('Le mot de passe doit contenir au moins 8 caractères');
    setLoading(true);
    try {
      await authService.signup(formData);
      navigate('/login', { state: { message: 'Inscription réussie ! Connectez-vous.' } });
    } catch (err) { setError(err.message || "Erreur lors de l'inscription"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8', padding:'24px 16px', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'680px' }}>

        {/* Card */}
        <div style={{ background:'#fff', borderRadius:'20px', padding:'36px 40px', boxShadow:'0 8px 40px rgba(15,23,42,.1), 0 1px 4px rgba(15,23,42,.05)', border:'1px solid #e2e8f0' }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'48px', height:'48px', borderRadius:'13px', background:'linear-gradient(135deg,#2563eb,#1e40af)', marginBottom:'14px', boxShadow:'0 4px 14px rgba(37,99,235,.3)' }}>
              <i className="ri-flow-chart" style={{ color:'#fff', fontSize:'22px' }}></i>
            </div>
            <h1 style={{ margin:'0 0 5px', fontSize:'20px', fontWeight:800, color:'#0f172a' }}>Créer un compte</h1>
            <p style={{ margin:0, fontSize:'13.5px', color:'#64748b' }}>Rejoignez AxiaWorkflow dès aujourd'hui</p>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:'9px', marginBottom:'18px', fontSize:'13px', fontWeight:600 }}>
              <i className="ri-error-warning-fill" style={{ fontSize:'15px', flexShrink:0 }}></i>{error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

            {/* Prénom + Nom */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={lbl}>Prénom <span style={{ color:'#ef4444' }}>*</span></label>
                <InputIcon icon="ri-user-line">
                  <input type="text" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} required disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </InputIcon>
              </div>
              <div>
                <label style={lbl}>Nom <span style={{ color:'#ef4444' }}>*</span></label>
                <InputIcon icon="ri-user-line">
                  <input type="text" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} required disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </InputIcon>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={lbl}>Email <span style={{ color:'#ef4444' }}>*</span></label>
              <InputIcon icon="ri-mail-line">
                <input type="email" name="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
              </InputIcon>
            </div>

            {/* Mots de passe */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={lbl}>Mot de passe <span style={{ color:'#ef4444' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <i className="ri-lock-line" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'14px', pointerEvents:'none' }}></i>
                  <input type={showPwd ? 'text':'password'} name="password" placeholder="Min. 8 caractères" value={formData.password} onChange={handleChange} required minLength="8" disabled={loading} style={{ ...inp, paddingRight:'36px' }} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
                    <i className={showPwd ? 'ri-eye-off-line':'ri-eye-line'} style={{ fontSize:'15px' }}></i>
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Confirmer <span style={{ color:'#ef4444' }}>*</span></label>
                <div style={{ position:'relative' }}>
                  <i className="ri-lock-2-line" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'14px', pointerEvents:'none' }}></i>
                  <input type={showConfirm ? 'text':'password'} name="confirmPassword" placeholder="Retapez le mot de passe" value={formData.confirmPassword} onChange={handleChange} required minLength="8" disabled={loading} style={{ ...inp, paddingRight:'36px' }} onFocus={focus} onBlur={blur} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
                    <i className={showConfirm ? 'ri-eye-off-line':'ri-eye-line'} style={{ fontSize:'15px' }}></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Rôle + Département */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={lbl}>Rôle <span style={{ color:'#ef4444' }}>*</span></label>
                {rolesLoading ? (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', borderRadius:'9px', border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:'13px', color:'#94a3b8' }}>
                    <i className="ri-loader-4-line" style={{ animation:'spin .8s linear infinite' }}></i> Chargement...
                  </div>
                ) : (
                  <InputIcon icon="ri-shield-user-line">
                    <select name="roleName" value={formData.roleName} onChange={handleChange} disabled={loading} required style={{ ...inp, cursor:'pointer', appearance:'none' }}>
                      <option value="">-- Sélectionner --</option>
                      {roles.map(r => <option key={r._id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>)}
                    </select>
                  </InputIcon>
                )}
              </div>
              <div>
                <label style={lbl}>Département</label>
                <InputIcon icon="ri-building-line">
                  <select name="department" value={formData.department} onChange={handleChange} disabled={loading} style={{ ...inp, cursor:'pointer', appearance:'none' }}>
                    <option value="">-- Sélectionner --</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </InputIcon>
              </div>
            </div>

            {/* Poste + Téléphone + Âge */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 90px', gap:'12px' }}>
              <div>
                <label style={lbl}>Poste</label>
                <InputIcon icon="ri-briefcase-line">
                  <input type="text" name="jobTitle" placeholder="Ex: Développeur" value={formData.jobTitle} onChange={handleChange} disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </InputIcon>
              </div>
              <div>
                <label style={lbl}>Téléphone</label>
                <InputIcon icon="ri-phone-line">
                  <input type="tel" name="phoneNumber" placeholder="+216 XX XXX XXX" value={formData.phoneNumber} onChange={handleChange} disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </InputIcon>
              </div>
              <div>
                <label style={lbl}>Âge</label>
                <input type="number" name="age" placeholder="25" value={formData.age} onChange={handleChange} min="18" max="80" disabled={loading} style={inpNoIcon} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || rolesLoading} style={{
              width:'100%', padding:'12px', borderRadius:'10px', border:'none',
              background: (loading || rolesLoading) ? '#94a3b8':'linear-gradient(135deg,#2563eb,#1e40af)',
              color:'#fff', fontSize:'14px', fontWeight:700, fontFamily:'inherit',
              cursor: (loading || rolesLoading) ? 'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              boxShadow: (loading || rolesLoading) ? 'none':'0 4px 14px rgba(37,99,235,.35)',
              transition:'all .2s', marginTop:'4px',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => e.currentTarget.style.transform='none'}
            >
              {loading
                ? <><i className="ri-loader-4-line" style={{ animation:'spin .8s linear infinite' }}></i>Inscription...</>
                : <><i className="ri-user-add-line"></i>Créer mon compte</>
              }
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px solid #f1f5f9', textAlign:'center' }}>
            <p style={{ margin:0, fontSize:'13px', color:'#94a3b8' }}>
              Déjà un compte ?{' '}
              <Link to="/login" style={{ color:'#2563eb', fontWeight:700, textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#94a3b8' }}>
          © {new Date().getFullYear()} AxiaWorkflow · Tous droits réservés
        </p>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;