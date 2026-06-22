import React, { useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import Footer from '../components/Layout/Footer';
import planService from '../services/planService';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

// ── Icons ──────────────────────────────────────────────────────────────────
const IconShield    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconZap       = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IconSliders   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>;
const IconBarChart  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
const IconUsers     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconRefresh   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconCheck     = ({ size=13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconStar      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconLock      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconCard      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconArrowR    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconArrowL    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconX         = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconParty     = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3L2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11C19.1 14.5 18.5 15 17.8 15H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z"/></svg>;
const IconLoader    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;

const FEATURES = [
  { icon: <IconShield />,  title: 'Sécurité avancée',  desc: 'JWT, RBAC et permissions granulaires pour un contrôle total.', color: '#2563EB' },
  { icon: <IconZap />,     title: 'Temps réel',        desc: 'Notifications et mises à jour instantanées sans rechargement.', color: '#0EA5E9' },
  { icon: <IconSliders />, title: 'Rôles flexibles',   desc: 'Créez des rôles sur-mesure adaptés à votre structure.', color: '#6366F1' },
  { icon: <IconBarChart />,title: 'Analytics',          desc: 'Pilotez la performance avec des tableaux de bord avancés.', color: '#10B981' },
];

const DURATIONS = [
  { value: 1,  label: '1 mois',  discount: null,   mult: 1.00 },
  { value: 3,  label: '3 mois',  discount: '−5%',  mult: 0.95 },
  { value: 6,  label: '6 mois',  discount: '−10%', mult: 0.90 },
  { value: 12, label: '12 mois', discount: '−20%', mult: 0.80 },
];

const B = '#2563EB'; // blue primary

// ── Payment Step ───────────────────────────────────────────────────────────
const PaymentStep = ({ formData, plan, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [amount, setAmount]   = useState(null);

  useEffect(() => {
    const d = { 1:1.00, 3:0.95, 6:0.90, 12:0.80 };
    setAmount(Math.round(plan.price * formData.durationMonths * (d[formData.durationMonths]||1)));
  }, [formData.durationMonths, plan.price]);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setError(''); setLoading(true);
    try {
      const res = await api.post('/subscriptions/create-payment-intent', { ...formData, planId: plan._id });
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(res.data.clientSecret, {
        payment_method: { card: elements.getElement(CardElement), billing_details: { name: `${formData.adminFirstName} ${formData.adminLastName}`, email: formData.adminEmail } },
      });
      if (stripeError) { setError(stripeError.message); return; }
      if (paymentIntent.status === 'succeeded') {
        await api.post('/subscriptions/request', { ...formData, planId: plan._id, stripePaymentIntentId: paymentIntent.id });
        onSuccess(amount);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur de paiement');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ padding:'12px 14px', borderRadius:'8px', marginBottom:'18px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', fontSize:'14px', color:'#1D4ED8', display:'flex', alignItems:'center', gap:'8px' }}>
        <IconCard />
        <span><strong>{plan.name}</strong> × {formData.durationMonths} mois = <strong>{amount} dt</strong></span>
      </div>
      <div style={{ padding:'14px', border:'1.5px solid #E2E8F0', borderRadius:'8px', background:'#F8FAFC', marginBottom:'6px' }}>
        <CardElement options={{ style:{ base:{ fontSize:'15px', color:'#0F172A', fontFamily:"'Inter', sans-serif", '::placeholder':{ color:'#94A3B8' } } } }} />
      </div>
      <p style={{ fontSize:'12px', color:'#94A3B8', margin:'8px 0 16px', display:'flex', alignItems:'center', gap:'5px' }}>
        <span style={{color:'#10B981'}}><IconLock /></span> Paiement sécurisé par Stripe
      </p>
      {error && <div style={{ padding:'10px 14px', borderRadius:'8px', marginBottom:'14px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', fontSize:'13px' }}>{error}</div>}
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={onBack} disabled={loading} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'11px', borderRadius:'8px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', color:'#475569', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
          <IconArrowL /> Retour
        </button>
        <button onClick={handlePay} disabled={loading||!stripe} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'11px', borderRadius:'8px', border:'none', background:B, color:'#fff', fontSize:'14px', fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:'0 4px 14px rgba(37,99,235,0.35)', fontFamily:"'Inter',sans-serif" }}>
          {loading ? <><IconLoader/> Paiement…</> : <><IconCard/> Payer {amount} dt</>}
        </button>
      </div>
    </div>
  );
};

// ── Subscription Modal ─────────────────────────────────────────────────────
const SubscriptionModal = ({ plan, onClose }) => {
  const [step, setStep]             = useState('form');
  const [paidAmount, setPaidAmount] = useState(null);
  const [error, setError]           = useState('');

  const [form, setForm] = useState({
    companyName:'', contactEmail:'', contactPhone:'', matriculeFiscal:'',
    adminFirstName:'', adminLastName:'', adminEmail:'',
    employeesCount:'', sector:'', message:'', durationMonths:1,
  });

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const inp = { width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:'8px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', color:'#0F172A', fontSize:'14px', fontFamily:"'Inter',sans-serif", outline:'none' };

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .axia-modal-inp:focus{border-color:${B}!important;box-shadow:0 0 0 3px rgba(37,99,235,0.1)}`}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'rgba(15,23,42,0.5)', backdropFilter:'blur(6px)' }}
        onClick={e => e.target===e.currentTarget && onClose()}>
        <div style={{ width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto', borderRadius:'16px', background:'#fff', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', fontFamily:"'Inter',sans-serif" }}>
          {/* Blue top bar */}
          <div style={{ height:'4px', background:`linear-gradient(90deg, ${B}, #0EA5E9)`, borderRadius:'16px 16px 0 0' }} />
          <div style={{ padding:'24px' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px' }}>
              <div>
                <h3 style={{ margin:'0 0 4px', fontSize:'18px', fontWeight:800, color:'#0F172A' }}>
                  {step==='success' ? 'Paiement confirmé !' : "Demande d'abonnement"}
                </h3>
                <p style={{ margin:0, fontSize:'13px', color:'#64748B' }}>Plan <strong>{plan.name}</strong> — {plan.price} dt/mois</p>
              </div>
              <button onClick={onClose} style={{ background:'#F1F5F9', border:'none', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748B', cursor:'pointer' }}>
                <IconX />
              </button>
            </div>

            {/* Step pills */}
            {step !== 'success' && (
              <div style={{ display:'flex', gap:'8px', marginBottom:'22px' }}>
                {[{k:'form',n:1,l:'Informations'},{k:'payment',n:2,l:'Paiement'}].map(({k,n,l}) => (
                  <div key={k} style={{ flex:1, padding:'8px', borderRadius:'8px', textAlign:'center', fontSize:'12px', fontWeight:700, background:step===k ? B : '#F1F5F9', color:step===k ? '#fff' : '#94A3B8', transition:'all 0.2s' }}>
                    {n}. {l}
                  </div>
                ))}
              </div>
            )}

            {/* Form */}
            {step === 'form' && (
              <form onSubmit={e=>{e.preventDefault();setError('');setStep('payment')}}>
                <p style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 10px'}}>Entreprise</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Nom *</label><input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Acme Corp" required style={inp} className="axia-modal-inp"/></div>
                  <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Matricule fiscal</label><input name="matriculeFiscal" value={form.matriculeFiscal} onChange={handleChange} placeholder="1234567A/P/M/000" style={inp} className="axia-modal-inp"/></div>
                  <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Email *</label><input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="contact@acme.com" required style={inp} className="axia-modal-inp"/></div>
                  <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Téléphone</label><input name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+216 XX XXX XXX" style={inp} className="axia-modal-inp"/></div>
                </div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'14px 0 10px'}}>Administrateur</p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                  <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Prénom *</label><input name="adminFirstName" value={form.adminFirstName} onChange={handleChange} placeholder="Prénom" required style={inp} className="axia-modal-inp"/></div>
                  <div><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Nom *</label><input name="adminLastName" value={form.adminLastName} onChange={handleChange} placeholder="Nom" required style={inp} className="axia-modal-inp"/></div>
                  <div style={{gridColumn:'1/-1'}}><label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Email admin *</label><input type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} placeholder="admin@acme.com" required style={inp} className="axia-modal-inp"/></div>
                </div>
                <p style={{fontSize:'11px',fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'14px 0 10px'}}>Durée</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'7px',marginBottom:'14px'}}>
                  {DURATIONS.map(d=>{
                    const active=form.durationMonths===d.value;
                    return <div key={d.value} onClick={()=>setForm(p=>({...p,durationMonths:d.value}))} style={{padding:'10px 6px',borderRadius:'8px',textAlign:'center',cursor:'pointer',border:active?`2px solid ${B}`:'1.5px solid #E2E8F0',background:active?'#EFF6FF':'#F8FAFC',transition:'all 0.15s'}}>
                      <p style={{margin:0,fontWeight:700,fontSize:'12px',color:active?B:'#475569'}}>{d.label}</p>
                      {d.discount&&<span style={{fontSize:'10px',color:'#10B981',fontWeight:700}}>{d.discount}</span>}
                      <p style={{margin:'2px 0 0',fontSize:'11px',color:'#64748B'}}>{Math.round(plan.price*d.value*d.mult)} dt</p>
                    </div>;
                  })}
                </div>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#475569',marginBottom:'4px'}}>Message (optionnel)</label>
                  <textarea name="message" value={form.message} onChange={handleChange} placeholder="Vos besoins spécifiques…" rows={3} style={{...inp,resize:'vertical'}} className="axia-modal-inp"/>
                </div>
                {error && <div style={{padding:'10px',borderRadius:'8px',marginBottom:'12px',background:'#FEF2F2',border:'1px solid #FECACA',color:'#DC2626',fontSize:'13px'}}>{error}</div>}
                <button type="submit" style={{width:'100%',padding:'12px',borderRadius:'8px',border:'none',background:B,color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',boxShadow:'0 4px 14px rgba(37,99,235,0.3)',fontFamily:"'Inter',sans-serif"}}>
                  Continuer vers le paiement <IconArrowR/>
                </button>
              </form>
            )}

            {/* Payment */}
            {step==='payment' && (
              <Elements stripe={stripePromise}>
                <PaymentStep formData={form} plan={plan} onSuccess={amt=>{setPaidAmount(amt);setStep('success')}} onBack={()=>setStep('form')}/>
              </Elements>
            )}

            {/* Success */}
            {step==='success' && (
              <div style={{textAlign:'center',padding:'8px 0'}}>
                <div style={{width:'68px',height:'68px',borderRadius:'16px',margin:'0 auto 20px',background:'#EFF6FF',border:'1.5px solid #BFDBFE',display:'flex',alignItems:'center',justifyContent:'center',color:B}}>
                  <IconParty/>
                </div>
                <p style={{fontSize:'15px',color:'#475569',lineHeight:1.6,margin:'0 0 8px'}}>
                  Paiement de <strong style={{color:'#0F172A'}}>{paidAmount} dt</strong> confirmé pour le plan <strong style={{color:'#0F172A'}}>{plan.name}</strong>.
                </p>
                <p style={{color:'#94A3B8',fontSize:'13px',marginBottom:'24px',lineHeight:1.6}}>
                  Notre équipe activera votre compte et vous enverra les identifiants par email.
                </p>
                <button onClick={onClose} style={{width:'100%',padding:'12px',borderRadius:'8px',border:'none',background:B,color:'#fff',fontSize:'14px',fontWeight:700,cursor:'pointer',fontFamily:"'Inter',sans-serif"}}>
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Home ───────────────────────────────────────────────────────────────────
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
    <div style={{ background:'#fff', minHeight:'100vh', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .home-hero-btn-primary:hover{background:#1D4ED8!important;box-shadow:0 6px 20px rgba(37,99,235,0.45)!important;transform:translateY(-1px)}
        .home-hero-btn-secondary:hover{border-color:${B}!important;color:${B}!important}
        .feature-card:hover{box-shadow:0 8px 30px rgba(37,99,235,0.1)!important;transform:translateY(-3px)}
        .plan-card-item:hover{box-shadow:0 8px 30px rgba(37,99,235,0.12)!important;transform:translateY(-4px)}
        .plan-cta:hover{opacity:0.92!important;transform:translateY(-1px)}
      `}</style>
      <Navbar />
      {/* ── Hero ── */}
      <section style={{ paddingTop:'140px', paddingBottom:'100px', textAlign:'center', background:'linear-gradient(180deg, #F0F7FF 0%, #fff 100%)' }}>
        <div style={{ maxWidth:'680px', margin:'0 auto', padding:'0 24px', animation:'fadeUp 0.5s ease-out' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'6px 16px', borderRadius:'20px', marginBottom:'24px', background:'#DBEAFE', color:B, fontSize:'13px', fontWeight:600 }}>
            <IconZap style={{width:14,height:14}}/> Plateforme de gestion de workflows
          </div>
          <h1 style={{ fontSize:'clamp(36px,6vw,56px)', fontWeight:900, color:'#0F172A', margin:'0 0 8px', lineHeight:1.1, letterSpacing:'-1px' }}>
            Gérez vos workflows
          </h1>
          <h1 style={{ fontSize:'clamp(36px,6vw,56px)', fontWeight:900, margin:'0 0 20px', lineHeight:1.1, letterSpacing:'-1px', color:B }}>
            plus intelligemment
          </h1>
          <p style={{ fontSize:'18px', color:'#475569', lineHeight:1.7, margin:'0 auto 36px', maxWidth:'520px' }}>
            Axia Workflow vous permet de suivre vos projets, d'automatiser vos processus et de collaborer efficacement.
          </p>
          <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'28px' }}>
            <a href="#plans" className="home-hero-btn-secondary" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'13px 24px', borderRadius:'10px', background:'#fff', border:'1.5px solid #E2E8F0', color:'#334155', fontSize:'15px', fontWeight:600, textDecoration:'none', transition:'all 0.2s' }}>
              Voir les plans
            </a>
          </div>
        </div>
      </section>
      {/* ── Features ── */}
      <section id="features" style={{ padding:'80px 24px', background:'#fff', borderTop:'1px solid #F1F5F9' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <span style={{ display:'inline-block', padding:'5px 14px', borderRadius:'20px', background:'#DBEAFE', color:B, fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>Fonctionnalités</span>
            <h2 style={{ fontSize:'clamp(24px,4vw,34px)', fontWeight:800, color:'#0F172A', margin:'0 0 12px', letterSpacing:'-0.5px' }}>Pourquoi choisir Axia Workflow ?</h2>
            <p style={{ color:'#64748B', fontSize:'16px', maxWidth:'480px', margin:'0 auto' }}>Tout ce dont votre équipe a besoin pour travailler mieux, en un seul endroit.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:'20px' }}>
            {FEATURES.map(({icon,title,desc,color}) => (
              <div key={title} className="feature-card" style={{ padding:'28px', borderRadius:'14px', background:'#fff', border:'1.5px solid #F1F5F9', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', transition:'all 0.2s' }}>
                <div style={{ width:'46px', height:'46px', borderRadius:'11px', background:`${color}12`, display:'flex', alignItems:'center', justifyContent:'center', color, marginBottom:'16px' }}>{icon}</div>
                <h4 style={{ margin:'0 0 8px', fontSize:'16px', fontWeight:700, color:'#0F172A' }}>{title}</h4>
                <p style={{ margin:0, fontSize:'14px', color:'#64748B', lineHeight:1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section id="plans" style={{ padding:'80px 24px', background:'#F8FAFC', borderTop:'1px solid #F1F5F9' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <span style={{ display:'inline-block', padding:'5px 14px', borderRadius:'20px', background:'#DBEAFE', color:B, fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'14px' }}>Tarification</span>
            <h2 style={{ fontSize:'clamp(24px,4vw,34px)', fontWeight:800, color:'#0F172A', margin:'0 0 12px', letterSpacing:'-0.5px' }}>Choisissez votre plan</h2>
            <p style={{ color:'#64748B', fontSize:'16px', maxWidth:'420px', margin:'0 auto' }}>Tarifs adaptés à chaque équipe. Aucun frais caché.</p>
          </div>

          {plansLoading ? (
            <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8' }}>Chargement…</div>
          ) : plans.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8' }}>Aucun plan disponible.</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'20px' }}>
              {plans.map(plan => (
                <div key={plan._id} className="plan-card-item" style={{ borderRadius:'16px', background:'#fff', border:plan.isPopular?`2px solid ${B}`:'1.5px solid #E2E8F0', boxShadow:plan.isPopular?'0 4px 24px rgba(37,99,235,0.15)':'0 2px 12px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', overflow:'hidden', transition:'all 0.2s' }}>
                  <div style={{ height:'3px', background:plan.color||B }} />
                  <div style={{ padding:'26px', flex:1, display:'flex', flexDirection:'column' }}>
                    {plan.isPopular && (
                      <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'20px', marginBottom:'14px', background:'#DBEAFE', color:B, fontSize:'11px', fontWeight:700, alignSelf:'flex-start' }}>
                        <IconStar/> Plus populaire
                      </div>
                    )}
                    <h3 style={{ margin:'0 0 6px', fontSize:'19px', fontWeight:800, color:'#0F172A' }}>{plan.name}</h3>
                    <div style={{ marginBottom:'12px' }}>
                      <span style={{ fontSize:'32px', fontWeight:900, color:'#0F172A' }}>{plan.price}</span>
                      <span style={{ color:'#94A3B8', fontSize:'14px' }}> dt/{plan.billingCycle==='monthly'?'mois':'an'}</span>
                    </div>
                    <p style={{ color:'#64748B', fontSize:'13px', lineHeight:1.6, marginBottom:'16px' }}>{plan.description}</p>
                    <div style={{ display:'flex', gap:'14px', marginBottom:'16px', padding:'10px 12px', borderRadius:'8px', background:'#F8FAFC', border:'1px solid #F1F5F9' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'#64748B', fontSize:'12px' }}><span style={{color:B}}><IconUsers/></span>{plan.maxUsers} users</span>
                      <span style={{ display:'flex', alignItems:'center', gap:'5px', color:'#64748B', fontSize:'12px' }}><span style={{color:B}}><IconRefresh/></span>{plan.maxWorkflows} flows</span>
                    </div>
                    {plan.features?.length > 0 && (
                      <ul style={{ listStyle:'none', margin:'0 0 22px', padding:0, display:'flex', flexDirection:'column', gap:'8px', flex:1 }}>
                        {plan.features.map((f,i) => (
                          <li key={i} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#475569' }}>
                            <span style={{color:'#10B981',flexShrink:0}}><IconCheck/></span>{f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button className="plan-cta" onClick={()=>setSelectedPlan(plan)} style={{ width:'100%', padding:'12px', borderRadius:'9px', border:'none', background:plan.isPopular?B:'#EFF6FF', color:plan.isPopular?'#fff':B, fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:plan.isPopular?'0 4px 14px rgba(37,99,235,0.35)':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
                      Choisir {plan.name} <IconArrowR/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ textAlign:'center', marginTop:'32px', color:'#94A3B8', fontSize:'14px' }}>
            Besoin d'un plan personnalisé ?{' '}
            <a href="mailto:contact@axia-workflow.com" style={{ color:B, fontWeight:600, textDecoration:'none' }}>Contactez-nous</a>
          </p>
        </div>
      </section>

      <Footer/>
      {selectedPlan && <SubscriptionModal plan={selectedPlan} onClose={()=>setSelectedPlan(null)}/>}
    </div>
  );
};

export default Home;