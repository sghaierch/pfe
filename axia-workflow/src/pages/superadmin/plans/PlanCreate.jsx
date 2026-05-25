import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import planService from '../../../services/planService';

const COLORS = ['#4f46e5','#0891b2','#7c3aed','#059669','#d97706','#dc2626','#0f172a'];

const PlanCreate = () => {
  const [form, setForm] = useState({
    name: '', price: '', billingCycle: 'monthly', description: '',
    features: [''], maxUsers: 5, maxWorkflows: 10,
    isActive: true, isPopular: false, color: '#4f46e5', order: 0
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFeatureChange = (i, val) => {
    const features = [...form.features];
    features[i] = val;
    setForm({ ...form, features });
  };

  const addFeature    = () => setForm({ ...form, features: [...form.features, ''] });
  const removeFeature = (i) => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try {
      await planService.create({
        ...form,
        price: parseFloat(form.price),
        maxUsers: parseInt(form.maxUsers),
        maxWorkflows: parseInt(form.maxWorkflows),
        order: parseInt(form.order),
        features: form.features.filter(f => f.trim() !== ''),
      });
      navigate('/dashboard/superadmin/plans', { state: { msg: '✅ Plan créé !' } });
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div><h1>Créer un plan</h1><p>Définissez les détails et fonctionnalités</p></div>
        <Link to="/dashboard/superadmin/plans" className="sa-btn-secondary">← Retour</Link>
      </div>

      <div className="sa-form-card">
        {error && <div className="sa-error">{error}</div>}
        <form onSubmit={handleSubmit}>

          {/* Infos de base */}
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Informations de base</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Nom du plan *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="ex: Starter, Pro, Enterprise" required disabled={loading} />
              </div>
              <div className="sa-form-group">
                <label>Ordre d'affichage</label>
                <input type="number" name="order" value={form.order} onChange={handleChange}
                  min="0" disabled={loading} />
              </div>
            </div>
            <div className="sa-form-group">
              <label>Description</label>
              <input name="description" value={form.description} onChange={handleChange}
                placeholder="Description courte du plan" disabled={loading} />
            </div>
          </div>

          {/* Prix */}
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Tarification</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Prix (dt) *</label>
                <input type="number" name="price" value={form.price} onChange={handleChange}
                  placeholder="29" min="0" step="0.01" required disabled={loading} />
              </div>
              <div className="sa-form-group">
                <label>Cycle de facturation</label>
                <select name="billingCycle" value={form.billingCycle} onChange={handleChange} disabled={loading}>
                  <option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Limites */}
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Limites</h4>
            <div className="sa-form-row">
              <div className="sa-form-group">
                <label>Utilisateurs max</label>
                <input type="number" name="maxUsers" value={form.maxUsers} onChange={handleChange}
                  min="1" disabled={loading} />
              </div>
              <div className="sa-form-group">
                <label>Workflows max</label>
                <input type="number" name="maxWorkflows" value={form.maxWorkflows} onChange={handleChange}
                  min="1" disabled={loading} />
              </div>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Fonctionnalités incluses</h4>
            {form.features.map((f, i) => (
              <div key={i} className="sa-feature-row">
                <input value={f} onChange={e => handleFeatureChange(i, e.target.value)}
                  placeholder={`Fonctionnalité ${i + 1}`} disabled={loading} />
                {form.features.length > 1 && (
                  <button type="button" className="sa-btn-remove"
                    onClick={() => removeFeature(i)} disabled={loading}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="sa-btn-add-feature"
              onClick={addFeature} disabled={loading}>
              + Ajouter une fonctionnalité
            </button>
          </div>

          {/* Couleur & Options */}
          <div className="sa-form-section">
            <h4 className="sa-form-section-title">Apparence & Options</h4>
            <div className="sa-form-group">
              <label>Couleur du plan</label>
              <div className="sa-color-picker">
                {COLORS.map(c => (
                  <button key={c} type="button"
                    className={`sa-color-dot ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
            <div className="sa-form-row" style={{ gap: '32px', marginTop: '12px' }}>
              <label className="sa-checkbox-label">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                <span>Plan actif (visible publiquement)</span>
              </label>
              <label className="sa-checkbox-label">
                <input type="checkbox" name="isPopular" checked={form.isPopular} onChange={handleChange} />
                <span>⭐ Marquer comme populaire</span>
              </label>
            </div>
          </div>

          <div className="sa-form-actions">
            <Link to="/dashboard/superadmin/plans" className="sa-btn-secondary">Annuler</Link>
            <button type="submit" className="sa-btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer le plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanCreate;