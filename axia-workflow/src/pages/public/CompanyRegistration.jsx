import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Layout/Navbar';
import Footer from '../../components/Layout/Footer';
import planService from '../../services/planService';
import tenantService from '../../services/tenantService';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconCheck = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconSparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.88 5.63L19 10l-5.12 1.37L12 17l-1.88-5.63L5 10l5.12-1.37L12 3z"/>
    <path d="M5 3l.88 2.63L8 7l-2.12.37L5 10l-.88-2.63L2 7l2.12-.37L5 3z"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <path d="M9 22V12h6v10M3 9h18"/>
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconParty = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.8 11.3L2 22l10.7-3.79"/>
    <path d="M4 3h.01"/>
    <path d="M22 8h.01"/>
    <path d="M15 2h.01"/>
    <path d="M22 20h.01"/>
    <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/>
    <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/>
    <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/>
    <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z"/>
  </svg>
);
const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// ── Constants ──────────────────────────────────────────────────────────────
const SECTORS = [
  'Informatique / Tech', 'Finance / Banque', 'Santé', 'Éducation',
  'BTP / Construction', 'Commerce / Retail', 'Industrie', 'Services', 'Autre',
];
const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];
const DURATIONS = [
  { value: 1,  label: '1 mois',  discount: null,  discountNum: 1.00 },
  { value: 3,  label: '3 mois',  discount: '−5%', discountNum: 0.95 },
  { value: 6,  label: '6 mois',  discount: '−10%',discountNum: 0.90 },
  { value: 12, label: '12 mois', discount: '−20%',discountNum: 0.80 },
];

// ── Shared Design Tokens ───────────────────────────────────────────────────
const token = {
  bg:          '#0A0F1E',
  bgCard:      '#111827',
  bgInput:     '#0D1424',
  border:      'rgba(37,99,235,0.15)',
  borderSubtle:'rgba(255,255,255,0.06)',
  primary:     '#2563EB',
  primaryMid:  '#60A5FA',
  accent:      '#1D4ED8',
  success:     '#10B981',
  danger:      '#EF4444',
  textPrimary: '#F8FAFF',
  textSub:     '#94A3B8',
  textMuted:   '#475569',
  radius:      '12px',
  radiusSm:    '8px',
  font:        "'Inter', -apple-system, sans-serif",
};

// ── Base Input Style ───────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 14px', borderRadius: token.radiusSm,
  background: token.bgInput,
  border: `1px solid rgba(37,99,235,0.2)`,
  color: token.textPrimary, fontSize: '14px',
  fontFamily: token.font,
  outline: 'none', transition: 'border-color 0.15s',
};

