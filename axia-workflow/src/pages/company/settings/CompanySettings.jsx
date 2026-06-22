import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconSettings  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconMail      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const IconPen       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconSave      = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconEye       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEdit      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconCopy      = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconLoader    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconBell      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IconClock     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

const B = '#2563EB';

// ── Config ──────────────────────────────────────────────────────────────────
const EVENT_LABELS = {
  step_assigned:      { label: 'Nouvelle tâche assignée',  color: '#2563EB', desc: "Envoyé quand une étape est assignée à un employé" },
  step_completed:     { label: 'Étape validée',             color: '#16A34A', desc: "Envoyé au créateur quand une étape est validée" },
  step_rejected:      { label: 'Étape rejetée',             color: '#DC2626', desc: "Envoyé au créateur quand une étape est rejetée" },
  workflow_completed: { label: 'Workflow terminé',          color: '#16A34A', desc: "Envoyé au créateur quand le workflow est terminé" },
  reminder:           { label: 'Rappel automatique',        color: '#D97706', desc: "Rappel si une tâche n'est pas traitée dans les délais" },
};

const EVENT_ICONS = {
  step_assigned: () => <IconBell/>,
  step_completed: () => <IconCheck/>,
  step_rejected: () => <IconAlert/>,
  workflow_completed: () => <IconCheck/>,
  reminder: () => <IconClock/>,
};

const VARIABLES = [
  { key:'{{userName}}',     desc:'Prénom + Nom' },
  { key:'{{workflowName}}', desc:'Nom du workflow' },
  { key:'{{stepName}}',     desc:"Nom de l'étape" },
  { key:'{{completedBy}}',  desc:'Qui a validé' },
  { key:'{{rejectedBy}}',   desc:'Qui a rejeté' },
  { key:'{{comment}}',      desc:'Motif du rejet' },
  { key:'{{daysPending}}',  desc:'Jours en attente' },
];

const DEFAULT_TRIGGERS = {
  step_assigned:      { email:true,  push:true,  label:'Nouvelle tâche assignée' },
  step_completed:     { email:true,  push:true,  label:'Étape validée' },
  step_rejected:      { email:true,  push:true,  label:'Étape rejetée' },
  workflow_completed: { email:true,  push:true,  label:'Workflow terminé' },
  reminder:           { email:true,  push:false, reminderDays:2, label:'Rappel automatique' },
};

const DEFAULT_TEMPLATES = {
  step_assigned:      { subject:'Nouvelle tâche : {{stepName}} — {{workflowName}}', body:'' },
  step_completed:     { subject:'Étape validée : {{stepName}} — {{workflowName}}',  body:'' },
  step_rejected:      { subject:'Étape rejetée : {{stepName}} — {{workflowName}}',  body:'' },
  workflow_completed: { subject:'Workflow terminé : {{workflowName}}',               body:'' },
  reminder:           { subject:'Rappel : {{workflowName}} — {{stepName}}',          body:'' },
};

// ── Toggle Switch ───────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, color = B }) => (
  <div onClick={onChange} style={{ width:'40px', height:'22px', borderRadius:'11px', background: checked ? color : '#CBD5E1', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
    <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'#fff', position:'absolute', top:'3px', left: checked ? '21px' : '3px', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
  </div>
);

// ── Input styles ────────────────────────────────────────────────────────────
const getInpStyle = (f) => ({
  width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:'9px',
  border: f ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: f ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

const SInput = ({ value, onChange, placeholder, style: extraStyle }) => {
  const [f, setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInpStyle(f), ...extraStyle}}/>;
};

const STextarea = ({ value, onChange, placeholder, rows=8, mono }) => {
  const [f, setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInpStyle(f), resize:'vertical', fontFamily: mono ? 'monospace' : "'Inter',sans-serif", fontSize: mono ? '13px' : '14px'}}/>;
};

// ── Main ────────────────────────────────────────────────────────────────────
const CompanySettings = () => {
  const [tab,       setTab]       = useState('triggers');
  const [triggers,  setTriggers]  = useState(DEFAULT_TRIGGERS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [signature, setSignature] = useState('');
  const [selEvent,  setSelEvent]  = useState('step_assigned');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [preview,   setPreview]   = useState(false);
  const [copied,    setCopied]    = useState('');

  useEffect(() => {
    API.get('/notifications/settings')
      .then(res => {
        const s = res.data?.data?.settings;
        if (s) {
          if (s.triggers)       setTriggers(p => ({...p,...s.triggers}));
          if (s.emailTemplates) setTemplates(p => ({...p,...s.emailTemplates}));
          if (s.emailSignature) setSignature(s.emailSignature);
        }
      }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const showMsg = (text) => { setMsg(text); setTimeout(()=>setMsg(''), 3500); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.patch('/notifications/settings', { triggers, emailTemplates:templates, emailSignature:signature });
      showMsg('SUCCESS Paramètres sauvegardés !');
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const updateTrigger = (event, channel, value) =>
    setTriggers(p => ({...p, [event]: {...p[event], [channel]: value}}));

  const updateTemplate = (event, field, value) =>
    setTemplates(p => ({...p, [event]: {...p[event], [field]: value}}));

  const copyVar = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const getPreviewHtml = () => {
    const tmpl = templates[selEvent];
    const body = tmpl.body || '<p>Bonjour {{userName}},<br/><br/>Ceci est un email de notification pour le workflow <strong>{{workflowName}}</strong>, étape <strong>{{stepName}}</strong>.</p>';
    const vars = { userName:'Jean Dupont', workflowName:'Demande de congé', stepName:'Validation RH', completedBy:'Marie Martin', rejectedBy:'Pierre Durant', comment:'Dossier incomplet', daysPending:'2' };
    const interpolated = body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || '{{'+k+'}}');
    const ec = EVENT_LABELS[selEvent]?.color || B;
    return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;">
        <div style="background:${ec};padding:16px 24px;"><h2 style="color:#fff;margin:0;font-size:15px;font-weight:700;">Axia Workflow</h2></div>
        <div style="padding:24px;">${interpolated}</div>
        <div style="padding:14px 24px;border-top:1px solid #F1F5F9;font-size:11px;color:#94A3B8;text-align:center;">${signature||'© Axia Workflow'}</div>
      </div>`;
  };

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  const TABS = [
    { id:'triggers',  label:'Déclencheurs', icon:<IconBell/> },
    { id:'templates', label:'Templates',    icon:<IconMail/> },
    { id:'signature', label:'Signature',    icon:<IconPen/>  },
  ];

  if (loading) return (
    <div style={{ padding:'80px', textAlign:'center', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px' }}>
      <IconLoader/> Chargement…
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .cs-tab-btn:hover { background: #F1F5F9 !important; }
        .cs-event-btn:hover { opacity: 0.9; }
        .cs-var-btn:hover { background: #DBEAFE !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1000px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px' }}>Paramètres Notifications</h1>
            <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>Configurez les déclencheurs et personnalisez les templates emails</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 22px', borderRadius:'10px', background:B, color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, boxShadow:'0 4px 14px rgba(37,99,235,0.3)', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
            {saving ? <><IconLoader/> Sauvegarde…</> : <><IconSave/> Sauvegarder tout</>}
          </button>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', fontWeight:600, fontSize:'14px', animation:'slideIn 0.3s ease', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', padding:'4px', background:'#F1F5F9', borderRadius:'12px', marginBottom:'24px', width:'fit-content' }}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} className="cs-tab-btn" onClick={() => setTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 18px', borderRadius:'9px', border:'none', cursor:'pointer', fontWeight: active?700:500, fontSize:'14px', background: active?'#fff':'transparent', color: active?'#0F172A':'#64748B', boxShadow: active?'0 1px 4px rgba(0,0,0,0.1)':'none', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                <span style={{color: active ? B : '#94A3B8'}}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB TRIGGERS ── */}
        {tab === 'triggers' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {Object.entries(triggers).map(([event, trig]) => {
              const cfg = EVENT_LABELS[event];
              const EIcon = EVENT_ICONS[event];
              return (
                <div key={event} style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'20px 24px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`${cfg.color}12`, border:`1.5px solid ${cfg.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, flexShrink:0 }}>
                        <EIcon/>
                      </div>
                      <div>
                        <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'14px', color:'#0F172A' }}>{cfg.label}</p>
                        <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>{cfg.desc}</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'24px', alignItems:'center' }}>
                      <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
                        <Toggle checked={!!trig.email} onChange={() => updateTrigger(event,'email',!trig.email)} color={cfg.color}/>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#475569' }}>Email</span>
                      </label>
                      <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
                        <Toggle checked={!!trig.push} onChange={() => updateTrigger(event,'push',!trig.push)} color={cfg.color}/>
                        <span style={{ fontSize:'13px', fontWeight:600, color:'#475569' }}>Push</span>
                      </label>
                    </div>
                  </div>
                  {event === 'reminder' && (
                    <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#475569' }}>Envoyer après</span>
                      <input type="number" min="1" max="30" value={trig.reminderDays||2}
                        onChange={e => updateTrigger('reminder','reminderDays',parseInt(e.target.value))}
                        style={{ width:'70px', padding:'7px 10px', borderRadius:'8px', border:'1.5px solid #E2E8F0', fontSize:'14px', color:'#0F172A', outline:'none', textAlign:'center', fontFamily:"'Inter',sans-serif" }}/>
                      <span style={{ fontSize:'13px', color:'#94A3B8' }}>jour(s) d'inactivité</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB TEMPLATES ── */}
        {tab === 'templates' && (
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:'20px' }}>

            {/* Sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {Object.entries(EVENT_LABELS).map(([event, cfg]) => {
                const EIcon = EVENT_ICONS[event];
                const active = selEvent === event;
                return (
                  <button key={event} className="cs-event-btn" onClick={() => { setSelEvent(event); setPreview(false); }}
                    style={{ padding:'10px 14px', borderRadius:'10px', border:'none', cursor:'pointer', textAlign:'left', fontWeight:600, fontSize:'13px', background: active ? `${cfg.color}10` : '#F8FAFC', color: active ? cfg.color : '#64748B', borderLeft:`3px solid ${active ? cfg.color : 'transparent'}`, display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                    <span><EIcon/></span> {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Editor */}
            <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'24px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:`${EVENT_LABELS[selEvent]?.color}12`, border:`1px solid ${EVENT_LABELS[selEvent]?.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:EVENT_LABELS[selEvent]?.color }}>
                    {EVENT_ICONS[selEvent]?.()}
                  </div>
                  <h3 style={{ margin:0, fontWeight:800, color:'#0F172A', fontSize:'14px' }}>{EVENT_LABELS[selEvent]?.label}</h3>
                </div>
                <button onClick={() => setPreview(!preview)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', border:'1.5px solid', borderColor: preview ? B : '#E2E8F0', background: preview ? B : '#fff', color: preview ? '#fff' : '#64748B', cursor:'pointer', fontWeight:600, fontSize:'13px', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
                  {preview ? <><IconEdit/> Éditer</> : <><IconEye/> Aperçu</>}
                </button>
              </div>

              {!preview ? (
                <>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>Objet de l'email</label>
                    <SInput value={templates[selEvent]?.subject||''} onChange={e=>updateTemplate(selEvent,'subject',e.target.value)} placeholder={DEFAULT_TEMPLATES[selEvent]?.subject}/>
                    <p style={{margin:'5px 0 0',fontSize:'11px',color:'#94A3B8'}}>Laisser vide pour utiliser l'objet par défaut</p>
                  </div>
                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>
                      Corps de l'email <span style={{fontWeight:400,color:'#94A3B8',textTransform:'none',letterSpacing:'normal'}}>(HTML supporté)</span>
                    </label>
                    <STextarea value={templates[selEvent]?.body||''} onChange={e=>updateTemplate(selEvent,'body',e.target.value)} placeholder={`<p>Bonjour {{userName}},</p>\n<p>Votre tâche <strong>{{stepName}}</strong> vous attend.</p>`} mono/>
                    <p style={{margin:'5px 0 0',fontSize:'11px',color:'#94A3B8'}}>Laisser vide pour utiliser le template par défaut</p>
                  </div>

                  {/* Variables */}
                  <div style={{background:'#F8FAFC',borderRadius:'10px',padding:'14px',border:'1.5px solid #E2E8F0'}}>
                    <p style={{margin:'0 0 10px',fontWeight:700,fontSize:'12px',color:'#0F172A',display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{color:B}}><IconCopy/></span> Variables disponibles — cliquer pour copier
                    </p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {VARIABLES.map(v => (
                        <button key={v.key} className="cs-var-btn" onClick={() => copyVar(v.key)} title={v.desc}
                          style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'6px', border:'1.5px solid #BFDBFE', background: copied===v.key ? '#DBEAFE' : '#EFF6FF', color: copied===v.key ? '#1D4ED8' : B, cursor:'pointer', fontSize:'11px', fontWeight:700, transition:'all 0.15s', fontFamily:"'Inter',sans-serif" }}>
                          {copied===v.key ? <IconCheck/> : <IconCopy/>} {v.key}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <p style={{margin:'0 0 14px',fontWeight:600,fontSize:'13px',color:'#64748B',display:'flex',alignItems:'center',gap:'6px'}}><IconEye/> Aperçu avec données d'exemple</p>
                  <div style={{border:'1.5px solid #E2E8F0',borderRadius:'10px',overflow:'hidden'}}>
                    <div style={{background:'#F8FAFC',padding:'10px 14px',borderBottom:'1px solid #E2E8F0',fontSize:'13px',color:'#475569'}}>
                      <strong>Objet :</strong> {(templates[selEvent]?.subject||DEFAULT_TEMPLATES[selEvent]?.subject||'').replace(/\{\{(\w+)\}\}/g,(_,k)=>({workflowName:'Demande de congé',stepName:'Validation RH'}[k]||k))}
                    </div>
                    <div style={{padding:'16px',background:'#fff'}} dangerouslySetInnerHTML={{__html:getPreviewHtml()}}/>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB SIGNATURE ── */}
        {tab === 'signature' && (
          <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'28px', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#EFF6FF', border:'1px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:B }}><IconPen/></div>
              <div>
                <h3 style={{margin:0,fontWeight:800,color:'#0F172A',fontSize:'14px'}}>Signature email</h3>
                <p style={{margin:0,fontSize:'12px',color:'#94A3B8'}}>Apparaît en bas de tous vos emails de notification</p>
              </div>
            </div>
            <label style={{display:'block',fontSize:'11px',fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'8px'}}>Code HTML de la signature</label>
            <STextarea value={signature} onChange={e=>setSignature(e.target.value)} rows={5} mono
              placeholder={`<p style="color:#94a3b8;font-size:12px;text-align:center;">© 2026 Votre Société — Tous droits réservés</p>`}/>
            {signature && (
              <div style={{marginTop:'20px'}}>
                <p style={{fontWeight:700,fontSize:'12px',color:'#64748B',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                  <span style={{color:B}}><IconEye/></span> Aperçu
                </p>
                <div style={{border:'1.5px solid #E2E8F0',borderRadius:'10px',padding:'16px',background:'#F8FAFC'}} dangerouslySetInnerHTML={{__html:signature}}/>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CompanySettings;