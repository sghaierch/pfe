import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import profileService from '../../../services/profileService';

const UserProfile = () => {
  const { user, login } = useAuth();

  // ── Info form ──
  const [info, setInfo]         = useState({ firstName: '', lastName: '', phoneNumber: '', jobTitle: '' });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg]   = useState(null);

  // ── Password form ──
  const [pwd, setPwd]           = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg]     = useState(null);

  const isMustChange = !!user?.mustChangePassword;

  useEffect(() => {
    profileService.getMe()
      .then(res => {
        const u = res.data?.user || {};
        setInfo({
          firstName:   u.firstName   || '',
          lastName:    u.lastName    || '',
          phoneNumber: u.phoneNumber || '',
          jobTitle:    u.jobTitle    || '',
        });
      })
      .catch(() => {});
  }, []);

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true); setInfoMsg(null);
    try {
      const res = await profileService.updateMe(info);
      const updatedUser = res.data?.user;
      // Mettre à jour le localStorage + contexte
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const merged = { ...stored, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(merged));
      login(localStorage.getItem('token'), merged);
      setInfoMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err) {
      setInfoMsg({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.newPassword !== pwd.confirmPassword) {
      return setPwdMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    }
    const passwordRegex = /^(?=(?:.*\d){5,})(?=(?:.*[a-zA-Z]){3,})(?=(?:.*[*\-\/+]){2,}).{10,}$/;
    if (!passwordRegex.test(pwd.newPassword)) {
      return setPwdMsg({
        type: 'error',
        text: 'Minimum 10 caractères : 5 chiffres, 3 lettres, 2 symboles (* - / +)'
      });
    }
    setPwdLoading(true);
    try {
      await profileService.changePassword(pwd.currentPassword, pwd.newPassword);
      // Mettre à jour mustChangePassword dans le contexte
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const merged = { ...stored, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(merged));
      login(localStorage.getItem('token'), merged);
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdMsg({ type: 'success', text: 'Mot de passe modifié avec succès.' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.message || 'Erreur lors du changement.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const s = styles;

  return (
    <div style={s.page}>

      {/* Bannière mustChangePassword */}
      {isMustChange && (
        <div style={s.mustChangeBanner}>
          🔐 Vous devez changer votre mot de passe temporaire avant de continuer.
        </div>
      )}

      <div style={s.header}>
        <div style={s.avatar}>
          {info.firstName?.charAt(0)}{info.lastName?.charAt(0)}
        </div>
        <div>
          <h1 style={s.name}>{info.firstName} {info.lastName}</h1>
          <p style={s.role}>{user?.role?.name} · {user?.email}</p>
        </div>
      </div>

      <div style={s.grid}>

        {/* ── Informations personnelles ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>👤 Informations personnelles</h2>
          <form onSubmit={handleInfoSubmit}>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>Prénom</label>
                <input style={s.input} value={info.firstName}
                  onChange={e => setInfo({ ...info, firstName: e.target.value })} required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Nom</label>
                <input style={s.input} value={info.lastName}
                  onChange={e => setInfo({ ...info, lastName: e.target.value })} required />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Poste / Titre</label>
              <input style={s.input} value={info.jobTitle}
                onChange={e => setInfo({ ...info, jobTitle: e.target.value })}
                placeholder="Ex: Chef de projet" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Téléphone</label>
              <input style={s.input} value={info.phoneNumber}
                onChange={e => setInfo({ ...info, phoneNumber: e.target.value })}
                placeholder="+216 XX XXX XXX" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input style={{ ...s.input, background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed' }}
                value={user?.email || ''} disabled />
            </div>
            {infoMsg && <div style={infoMsg.type === 'success' ? s.successMsg : s.errorMsg}>{infoMsg.text}</div>}
            <button type="submit" style={s.btn} disabled={infoLoading}>
              {infoLoading ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        {/* ── Changement mot de passe ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>🔑 Changer le mot de passe</h2>
          {isMustChange && (
            <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '16px', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', margin: '0 0 16px' }}>
              Votre compte utilise un mot de passe temporaire. Veuillez le modifier maintenant.
            </p>
          )}
          <form onSubmit={handlePwdSubmit}>
            <div style={s.field}>
              <label style={s.label}>Mot de passe actuel</label>
              <input style={s.input} type="password" value={pwd.currentPassword}
                onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })} required />
            </div>
            <div style={s.field}>
            <label style={s.label}>Nouveau mot de passe</label>
            <input
              style={s.input}
              type="password"
              value={pwd.newPassword}
              onChange={e => setPwd({ ...pwd, newPassword: e.target.value })}
              placeholder="Mot de passe sécurisé"
              required
            />

            <p style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '6px',
              lineHeight: '1.5'
            }}>
              Minimum 10 caractères : 5 chiffres, 3 lettres, 2 symboles (* - / +)
              <br />
              Ex : abc12345/*
            </p>
          </div>
            <div style={s.field}>
              <label style={s.label}>Confirmer le nouveau mot de passe</label>
              <input style={s.input} type="password" value={pwd.confirmPassword}
                onChange={e => setPwd({ ...pwd, confirmPassword: e.target.value })} required />
            </div>
            {pwdMsg && <div style={pwdMsg.type === 'success' ? s.successMsg : s.errorMsg}>{pwdMsg.text}</div>}
            <button type="submit" style={s.btn} disabled={pwdLoading}>
              {pwdLoading ? 'Modification…' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

const styles = {
  page: {
    padding: '32px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  mustChangeBanner: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    borderRadius: '10px',
    padding: '14px 20px',
    marginBottom: '24px',
    fontWeight: 600,
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '32px',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 700,
    flexShrink: 0,
  },
  name: { margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#0f172a' },
  role: { margin: 0, fontSize: '13px', color: '#64748b' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    margin: '0 0 24px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    paddingBottom: '14px',
    borderBottom: '1px solid #f1f5f9',
  },
  row: { display: 'flex', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', marginBottom: '16px', flex: 1 },
  label: { fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fff',
  },
  btn: {
    marginTop: '8px',
    width: '100%',
    padding: '11px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  successMsg: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#166534',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  errorMsg: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
};

export default UserProfile;
