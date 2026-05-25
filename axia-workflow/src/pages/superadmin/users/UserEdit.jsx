import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import userService from '../../../services/userService';

const DEPARTMENTS = ['RH','Finance','Achats','Opérations','Projets','IT','Marketing','Autre'];

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'',
    department:'', jobTitle:'', phoneNumber:'', age:''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userService.getById(id).then(res => {
      const u = res.data?.user || res.data;
      if (u) setForm({
        firstName:   u.firstName   || '',
        lastName:    u.lastName    || '',
        email:       u.email       || '',
        department:  u.department  || '',
        jobTitle:    u.jobTitle    || '',
        phoneNumber: u.phoneNumber || '',
        age:         u.age         || '',
      });
    }).catch(console.error);
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      await userService.update(id, form);
      navigate('/dashboard/superadmin/users', { state: { msg: '✅ Utilisateur modifié !' } });
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
    } finally { setLoading(false); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div><h1>Modifier l'utilisateur</h1><p>Mettez à jour les informations</p></div>
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
            <h4 className="sa-form-section-title">Département & Poste</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Département</label>
                <select name="department" value={form.department} onChange={handleChange} disabled={loading}>
                  <option value="">-- Sélectionner --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sa-form-group">
                <label>Poste</label>
                <input name="jobTitle" value={form.jobTitle} onChange={handleChange} disabled={loading} />
              </div>
            </div>
          </div>

          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/users" className="sa-btn-secondary">Annuler</Link>
            <button type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEdit;