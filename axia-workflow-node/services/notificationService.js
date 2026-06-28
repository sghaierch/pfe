const { sendEmail, emailTemplates, resolveTemplate } = require('./emailService');

const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

// ── Helper email ──────────────────────────────────────────────────────────────
const sendEmailWithTemplate = async (conn, eventType, vars, fallbackTmpl) => {
  const custom = await resolveTemplate(conn, eventType, vars);
  if (custom === null) return;
  const tmpl = {
    subject: custom?.subject || fallbackTmpl.subject,
    html:    custom?.html    || fallbackTmpl.html,
  };
  await sendEmail({ to: vars.to, ...tmpl });
};

// ── Helper : trouver TOUS les users d'un poste (jobTitle, insensible casse) ──
const findUsersByPost = async (conn, postName) => {
  try {
    const userSchema = require('../models/userModel').schema;
    const User = safeModel(conn, 'User', userSchema);
    const normalized = (postName || '').trim();
    return await User.find({
      jobTitle: { $regex: new RegExp('^' + normalized + '$', 'i') },
      isActive: { $ne: false },
    });
  } catch (err) {
    console.error('findUsersByPost error:', err.message);
    return [];
  }
};

// ── Helper : trouver TOUS les users d'une etape ───────────────────────────────
const findStepUsers = async (conn, step) => {
  try {
    const userSchema = require('../models/userModel').schema;
    const User = safeModel(conn, 'User', userSchema);

    // Priorite 1 : assignedTo direct (ObjectId unique)
    if (step.assignedTo) {
      const user = await User.findById(step.assignedTo);
      if (user) {
        console.log('findStepUsers -> par assignedTo:', user.email);
        return [user];
      }
    }

    // Priorite 2 : assignedPost — TOUS les users du poste
    const postName = (step.assignedPost || step.assignedPostName || '').trim();
    if (postName && postName !== 'AUTO') {
      const users = await findUsersByPost(conn, postName);
      console.log('findStepUsers -> poste "' + postName + '": ' + users.length + ' user(s)');
      return users;
    }

    console.log('findStepUsers -> aucun user pour step:', step.name);
    return [];
  } catch (err) {
    console.error('findStepUsers error:', err.message);
    return [];
  }
};

// ── Helper : sauvegarder notification en base ─────────────────────────────────
const saveNotification = async (conn, data) => {
  try {
    const notifSchema = require('../models/notificationModel').schema;
    const Notification = safeModel(conn, 'Notification', notifSchema);
    await Notification.create(data);
  } catch (err) {
    console.error('saveNotification error:', err.message);
  }
};

