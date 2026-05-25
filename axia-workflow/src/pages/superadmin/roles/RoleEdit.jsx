import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import roleService       from '../../../services/roleService';
import permissionService from '../../../services/permissionService';

const RoleEdit = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [form, setForm]               = useState({ name: '', description: '', permissions: [] });
  const [allPermissions, setAllPerms] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      setError('');
      try {
        const [permRes, roleRes] = await Promise.all([
          permissionService.getAll(),
          roleService.getOne(id),
        ]);

        setAllPerms(permRes.data?.permissions || []);

        const role = roleRes.data?.role;
        if (!role) throw new Error('Rôle introuvable');

        setForm({
          name:        role.name,
          description: role.description || '',
          permissions: role.permissions?.map(p =>
            typeof p === 'object' ? p._id : p
          ) || [],
        });
      } catch (err) {
        setError(err.message || 'Impossible de charger le rôle');
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  const togglePerm = (permId) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(x => x !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const grouped = allPermissions.reduce((acc, p) => {
    const cat = p.category || 'Autres';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await roleService.update(id, form);
      navigate('/dashboard/superadmin/roles', {
        state: { msg: '✅ Rôle modifié avec succès' }
      });
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="sa-page">
        <div className="sa-loading">Chargement du rôle...</div>
      </div>
    );
  }

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h1>Modifier le rôle</h1>
          <p>Mettez à jour les informations et permissions</p>
        </div>
        <Link to="/dashboard/superadmin/roles" className="sa-btn-secondary">← Retour</Link>
      </div>

      {error && <div className="sa-error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="sa-form-card">
        <form onSubmit={handleSubmit}>
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Informations de base</h4>
            <div className="sa-form-group">
              <label>Nom du rôle *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                disabled={saving}
                placeholder="Nom du rôle"
              />
            </div>
            <div className="sa-form-group">
              <label>Description</label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                disabled={saving}
                placeholder="Description du rôle"
              />
            </div>
          </div>

          <div className="sa-form-section">
            <h4 className="sa-form-section-title">
              Permissions ({form.permissions.length} sélectionnée(s))
            </h4>
            {Object.keys(grouped).length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                Aucune permission disponible
              </p>
            ) : (
              <div className="sa-perm-selector">
                {Object.entries(grouped).map(([cat, perms]) => (
                  <div key={cat} className="sa-perm-category">
                    <div className="sa-perm-cat-title">{cat}</div>
                    <div className="sa-perm-list">
                      {perms.map(p => (
                        <label key={p._id} className="sa-perm-item">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(p._id)}
                            onChange={() => togglePerm(p._id)}
                            disabled={saving}
                          />
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/roles" className="sa-btn-secondary">
              Annuler
            </Link>
            <button type="submit" className="sa-btn-primary" disabled={saving}>
              {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleEdit;