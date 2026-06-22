import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const response = await authService.signin({ email, password });
      if (response.status === 'success') {
        const token = response.token;
        const user  = response.data?.user;
        if (!token || !user) throw new Error('Réponse invalide');
        login(token, user);
        let path;
        if (user.tenant) {
          const roleName = typeof user.role === 'object' ? user.role?.name : user.role;
          path = (roleName === 'company_admin' || user.isCompanyAdmin) ? '/dashboard/company' : '/dashboard/employee';
        } else if (user.role?.name === 'superadmin') {
          path = '/dashboard/superadmin';
        } else {
          path = '/dashboard/company';
        }
        navigate(path, { replace: true });
      } else {
        throw new Error(response.message || 'Échec de connexion');
      }
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#f0f4f8',
    }}>
      {/* ── Panneau gauche décoratif ── */}
      <div style={{
        flex: 1, display: 'none',
        background: 'linear-gradient(145deg, #1e40af 0%, #2563eb 40%, #3b82f6 100%)',
        position: 'relative', overflow: 'hidden',
      }} className="login-left-panel">
        {/* Cercles décoratifs */}
        {[
          { w:320, h:320, top:'-80px',  left:'-80px',  op:.12 },
          { w:220, h:220, top:'40%',    left:'60%',    op:.08 },
          { w:180, h:180, bottom:'-40px', right:'-40px', op:.15 },
        ].map((c, i) => (
          <div key={i} style={{
            position:'absolute', width:c.w, height:c.h, borderRadius:'50%',
            background:'rgba(255,255,255,.15)', top:c.top, left:c.left,
            bottom:c.bottom, right:c.right, opacity:c.op,
          }} />
        ))}
        <div style={{ position:'relative', zIndex:1, padding:'60px 48px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ marginBottom:'48px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'32px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="ri-flow-chart" style={{ color:'#fff', fontSize:'20px' }}></i>
              </div>
              <span style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>AxiaWorkflow</span>
            </div>
            <h2 style={{ fontSize:'32px', fontWeight:800, color:'#fff', margin:'0 0 16px', lineHeight:1.2 }}>
              Gérez vos workflows<br />en toute simplicité
            </h2>
            <p style={{ color:'rgba(255,255,255,.75)', fontSize:'15px', lineHeight:1.7, margin:0 }}>
              Automatisez vos processus, suivez vos équipes et optimisez votre productivité.
            </p>
          </div>
          {/* Features */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {[
              ['ri-shield-check-line', 'Sécurité renforcée & données chiffrées'],
              ['ri-team-line',         'Collaboration en temps réel'],
              ['ri-bar-chart-line',    'Analytics et rapports détaillés'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={icon} style={{ color:'#fff', fontSize:'16px' }}></i>
                </div>
                <span style={{ color:'rgba(255,255,255,.9)', fontSize:'14px', fontWeight:500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div style={{
        width: '100%', maxWidth: '480px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 32px', position: 'relative',
      }}>

        {/* Bouton retour */}
        <button onClick={() => navigate('/')} style={{
          position: 'absolute', top: '24px', left: '24px',
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#fff', border: '1.5px solid #e2e8f0', padding: '7px 14px',
          borderRadius: '9px', cursor: 'pointer', fontWeight: 600, color: '#64748b',
          fontSize: '13px', fontFamily: 'inherit', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='#2563eb'; e.currentTarget.style.color='#2563eb'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.color='#64748b'; }}
        >
          <i className="ri-arrow-left-line"></i> Accueil
        </button>

        {/* Card formulaire */}
        <div style={{
          background: '#fff', borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 8px 40px rgba(15,23,42,0.1), 0 1px 4px rgba(15,23,42,0.05)',
          border: '1px solid #e2e8f0',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,#2563eb,#1e40af)', marginBottom:'16px', boxShadow:'0 4px 14px rgba(37,99,235,.3)' }}>
              <i className="ri-flow-chart" style={{ color:'#fff', fontSize:'24px' }}></i>
            </div>
            <h1 style={{ margin:'0 0 6px', fontSize:'22px', fontWeight:800, color:'#0f172a' }}>Connexion</h1>
            <p style={{ margin:0, fontSize:'14px', color:'#64748b', fontWeight:400 }}>
              Bienvenue ! Connectez-vous pour continuer
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', padding: '11px 14px',
              borderRadius: '10px', marginBottom: '20px',
              fontSize: '13px', fontWeight: 600,
            }}>
              <i className="ri-error-warning-fill" style={{ fontSize: '16px', flexShrink: 0 }}></i>
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:'12px', fontWeight:700, color:'#374151', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.4px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <i className="ri-mail-line" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'15px', pointerEvents:'none' }}></i>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required disabled={loading}
                  placeholder="votre@email.com"
                  style={{
                    width:'100%', padding:'11px 12px 11px 38px', borderRadius:'9px',
                    border:'1.5px solid #e2e8f0', fontSize:'14px', fontFamily:'inherit',
                    outline:'none', background:'#f8fafc', color:'#0f172a',
                    boxSizing:'border-box', transition:'all .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,.1)'; }}
                  onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <label style={{ fontSize:'12px', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'.4px' }}>
                  Mot de passe
                </label>
                <Link to="/forget-password" style={{ fontSize:'12px', color:'#2563eb', textDecoration:'none', fontWeight:600 }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <i className="ri-lock-line" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'15px', pointerEvents:'none' }}></i>
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required disabled={loading}
                  placeholder="••••••••"
                  style={{
                    width:'100%', padding:'11px 40px 11px 38px', borderRadius:'9px',
                    border:'1.5px solid #e2e8f0', fontSize:'14px', fontFamily:'inherit',
                    outline:'none', background:'#f8fafc', color:'#0f172a',
                    boxSizing:'border-box', transition:'all .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor='#2563eb'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,.1)'; }}
                  onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{
                  position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'2px',
                  display:'flex', alignItems:'center',
                }}>
                  <i className={showPwd ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize:'16px' }}></i>
                </button>
              </div>
            </div>

            {/* Bouton submit */}
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', borderRadius:'10px', border:'none',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1e40af)',
              color:'#fff', fontSize:'14px', fontWeight:700, fontFamily:'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,.35)',
              transition:'all .2s', marginTop:'4px',
            }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='none'; }}
            >
              {loading
                ? <><i className="ri-loader-4-line" style={{ fontSize:'16px', animation:'spin .8s linear infinite' }}></i>Connexion en cours...</>
                : <><i className="ri-login-box-line" style={{ fontSize:'16px' }}></i>Se connecter</>
              }
            </button>
          </form>

          {/* Footer card */}
          <div style={{ marginTop:'24px', paddingTop:'20px', borderTop:'1px solid #f1f5f9', textAlign:'center' }}>
            <p style={{ margin:0, fontSize:'12.5px', color:'#94a3b8' }}>
              Vous êtes une entreprise ?{' '}
              <Link to="/company/register" style={{ color:'#2563eb', fontWeight:700, textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer page */}
        <p style={{ textAlign:'center', marginTop:'20px', fontSize:'12px', color:'#94a3b8' }}>
          © {new Date().getFullYear()} AxiaWorkflow · Tous droits réservés
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;