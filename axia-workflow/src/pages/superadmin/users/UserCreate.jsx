import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../../../services/userService';
import roleService from '../../../services/roleService';

const DEPARTMENTS = ['RH','Finance','Achats','Opérations','Projets','IT','Marketing','Autre'];

const UserCreate = () => {
  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', password:'', confirmPassword:'',
    roleName:'', department:'', jobTitle:'', phoneNumber:'', age:''
  });
  const [roles,   setRoles]   = useState([]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    roleService.getAll().then(r => setRoles(r.data?.roles || []));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) return setError('Mots de passe différents');
    setLoading(true);
    try {
      await userService.create(form);
      navigate('/dashboard/superadmin/users', { state: { msg: '✅ Utilisateur créé !' } });
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div><h1>Créer un utilisateur</h1><p>Remplissez les informations ci-dessous</p></div>
        <Link to="/dashboard/superadmin/users" className="sa-btn-secondary">← Retour</Link>
      </div>

      <div className="sa-form-card">
        {error && <div className="sa-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Informations personnelles</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Prénom *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required disabled={loading} />
              </div>
              <div className="sa-form-group">
                <label>Nom *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required disabled={loading} />
              </div>
            </div>
            <div className="sa-form-group">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Téléphone</label>
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} disabled={loading} />
              </div>
              <div className="sa-form-group">
                <label>Âge</label>
                <input type="number" name="age" value={form.age} onChange={handleChange} min="18" max="80" disabled={loading} />
              </div>
            </div>
          </div>

          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Rôle & Département</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Rôle *</label>
                <select name="roleName" value={form.roleName} onChange={handleChange} required disabled={loading}>
                  <option value="">-- Sélectionner --</option>
                  {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div className="sa-form-group">
                <label>Département</label>
                <select name="department" value={form.department} onChange={handleChange} disabled={loading}>
                  <option value="">-- Sélectionner --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="sa-form-group">
              <label>Poste</label>
              <input name="jobTitle" value={form.jobTitle} onChange={handleChange} disabled={loading} />
            </div>
          </div>

          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Mot de passe</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Mot de passe *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required minLength="8" disabled={loading} />
              </div>
              <div className="sa-form-group">
                <label>Confirmer *</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required minLength="8" disabled={loading} />
              </div>
            </div>
          </div>

          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/users" className="sa-btn-secondary">Annuler</Link>
            <button type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserCreate;