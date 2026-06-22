import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ForgetPassword = () => {
  const navigate    = useNavigate();
  const [email,    setEmail]   = useState('');
  const [error,    setError]   = useState('');
  const [success,  setSuccess] = useState('');
  const [loading,  setLoading] = useState(false);
  const [sent,     setSent]    = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email) { setError('Veuillez entrer votre adresse email'); return; }
    setLoading(true);
    try {
      await authService.forgetPassword({ email });
      setSent(true);
      setSuccess('Un email avec votre nouveau mot de passe a été envoyé !');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8', padding:'24px 16px', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        <div style={{ background:'#fff', borderRadius:'20px', padding:'40px 36px', boxShadow:'0 8px 40px rgba(15,23,42,.1), 0 1px 4px rgba(15,23,42,.05)', border:'1px solid #e2e8f0' }}>

          {/* Bouton retour */}
          <button onClick={() => navigate('/login')} style={{ display:'flex', alignItems:'center', gap:'6px', background:'#f1f5f9', border:'none', padding:'7px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:600, color:'#64748b', fontSize:'12.5px', fontFamily:'inherit', marginBottom:'24px', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#e2e8f0'; e.currentTarget.style.color='#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#64748b'; }}>
            <i className="ri-arrow-left-line"></i> Retour
          </button>

          {!sent ? (
            <>
              {/* Header */}
              <div style={{ textAlign:'center', marginBottom:'28px' }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,#f59e0b,#d97706)', marginBottom:'14px', boxShadow:'0 4px 14px rgba(245,158,11,.3)' }}>
                  <i className="ri-lock-password-line" style={{ color:'#fff', fontSize:'24px' }}></i>
                </div>
                <h1 style={{ margin:'0 0 6px', fontSize:'20px', fontWeight:800, color:'#0f172a' }}>Mot de passe oublié</h1>
                <p style={{ margin:0, fontSize:'13.5px', color:'#64748b', lineHeight:1.6 }}>
                  Entrez votre email et nous vous enverrons un nouveau mot de passe.
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', padding:'10px 14px', borderRadius:'9px', marginBottom:'16px', fontSize:'13px', fontWeight:600 }}>
                  <i className="ri-error-warning-fill" style={{ flexShrink:0 }}></i>{error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.4px' }}>
                    Email
                  </label>
                  <div style={{ position:'relative' }}>
                    <i className="ri-mail-line" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'15px', pointerEvents:'none' }}></i>
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required disabled={loading} placeholder="votre@email.com" autoComplete="email"
                      style={{ width:'100%', padding:'11px 12px 11px 36px', borderRadius:'9px', border:'1.5px solid #e2e8f0', fontSize:'13px', fontFamily:'inherit', outline:'none', background:'#f8fafc', color:'#0f172a', boxSizing:'border-box', transition:'all .15s' }}
                      onFocus={e => { e.target.style.borderColor='#f59e0b'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(245,158,11,.1)'; }}
                      onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; e.target.style.boxShadow='none'; }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  width:'100%', padding:'12px', borderRadius:'10px', border:'none',
                  background: loading ? '#94a3b8':'linear-gradient(135deg,#f59e0b,#d97706)',
                  color:'#fff', fontSize:'14px', fontWeight:700, fontFamily:'inherit',
                  cursor: loading ? 'not-allowed':'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  boxShadow: loading ? 'none':'0 4px 14px rgba(245,158,11,.35)',
                  transition:'all .2s',
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform='none'}>
                  {loading
                    ? <><i className="ri-loader-4-line" style={{ animation:'spin .8s linear infinite' }}></i>Envoi en cours...</>
                    : <><i className="ri-mail-send-line"></i>Envoyer le lien</>
                  }
                </button>
              </form>
            </>
          ) : (
            /* État succès */
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'64px', height:'64px', borderRadius:'50%', background:'#dcfce7', marginBottom:'16px' }}>
                <i className="ri-mail-check-line" style={{ color:'#16a34a', fontSize:'28px' }}></i>
              </div>
              <h2 style={{ margin:'0 0 10px', fontSize:'18px', fontWeight:800, color:'#0f172a' }}>Email envoyé !</h2>
              <p style={{ margin:'0 0 24px', fontSize:'13.5px', color:'#64748b', lineHeight:1.7 }}>
                {success}<br />
                <span style={{ fontSize:'12px', color:'#94a3b8' }}>Vérifiez votre boîte de réception (et les spams).</span>
              </p>
              <button onClick={() => navigate('/login')} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'9px', border:'none', background:'linear-gradient(135deg,#2563eb,#1e40af)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(37,99,235,.3)' }}>
                <i className="ri-login-box-line"></i> Aller à la connexion
              </button>
            </div>
          )}

          {/* Footer */}
          {!sent && (
            <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px solid #f1f5f9', textAlign:'center' }}>
              <p style={{ margin:0, fontSize:'13px', color:'#94a3b8' }}>
                Vous vous souvenez ?{' '}
                <Link to="/login" style={{ color:'#2563eb', fontWeight:700, textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                  Se connecter
                </Link>
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#94a3b8' }}>
          © {new Date().getFullYear()} AxiaWorkflow · Tous droits réservés
        </p>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
};

export default ForgetPassword;