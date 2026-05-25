import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import planService from '../../services/planService';
import tenantService from '../../services/tenantService';
import '../../styles/CompanyRegistration.css';

const SECTORS = [
  'Informatique / Tech', 'Finance / Banque', 'Santé', 'Éducation',
  'BTP / Construction', 'Commerce / Retail', 'Industrie', 'Services', 'Autre'
];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const DURATIONS = [
  { value: 1,  label: '1 mois',  discount: '' },
  { value: 3,  label: '3 mois',  discount: '-5%' },
  { value: 6,  label: '6 mois',  discount: '-10%' },
  { value: 12, label: '12 mois', discount: '-20%' },
];

const CompanyRegistration = () => {
  const [step,    setStep]    = useState(1);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const [form, setForm] = useState({
    companyName:     '',
    matriculeFiscal: '',
    contactEmail:    '',
    contactPhone:    '',
    sector:          '',
    employeesCount:  '',
    address:         '',
    adminFirstName:  '',
    adminLastName:   '',
    adminEmail:      '',
    adminPassword:   '',
    adminConfirm:    '',
    planId:          '',
    durationMonths:  1,
    message:         '',
  });

  useEffect(() => {
    planService.getPublicPlans()
      .then(res => setPlans(res.data?.plans || []))
      .catch(() => setPlans([]));
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const selectPlan = (planId) => {
    setForm({ ...form, planId });
    setStep(2);
  };

  const selectedPlan = plans.find(p => p._id === form.planId);

  // Prix calculé selon durée
  const getPrice = () => {
    if (!selectedPlan) return 0;
    const discounts = { 1: 1, 3: 0.95, 6: 0.90, 12: 0.80 };
    return Math.round(selectedPlan.price * form.durationMonths * (discounts[form.durationMonths] || 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.companyName || !form.contactEmail || !form.adminFirstName ||
        !form.adminLastName || !form.adminEmail || !form.planId) {
      setError('Tous les champs obligatoires (*) doivent être remplis');
      return;
    }
    if (form.adminPassword && form.adminPassword !== form.adminConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.adminPassword && form.adminPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      await tenantService.createRequest({
        companyName:     form.companyName,
        matriculeFiscal: form.matriculeFiscal || undefined,
        contactEmail:    form.contactEmail,
        contactPhone:    form.contactPhone,
        sector:          form.sector,
        employeesCount:  form.employeesCount,
        address:         form.address,
        adminFirstName:  form.adminFirstName,
        adminLastName:   form.adminLastName,
        adminEmail:      form.adminEmail,
        adminPassword:   form.adminPassword || undefined,
        planId:          form.planId,
        durationMonths:  form.durationMonths,
        message:         form.message,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="registration-wrapper">
        <Navbar />
        <div className="registration-success">
          <div className="success-icon">🎉</div>
          <h1>Demande envoyée avec succès !</h1>
          <p>
            Votre demande d'inscription pour <strong>{form.companyName}</strong> a été soumise.
          </p>
          <p>
            Notre équipe va examiner votre demande et vous recevrez un email de confirmation
            dans les <strong>24-48 heures</strong> avec vos identifiants de connexion.
          </p>
          {form.matriculeFiscal && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '14px 20px', margin: '16px auto', maxWidth: '400px' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#166534', fontSize: '14px' }}>
                ✓ Matricule fiscal enregistré : {form.matriculeFiscal.toUpperCase()}
              </p>
            </div>
          )}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 20px', margin: '12px auto', maxWidth: '400px' }}>
            <p style={{ margin: 0, color: '#1d4ed8', fontSize: '14px' }}>
              Plan <strong>{selectedPlan?.name}</strong> —
              {form.durationMonths} mois — <strong>{getPrice()} dt</strong>
            </p>
          </div>
          <div className="success-actions">
            <Link to="/" className="btn-primary">Retour à l'accueil</Link>
            <Link to="/login" className="btn-secondary">Se connecter</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="registration-wrapper">
      <Navbar />
      <div className="registration-container">

        <div className="registration-header">
          <h1>Inscription Entreprise</h1>
          <p>Créez votre compte entreprise en 2 étapes simples</p>
        </div>

        {/* Steps */}
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Choisir un plan</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Informations</div>
          </div>
        </div>

        {/* ── ÉTAPE 1 — Plans ── */}
        {step === 1 && (
          <div className="step-content">
            <h2>Choisissez votre plan</h2>
            {plans.length === 0 && (
              <p style={{ textAlign: 'center', color: '#64748b' }}>Chargement des plans...</p>
            )}
            <div className="plans-grid">
              {plans.map(plan => (
                <div key={plan._id} className={`plan-card ${plan.isPopular ? 'popular' : ''}`} style={{ borderTopColor: plan.color }}>
                  {plan.isPopular && <div className="plan-badge">⭐ Recommandé</div>}
                  <h3>{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price-amount">{plan.price}dt</span>
                    <span className="price-period">/mois</span>
                  </div>
                  <p className="plan-desc">{plan.description}</p>
                  <div className="plan-limits">
                    <div>👥 {plan.maxUsers >= 99999 ? 'Illimité' : plan.maxUsers} utilisateurs</div>
                    <div>🔄 {plan.maxWorkflows >= 9999 ? 'Illimité' : plan.maxWorkflows} workflows</div>
                    {plan.hasAI && <div>✦ IA incluse</div>}
                  </div>
                  <ul className="plan-features">
                    {plan.features?.map((f, i) => <li key={i}>✓ {f}</li>)}
                  </ul>
                  <button
                    className="btn-select-plan"
                    style={plan.isPopular ? { background: plan.color } : {}}
                    onClick={() => selectPlan(plan._id)}
                  >
                    Choisir {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 — Formulaire ── */}
        {step === 2 && (
          <div className="step-content">
            <div className="form-header">
              <h2>Informations de l'entreprise</h2>
              <div className="selected-plan-badge">
                Plan : <strong>{selectedPlan?.name}</strong> — {selectedPlan?.price}dt/mois
                <button className="btn-change-plan" onClick={() => setStep(1)}>Changer</button>
              </div>
            </div>

            {error && <div className="error-message">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="registration-form">

              {/* ── Durée abonnement ── */}
              <div className="form-section">
                <h3>Durée de l'abonnement</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {DURATIONS.map(d => (
                    <div
                      key={d.value}
                      onClick={() => setForm({ ...form, durationMonths: d.value })}
                      style={{
                        padding: '14px 10px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                        border: form.durationMonths === d.value ? `2px solid ${selectedPlan?.color || '#4f46e5'}` : '2px solid #e2e8f0',
                        background: form.durationMonths === d.value ? '#eff6ff' : '#f8fafc',
                      }}
                    >
                      <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{d.label}</p>
                      {d.discount && (
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                          {d.discount}
                        </span>
                      )}
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                        {Math.round(selectedPlan?.price * d.value * ({ 1: 1, 3: 0.95, 6: 0.90, 12: 0.80 }[d.value] || 1))} dt
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Société ── */}
              <div className="form-section">
                <h3>Informations de l'entreprise</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom de l'entreprise *</label>
                    <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Corporation" required disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>Matricule fiscal <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '12px' }}>(identifiant unique)</span></label>
                    <input name="matriculeFiscal" value={form.matriculeFiscal} onChange={handleChange} placeholder="1234567A/N/M/001" disabled={loading} />
                    <small>Recommandé pour éviter les doublons</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email de contact *</label>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="contact@acme.com" required disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+216 XX XXX XXX" disabled={loading} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Secteur d'activité</label>
                    <select name="sector" value={form.sector} onChange={handleChange} disabled={loading}>
                      <option value="">-- Sélectionner --</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nombre d'employés</label>
                    <select name="employeesCount" value={form.employeesCount} onChange={handleChange} disabled={loading}>
                      <option value="">-- Sélectionner --</option>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Adresse de la société" disabled={loading} />
                </div>
              </div>

              {/* ── Admin ── */}
              <div className="form-section">
                <h3>Compte administrateur principal</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input name="adminFirstName" value={form.adminFirstName} onChange={handleChange} placeholder="Prénom" required disabled={loading} />
                  </div>
                  <div className="form-group">
                    <label>Nom *</label>
                    <input name="adminLastName" value={form.adminLastName} onChange={handleChange} placeholder="Nom" required disabled={loading} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email administrateur *</label>
                  <input type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} placeholder="admin@acme.com" required disabled={loading} />
                  <small>Cet email sera utilisé pour la première connexion</small>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input type="password" name="adminPassword" value={form.adminPassword} onChange={handleChange} placeholder="Minimum 8 caractères" disabled={loading} />
                    <small>Optionnel — un mot de passe temporaire sera généré si vide</small>
                  </div>
                  <div className="form-group">
                    <label>Confirmer le mot de passe</label>
                    <input type="password" name="adminConfirm" value={form.adminConfirm} onChange={handleChange} placeholder="Retaper le mot de passe" disabled={loading} />
                  </div>
                </div>
              </div>

              {/* ── Message ── */}
              <div className="form-group">
                <label>Message (optionnel)</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Décrivez vos besoins spécifiques..." rows={3} disabled={loading} />
              </div>

              {/* ── Récap ── */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>Récapitulatif</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Plan <strong>{selectedPlan?.name}</strong> — {form.durationMonths} mois
                  — Total : <strong style={{ color: '#4f46e5' }}>{getPrice()} dt</strong>
                  {form.durationMonths > 1 && <span style={{ color: '#059669', marginLeft: '8px', fontSize: '12px' }}>✓ Réduction appliquée</span>}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Accès pendant {form.durationMonths} mois après approbation. Suspendu automatiquement à l'expiration.
                </p>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)} disabled={loading}>← Retour</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? '⏳ Envoi en cours...' : 'Envoyer la demande →'}
                </button>
              </div>

            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CompanyRegistration;