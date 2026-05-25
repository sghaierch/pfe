import React, { useState, useEffect } from 'react';
import API from '../../../services/api';

const EVENT_LABELS = {
  step_assigned:      { icon: '📋', label: 'Nouvelle tâche assignée',   color: '#4f46e5', desc: 'Envoyé quand une étape est assignée à un employé' },
  step_completed:     { icon: '✅', label: 'Étape validée',              color: '#059669', desc: 'Envoyé au créateur quand une étape est validée' },
  step_rejected:      { icon: '❌', label: 'Étape rejetée',              color: '#dc2626', desc: 'Envoyé au créateur quand une étape est rejetée' },
  workflow_completed: { icon: '🎉', label: 'Workflow terminé',           color: '#059669', desc: 'Envoyé au créateur quand le workflow est terminé' },
  reminder:           { icon: '⏰', label: 'Rappel automatique',         color: '#f59e0b', desc: 'Rappel si une tâche n\'est pas traitée dans les délais' },
};

const VARIABLES = [
  { key: '{{userName}}',      desc: 'Prénom + Nom du destinataire' },
  { key: '{{workflowName}}',  desc: 'Nom du workflow' },
  { key: '{{stepName}}',      desc: 'Nom de l\'étape' },
  { key: '{{completedBy}}',   desc: 'Qui a validé (step_completed)' },
  { key: '{{rejectedBy}}',    desc: 'Qui a rejeté (step_rejected)' },
  { key: '{{comment}}',       desc: 'Motif du rejet' },
  { key: '{{daysPending}}',   desc: 'Nombre de jours en attente (reminder)' },
];

const DEFAULT_TRIGGERS = {
  step_assigned:      { email: true,  push: true,  label: 'Nouvelle tâche assignée' },
  step_completed:     { email: true,  push: true,  label: 'Étape validée' },
  step_rejected:      { email: true,  push: true,  label: 'Étape rejetée' },
  workflow_completed: { email: true,  push: true,  label: 'Workflow terminé' },
  reminder:           { email: true,  push: false, reminderDays: 2, label: 'Rappel automatique' },
};

const DEFAULT_TEMPLATES = {
  step_assigned:      { subject: '📋 Nouvelle tâche : {{stepName}} — {{workflowName}}', body: '' },
  step_completed:     { subject: '✅ Étape validée : {{stepName}} — {{workflowName}}', body: '' },
  step_rejected:      { subject: '❌ Étape rejetée : {{stepName}} — {{workflowName}}', body: '' },
  workflow_completed: { subject: '🎉 Workflow terminé : {{workflowName}}', body: '' },
  reminder:           { subject: '⏰ Rappel : {{workflowName}} — {{stepName}}', body: '' },
};

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

  useEffect(() => {
    API.get('/notifications/settings')
      .then(res => {
        const s = res.data?.data?.settings;
        if (s) {
          if (s.triggers)       setTriggers(prev => ({ ...prev, ...s.triggers }));
          if (s.emailTemplates) setTemplates(prev => ({ ...prev, ...s.emailTemplates }));
          if (s.emailSignature) setSignature(s.emailSignature);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.patch('/notifications/settings', {
        triggers,
        emailTemplates: templates,
        emailSignature: signature,
      });
      showMsg('SUCCESS Paramètres sauvegardés !');
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const updateTrigger = (event, channel, value) => {
    setTriggers(prev => ({
      ...prev,
      [event]: { ...prev[event], [channel]: value }
    }));
  };

  const updateTemplate = (event, field, value) => {
    setTemplates(prev => ({
      ...prev,
      [event]: { ...prev[event], [field]: value }
    }));
  };

  // Prévisualisation email
  const getPreviewHtml = () => {
    const tmpl = templates[selEvent];
    const body = tmpl.body || '<p>Bonjour {{userName}},<br/><br/>Ceci est un email de notification pour le workflow <strong>{{workflowName}}</strong>, étape <strong>{{stepName}}</strong>.</p>';
    const vars = {
      userName: 'Jean Dupont', workflowName: 'Demande de congé',
      stepName: 'Validation RH', completedBy: 'Marie Martin',
      rejectedBy: 'Pierre Durant', comment: 'Dossier incomplet',
      daysPending: '2',
    };
    const colors = { step_assigned: '#4f46e5', step_completed: '#059669', step_rejected: '#dc2626', workflow_completed: '#059669', reminder: '#f59e0b' };
    const interpolated = body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || '{{' + k + '}}');
    return `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
        <div style="background:${colors[selEvent]};padding:16px;text-align:center;">
          <h2 style="color:#fff;margin:0;font-size:16px;">Axia Workflow</h2>
        </div>
        <div style="padding:20px;">${interpolated}</div>
        <div style="padding:12px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
          ${signature || '© Axia Workflow'}
        </div>
      </div>
    `;
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
  const msgBg    = msg.startsWith('SUCCESS') ? '#dcfce7' : '#fee2e2';
  const msgColor = msg.startsWith('SUCCESS') ? '#166534' : '#991b1b';

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            Paramètres Notifications
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Configurez les déclencheurs et personnalisez les templates emails
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '10px 24px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontSize: '14px' }}
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder tout'}
        </button>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: msgBg, color: msgColor }}>
          {msg.replace(/^(SUCCESS|ERREUR)\s?/, '')}
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e2e8f0', marginBottom: '28px' }}>
        {[
          { id: 'triggers',  label: '⚙️ Déclencheurs' },
          { id: 'templates', label: '✉️ Templates emails' },
          { id: 'signature', label: '🖊️ Signature' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', borderRadius: '8px 8px 0 0',
            background: tab === t.id ? '#4f46e5' : 'transparent',
            color:      tab === t.id ? '#fff' : '#64748b',
            borderBottom: tab === t.id ? '2px solid #4f46e5' : '2px solid transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB DÉCLENCHEURS ── */}
      {tab === 'triggers' && (
        <div>
          <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
            Choisissez pour chaque événement si une notification <strong>email</strong> doit être envoyée.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(EVENT_LABELS).map(([event, cfg]) => {
              const trig = triggers[event] || {};
              return (
                <div key={event} style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cfg.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        {cfg.icon}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{cfg.label}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{cfg.desc}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexShrink: 0 }}>
                      {/* Toggle Email */}
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <div
                          onClick={() => updateTrigger(event, 'email', !trig.email)}
                          style={{ width: '44px', height: '24px', borderRadius: '12px', background: trig.email !== false ? '#4f46e5' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
                        >
                          <div style={{ position: 'absolute', top: '2px', left: trig.email !== false ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: trig.email !== false ? '#4f46e5' : '#94a3b8' }}>Email</span>
                      </label>
                    </div>
                  </div>

                  {/* Délai rappel */}
                  {event === 'reminder' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                        Envoyer après :
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={trig.reminderDays || 2}
                        onChange={e => updateTrigger('reminder', 'reminderDays', parseInt(e.target.value))}
                        style={{ ...inp, width: '70px' }}
                      />
                      <span style={{ fontSize: '13px', color: '#64748b' }}>jour(s) d'inactivité</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB TEMPLATES ── */}
      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>

          {/* Sidebar événements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.entries(EVENT_LABELS).map(([event, cfg]) => (
              <button
                key={event}
                onClick={() => { setSelEvent(event); setPreview(false); }}
                style={{
                  padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontWeight: 600, fontSize: '12px',
                  background: selEvent === event ? cfg.color + '15' : '#f8fafc',
                  color:      selEvent === event ? cfg.color : '#64748b',
                  borderLeft: `3px solid ${selEvent === event ? cfg.color : 'transparent'}`,
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>

          {/* Éditeur template */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                {EVENT_LABELS[selEvent]?.icon} Template — {EVENT_LABELS[selEvent]?.label}
              </h3>
              <button
                onClick={() => setPreview(!preview)}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: preview ? '#4f46e5' : '#fff', color: preview ? '#fff' : '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                {preview ? '✏️ Éditer' : '👁️ Aperçu'}
              </button>
            </div>

            {!preview ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                    Objet de l'email
                  </label>
                  <input
                    value={templates[selEvent]?.subject || ''}
                    onChange={e => updateTemplate(selEvent, 'subject', e.target.value)}
                    style={inp}
                    placeholder={DEFAULT_TEMPLATES[selEvent]?.subject}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Laisser vide pour utiliser l'objet par défaut
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                    Corps de l'email <span style={{ fontWeight: 400, color: '#94a3b8' }}>(HTML supporté)</span>
                  </label>
                  <textarea
                    value={templates[selEvent]?.body || ''}
                    onChange={e => updateTemplate(selEvent, 'body', e.target.value)}
                    rows={8}
                    style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                    placeholder={`<p>Bonjour {{userName}},</p>\n<p>Votre tâche <strong>{{stepName}}</strong> dans le workflow <strong>{{workflowName}}</strong> vous attend.</p>`}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Laisser vide pour utiliser le template par défaut
                  </p>
                </div>

                {/* Variables disponibles */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '12px', color: '#374151' }}>
                    Variables disponibles — cliquez pour copier :
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {VARIABLES.map(v => (
                      <button
                        key={v.key}
                        onClick={() => navigator.clipboard.writeText(v.key)}
                        title={v.desc}
                        style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid #c7d2fe', background: '#ede9fe', color: '#4f46e5', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                      >
                        {v.key}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: '13px', color: '#64748b' }}>
                  Aperçu avec des données d'exemple :
                </p>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#374151' }}>
                    <strong>Objet :</strong> {(templates[selEvent]?.subject || DEFAULT_TEMPLATES[selEvent]?.subject || '').replace(/\{\{(\w+)\}\}/g, (_, k) => ({ workflowName: 'Demande de congé', stepName: 'Validation RH' }[k] || k))}
                  </div>
                  <div
                    style={{ padding: '16px', background: '#fff' }}
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB SIGNATURE ── */}
      {tab === 'signature' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px' }}>
          <h3 style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>Signature email</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px' }}>
            Cette signature apparaît en bas de tous vos emails de notification.
          </p>
          <textarea
            value={signature}
            onChange={e => setSignature(e.target.value)}
            rows={5}
            style={{ ...inp, fontFamily: 'monospace', fontSize: '13px', resize: 'vertical', marginBottom: '12px' }}
            placeholder={`<p style="color:#94a3b8;font-size:12px;text-align:center;">© 2026 Votre Société — Tous droits réservés</p>`}
          />
          {signature && (
            <div>
              <p style={{ fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '8px' }}>Aperçu :</p>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}
                dangerouslySetInnerHTML={{ __html: signature }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySettings;