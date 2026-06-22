import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import planService from '../../../services/planService';

const COLORS = ['#2563eb','#0891b2','#7c3aed','#059669','#d97706','#dc2626','#0f172a'];
const CAPS = [
  { name: 'hasAI',            icon: 'ri-robot-line',          label: 'Intelligence Artificielle' },
  { name: 'hasAnalytics',     icon: 'ri-bar-chart-line',      label: 'Analytics avancés'         },
  { name: 'hasAdvancedForms', icon: 'ri-file-edit-line',      label: 'Formulaires dynamiques'    },
  { name: 'hasAPIAccess',     icon: 'ri-code-s-slash-line',   label: 'Accès API complet'         },
  { name: 'hasSSO',           icon: 'ri-shield-keyhole-line', label: 'SSO & sécurité'            },
  { name: 'hasSMSNotif',      icon: 'ri-message-3-line',      label: 'Notifications SMS'         },
];

const inp = { width:'100%', padding:'8px 11px', borderRadius:'8px', border:'1.5px solid #e2e8f0', fontSize:'13px', fontFamily:'inherit', outline:'none', background:'#fff', color:'#0f172a', boxSizing:'border-box', transition:'border-color .15s' };
const lbl = { display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:700, color:'#64748b', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'.4px' };

const Field = ({ label, icon, required, children }) => (
  <div>
    <label style={lbl}>{icon && <i className={icon} style={{ color:'#94a3b8', fontSize:'12px' }}></i>}{label}{required && <span style={{ color:'#ef4444' }}>*</span>}</label>
    {children}
  </div>
);

const Section = ({ icon, title, color='#2563eb', children }) => (
  <div style={{ background:'#fff', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 14px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc' }}>
      <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className={icon} style={{ fontSize:'12px', color }}></i>
      </div>
      <span style={{ fontSize:'12px', fontWeight:700, color:'#0f172a' }}>{title}</span>
    </div>
    <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:'10px' }}>{children}</div>
  </div>
);

const PlanCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:'', price:'', billingCycle:'monthly', description:'', features:[''],
    maxUsers:5, maxWorkflows:10, maxProjects:3, isActive:true, isPopular:false,
    color:'#2563eb', order:0,
    hasAI:false, hasAnalytics:false, hasAdvancedForms:false,
    hasAPIAccess:false, hasSSO:false, hasSMSNotif:false,
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };
  const setFeature = (i, v) => { const f = [...form.features]; f[i] = v; set('features', f); };
  const addFeature    = () => set('features', [...form.features, '']);
  const removeFeature = i  => set('features', form.features.filter((_, idx) => idx !== i));
  const focus = e => e.target.style.borderColor = '#2563eb';
  const blur  = e => e.target.style.borderColor = '#e2e8f0';

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await planService.create({ ...form, price: parseFloat(form.price), maxUsers: parseInt(form.maxUsers), maxWorkflows: parseInt(form.maxWorkflows), maxProjects: parseInt(form.maxProjects), order: parseInt(form.order), features: form.features.filter(f => f.trim()) });
      navigate('/dashboard/superadmin/plans', { state: { msg: '✅ Plan créé !' } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'Inter, -apple-system, sans-serif', background:'#f0f4f8' }}>

      {/* Header fixe */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px', borderBottom:'1px solid #e2e8f0', background:'#fff', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <Link to="/dashboard/superadmin/plans" style={{ display:'flex', alignItems:'center', gap:'5px', background:'#f1f5f9', border:'none', padding:'7px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:600, color:'#64748b', fontSize:'12.5px', textDecoration:'none', transition:'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background='#f1f5f9'}>
            <i className="ri-arrow-left-line"></i> Retour
          </Link>
          <div>
            <h1 style={{ margin:0, fontSize:'15px', fontWeight:800, color:'#0f172a', display:'flex', alignItems:'center', gap:'7px' }}>
              <i className="ri-add-circle-line" style={{ color:'#2563eb' }}></i>Créer un plan
            </h1>
            <p style={{ margin:0, fontSize:'11px', color:'#94a3b8' }}>Définissez les détails et fonctionnalités</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <Link to="/dashboard/superadmin/plans" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'8px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:'13px', fontWeight:600, textDecoration:'none' }}>
            Annuler
          </Link>
          <button type="submit" form="plan-create-form" disabled={loading} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'8px 20px', borderRadius:'8px', border:'none', background: loading ? '#94a3b8':'#2563eb', color:'#fff', fontSize:'13px', fontWeight:700, cursor: loading ? 'not-allowed':'pointer', boxShadow:'0 2px 8px rgba(37,99,235,.25)' }}>
            <i className={loading ? 'ri-loader-4-line':'ri-add-line'} style={{ fontSize:'15px' }}></i>
            {loading ? 'Création...' : 'Créer le plan'}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ margin:'10px 24px 0', padding:'10px 14px', borderRadius:'8px', background:'#fee2e2', color:'#991b1b', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'7px', flexShrink:0 }}>
          <i className="ri-error-warning-line"></i>{error}
        </div>
      )}

      {/* Formulaire — 2 colonnes */}
      <form id="plan-create-form" onSubmit={handleSubmit} style={{ flex:1, overflow:'auto', padding:'14px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', maxWidth:'1100px' }}>

          {/* COL GAUCHE */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

            <Section icon="ri-information-line" title="Informations de base" color="#2563eb">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:'10px' }}>
                <Field label="Nom du plan" icon="ri-text" required>
                  <input name="name" value={form.name} onChange={handleChange} required disabled={loading} placeholder="ex: Starter, Pro, Enterprise" style={inp} onFocus={focus} onBlur={blur} />
                </Field>
                <Field label="Ordre" icon="ri-sort-asc">
                  <input type="number" name="order" value={form.order} onChange={handleChange} min="0" disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </Field>
              </div>
              <Field label="Description" icon="ri-file-text-line">
                <input name="description" value={form.description} onChange={handleChange} disabled={loading} placeholder="Description courte du plan" style={inp} onFocus={focus} onBlur={blur} />
              </Field>
            </Section>

            <Section icon="ri-money-dollar-circle-line" title="Tarification" color="#059669">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <Field label="Prix (dt)" icon="ri-price-tag-3-line" required>
                  <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="99" min="0" step="0.01" required disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </Field>
                <Field label="Cycle" icon="ri-calendar-line">
                  <select name="billingCycle" value={form.billingCycle} onChange={handleChange} disabled={loading} style={{ ...inp, cursor:'pointer' }}>
                    <option value="monthly">Mensuel</option>
                    <option value="yearly">Annuel</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section icon="ri-settings-3-line" title="Limites" color="#7c3aed">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
                <Field label="Utilisateurs" icon="ri-user-line">
                  <input type="number" name="maxUsers" value={form.maxUsers} onChange={handleChange} min="1" disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </Field>
                <Field label="Workflows" icon="ri-flow-chart">
                  <input type="number" name="maxWorkflows" value={form.maxWorkflows} onChange={handleChange} min="1" disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </Field>
                <Field label="Projets" icon="ri-folder-line">
                  <input type="number" name="maxProjects" value={form.maxProjects} onChange={handleChange} min="1" disabled={loading} style={inp} onFocus={focus} onBlur={blur} />
                </Field>
              </div>
            </Section>

            <Section icon="ri-list-check-2" title="Fonctionnalités incluses" color="#0891b2">
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {form.features.map((f, i) => (
                  <div key={i} style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <i className="ri-check-line" style={{ color:'#10b981', fontSize:'14px', flexShrink:0 }}></i>
                    <input value={f} onChange={e => setFeature(i, e.target.value)} placeholder={`Fonctionnalité ${i + 1}`} disabled={loading} style={{ ...inp, flex:1 }} onFocus={focus} onBlur={blur} />
                    {form.features.length > 1 && (
                      <button type="button" onClick={() => removeFeature(i)} disabled={loading}
                        style={{ width:'28px', height:'28px', borderRadius:'6px', background:'#fee2e2', border:'1px solid #fecaca', color:'#dc2626', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className="ri-close-line" style={{ fontSize:'13px' }}></i>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addFeature} disabled={loading}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'7px', borderRadius:'8px', background:'none', border:'1.5px dashed #bfdbfe', color:'#2563eb', fontSize:'12.5px', fontWeight:600, cursor:'pointer' }}>
                  <i className="ri-add-line"></i> Ajouter une fonctionnalité
                </button>
              </div>
            </Section>
          </div>

          {/* COL DROITE */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

            {/* Aperçu live */}
            <div style={{ borderRadius:'10px', overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ background: form.color || '#2563eb', padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <h3 style={{ margin:'0 0 3px', fontSize:'16px', fontWeight:800, color:'#fff' }}>{form.name || 'Nom du plan'}</h3>
                    <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,.7)' }}>{form.description || 'Description du plan'}</p>
                  </div>
                  {form.isPopular && <span style={{ background:'rgba(255,255,255,.2)', color:'#fff', fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'999px', display:'flex', alignItems:'center', gap:'3px' }}><i className="ri-star-fill"></i>Populaire</span>}
                </div>
                <div style={{ marginTop:'12px', display:'flex', alignItems:'baseline', gap:'4px' }}>
                  <span style={{ fontSize:'28px', fontWeight:800, color:'#fff' }}>{form.price || '0'}</span>
                  <span style={{ fontSize:'13px', color:'rgba(255,255,255,.7)' }}>dt/{form.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
                </div>
              </div>
              <div style={{ background:'#fff', padding:'10px 16px' }}>
                <div style={{ display:'flex', gap:'12px', fontSize:'11.5px', color:'#64748b' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><i className="ri-user-line"></i>{form.maxUsers} users</span>
                  <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><i className="ri-flow-chart"></i>{form.maxWorkflows} workflows</span>
                  <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><i className="ri-folder-line"></i>{form.maxProjects} projets</span>
                </div>
              </div>
            </div>

            {/* Capacités */}
            <Section icon="ri-flashlight-line" title="Capacités incluses" color="#f59e0b">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                {CAPS.map(cap => (
                  <label key={cap.name} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 10px', borderRadius:'8px', border:`1.5px solid ${form[cap.name] ? '#bfdbfe':'#e2e8f0'}`, background: form[cap.name] ? '#eff6ff':'#f8fafc', cursor:'pointer', transition:'all .15s' }}>
                    <input type="checkbox" name={cap.name} checked={form[cap.name]} onChange={handleChange} style={{ accentColor:'#2563eb', width:'13px', height:'13px', flexShrink:0 }} />
                    <i className={cap.icon} style={{ fontSize:'13px', color: form[cap.name] ? '#2563eb':'#94a3b8', flexShrink:0 }}></i>
                    <span style={{ fontSize:'11.5px', fontWeight:600, color: form[cap.name] ? '#1e40af':'#64748b' }}>{cap.label}</span>
                  </label>
                ))}
              </div>
            </Section>

            {/* Couleur */}
            <Section icon="ri-palette-line" title="Couleur du plan" color="#7c3aed">
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set('color', c)}
                    style={{ width:'32px', height:'32px', borderRadius:'50%', background:c, border: form.color === c ? '3px solid #fff':'3px solid transparent', outline: form.color === c ? `2.5px solid ${c}`:'none', cursor:'pointer', transition:'all .15s', transform: form.color === c ? 'scale(1.15)':'scale(1)' }} />
                ))}
              </div>
            </Section>

            {/* Options */}
            <Section icon="ri-toggle-line" title="Options" color="#059669">
              <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                {[
                  { name:'isActive',  icon:'ri-eye-line',  label:'Plan actif (visible publiquement)', color:'#059669' },
                  { name:'isPopular', icon:'ri-star-line', label:'Marquer comme populaire',           color:'#d97706' },
                ].map(opt => (
                  <label key={opt.name} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'9px 12px', borderRadius:'8px', border:`1.5px solid ${form[opt.name] ? '#bbf7d0':'#e2e8f0'}`, background: form[opt.name] ? '#f0fdf4':'#f8fafc', cursor:'pointer', transition:'all .15s' }}>
                    <input type="checkbox" name={opt.name} checked={form[opt.name]} onChange={handleChange} style={{ accentColor:opt.color, width:'14px', height:'14px', flexShrink:0 }} />
                    <i className={opt.icon} style={{ fontSize:'14px', color: form[opt.name] ? opt.color:'#94a3b8' }}></i>
                    <span style={{ fontSize:'12.5px', fontWeight:600, color: form[opt.name] ? '#166534':'#64748b' }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlanCreate;