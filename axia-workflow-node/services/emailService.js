const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD_APPLICATION,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Axia Workflow" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log('✅ Email envoyé à:', to);
    return true;
  } catch (err) {
    console.error('❌ Erreur email:', err.message);
    return false;
  }
};

// ✅ Remplacer les variables {{variable}} dans un template
const interpolate = (text, vars) => {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
};

// ✅ Construire le HTML complet depuis un body personnalisé
const buildCustomHtml = (body, vars, headerColor, signature) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;
              border-radius:12px;border:1px solid #e2e8f0;">
    <div style="background:${headerColor};padding:20px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;">Axia Workflow</h1>
    </div>
    <div style="padding:24px;">
      ${interpolate(body, vars)}
    </div>
    <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
      ${signature || '<p style="color:#94a3b8;font-size:12px;margin:0;">© ' + new Date().getFullYear() + ' Axia Workflow</p>'}
    </div>
  </div>
`;

// ✅ Résoudre un template — cherche en base, sinon utilise le hardcodé
const resolveTemplate = async (conn, eventType, vars) => {
  try {
    if (conn) {
      const mongoose = require('mongoose');
      const schema = require('../models/notificationSettingsModel').schema;
      const safeModel = (c, n, s) => { try { return c.model(n); } catch { return c.model(n, s); } };
      const Settings = safeModel(conn, 'NotificationSettings', schema);
      const settings = await Settings.findOne();

      if (settings) {
        const tmpl    = settings.emailTemplates?.[eventType];
        const trigger = settings.triggers?.[eventType];

        // Vérifier si l'email est activé pour cet event
        if (trigger && trigger.email === false) {
          return null; // Email désactivé — ne pas envoyer
        }

        // Si un subject ou body personnalisé existe, l'utiliser
        if (tmpl && (tmpl.subject || tmpl.body)) {
          const headerColors = {
            step_assigned:      '#4f46e5',
            step_completed:     '#059669',
            step_rejected:      '#dc2626',
            workflow_completed: '#059669',
            reminder:           '#f59e0b',
          };
          return {
            subject: tmpl.subject ? interpolate(tmpl.subject, vars) : null,
            html:    tmpl.body    ? buildCustomHtml(
              tmpl.body, vars,
              headerColors[eventType] || '#4f46e5',
              settings.emailSignature
            ) : null,
          };
        }
      }
    }
  } catch (err) {
    console.error('⚠️ resolveTemplate DB error:', err.message);
  }
  return null; // Fallback sur le template hardcodé
};

// ── Templates hardcodés (fallback) ───────────────────────────────────────────
const emailTemplates = {

  step_assigned: ({ recipientName, workflowName, stepName, dueDate }) => ({
    subject: `📋 Nouvelle tâche : ${stepName} — ${workflowName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
        <div style="background:#4f46e5;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Axia Workflow</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Bonjour ${recipientName},</h2>
          <p style="color:#374151;font-size:15px;">
            Vous avez une <strong>nouvelle tâche à traiter</strong> dans le workflow :
          </p>
          <div style="background:#f8fafc;border-radius:10px;padding:16px;margin:16px 0;border-left:4px solid #4f46e5;">
            <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Workflow</p>
            <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#0f172a;">${workflowName}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Étape à traiter</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#4f46e5;">${stepName}</p>
            ${dueDate ? `<p style="margin:8px 0 0;font-size:13px;color:#f59e0b;">⏰ Échéance : ${new Date(dueDate).toLocaleDateString('fr-FR')}</p>` : ''}
          </div>
          <p style="color:#374151;font-size:14px;">Connectez-vous à votre dashboard pour traiter cette tâche.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/employee"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:8px;">
            Voir mes tâches
          </a>
        </div>
        <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      </div>
    `,
  }),

  step_completed: ({ recipientName, workflowName, stepName, completedBy, nextStepName }) => ({
    subject: `✅ Étape validée : ${stepName} — ${workflowName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
        <div style="background:#059669;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Axia Workflow</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Bonjour ${recipientName},</h2>
          <p style="color:#374151;font-size:15px;">
            L'étape <strong>${stepName}</strong> du workflow <strong>${workflowName}</strong>
            vient d'être <span style="color:#059669;font-weight:700;">validée</span> par ${completedBy}.
          </p>
          ${nextStepName ? `
          <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0;border-left:4px solid #059669;">
            <p style="margin:0;font-size:14px;color:#166534;">▶ Prochaine étape : <strong>${nextStepName}</strong></p>
          </div>` : ''}
        </div>
        <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      </div>
    `,
  }),

  step_rejected: ({ recipientName, workflowName, stepName, rejectedBy, comment }) => ({
    subject: `❌ Étape rejetée : ${stepName} — ${workflowName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
        <div style="background:#dc2626;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Axia Workflow</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Bonjour ${recipientName},</h2>
          <p style="color:#374151;font-size:15px;">
            L'étape <strong>${stepName}</strong> du workflow <strong>${workflowName}</strong>
            a été <span style="color:#dc2626;font-weight:700;">rejetée</span> par ${rejectedBy}.
          </p>
          ${comment ? `
          <div style="background:#fff5f5;border-radius:10px;padding:16px;margin:16px 0;border-left:4px solid #dc2626;">
            <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Motif du rejet :</p>
            <p style="margin:0;font-size:14px;color:#991b1b;font-style:italic;">"${comment}"</p>
          </div>` : ''}
        </div>
        <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      </div>
    `,
  }),

  workflow_completed: ({ recipientName, workflowName }) => ({
    subject: `🎉 Workflow terminé : ${workflowName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
        <div style="background:#059669;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Axia Workflow</h1>
        </div>
        <div style="padding:24px;text-align:center;">
          <p style="font-size:48px;margin:0 0 16px;">🎉</p>
          <h2 style="color:#0f172a;margin:0 0 12px;">Félicitations ${recipientName} !</h2>
          <p style="color:#374151;font-size:15px;">
            Le workflow <strong>${workflowName}</strong> est maintenant
            <span style="color:#059669;font-weight:700;">terminé avec succès</span>.
          </p>
        </div>
        <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      </div>
    `,
  }),

  reminder: ({ recipientName, workflowName, stepName, daysPending }) => ({
    subject: `⏰ Rappel : Tâche en attente depuis ${daysPending} jour(s) — ${workflowName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e2e8f0;">
        <div style="background:#f59e0b;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">Axia Workflow — Rappel</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 16px;">Bonjour ${recipientName},</h2>
          <p style="color:#374151;font-size:15px;">
            Vous avez une tâche en attente depuis
            <strong style="color:#f59e0b;">${daysPending} jour(s)</strong>.
          </p>
          <div style="background:#fef3c7;border-radius:10px;padding:16px;margin:16px 0;border-left:4px solid #f59e0b;">
            <p style="margin:0 0 8px;font-size:14px;color:#92400e;">Workflow : <strong>${workflowName}</strong></p>
            <p style="margin:0;font-size:14px;color:#92400e;">Étape : <strong>${stepName}</strong></p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/employee"
             style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
            Traiter maintenant
          </a>
        </div>
        <div style="padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates, resolveTemplate };