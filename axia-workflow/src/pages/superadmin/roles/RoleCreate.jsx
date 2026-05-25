import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import roleService       from '../../../services/roleService';
import permissionService from '../../../services/permissionService';

const RoleCreate = () => {
  const [form, setForm]       = useState({ name: '', description: '', permissions: [] });
  const [permissions, setPermissions] = useState([]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    permissionService.getAll().then(r => setPermissions(r.data?.permissions || []));
  }, []);

  const togglePerm = (id) => setForm(prev => ({
    ...prev,
    permissions: prev.permissions.includes(id)
      ? prev.permissions.filter(x => x !== id)
      : [...prev.permissions, id],
  }));

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      await roleService.create(form);
      navigate('/dashboard/superadmin/roles', { state: { msg: '✅ Rôle créé !' } });
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div><h1>Créer un rôle</h1><p>Définissez les permissions associées</p></div>
        <Link to="/dashboard/superadmin/roles" className="sa-btn-secondary">← Retour</Link>
      </div>

      <div className="sa-form-card">
        {error && <div className="sa-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Informations</h4>
            <div className="sa-form-group">
              <label>Nom du rôle *</label>
              <input value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="ex: manager" required disabled={loading} />
            </div>
            <div className="sa-form-group">
              <label>Description</label>
              <input value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Description du rôle" disabled={loading} />
            </div>
          </div>

          <div className="sa-form-section">
            <h4 className="sa-form-section-title">
              Permissions ({form.permissions.length} sélectionnée(s))
            </h4>
            <div className="sa-perm-selector">
              {Object.entries(grouped).map(([cat, perms]) => (
                <div key={cat} className="sa-perm-category">
                  <div className="sa-perm-cat-title">{cat}</div>
                  <div className="sa-perm-list">
                    {perms.map(p => (
                      <label key={p._id} className="sa-perm-item">
                        <input type="checkbox"
                          checked={form.permissions.includes(p._id)}
                          onChange={() => togglePerm(p._id)} />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/roles" className="sa-btn-secondary">Annuler</Link>
            <button type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer le rôle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleCreate;