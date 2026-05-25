// services/pushService.js
const webpush = require('web-push');

// ✅ Configuration VAPID avec vos clés .env
webpush.setVapidDetails(
  process.env.VAPID_EMAIL    || 'mailto:contact@axia-workflow.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Envoyer une notification push à une subscription ─────────────────────────
const sendPush = async (subscription, payload) => {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    console.log('✅ Push envoyé');
    return true;
  } catch (err) {
    // 410 = subscription expirée/révoquée → à supprimer de la base
    if (err.statusCode === 410) {
      console.log('⚠️ Subscription expirée, à supprimer');
      return 'expired';
    }
    console.error('❌ Push error:', err.message);
    return false;
  }
};

// ── Payload selon le type d'événement ────────────────────────────────────────
const pushPayloads = {
  step_assigned: ({ workflowName, stepName }) => ({
    title:   '📋 Nouvelle tâche',
    body:    `${stepName} — ${workflowName}`,
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    url:     '/dashboard/employee',
    tag:     'step_assigned',  // remplace la notif précédente du même type
  }),

  step_completed: ({ workflowName, stepName, completedBy }) => ({
    title:   '✅ Étape validée',
    body:    `${stepName} validée par ${completedBy} — ${workflowName}`,
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    url:     '/dashboard/company/projects',
    tag:     'step_completed',
  }),

  step_rejected: ({ workflowName, stepName, rejectedBy }) => ({
    title:   '❌ Étape rejetée',
    body:    `${stepName} rejetée par ${rejectedBy} — ${workflowName}`,
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    url:     '/dashboard/company/projects',
    tag:     'step_rejected',
  }),

  workflow_completed: ({ workflowName }) => ({
    title:   '🎉 Workflow terminé !',
    body:    `${workflowName} est terminé avec succès`,
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    url:     '/dashboard/company/projects',
    tag:     'workflow_completed',
  }),

  reminder: ({ workflowName, stepName, daysPending }) => ({
    title:   '⏰ Rappel',
    body:    `Tâche en attente depuis ${daysPending}j : ${stepName} — ${workflowName}`,
    icon:    '/logo192.png',
    badge:   '/logo192.png',
    url:     '/dashboard/employee',
    tag:     'reminder',
  }),
};

module.exports = { sendPush, pushPayloads };