// ── Section Heading ────────────────────────────────────────────────────────
const SectionHeading = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    marginBottom: '20px', paddingBottom: '12px',
    borderBottom: `1px solid ${token.borderSubtle}`,
  }}>
    <span style={{ color: token.primary }}>{icon}</span>
    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: token.textSub, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</h3>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const CompanyRegistration = () => {
  const [step,    setStep]    = useState(1);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const [form, setForm] = useState({
    companyName: '', matriculeFiscal: '', contactEmail: '', contactPhone: '',
    sector: '', employeesCount: '', address: '',
    adminFirstName: '', adminLastName: '', adminEmail: '',
    adminPassword: '', adminConfirm: '', planId: '', durationMonths: 1, message: '',
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

  const selectPlan = (planId) => { setForm({ ...form, planId }); setStep(2); };

  const selectedPlan = plans.find(p => p._id === form.planId);

  const getPrice = () => {
    if (!selectedPlan) return 0;
    const d = { 1: 1, 3: 0.95, 6: 0.90, 12: 0.80 };
    return Math.round(selectedPlan.price * form.durationMonths * (d[form.durationMonths] || 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.companyName || !form.contactEmail || !form.adminFirstName || !form.adminLastName || !form.adminEmail || !form.planId) {
      setError('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }
    if (form.adminPassword && form.adminPassword !== form.adminConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.adminPassword && form.adminPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    try {
      await tenantService.createRequest({
        companyName: form.companyName, matriculeFiscal: form.matriculeFiscal || undefined,
        contactEmail: form.contactEmail, contactPhone: form.contactPhone,
        sector: form.sector, employeesCount: form.employeesCount, address: form.address,
        adminFirstName: form.adminFirstName, adminLastName: form.adminLastName,
        adminEmail: form.adminEmail, adminPassword: form.adminPassword || undefined,
        planId: form.planId, durationMonths: form.durationMonths, message: form.message,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const wrap = { background: token.bg, minHeight: '100vh', fontFamily: token.font };

  // ── Success Screen ─────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={wrap}>
        <Navbar />
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 24px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(29,78,216,0.15))',
            border: `1px solid rgba(37,99,235,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA',
          }}>
            <IconParty />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: token.textPrimary, marginBottom: '12px' }}>
            Demande envoyée !
          </h1>
          <p style={{ color: token.textSub, fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>
            La demande pour <strong style={{ color: token.textPrimary }}>{form.companyName}</strong> a bien été reçue.
            Notre équipe vous contactera dans les <strong style={{ color: token.textPrimary }}>24–48 h</strong>.
          </p>

          {form.matriculeFiscal && (
            <div style={{
              margin: '20px auto', padding: '14px 18px', borderRadius: token.radius,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ color: token.success }}><IconCheck size={16} /></span>
              <span style={{ color: '#6EE7B7', fontSize: '13px', fontWeight: 600 }}>
                Matricule fiscal enregistré : {form.matriculeFiscal.toUpperCase()}
              </span>
            </div>
          )}

          <div style={{
            margin: '16px auto', padding: '14px 18px', borderRadius: token.radius,
            background: 'rgba(37,99,235,0.08)', border: `1px solid ${token.border}`,
          }}>
            <p style={{ margin: 0, color: token.primaryMid, fontSize: '14px' }}>
              Plan <strong>{selectedPlan?.name}</strong> · {form.durationMonths} mois · <strong>{getPrice()} dt</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'center' }}>
            <Link to="/" style={{
              padding: '10px 20px', borderRadius: token.radiusSm,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${token.borderSubtle}`,
              color: token.textSub, fontSize: '14px', fontWeight: 500, textDecoration: 'none',
            }}>
              Retour à l'accueil
            </Link>
            <Link to="/login" style={{
              padding: '10px 20px', borderRadius: token.radiusSm,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(37,99,235,0.35)',
            }}>
              Se connecter
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <Navbar />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #475569; }
        select option { background: #111827; color: #F8FAFF; }
        input:focus, select:focus, textarea:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      `}</style>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '100px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', borderRadius: '20px', marginBottom: '16px',
            background: 'rgba(37,99,235,0.1)', border: `1px solid ${token.border}`,
            color: token.primaryMid, fontSize: '13px', fontWeight: 600,
          }}>
            <IconBuilding /> Inscription Entreprise
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: token.textPrimary, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Créez votre espace de travail
          </h1>
          <p style={{ color: token.textSub, fontSize: '16px', margin: 0 }}>
            Configuration en 2 étapes · Activation sous 48h
          </p>
        </div>

        {/* Steps Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', gap: '0' }}>
          {[
            { n: 1, label: 'Choisir un plan' },
            { n: 2, label: 'Vos informations' },
          ].map(({ n, label }, i) => (
            <React.Fragment key={n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: step >= n ? 'linear-gradient(135deg, #2563EB, #1D4ED8)' : 'rgba(255,255,255,0.05)',
                  border: step >= n ? 'none' : `1px solid ${token.borderSubtle}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: step >= n ? '#fff' : token.textMuted,
                  fontSize: step > n ? '14px' : '14px', fontWeight: 700,
                  boxShadow: step >= n ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {step > n ? <IconCheck size={15} /> : n}
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: step === n ? 700 : 500,
                  color: step === n ? token.textPrimary : token.textMuted,
                }}>
                  {label}
                </span>
              </div>
              {i === 0 && (
                <div style={{
                  width: '80px', height: '1px', margin: '0 16px',
                  background: step >= 2 ? token.primary : token.borderSubtle,
                  transition: 'background 0.3s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1 — Plans ── */}
        {step === 1 && (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 700, color: token.textPrimary, marginBottom: '32px' }}>
              Choisissez votre plan
            </h2>
            {plans.length === 0 && (
              <p style={{ textAlign: 'center', color: token.textMuted }}>Chargement des plans…</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {plans.map(plan => (
                <div key={plan._id} style={{
                  borderRadius: '16px', overflow: 'hidden', position: 'relative',
                  background: token.bgCard,
                  border: plan.isPopular ? `1px solid rgba(37,99,235,0.5)` : `1px solid ${token.borderSubtle}`,
                  boxShadow: plan.isPopular ? '0 0 40px rgba(37,99,235,0.15)' : 'none',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Top color stripe */}
                  <div style={{ height: '3px', background: plan.color || token.primary }} />

                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {plan.isPopular && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '20px', marginBottom: '14px',
                        background: 'rgba(37,99,235,0.12)', border: `1px solid ${token.border}`,
                        color: token.primaryMid, fontSize: '11px', fontWeight: 700,
                        alignSelf: 'flex-start',
                      }}>
                        <IconStar /> Recommandé
                      </div>
                    )}

                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800, color: token.textPrimary }}>{plan.name}</h3>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '30px', fontWeight: 800, color: token.textPrimary }}>{plan.price}</span>
                      <span style={{ color: token.textMuted, fontSize: '14px' }}> dt/mois</span>
                    </div>
                    <p style={{ color: token.textSub, fontSize: '13px', lineHeight: 1.6, marginBottom: '16px', flex: 1 }}>
                      {plan.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: token.textSub, fontSize: '13px' }}>
                        <span style={{ color: token.primary }}><IconUsers /></span>
                        {plan.maxUsers >= 99999 ? 'Utilisateurs illimités' : `${plan.maxUsers} utilisateurs`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: token.textSub, fontSize: '13px' }}>
                        <span style={{ color: token.primary }}><IconRefresh /></span>
                        {plan.maxWorkflows >= 9999 ? 'Workflows illimités' : `${plan.maxWorkflows} workflows`}
                      </div>
                      {plan.hasAI && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: token.textSub, fontSize: '13px' }}>
                          <span style={{ color: '#F59E0B' }}><IconSparkles /></span>
                          IA incluse
                        </div>
                      )}
                    </div>

                    {plan.features?.length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '0 0 20px', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {plan.features.map((f, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: token.textSub }}>
                            <span style={{ color: token.success, flexShrink: 0 }}><IconCheck /></span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={() => selectPlan(plan._id)}
                      style={{
                        width: '100%', padding: '11px', borderRadius: token.radiusSm, border: 'none',
                        background: plan.isPopular
                          ? `linear-gradient(135deg, ${plan.color || '#2563EB'}, ${token.accent})`
                          : 'rgba(37,99,235,0.1)',
                        color: plan.isPopular ? '#fff' : token.primaryMid,
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        boxShadow: plan.isPopular ? `0 4px 16px rgba(37,99,235,0.35)` : 'none',
                        border: plan.isPopular ? 'none' : `1px solid ${token.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.15s',
                      }}
                    >
                      Choisir {plan.name} <IconArrowRight />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 — Form ── */}
        {step === 2 && (
          <div>
            {/* Plan badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderRadius: token.radius, marginBottom: '28px',
              background: 'rgba(37,99,235,0.08)', border: `1px solid ${token.border}`,
            }}>
              <span style={{ color: token.textSub, fontSize: '14px' }}>
                Plan sélectionné : <strong style={{ color: token.textPrimary }}>{selectedPlan?.name}</strong>
                <span style={{ color: token.textMuted, marginLeft: '6px' }}>— {selectedPlan?.price} dt/mois</span>
              </span>
              <button onClick={() => setStep(1)} style={{
                background: 'rgba(37,99,235,0.12)', border: `1px solid ${token.border}`,
                color: token.primaryMid, fontSize: '12px', fontWeight: 600,
                padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
                fontFamily: token.font,
              }}>
                Modifier
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: token.radiusSm, marginBottom: '20px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#F87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Duration */}
              <div style={{ background: token.bgCard, borderRadius: '16px', padding: '24px', marginBottom: '16px', border: `1px solid ${token.borderSubtle}` }}>
                <SectionHeading icon={<IconCalendar />} title="Durée de l'abonnement" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {DURATIONS.map(d => {
                    const active = form.durationMonths === d.value;
                    return (
                      <div key={d.value} onClick={() => !loading && setForm({ ...form, durationMonths: d.value })} style={{
                        padding: '14px 10px', borderRadius: token.radiusSm, textAlign: 'center', cursor: 'pointer',
                        border: active ? `1.5px solid ${token.primary}` : `1px solid ${token.borderSubtle}`,
                        background: active ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.15s',
                      }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, color: active ? token.primaryMid : token.textSub, fontSize: '14px' }}>{d.label}</p>
                        {d.discount && (
                          <span style={{
                            display: 'inline-block', padding: '1px 7px', borderRadius: '10px',
                            background: 'rgba(16,185,129,0.12)', color: '#34D399',
                            fontSize: '11px', fontWeight: 700, marginBottom: '4px',
                          }}>{d.discount}</span>
                        )}
                        <p style={{ margin: 0, fontSize: '13px', color: active ? token.textPrimary : token.textMuted, fontWeight: active ? 700 : 400 }}>
                          {Math.round(selectedPlan?.price * d.value * d.discountNum)} dt
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Company info */}
              <div style={{ background: token.bgCard, borderRadius: '16px', padding: '24px', marginBottom: '16px', border: `1px solid ${token.borderSubtle}` }}>
                <SectionHeading icon={<IconBuilding />} title="Informations de l'entreprise" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Nom de l'entreprise *</label>
                    <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Corporation" required disabled={loading} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>
                      Matricule fiscal <span style={{ color: token.textMuted, fontWeight: 400 }}>(recommandé)</span>
                    </label>
                    <input name="matriculeFiscal" value={form.matriculeFiscal} onChange={handleChange} placeholder="1234567A/N/M/001" disabled={loading} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Email de contact *</label>
                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="contact@acme.com" required disabled={loading} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Téléphone</label>
                    <input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+216 XX XXX XXX" disabled={loading} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Secteur d'activité</label>
                    <select name="sector" value={form.sector} onChange={handleChange} disabled={loading} style={inputStyle}>
                      <option value="">— Sélectionner —</option>
                      {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Nombre d'employés</label>
                    <select name="employeesCount" value={form.employeesCount} onChange={handleChange} disabled={loading} style={inputStyle}>
                      <option value="">— Sélectionner —</option>
                      {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Adresse</label>
                  <input name="address" value={form.address} onChange={handleChange} placeholder="Adresse complète de la société" disabled={loading} style={inputStyle} />
                </div>
              </div>

              {/* Admin account */}
              <div style={{ background: token.bgCard, borderRadius: '16px', padding: '24px', marginBottom: '16px', border: `1px solid ${token.borderSubtle}` }}>
                <SectionHeading icon={<IconUser />} title="Compte administrateur" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Prénom *</label>
                    <input name="adminFirstName" value={form.adminFirstName} onChange={handleChange} placeholder="Prénom" required disabled={loading} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Nom *</label>
                    <input name="adminLastName" value={form.adminLastName} onChange={handleChange} placeholder="Nom de famille" required disabled={loading} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Email administrateur *</label>
                  <input type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} placeholder="admin@acme.com" required disabled={loading} style={inputStyle} />
                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: token.textMuted }}>Utilisé pour la première connexion.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Mot de passe</label>
                    <input type="password" name="adminPassword" value={form.adminPassword} onChange={handleChange} placeholder="8 caractères minimum" disabled={loading} style={inputStyle} />
                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: token.textMuted }}>Optionnel — un mot de passe temporaire sera généré si vide.</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Confirmer le mot de passe</label>
                    <input type="password" name="adminConfirm" value={form.adminConfirm} onChange={handleChange} placeholder="Retaper le mot de passe" disabled={loading} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: token.textSub }}>Message (optionnel)</label>
                <textarea name="message" value={form.message} onChange={handleChange} placeholder="Décrivez vos besoins spécifiques…" rows={3} disabled={loading}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Summary */}
              <div style={{
                padding: '16px 20px', borderRadius: token.radius, marginBottom: '24px',
                background: 'rgba(37,99,235,0.06)', border: `1px solid ${token.border}`,
              }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: token.textPrimary, fontSize: '14px' }}>Récapitulatif</p>
                <p style={{ margin: 0, fontSize: '14px', color: token.textSub }}>
                  Plan <strong style={{ color: token.textPrimary }}>{selectedPlan?.name}</strong> · {form.durationMonths} mois
                  · Total : <strong style={{ color: token.primaryMid }}>{getPrice()} dt</strong>
                  {form.durationMonths > 1 && (
                    <span style={{ color: token.success, marginLeft: '10px', fontSize: '12px', fontWeight: 600 }}>
                      ✓ Réduction appliquée
                    </span>
                  )}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: token.textMuted }}>
                  Accès actif pendant {form.durationMonths} mois après approbation.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStep(1)} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 20px', borderRadius: token.radiusSm,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${token.borderSubtle}`,
                  color: token.textSub, fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: token.font,
                }}>
                  <IconArrowLeft /> Retour
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px 24px', borderRadius: token.radiusSm, border: 'none',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#fff', fontSize: '14px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                  fontFamily: token.font,
                }}>
                  {loading ? <><IconLoader /> Envoi en cours…</> : <>Envoyer la demande <IconArrowRight /></>}
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