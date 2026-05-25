import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Tentative de connexion avec:', email);

      const response = await authService.signin({ email, password });

      if (response.status === 'success') {
        const token = response.token;
        const user = response.data?.user;

        if (!token || !user) {
          throw new Error('Réponse invalide : token ou user manquant');
        }

        console.log('✅ User reçu:', user);
        console.log('🏢 Tenant:', user.tenant);

        // Sauvegarde
        login(token, user);

        // ✅ Redirection immédiate basée sur user API
        let path;

        if (user.tenant) {
        const roleName = typeof user.role === 'object' ? user.role?.name : user.role;
        if (roleName === 'company_admin' || user.isCompanyAdmin) {
          path = '/dashboard/company';
        } else {
          path = '/dashboard/employee';
        }
        } else if (user.role?.name === 'superadmin') {
        path = '/dashboard/superadmin';
        } else {
        path = '/dashboard/company';
        }
        console.log('🚀 Redirection vers:', path);
        navigate(path, { replace: true });

      } else {
        throw new Error(response.message || 'Échec de connexion');
      }

    } catch (err) {
      console.error('❌ Erreur connexion:', err);
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
<div className="auth-container">

  <button
    type="button"
    onClick={() => navigate('/')}
    className="back-floating-btn"
  >
    ← Retour
  </button>

  <div className="auth-card">

        <div className="auth-logo">
          <span className="logo-axia">Axia</span>
          <span className="logo-workflow">Workflow</span>
        </div>

        <h2>Connexion</h2>
        <p className="auth-subtitle">
          Bienvenue ! Connectez-vous pour continuer
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forget-password">Mot de passe oublié ?</Link>
        </div>

      </div>
    </div>
  );
};

export default Login;