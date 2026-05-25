import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import Footer from '../components/Layout/Footer';
import subscriptionService from '../services/subscriptionService';
import planService from '../services/planService';
import '../styles/Home.css';

const FEATURES = [
  { icon: '🔐', title: 'Sécurité avancée',  desc: 'JWT + rôles + permissions granulaires' },
  { icon: '⚡', title: 'Temps réel',        desc: 'Notifications et mises à jour instantanées' },
  { icon: '🎯', title: 'Rôles flexibles',   desc: 'Définissez des rôles sur mesure pour votre équipe' },
  { icon: '📊', title: 'Analytics',         desc: 'Suivez la performance avec des rapports détaillés' },
];

const DURATIONS = [
  { value: 1,  label: '1 mois',  discount: '',     multiplier: 1.00 },
  { value: 3,  label: '3 mois',  discount: '-5%',  multiplier: 0.95 },
  { value: 6,  label: '6 mois',  discount: '-10%', multiplier: 0.90 },
  { value: 12, label: '12 mois', discount: '-20%', multiplier: 0.80 },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
const SubscriptionModal = ({ plan, onClose }) => {
  const [form, setForm] = useState({
    companyName:     '',
    contactEmail:    '',   // ✅ corrigé (était "email")
    contactPhone:    '',   // ✅ corrigé (était "phone")
    matriculeFiscal: '',   // ✅ nouveau
    adminFirstName:  '',   // ✅ nouveau
    adminLastName:   '',   // ✅ nouveau
    adminEmail:      '',   // ✅ nouveau
    employeesCount:  '',   // ✅ corrigé (était "employees")
    sector:          '',
    message:         '',
    durationMonths:  1,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await subscriptionService.requestSubscription({
        companyName:     form.companyName,
        contactEmail:    form.contactEmail,
        contactPhone:    form.contactPhone,
        matriculeFiscal: form.matriculeFiscal || undefined,
        adminFirstName:  form.adminFirstName,
        adminLastName:   form.adminLastName,
        adminEmail:      form.adminEmail,
        employeesCount:  form.employeesCount,
        sector:          form.sector          || undefined,
        message:         form.message,
        durationMonths:  form.durationMonths,
        planId:          plan._id,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>✕</button>

        {success ? (
          <div className="modal-success">
            <div className="success-icon">🎉</div>
            <h3>Demande envoyée !</h3>
            <p>Votre demande pour le plan <strong>{plan.name}</strong> a été soumise. Notre équipe vous contactera sous 24h.</p>
            <button className="btn-primary full-width" onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3>Demande d'abonnement</h3>
              <p>Remplissez ce formulaire et nous vous recontactons rapidement.</p>
            </div>

            <div className="modal-plan-tag">
              📦 Plan {plan.name} — {plan.price}dt/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>

              {/* ── Entreprise ── */}
              <p style={{ fontSize:'12px', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 8px' }}>
                🏢 Informations de l'entreprise
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Nom de l'entreprise *</label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Acme Corp"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Matricule fiscale</label>
                  <input
                    name="matriculeFiscal"
                    value={form.matriculeFiscal}
                    onChange={handleChange}
                    placeholder="1234567A/P/M/000"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email de contact *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="contact@acme.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleChange}
                    placeholder="+216 XX XXX XXX"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Secteur d'activité</label>
                  <select name="sector" value={form.sector} onChange={handleChange} disabled={loading}>
                    <option value="">-- Sélectionner --</option>
                    <option value="tech">Technologie / IT</option>
                    <option value="commerce">Commerce</option>
                    <option value="industrie">Industrie</option>
                    <option value="sante">Santé</option>
                    <option value="education">Éducation</option>
                    <option value="finance">Finance</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nombre d'employés</label>
                  <select name="employeesCount" value={form.employeesCount} onChange={handleChange} disabled={loading}>
                    <option value="">-- Sélectionner --</option>
                    <option value="1-10">1 – 10</option>
                    <option value="11-50">11 – 50</option>
                    <option value="51-200">51 – 200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
              </div>

              {/* ── Admin ── */}
              <p style={{ fontSize:'12px', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:'16px 0 8px' }}>
                👤 Compte administrateur
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    name="adminFirstName"
                    value={form.adminFirstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    name="adminLastName"
                    value={form.adminLastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email administrateur *</label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={form.adminEmail}
                    onChange={handleChange}
                    placeholder="admin@acme.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* ── Durée ── */}
              <p style={{ fontSize:'12px', fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:'16px 0 8px' }}>
                📅 Durée de l'abonnement
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'6px', marginBottom:'12px' }}>
                {DURATIONS.map(d => (
                  <div
                    key={d.value}
                    onClick={() => !loading && setForm(prev => ({ ...prev, durationMonths: d.value }))}
                    style={{
                      padding:'10px 6px', borderRadius:'8px', textAlign:'center',
                      cursor: loading ? 'default' : 'pointer',
                      border: form.durationMonths === d.value
                        ? `2px solid ${plan.color || '#4f46e5'}`
                        : '2px solid #e2e8f0',
                      background: form.durationMonths === d.value ? '#eff6ff' : '#f8fafc',
                      transition:'all 0.15s',
                    }}
                  >
                    <p style={{ margin:0, fontWeight:700, fontSize:'12px', color:'#0f172a' }}>{d.label}</p>
                    {d.discount && <span style={{ fontSize:'10px', color:'#059669', fontWeight:700 }}>{d.discount}</span>}
                    <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#64748b' }}>
                      {Math.round(plan.price * d.value * d.multiplier)} dt
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Message ── */}
              <div className="form-group">
                <label>Message (optionnel)</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Décrivez vos besoins spécifiques..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer ma demande'}
              </button>

            </form>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Page Home ────────────────────────────────────────────────────────────────
const Home = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans,        setPlans]        = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    planService.getPublicPlans()
      .then(res => setPlans(res.data?.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  return (
    <div className="home-wrapper">
      <Navbar />

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-eyebrow">Plateforme de gestion de workflows</div>
          <h1>Gérez vos workflows<span>plus intelligemment</span></h1>
          <p>Axia Workflow vous permet de suivre vos projets, automatiser vos processus et collaborer efficacement.</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-primary">Commencer gratuitement</Link>
            <a href="#plans" className="btn-secondary">Voir les plans</a>
          </div>
          <div className="hero-social-proof">
            <span>Aucune carte requise</span>
            <span>Essai 14 jours gratuit</span>
            <span>Annulez à tout moment</span>
          </div>
        </div>
      </section>

      <section className="why-section">
        <div className="why-content">
          <h2>Pourquoi choisir Axia Workflow ?</h2>
          <p>Notre plateforme intuitive vous aide à organiser vos tâches, suivre l'avancement en temps réel et attribuer des rôles clairs.</p>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-item">
                <div className="feature-icon-big">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="plans-section" id="plans">
        <div className="plans-content">
          <div className="section-header">
            <span className="section-eyebrow">Tarification transparente</span>
            <h2>Choisissez votre plan</h2>
            <p>Des prix adaptés à chaque taille d'équipe. Pas de frais cachés.</p>
          </div>

          {plansLoading ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#64748b' }}>Chargement des plans...</div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#94a3b8' }}>Aucun plan disponible.</div>
          ) : (
            <div className="plans-grid">
              {plans.map(plan => (
                <div key={plan._id} className={`plan-card ${plan.isPopular ? 'plan-popular' : ''}`} style={{ borderTopColor: plan.color }}>
                  {plan.isPopular && <div className="plan-badge-popular">⭐ Plus populaire</div>}
                  <div className="plan-header">
                    <h3 className="plan-name">{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price-amount">{plan.price}dt</span>
                      <span className="price-period">/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                    </div>
                    <p className="plan-description">{plan.description}</p>
                  </div>
                  <div className="plan-limits">
                    <span>👥 {plan.maxUsers} utilisateurs</span>
                    <span>🔄 {plan.maxWorkflows} workflows</span>
                  </div>
                  <hr className="plan-divider" />
                  <ul className="plan-features">
                    {plan.features?.map((f, i) => (
                      <li key={i}><span className="feature-check">✓</span>{f}</li>
                    ))}
                  </ul>
                  <button
                    className={`plan-cta ${plan.isPopular ? 'cta-primary' : 'cta-outline'}`}
                    style={plan.isPopular ? { background: plan.color, borderColor: plan.color } : {}}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    Choisir {plan.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="plans-footer">
            <p>Besoin d'un plan personnalisé ? <a href="mailto:contact@axia-workflow.com" className="link-primary">Contactez-nous</a></p>
          </div>
        </div>
      </section>

      <Footer />

      {selectedPlan && (
        <SubscriptionModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      )}
    </div>
  );
};

export default Home;