import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import permissionService from '../../../services/permissionService';

const CATEGORIES = ['users','roles','workflows','forms','execution','ai','supervision','notifications','files','audit'];

const PermissionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: '', description: '', category: 'users' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    permissionService.getAll().then(res => {
      const perm = res.data?.permissions?.find(p => p._id === id);
      if (perm) setForm({
        name:        perm.name,
        description: perm.description || '',
        category:    perm.category,
      });
    }).catch(console.error);
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      await permissionService.update(id, form);
      navigate('/dashboard/superadmin/permissions', { state: { msg: '✅ Permission modifiée !' } });
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div><h1>Modifier la permission</h1><p>Mettez à jour les informations</p></div>
        <Link to="/dashboard/superadmin/permissions" className="sa-btn-secondary">← Retour</Link>
      </div>

      <div className="sa-form-card">
        {error && <div className="sa-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Informations</h4>
            <div className="sa-form-group">
              <label>Nom *</label>
              <input name="name" value={form.name} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="sa-form-group">
              <label>Catégorie *</label>
              <select name="category" value={form.category} onChange={handleChange} disabled={loading}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sa-form-group">
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange} disabled={loading} />
            </div>
          </div>
          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/permissions" className="sa-btn-secondary">Annuler</Link>
            <button type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionEdit;