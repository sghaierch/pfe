import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import permissionService from '../../../services/permissionService';


const CATEGORIES = ['users','roles','workflows','forms','execution','ai','supervision','notifications','files','audit'];

const PermissionCreate = () => {
  const [form, setForm]     = useState({ name: '', description: '', category: 'users' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      await permissionService.create(form);
      navigate('/dashboard/superadmin/permissions', { state: { msg: '✅ Permission créée !' } });
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div><h1>Créer une permission</h1><p>Définissez une nouvelle permission</p></div>
        <Link to="/dashboard/superadmin/permissions" className="sa-btn-secondary">← Retour</Link>
      </div>

      <div className="sa-form-card">
        {error && <div className="sa-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Informations</h4>
            <div className="sa-form-group">
              <label>Nom *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="ex: create_user" required disabled={loading} />
              <small style={{ color:'#94a3b8', marginTop:'4px', display:'block' }}>
                Utilisez le format snake_case
              </small>
            </div>
            <div className="sa-form-group">
              <label>Catégorie *</label>
              <select name="category" value={form.category} onChange={handleChange} disabled={loading}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sa-form-group">
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange}
                placeholder="Description de la permission" disabled={loading} />
            </div>
          </div>
          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/permissions" className="sa-btn-secondary">Annuler</Link>
            <button type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer la permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionCreate;