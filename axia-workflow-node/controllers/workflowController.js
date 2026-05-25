const mongoose = require('mongoose');
const DOC_TRANSFORMATIONS = {
  'DA':  'DAC',
  'DAC': 'BS',
  'BS':  'DF',
  'DF':  'BR',
};
const generateDocNumber = async (conn, type) => {
  const schema = require('../models/businessDocumentModel').schema;
  const BDoc   = safeModel(conn, 'BusinessDocument', schema);
  const year   = new Date().getFullYear().toString().slice(-2);
  const count  = await BDoc.countDocuments({ type });
  return type + year + String(count + 1).padStart(3, '0');
};

const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

const getWorkflowModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const { schema } = require('../models/workflowModel');
  return safeModel(conn, 'Workflow', schema);
};

// ✅ FIX BUG 1 : helper centralisé pour normaliser les champs d'un formulaire
// Utilisé dans createWorkflow ET updateWorkflow pour éviter l'erreur "options"
const normalizeFormFields = (fields = []) => {
  return (fields || [])
    .filter(f => f != null && typeof f === 'object')   // ← élimine les null/undefined
    .map((f) => ({
      ...f,
      id:         f.id         || new mongoose.Types.ObjectId().toString(),
      options:    Array.isArray(f.options)  ? f.options  : [],   // ← plus jamais undefined
      columns:    Array.isArray(f.columns)  ? f.columns  : [],
      readOnly:   f.readOnly   || false,
      autoSource: f.autoSource || '',
      data:       f.data       ?? null,
    }));
};

// ─────────────────────────────────────────────────────────────────────────────
// ── MOTEUR DE CONDITIONS DE TRANSITION ───────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const evaluateCondition = (condition, formData = {}) => {
  const { field, operator, value } = condition;
  const submitted = formData[field];

  if (submitted === undefined || submitted === null || submitted === '') return false;

  const numSubmitted = parseFloat(submitted);
  const numValue     = parseFloat(value);
  const isNumeric    = !isNaN(numSubmitted) && !isNaN(numValue);

  switch (operator) {
    case 'equals':     return String(submitted).toLowerCase() === String(value).toLowerCase();
    case 'not_equals': return String(submitted).toLowerCase() !== String(value).toLowerCase();
    case 'contains':   return String(submitted).toLowerCase().includes(String(value).toLowerCase());
    case 'greater':    return isNumeric && numSubmitted > numValue;
    case 'less':       return isNumeric && numSubmitted < numValue;
    default:
      console.warn('⚠️ Opérateur inconnu:', operator);
      return false;
  }
};

const stepConditionsMet = (step, formData = {}) => {
  const conditions = step.conditions || [];
  if (conditions.length === 0) return true;
  return conditions.every((cond) => evaluateCondition(cond, formData));
};

const evaluateNextStep = (workflow, currentStepIndex, formData = {}) => {
  const steps = workflow.steps;

  for (let i = currentStepIndex + 1; i < steps.length; i++) {
    if (stepConditionsMet(steps[i], formData)) {
      console.log(`✅ Moteur conditions → étape ${i} "${steps[i].name}" sélectionnée`);
      for (let j = currentStepIndex + 1; j < i; j++) {
        steps[j].status  = 'completed';
        steps[j].comment = 'Étape ignorée automatiquement (conditions non satisfaites)';
        console.log(`⏭️  Étape ${j} "${steps[j].name}" ignorée`);
      }
      return i;
    }
  }
  return -1;
};

const canUserSeeWorkflow = (workflow, user) => {
  if (workflow.visibility !== 'restricted') return true;
  const userId   = user._id.toString();
  const userRole = typeof user.role === 'object' ? user.role?.name : user.role;
  const userPost = user.jobTitle || '';

  if (workflow.allowedUsers?.some(u => u.toString() === userId)) return true;
  if (workflow.allowedRoles?.includes(userRole)) return true;
  if (workflow.allowedPosts?.includes(userPost)) return true;
  return false;
};

// ── GET /workflows/project/:projectId ────────────────────────────────────────
exports.getWorkflows = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const query = req.params.projectId
      ? { project: req.params.projectId }
      : {};
    const workflows = await Workflow.find(query)
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { workflows } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/audit-log ──────────────────────────────────────────────────
exports.getAuditLog = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const { action, user, from, to, workflowId } = req.query;

    const all = await Workflow.find({ 'history.0': { $exists: true } }).sort({ updatedAt: -1 });

    let entries = [];
    all.forEach((wf) => {
      (wf.history || []).forEach((h) => {
        entries.push({
          workflowId:     wf._id,
          workflowName:   wf.name,
          workflowStatus: wf.status,
          action:    h.action,
          stepName:  h.stepName  || '',
          byName:    h.byName    || '',
          by:        h.by,
          comment:   h.comment   || '',
          date:      h.date,
        });
      });
    });

    if (workflowId) entries = entries.filter(e => e.workflowId.toString() === workflowId);
    if (action)     entries = entries.filter(e => e.action === action);
    if (user)       entries = entries.filter(e => e.byName?.toLowerCase().includes(user.toLowerCase()));
    if (from)       entries = entries.filter(e => new Date(e.date) >= new Date(from));
    if (to)         entries = entries.filter(e => new Date(e.date) <= new Date(to + 'T23:59:59'));

    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ status: 'success', data: { entries, total: entries.length } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/:id ────────────────────────────────────────────────────────
exports.getWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id)
      .populate('steps.assignedTo', 'firstName lastName email');

    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });

    const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
    const isAdmin  = req.user.isCompanyAdmin || userRole === 'company_admin';

    if (!isAdmin && !canUserSeeWorkflow(workflow, req.user)) {
      return res.status(403).json({ status: 'fail', message: 'Accès refusé à ce workflow' });
    }

    let documents = [];
    try {
      const docSchema = require('../models/documentModel')?.schema;
      if (docSchema) {
        const Document = safeModel(req.tenantConnection, 'Document', docSchema);
        documents = await Document.find({ workflow: workflow._id }).sort({ createdAt: -1 });
      }
    } catch (e) { documents = []; }

    res.json({ status: 'success', data: { workflow, documents } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── POST /workflows ───────────────────────────────────────────────────────────
exports.createWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);

    const {
      name, description, projectId, project, dueDate, steps = [],
      visibility = 'global', allowedRoles = [], allowedPosts = [], allowedUsers = [],
    } = req.body;

    const projectRef = project || projectId || null;
    // ✅ FIX BUG 1 : utilisation de normalizeFormFields pour éviter "options undefined"
    const stepsWithDefaults = steps.map((s, i) => ({
      ...s,
      order:            s.order ?? i,
      status:           'pending',
      assignedPostName: s.assignedPostName || s.assignedPost || '',
      assignedToName:   s.assignedToName   || '',
      conditions:       s.conditions       || [],
      form: {
        fields: normalizeFormFields(s.form?.fields),
      },
      claims: {
        canValidate: s.claims?.canValidate !== false,
        canReject:   s.claims?.canReject   !== false,
        canModify:   s.claims?.canModify   === true,
        canView:     s.claims?.canView     !== false,
      },
    }));

    const workflow = await Workflow.create({
  name, description,
  ...(projectRef ? { project: projectRef } : {}),  // ✅ n'inclut project que s'il existe
  createdBy:  req.user._id,
  dueDate,
  isTemplate: req.body.isTemplate || false,
  docType:    req.body.docType || '',
  steps:      stepsWithDefaults,
  visibility,
  allowedRoles,
  allowedPosts,
  allowedUsers,
});

    // ── Créer le document initial si docType fourni ──────────────────────────
    if (req.body.docType && req.body.documentData) {
      try {
        const bdSchema  = require('../models/businessDocumentModel').schema;
        const BDoc      = safeModel(req.tenantConnection, 'BusinessDocument', bdSchema);
        const number    = await generateDocNumber(req.tenantConnection, req.body.docType);
        const doc       = await BDoc.create({
          number,
          type:          req.body.docType,
          statut:        'en_cours',
          demandeur:     req.body.documentData.demandeur,
          depot:         req.body.documentData.depot,
          priorite:      req.body.documentData.priorite || 'normale',
          commentaire:   req.body.documentData.commentaire,
          lignes:        req.body.documentData.lignes || [],
          workflow:      workflow._id,
          createdBy:     req.user._id,
          createdByName: req.user.firstName + ' ' + req.user.lastName,
        });
        workflow.docType     = req.body.docType;
        workflow.businessDoc = doc._id;
        workflow.rootDoc     = doc._id;
        await workflow.save();
      } catch (e) {
        console.warn('⚠️ Création doc initiale:', e.message);
      }
    }

    res.status(201).json({ status: 'success', data: { workflow } });
    console.log('📝 createWorkflow — user:', req.user._id, '— payload:', { name, projectRef, isTemplate: req.body.isTemplate });
  } catch (err) {
    console.error('❌ ERREUR createWorkflow:', err.message);
    console.error('❌ DETAILS:', JSON.stringify(err.errors));
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /workflows/:id/start ────────────────────────────────────────────────
// Utilisé par l'ADMIN pour activer un workflow template (visible aux employés)
exports.startWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    if (workflow.status !== 'draft') return res.status(400).json({ status: 'fail', message: 'Workflow déjà démarré' });

    workflow.status     = 'active';
    workflow.startedAt  = new Date();
    workflow.isTemplate = true; // ✅ workflow démarré par admin = template visible aux employés
    if (workflow.steps.length > 0) workflow.steps[0].status = 'in_progress';

    workflow.history.push({
      action: 'workflow_started',
      by:     req.user._id,
      byName: req.user.firstName + ' ' + req.user.lastName,
      date:   new Date(),
    });

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/start-instance ──────────────────────────────────────
// ✅ NOUVEAU — Utilisé par l'EMPLOYÉ pour démarrer sa propre demande
// Ne touche PAS à isTemplate (reste false pour les instances employés)
exports.startInstance = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    if (workflow.status !== 'draft') return res.status(400).json({ status: 'fail', message: 'Workflow déjà démarré' });

    workflow.status    = 'active';
    workflow.startedAt = new Date();
    // ✅ isTemplate reste false — c'est une instance de demande employé, pas un template
    if (workflow.steps.length > 0) workflow.steps[0].status = 'in_progress';

    workflow.history.push({
      action: 'workflow_started',
      by:     req.user._id,
      byName: req.user.firstName + ' ' + req.user.lastName,
      date:   new Date(),
    });

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/complete-step ───────────────────────────────────────
exports.completeStep = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const { comment, formData, checklistData } = req.body;
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    if (workflow.status !== 'active') return res.status(400).json({ status: 'fail', message: 'Workflow non actif' });

    const stepIndex = workflow.currentStep;
    const step      = workflow.steps[stepIndex];
    if (!step) return res.status(400).json({ status: 'fail', message: 'Étape introuvable' });

    const userId   = req.user._id.toString();
    const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
    const userPost = req.user.jobTitle || '';
    const isAdmin  = req.user.isCompanyAdmin || userRole === 'company_admin';

    const assignedTo = step.assignedTo?.toString();
    const isAssigned = assignedTo === userId
                    || step.assignedRole === userRole
                    || step.assignedPost?.toLowerCase().trim() === userPost?.toLowerCase().trim();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ status: 'fail', message: 'Cette étape ne vous est pas assignée' });
    }

    // ✅ BUG 3 FIX : le créateur peut toujours compléter step 0 (sa propre demande)
    // même si canValidate=false sur l'étape employé
    const isCreator      = workflow.createdBy?.toString() === userId;
    const isStep0ByCreator = isCreator && stepIndex === 0;
    if (!isAdmin && !isStep0ByCreator && step.claims?.canValidate === false) {
      return res.status(403).json({ status: 'fail', message: "Vous n'avez pas la permission de valider cette étape" });
    }

    if (formData && step.form?.fields) {
      step.form.fields.forEach((field) => {
        if (formData[field.id] !== undefined) field.data = formData[field.id]; // FIX: data pas value
      });
    }
    if (checklistData) {
      checklistData.forEach((item, i) => {
        if (step.checklist[i]) step.checklist[i].checked = item.checked;
      });
    }

    step.status      = 'completed';
    step.completedAt = new Date();
    step.completedBy = req.user._id;
    step.comment     = comment || '';

    workflow.history.push({
      action: 'step_completed', stepIndex, stepName: step.name,
      by: req.user._id, byName: req.user.firstName + ' ' + req.user.lastName,
      comment: comment || '', date: new Date(),
    });

    const submittedFormData = {};
    if (step.form?.fields) {
      step.form.fields.forEach((field) => {
        if (field.data !== undefined && field.data !== null) {
          submittedFormData[field.id]    = field.data;
          submittedFormData[field.label] = field.data;
        }
      });
    }
    const allFormData = { ...submittedFormData, ...(formData || {}) };
    console.log('🔍 Moteur conditions — formData évalué:', allFormData);

    const nextIndex = evaluateNextStep(workflow, stepIndex, allFormData);

    if (nextIndex !== -1) {
      workflow.currentStep             = nextIndex;
      workflow.steps[nextIndex].status = 'in_progress';
      workflow.history.push({
        action:    'step_skipped_by_condition',
        stepIndex: nextIndex,
        stepName:  workflow.steps[nextIndex].name,
        by:        req.user._id,
        byName:    req.user.firstName + ' ' + req.user.lastName,
        comment:   'Sélectionné par moteur de conditions',
        date:      new Date(),
      });
    } else {
      workflow.status      = 'completed';
      workflow.completedAt = new Date();
      workflow.history.push({
        action: 'workflow_completed',
        by:     req.user._id,
        byName: req.user.firstName + ' ' + req.user.lastName,
        date:   new Date(),
      });
    }

    workflow.markModified('steps');
    await workflow.save();

    try {
      if (workflow.docType && workflow.businessDoc) {
        const nextDocType = DOC_TRANSFORMATIONS[workflow.docType];
        if (nextDocType && workflow.status !== 'completed') {
          const bdSchema  = require('../models/businessDocumentModel').schema;
          const BDoc      = safeModel(req.tenantConnection, 'BusinessDocument', bdSchema);
          const sourceDoc = await BDoc.findById(workflow.businessDoc);
          if (sourceDoc) {
            const newNumber = await generateDocNumber(req.tenantConnection, nextDocType);
            const newDoc = await BDoc.create({
              number:        newNumber,
              type:          nextDocType,
              statut:        'en_cours',
              demandeur:     sourceDoc.demandeur,
              depot:         sourceDoc.depot,
              priorite:      sourceDoc.priorite,
              lignes:        sourceDoc.lignes,
              workflow:      workflow._id,
              parentDoc:     sourceDoc._id,
              rootDoc:       sourceDoc.rootDoc || sourceDoc._id,
              createdBy:     req.user._id,
              createdByName: req.user.firstName + ' ' + req.user.lastName,
            });
            workflow.docType     = nextDocType;
            workflow.businessDoc = newDoc._id;
            await workflow.save();
            sourceDoc.statut = 'validé';
            await sourceDoc.save();
            console.log(`✅ Transformation : ${workflow.docType} → ${newDoc.number}`);
          }
        }
        if (workflow.status === 'completed' && workflow.businessDoc) {
          const bdSchema = require('../models/businessDocumentModel').schema;
          const BDoc     = safeModel(req.tenantConnection, 'BusinessDocument', bdSchema);
          await BDoc.findByIdAndUpdate(workflow.businessDoc, { statut: 'validé' });
        }
      }
    } catch (docErr) {
      console.warn('⚠️ Transformation doc non bloquante:', docErr.message);
    }

    try {
      const notifService = require('../services/notificationService');
      const byName = req.user.firstName + ' ' + req.user.lastName;

      if (workflow.status === 'completed') {
        // Workflow entierement approuve -> notifier l'employe (createur)
        await notifService.notifyWorkflowCompleted(req.tenantConnection, workflow);
      } else {
        // Une etape vient d'etre completee -> notifier le responsable de l'etape suivante
        // ET informer l'employe que sa demande avance
        await notifService.notifyStepCompleted(req.tenantConnection, workflow, stepIndex, byName);
      }
    } catch (e) { console.warn('Notif error:', e.message); }

    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/reject-step ─────────────────────────────────────────
exports.rejectStep = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const { comment } = req.body;
    if (!comment?.trim()) return res.status(400).json({ status: 'fail', message: 'Un commentaire est requis pour rejeter' });

    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    if (workflow.status !== 'active') return res.status(400).json({ status: 'fail', message: 'Workflow non actif' });

    const stepIndex = workflow.currentStep;
    const step      = workflow.steps[stepIndex];
    if (!step) return res.status(400).json({ status: 'fail', message: 'Étape introuvable' });

    const userId   = req.user._id.toString();
    const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
    const userPost = req.user.jobTitle || '';
    const isAdmin  = req.user.isCompanyAdmin || userRole === 'company_admin';

    const assignedTo = step.assignedTo?.toString();
    const isAssigned = assignedTo === userId
                    || step.assignedRole === userRole
                    || step.assignedPost?.toLowerCase().trim() === userPost?.toLowerCase().trim();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ status: 'fail', message: 'Cette étape ne vous est pas assignée' });
    }

    // ✅ FIX : claims vérifié APRÈS avoir confirmé que l'étape appartient à l'utilisateur
    if (!isAdmin && step.claims?.canReject === false) {
      return res.status(403).json({ status: 'fail', message: "Vous n'avez pas la permission de rejeter cette étape" });
    }

    step.status  = 'rejected';
    step.comment = comment;

    workflow.status = 'rejected';
    workflow.history.push({
      action: 'step_rejected', stepIndex, stepName: step.name,
      by: req.user._id, byName: req.user.firstName + ' ' + req.user.lastName,
      comment, date: new Date(),
    });

    workflow.markModified('steps');
    await workflow.save();

    try {
      const notifService = require('../services/notificationService');
      const byName = req.user.firstName + ' ' + req.user.lastName;
      await notifService.notifyStepRejected(req.tenantConnection, workflow, stepIndex, byName, comment);
    } catch (e) { console.warn('Notif error:', e.message); }

    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/my-requests ────────────────────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);

    const workflows = await Workflow.find({
      createdBy:  req.user._id,
      isTemplate: { $ne: true },
      status:     { $ne: 'archived' },
    })
      .sort({ createdAt: -1 })
      .lean();

    let enriched = workflows;
    try {
      const bdSchema = require('../models/businessDocumentModel').schema;
      const BDoc     = safeModel(req.tenantConnection, 'BusinessDocument', bdSchema);

      enriched = await Promise.all(workflows.map(async (wf) => {
        if (!wf.businessDoc) return wf;
        try {
          const doc = await BDoc.findById(wf.businessDoc).lean();
          return { ...wf, businessDocInfo: doc ? { number: doc.number, type: doc.type, priorite: doc.priorite, demandeur: doc.demandeur } : null };
        } catch (_) { return wf; }
      }));
    } catch (_) {}

    res.json({ status: 'success', data: { workflows: enriched, total: enriched.length } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/my-tasks ───────────────────────────────────────────────────
exports.getMyTasks = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const userId   = req.user._id.toString();
    const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
    const userPost = req.user.jobTitle || '';

    const workflows = await Workflow.find({ status: 'active', isTemplate: { $ne: true } });

    console.log('getMyTasks -> userId:', userId, '| userPost:', userPost);
    console.log('getMyTasks -> workflows actifs:', workflows.length);

    const tasks = [];
    for (const wf of workflows) {
      // FIX 2 : chercher TOUTES les étapes in_progress assignées à cet user
      // et pas uniquement wf.steps[wf.currentStep] qui peut être désynchronisé
      const stepIdx = wf.steps.findIndex((step) => {
        if (step.status !== 'in_progress') return false;
        if (step.claims?.canView === false) return false;
        const assignedTo = step.assignedTo?.toString();
        const stepPost   = (step.assignedPost || '').toLowerCase().trim();
        const stepRole   = step.assignedRole  || '';
        const byId   = assignedTo === userId;
        const byPost = stepPost !== '' && stepPost === userPost.toLowerCase().trim();
        const byRole = stepRole !== '' && stepRole === userRole;
        if (byId || byPost || byRole) {
          console.log('getMyTasks -> MATCH wf:', wf.name, '| step:', step.name,
            '| byId:', byId, '| byPost:', byPost,
            '| stepPost="' + stepPost + '" userPost="' + userPost + '"');
          return true;
        }
        return false;
      });

      if (stepIdx === -1) continue;
      const step = wf.steps[stepIdx];
      tasks.push({
        workflowId:   wf._id,
        workflowName: wf.name,
        stepIndex:    stepIdx,
        dueDate:      wf.dueDate,
        history:      (wf.history || []).slice(-5),
        step:         { ...step.toObject(), claims: step.claims },
      });
    }

    console.log('getMyTasks -> taches retournees:', tasks.length);
    res.json({ status: 'success', data: { tasks } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/global/visible ─────────────────────────────────────────────
exports.getGlobalWorkflows = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const userRole = typeof req.user.role === 'object' ? req.user.role?.name : req.user.role;
    const isAdmin  = req.user.isCompanyAdmin || userRole === 'company_admin';

    const allWorkflows = await Workflow.find({
      status:     { $in: ['active', 'completed', 'rejected'] },
      isTemplate: { $ne: true },
    }).sort({ createdAt: -1 });

    const visible = isAdmin
      ? allWorkflows
      : allWorkflows.filter((wf) => canUserSeeWorkflow(wf, req.user));

    res.json({ status: 'success', data: { workflows: visible } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/stats/overview ─────────────────────────────────────────────
exports.getWorkflowStats = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const now = new Date();

    // ── Tous les enregistrements ─────────────────────────────────────────────
    const all = await Workflow.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 });

    // ── Séparation templates / instances ────────────────────────────────────
    // templates  = créés par admin (isTemplate:true)
    // instances  = demandes soumises par employés (isTemplate:false ou absent)
    const templates  = all.filter(w => w.isTemplate === true);
    const instances  = all.filter(w => w.isTemplate !== true);

    // ── Stats portent UNIQUEMENT sur les instances (demandes réelles) ────────
    const stats = {
      total:     instances.length,
      draft:     instances.filter(w => w.status === 'draft').length,
      active:    instances.filter(w => w.status === 'active').length,
      completed: instances.filter(w => w.status === 'completed').length,
      rejected:  instances.filter(w => w.status === 'rejected').length,
      overdue:   0,
      // compteurs templates pour info admin
      totalTemplates:  templates.length,
      activeTemplates: templates.filter(w => w.status === 'active').length,
      draftTemplates:  templates.filter(w => w.status === 'draft').length,
    };

    const mapWorkflow = (wf) => {
      const obj         = wf.toObject();
      const totalSteps  = wf.steps.length;
      const doneSteps   = wf.steps.filter(s => s.status === 'completed').length;
      const progress    = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
      const currentStep = wf.steps[wf.currentStep];

      let isOverdue = false, daysActive = 0, stepDays = 0, stepOverdue = false;

      if (wf.status === 'active' && wf.startedAt) {
        daysActive = Math.floor((now - new Date(wf.startedAt)) / (1000 * 60 * 60 * 24));
      }
      if (wf.dueDate && wf.status === 'active') {
        isOverdue = new Date(wf.dueDate) < now;
        if (isOverdue && wf.isTemplate !== true) stats.overdue++;
      }
      if (currentStep && wf.status === 'active') {
        const stepStarted = currentStep.updatedAt || wf.startedAt;
        stepDays = Math.floor((now - new Date(stepStarted)) / (1000 * 60 * 60 * 24));
        if (currentStep.delai) {
          const delaiDays = currentStep.delai.includes('j') ? parseInt(currentStep.delai) : parseInt(currentStep.delai) * 7;
          stepOverdue = stepDays > delaiDays;
        }
      }

      return {
        ...obj, progress, doneSteps, totalSteps, isOverdue, stepOverdue, daysActive, stepDays,
        currentStepName:     currentStep?.name || '',
        currentStepAssignee: currentStep?.assignedToName || currentStep?.assignedPost || '',
      };
    };

    // ── Réponse avec les 2 listes séparées ───────────────────────────────────
    res.status(200).json({
      status: 'success',
      data: {
        stats,
        workflows:  instances.map(mapWorkflow),   // demandes employés
        templates:  templates.map(mapWorkflow),    // templates admin
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET /workflows/users/list ─────────────────────────────────────────────────
exports.getTenantUsers = async (req, res) => {
  try {
    const conn = req.tenantConnection;
    if (!conn) return res.status(400).json({ status: 'fail', message: 'Connexion tenant manquante' });
    const userSchema = require('../models/userModel').schema;
    const User = safeModel(conn, 'User', userSchema);
    const users = await User.find({ isActive: { $ne: false } })
      .populate('role', 'name')
      .select('firstName lastName email role jobTitle department')
      .sort({ firstName: 1 });
    res.json({ status: 'success', data: { users } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── POST /workflows/documents/upload ─────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'fail', message: 'Aucun fichier reçu' });
    const conn = req.tenantConnection;
    let docSchema;
    try { docSchema = require('../models/documentModel').schema; } catch (e) {
      docSchema = new mongoose.Schema({
        workflow: mongoose.Schema.Types.ObjectId, stepIndex: Number,
        uploadedBy: mongoose.Schema.Types.ObjectId, uploadedByName: String,
        originalName: String, filename: String, url: String, size: Number, type: String,
      }, { timestamps: true });
    }
    const Document = safeModel(conn, 'Document', docSchema);

    const doc = await Document.create({
      name:           req.body.name || req.file.originalname,
      mimetype:       req.file.mimetype,
      uploadedBy:     req.user._id,
      uploadedByName: req.user.firstName + ' ' + req.user.lastName,
      originalName:   req.file.originalname,
      filename:       req.file.filename,
      url:            '/uploads/' + req.file.filename,
      size:           req.file.size,
      type: req.file.mimetype.startsWith('image') ? 'image'
          : req.file.mimetype.startsWith('video') ? 'video'
          : req.file.mimetype === 'application/pdf' ? 'pdf' : 'document',
    });

    res.status(201).json({ status: 'success', data: { document: doc } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/documents/workflow/:workflowId ─────────────────────────────
exports.getDocuments = async (req, res) => {
  try {
    const conn = req.tenantConnection;
    let docSchema;
    try { docSchema = require('../models/documentModel').schema; } catch (e) {
      docSchema = new mongoose.Schema({
        workflow: mongoose.Schema.Types.ObjectId, stepIndex: Number,
        uploadedBy: mongoose.Schema.Types.ObjectId, uploadedByName: String,
        originalName: String, filename: String, url: String, size: Number, type: String,
      }, { timestamps: true });
    }
    const Document = safeModel(conn, 'Document', docSchema);

    const { workflowId, projectId } = req.params;
    const query = {};
    if (workflowId) query.workflow = workflowId;
    if (projectId)  query.project  = projectId;

    const documents = await Document.find(query).sort({ createdAt: -1 });
    res.json({ status: 'success', data: { documents } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id ─────────────────────────────────────────────────────
exports.updateWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });

    if (workflow.status !== 'draft') {
      return res.status(400).json({
        status: 'fail',
        message: 'Impossible de modifier un workflow déjà démarré. Seuls les workflows en brouillon sont modifiables.',
      });
    }

    const {
      name, description, dueDate, steps = [],
      nodes = [], edges = [],
      visibility, allowedRoles, allowedPosts, allowedUsers,
    } = req.body;

    if (name)                      workflow.name        = name;
    if (description !== undefined) workflow.description = description;
    if (dueDate !== undefined)     workflow.dueDate     = dueDate || null;
    if (visibility)                workflow.visibility  = visibility;
    if (allowedRoles)              workflow.allowedRoles  = allowedRoles;
    if (allowedPosts)              workflow.allowedPosts  = allowedPosts;
    if (allowedUsers)              workflow.allowedUsers  = allowedUsers;

    // ✅ FIX BUG 1 : même normalisation que createWorkflow
    workflow.steps = steps.map((s, i) => ({
      ...s,
      order:            s.order ?? i,
      status:           'pending',
      assignedPostName: s.assignedPostName || s.assignedPost || '',
      assignedToName:   s.assignedToName   || '',
      conditions:       s.conditions       || [],
      form: {
        fields: normalizeFormFields(s.form?.fields),
      },
      claims: {
        canValidate: s.claims?.canValidate !== false,
        canReject:   s.claims?.canReject   !== false,
        canModify:   s.claims?.canModify   === true,
        canView:     s.claims?.canView     !== false,
      },
    }));

    workflow.canvasNodes = nodes;
    workflow.canvasEdges = edges;
    workflow.currentStep = 0;

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/archive ──────────────────────────────────────────────
exports.archiveWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });

    if (!['completed', 'rejected', 'draft'].includes(workflow.status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Seuls les workflows terminés, rejetés ou brouillons peuvent être archivés.',
      });
    }

    workflow.status = 'archived';
    workflow.history.push({
      action:  'workflow_archived',
      by:      req.user._id,
      byName:  req.user.firstName + ' ' + req.user.lastName,
      comment: req.body.comment || '',
      date:    new Date(),
    });

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/visibility ──────────────────────────────────────────
exports.updateWorkflowVisibility = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });

    const { visibility, allowedRoles = [], allowedPosts = [], allowedUsers = [] } = req.body;

    if (visibility)  workflow.visibility   = visibility;
    workflow.allowedRoles  = allowedRoles;
    workflow.allowedPosts  = allowedPosts;
    workflow.allowedUsers  = allowedUsers;

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/:id/document-chain ────────────────────────────────────────
exports.getDocumentChain = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow?.businessDoc) return res.json({ status: 'success', data: { chain: [] } });

    const bdSchema = require('../models/businessDocumentModel').schema;
    const BDoc     = safeModel(req.tenantConnection, 'BusinessDocument', bdSchema);

    const rootId = workflow.rootDoc || workflow.businessDoc;
    const chain  = await BDoc.find({
      $or: [{ _id: rootId }, { rootDoc: rootId }],
    }).sort({ createdAt: 1 });

    res.json({ status: 'success', data: { chain } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.deleteWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    }

    // ❌ Impossible de supprimer un workflow actif — les employés en ont besoin
    if (workflow.status === 'active') {
      return res.status(400).json({
        status: 'fail',
        message: 'Impossible de supprimer un workflow actif. Désactivez-le d\'abord.',
      });
    }

    await Workflow.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Workflow supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/deactivate ──────────────────────────────────────────
// Désactive un workflow actif (le retire de la liste des demandes employés)
exports.deactivateWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    }
    if (workflow.status !== 'active') {
      return res.status(400).json({ status: 'fail', message: 'Ce workflow n\'est pas actif' });
    }

    workflow.status = 'draft';
    workflow.history.push({
      action:  'workflow_deactivated',
      by:      req.user._id,
      byName:  req.user.firstName + ' ' + req.user.lastName,
      comment: 'Désactivé par l\'administrateur',
      date:    new Date(),
    });

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
// ── GET /workflows/templates/active ──────────────────────────────────────────
// Retourne uniquement les workflows isTemplate:true + status:'active'
// Utilisé par les employés pour choisir leur type de demande
exports.getActiveTemplates = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    // FIX 1 : on cherche UNIQUEMENT isTemplate:true
    // Les demandes employés (isTemplate:false) ne doivent PAS apparaître ici
    // Les anciens workflows sans le champ sont exclus volontairement
    const workflows = await Workflow.find({
      status:     'active',
      isTemplate: true,
    }).sort({ createdAt: -1 });

    res.json({ status: 'success', data: { workflows } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};