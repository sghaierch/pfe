import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';
import API from '../../services/api';
import '../../styles/Auth.css';

const DEPARTMENTS = ['RH','Finance','Achats','Opérations','Projets','IT','Marketing','Autre'];

const Register = () => {
  const [formData, setFormData] = useState({
    firstName:       '',
    lastName:        '',
    email:           '',
    password:        '',
    confirmPassword: '',
    roleName:        '',
    department:      '',
    jobTitle:        '',
    phoneNumber:     '',
    age:             '',
  });

  const [roles,        setRoles]        = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const navigate = useNavigate();

  // ✅ Charger les rôles depuis la DB au montage
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await API.get('/roles/public');
        const fetchedRoles = response.data?.data?.roles || [];
        setRoles(fetchedRoles);
        // Sélectionner le premier rôle par défaut
        if (fetchedRoles.length > 0) {
          setFormData(prev => ({ ...prev, roleName: fetchedRoles[0].name }));
        }
      } catch (err) {
        console.error('Erreur chargement rôles:', err);
        setError('Impossible de charger les rôles. Réessayez.');
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.roleName) {
      return setError('Veuillez sélectionner un rôle');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    if (formData.password.length < 8) {
      return setError('Le mot de passe doit contenir au moins 8 caractères');
    }

    setLoading(true);
    try {
      await authService.signup(formData);
      navigate('/login', { state: { message: 'Inscription réussie ! Connectez-vous.' } });
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <span className="logo-axia">Axia</span>
          <span className="logo-workflow">Workflow</span>
        </div>
        <h2>Créer un compte</h2>
        <p className="auth-subtitle">Rejoignez Axia Workflow dès aujourd'hui</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text" name="firstName" placeholder="Jean"
                value={formData.firstName} onChange={handleChange}
                required disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text" name="lastName" placeholder="Dupont"
                value={formData.lastName} onChange={handleChange}
                required disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email" name="email" placeholder="votre@email.com"
              value={formData.email} onChange={handleChange}
              required disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mot de passe *</label>
              <input
                type="password" name="password" placeholder="Minimum 8 caractères"
                value={formData.password} onChange={handleChange}
                required minLength="8" disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Confirmer *</label>
              <input
                type="password" name="confirmPassword" placeholder="Retapez le mot de passe"
                value={formData.confirmPassword} onChange={handleChange}
                required minLength="8" disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            {/* ✅ Rôles chargés dynamiquement depuis la DB */}
            <div className="form-group">
              <label>Rôle *</label>
              {rolesLoading ? (
                <div className="select-loading">Chargement des rôles...</div>
              ) : (
                <select
                  name="roleName"
                  value={formData.roleName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="">-- Sélectionner un rôle --</option>
                  {roles.map(r => (
                    <option key={r._id} value={r.name}>
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Département</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">-- Sélectionner --</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Poste</label>
              <input
                type="text" name="jobTitle" placeholder="Ex: Développeur"
                value={formData.jobTitle} onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel" name="phoneNumber" placeholder="+216 XX XXX XXX"
                value={formData.phoneNumber} onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '160px' }}>
            <label>Âge</label>
            <input
              type="number" name="age" placeholder="25"
              value={formData.age} onChange={handleChange}
              min="18" max="80" disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary full-width"
            disabled={loading || rolesLoading}
          >
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-link">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;