// ── Helper : verifier si trigger actif ───────────────────────────────────────
const isTriggerActive = async (conn, eventType, channel) => {
  try {
    const schema   = require('../models/notificationSettingsModel').schema;
    const Settings = safeModel(conn, 'NotificationSettings', schema);
    const settings = await Settings.findOne();
    if (!settings) return true;
    return settings.triggers?.[eventType]?.[channel || 'email'] !== false;
  } catch {
    return true;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// notifyWorkflowStarted — NE FAIT RIEN
// Le demarrage admin n'envoie pas de notification.
// La notification au validateur part quand l'employe soumet sa demande (completeStep).
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyWorkflowStarted = async (conn, workflow) => {
  console.log('notifyWorkflowStarted -> aucune action (notifications gerees par completeStep)');
};

// ─────────────────────────────────────────────────────────────────────────────
// notifyStepCompleted — appelee apres chaque validation d'etape
//
// LOGIQUE PROFESSIONNELLE :
//   - Step 0 complete par employe → notifier le VALIDATEUR (step 1)
//   - Step 1 complete par validateur → notifier le CONFIRMATEUR (step 2)
//                                    + informer l'employe que ca avance
//   - Workflow complete → notifier l'EMPLOYE (demande approuvee)
//
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyStepCompleted = async (conn, workflow, stepIndex, completedByName) => {
  try {
    const completedStep = workflow.steps[stepIndex];

    // Trouver l'etape suivante (celle qui vient de passer in_progress)
    const nextStepIndex = workflow.steps.findIndex(
      (s, i) => i > stepIndex && s.status === 'in_progress'
    );
    const nextStep = nextStepIndex !== -1 ? workflow.steps[nextStepIndex] : null;

    const userSchema = require('../models/userModel').schema;
    const User = safeModel(conn, 'User', userSchema);

    // ── 1. Notifier TOUS les responsables de l'etape suivante ────────────────
    if (nextStep) {
      const nextUsers = await findStepUsers(conn, nextStep);

      if (nextUsers.length === 0) {
        console.log('notifyStepCompleted -> aucun responsable pour etape suivante:', nextStep.name);
      }

      for (const nextUser of nextUsers) {
        if (!nextUser?.email) continue;

        const vars = {
          to:            nextUser.email,
          recipientName: nextUser.firstName + ' ' + nextUser.lastName,
          workflowName:  workflow.name,
          stepName:      nextStep.name,
          dueDate:       workflow.dueDate,
          userName:      nextUser.firstName + ' ' + nextUser.lastName,
        };

        await sendEmailWithTemplate(conn, 'step_assigned', vars, emailTemplates.step_assigned(vars));

        await saveNotification(conn, {
          type:           'step_assigned',
          title:          'Nouvelle tache a traiter : ' + nextStep.name,
          message:        'Vous avez une tache a traiter dans "' + workflow.name + '"',
          recipient:      nextUser._id,
          recipientEmail: nextUser.email,
          workflowId:     workflow._id,
          stepIndex:      nextStepIndex,
          isSent:         true,
          sentAt:         new Date(),
        });

        console.log('notifyStepCompleted -> notifie validateur:', nextUser.email);
      }
    }

    // ── 2. Informer l'employe (createur) que son etape a avance ──────────────
    // Seulement si ce n'est pas lui-meme qui vient de completer (eviter doublon step 0)
    const creator = await User.findById(workflow.createdBy);
    if (creator?.email) {
      const creatorId = creator._id.toString();
      const completedById = workflow.steps[stepIndex]?.completedBy?.toString();
      const isCreatorWhoCompleted = completedById === creatorId;

      // Notifier l'employe seulement si c'est un validateur/confirmateur qui a valide
      if (!isCreatorWhoCompleted) {
        const vars = {
          to:            creator.email,
          recipientName: creator.firstName + ' ' + creator.lastName,
          workflowName:  workflow.name,
          stepName:      completedStep.name,
          completedBy:   completedByName,
          nextStepName:  nextStep?.name || '',
          userName:      creator.firstName + ' ' + creator.lastName,
        };

        await sendEmailWithTemplate(conn, 'step_completed', vars, emailTemplates.step_completed(vars));

        await saveNotification(conn, {
          type:           'step_completed',
          title:          'Votre demande avance : ' + completedStep.name + ' validee',
          message:        completedByName + ' a valide l\'etape "' + completedStep.name + '" de votre demande "' + workflow.name + '"',
          recipient:      creator._id,
          recipientEmail: creator.email,
          workflowId:     workflow._id,
          stepIndex,
          isSent:         true,
          sentAt:         new Date(),
        });

        console.log('notifyStepCompleted -> informe employe:', creator.email);
      }
    }
  } catch (err) {
    console.error('notifyStepCompleted error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// notifyStepRejected — appelee quand un validateur rejette
// Notifie l'employe (createur) que sa demande a ete rejetee avec le motif
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyStepRejected = async (conn, workflow, stepIndex, rejectedByName, comment) => {
  try {
    const rejectedStep = workflow.steps[stepIndex];
    const userSchema   = require('../models/userModel').schema;
    const User = safeModel(conn, 'User', userSchema);
    const creator = await User.findById(workflow.createdBy);

    if (creator?.email) {
      const vars = {
        to:            creator.email,
        recipientName: creator.firstName + ' ' + creator.lastName,
        workflowName:  workflow.name,
        stepName:      rejectedStep.name,
        rejectedBy:    rejectedByName,
        comment:       comment || '',
        userName:      creator.firstName + ' ' + creator.lastName,
      };

      await sendEmailWithTemplate(conn, 'step_rejected', vars, emailTemplates.step_rejected(vars));

      await saveNotification(conn, {
        type:           'step_rejected',
        title:          'Demande rejetee : ' + workflow.name,
        message:        rejectedByName + ' a rejete votre demande "' + workflow.name + '"' + (comment ? ' — Motif : ' + comment : ''),
        recipient:      creator._id,
        recipientEmail: creator.email,
        workflowId:     workflow._id,
        stepIndex,
        isSent:         true,
        sentAt:         new Date(),
      });

      console.log('notifyStepRejected -> informe employe:', creator.email);
    }
  } catch (err) {
    console.error('notifyStepRejected error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// notifyWorkflowCompleted — workflow entierement approuve
// Notifie l'employe (createur) que sa demande est approuvee
// ─────────────────────────────────────────────────────────────────────────────
exports.notifyWorkflowCompleted = async (conn, workflow) => {
  try {
    const userSchema = require('../models/userModel').schema;
    const User = safeModel(conn, 'User', userSchema);
    const creator = await User.findById(workflow.createdBy);

    if (creator?.email) {
      const vars = {
        to:            creator.email,
        recipientName: creator.firstName + ' ' + creator.lastName,
        workflowName:  workflow.name,
        userName:      creator.firstName + ' ' + creator.lastName,
      };

      await sendEmailWithTemplate(conn, 'workflow_completed', vars, emailTemplates.workflow_completed(vars));

      await saveNotification(conn, {
        type:           'workflow_completed',
        title:          'Demande approuvee : ' + workflow.name,
        message:        'Votre demande "' + workflow.name + '" a ete entierement approuvee !',
        recipient:      creator._id,
        recipientEmail: creator.email,
        workflowId:     workflow._id,
        isSent:         true,
        sentAt:         new Date(),
      });

      console.log('notifyWorkflowCompleted -> informe employe:', creator.email);
    }
  } catch (err) {
    console.error('notifyWorkflowCompleted error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ── Helper : convertir step.delai en nombre de jours ─────────────────────────
// Formats supportés : '1j', '2j', '3j', '1s', '2s' (j=jour, s=semaine)
const delaiToDays = (delai) => {
  if (!delai || typeof delai !== 'string') return null;
  const val = parseInt(delai);
  if (isNaN(val)) return null;
  if (delai.includes('s')) return val * 7;   // semaines → jours
  if (delai.includes('j')) return val;        // jours
  // Anciens formats numériques en minutes (ex: 1440 = 1 jour)
  if (!isNaN(Number(delai))) {
    const minutes = Number(delai);
    return Math.round(minutes / 1440);
  }
  return null;
};

// sendReminders — rappels automatiques aux validateurs en retard
// Lit step.delai pour envoyer le rappel EXACTEMENT quand le délai est dépassé
// ─────────────────────────────────────────────────────────────────────────────
exports.sendReminders = async (conn) => {
  try {
    const workflowSchema = require('../models/workflowModel').schema;
    const Workflow = safeModel(conn, 'Workflow', workflowSchema);

    // ── Délai de fallback depuis les settings (si step.delai non configuré) ──
    let globalReminderDays = 2; // défaut : 2 jours
    let remindersEnabled   = true;
    try {
      const schema   = require('../models/notificationSettingsModel').schema;
      const Settings = safeModel(conn, 'NotificationSettings', schema);
      const settings = await Settings.findOne();
      if (settings?.triggers?.reminder?.reminderDays) {
        globalReminderDays = settings.triggers.reminder.reminderDays;
      }
      if (settings?.triggers?.reminder?.email === false) {
        console.log('[CRON] Rappels désactivés pour ce tenant');
        remindersEnabled = false;
      }
    } catch {}

    if (!remindersEnabled) return;

    // Exclure les templates — uniquement les instances réelles
    const activeWorkflows = await Workflow.find({ status: 'active', isTemplate: { $ne: true } });
    const now = new Date();
    let totalSent = 0;

    for (const wf of activeWorkflows) {
      const stepIdx     = wf.currentStep;
      const currentStep = wf.steps[stepIdx];
      if (!currentStep || currentStep.status !== 'in_progress') continue;

      // ── Calcul du délai applicable ────────────────────────────────────────
      // Priorité 1 : step.delai configuré dans l'éditeur (ex: '2j', '1s')
      // Priorité 2 : globalReminderDays depuis les settings
      const stepDelaiDays = delaiToDays(currentStep.delai);
      const reminderDays  = stepDelaiDays !== null ? stepDelaiDays : globalReminderDays;

      // ── Temps écoulé depuis le début de cette étape ───────────────────────
      const stepStarted = currentStep.updatedAt || wf.startedAt || wf.updatedAt;
      const daysPending = Math.floor((now - new Date(stepStarted)) / (1000 * 60 * 60 * 24));

      // ── Déclencher uniquement quand le délai est exactement dépassé ───────
      // On envoie si daysPending >= reminderDays (pas avant)
      if (daysPending < reminderDays) {
        console.log(`[CRON] "\${wf.name}" étape "\${currentStep.name}" : \${daysPending}j / \${reminderDays}j — pas encore en retard`);
        continue;
      }

      // ── Marquer l'étape comme "en retard" dans l'historique (1 seule fois) ─
      const alreadyNotified = (wf.history || []).some(h =>
        h.action === 'step_overdue_reminder' &&
        h.stepIndex === stepIdx &&
        // Ne pas renvoyer si déjà notifié aujourd'hui
        new Date(h.date).toDateString() === now.toDateString()
      );

      if (alreadyNotified) {
        console.log(`[CRON] "\${wf.name}" étape "\${currentStep.name}" : rappel déjà envoyé aujourd'hui`);
        continue;
      }

      // ── Trouver les destinataires de cette étape ──────────────────────────
      const users = await findStepUsers(conn, currentStep);

      for (const user of users) {
        if (!user?.email) continue;
        const vars = {
          to:            user.email,
          recipientName: user.firstName + ' ' + user.lastName,
          workflowName:  wf.name,
          stepName:      currentStep.name,
          daysPending,
          delaiConfigured: currentStep.delai || `\${reminderDays}j`,
          userName:      user.firstName + ' ' + user.lastName,
        };
        await sendEmailWithTemplate(conn, 'reminder', vars, emailTemplates.reminder(vars));
        console.log(`[CRON] ✅ Rappel envoyé à \${user.email} — "\${wf.name}" / "\${currentStep.name}" (\${daysPending}j de retard)`);
        totalSent++;
      }

      // ── Enregistrer dans l'historique du workflow ─────────────────────────
      try {
        wf.history.push({
          action:    'step_overdue_reminder',
          stepIndex: stepIdx,
          stepName:  currentStep.name,
          byName:    'Système',
          comment:   `Rappel automatique — \${daysPending} jour(s) de retard (délai configuré : \${currentStep.delai || globalReminderDays + 'j'})`,
          date:      now,
        });
        await wf.save();
      } catch (saveErr) {
        console.error('[CRON] Erreur sauvegarde historique:', saveErr.message);
      }
    }

    console.log(`[CRON] Rappels terminés — \${totalSent} email(s) envoyé(s) sur \${activeWorkflows.length} workflow(s) actif(s)`);
  } catch (err) {
    console.error('[CRON] sendReminders error:', err.message);
  }
};