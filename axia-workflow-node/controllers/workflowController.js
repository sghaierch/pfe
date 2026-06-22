const mongoose = require('mongoose');


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

// ✅ Helper centralisé pour normaliser les champs d'un formulaire
const normalizeFormFields = (fields = []) => {
  return (fields || [])
    .filter(f => f != null && typeof f === 'object')
    .map((f) => ({
      ...f,
      id:         f.id         || new mongoose.Types.ObjectId().toString(),
      options:    Array.isArray(f.options)  ? f.options  : [],
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
  const userPost = (user.jobTitle || '').toLowerCase().trim();

  if (workflow.allowedUsers?.some(u => u.toString() === userId)) return true;
  if (workflow.allowedRoles?.includes(userRole)) return true;
  if (workflow.allowedPosts?.some(p => {
    const pLower = p.toLowerCase().trim();
    return pLower === userPost
      || pLower.includes(userPost)
      || userPost.includes(pLower);
  })) return true;
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
// ✅ BUG 4 CORRIGÉ — filtre en MongoDB quand possible + limite de sécurité
exports.getAuditLog = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const { action, user, from, to, workflowId } = req.query;

    // Construire le filtre MongoDB
    const matchQuery = { 'history.0': { $exists: true } };
    if (workflowId) matchQuery._id = new mongoose.Types.ObjectId(workflowId);

    const all = await Workflow.find(matchQuery).sort({ updatedAt: -1 }).limit(500);

    let entries = [];
    all.forEach((wf) => {
      (wf.history || []).forEach((h) => {
        // Filtres rapides inline
        if (action && h.action !== action) return;
        if (user && !h.byName?.toLowerCase().includes(user.toLowerCase())) return;
        if (from && new Date(h.date) < new Date(from)) return;
        if (to   && new Date(h.date) > new Date(to + 'T23:59:59')) return;

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

    const isCreator   = workflow.createdBy?.toString() === req.user._id.toString();
    const isTemplate  = workflow.isTemplate === true;
    const isAssignee  = (workflow.steps || []).some(s =>
      s.assignedTo?.toString() === req.user._id.toString() ||
      (s.assignedPost && s.assignedPost.toLowerCase().trim() === (req.user.jobTitle || '').toLowerCase().trim())
    );

    if (!isAdmin && !isTemplate && !isCreator && !isAssignee && !canUserSeeWorkflow(workflow, req.user)) {
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
      ...(projectRef ? { project: projectRef } : {}),
      createdBy:  req.user._id,
      dueDate,
      isTemplate: req.body.isTemplate || false,
      docType:    mongoose.Types.ObjectId.isValid(req.body.docType) ? req.body.docType : null,
      steps:      stepsWithDefaults,
      visibility,
      allowedRoles,
      allowedPosts,
      allowedUsers,
    });

    // ── Génération du docNumber ───────────────────────────────────────────
    const docTypeId = req.body.docTypeId || req.body.docType;

    if (docTypeId) {
      try {
        const dtSchema = require('../models/documentTypeModel').schema;
        const DT = safeModel(req.tenantConnection, 'DocumentType', dtSchema);

        const dt = mongoose.Types.ObjectId.isValid(docTypeId)
          ? await DT.findByIdAndUpdate(docTypeId, { $inc: { counter: 1 } }, { new: true })
          : await DT.findOneAndUpdate({ prefix: docTypeId, isActive: true }, { $inc: { counter: 1 } }, { new: true });

        if (dt) {
          const year = new Date().getFullYear().toString().slice(-2);
          workflow.docNumber = `${dt.prefix}${year}-${String(dt.counter).padStart(dt.digits, '0')}`;
          workflow.docType   = dt._id;
          await workflow.save();
        }
      } catch (e) {
        console.warn('⚠️ docNumber generation failed:', e.message);
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
exports.startWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    if (workflow.status !== 'draft') return res.status(400).json({ status: 'fail', message: 'Workflow déjà démarré' });

    workflow.status     = 'active';
    workflow.startedAt  = new Date();
    workflow.isTemplate = true;
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
exports.startInstance = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    if (workflow.status !== 'draft') return res.status(400).json({ status: 'fail', message: 'Workflow déjà démarré' });

    workflow.status    = 'active';
    workflow.startedAt = new Date();
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

// ─────────────────────────────────────────────────────────────────────────────
// ── HELPER : propage les données de tableau entre étapes
// ─────────────────────────────────────────────────────────────────────────────
const propagateTableData = (workflow, completedStepIndex) => {
  const completedStep = workflow.steps[completedStepIndex];
  if (!completedStep?.form?.fields) return;

  const sourceTableFields = completedStep.form.fields.filter(
    f => f.type === 'table' && Array.isArray(f.data) && f.data.length > 0
  );
  if (sourceTableFields.length === 0) return;

  for (let i = completedStepIndex + 1; i < workflow.steps.length; i++) {
    const targetStep = workflow.steps[i];
    if (!targetStep?.form?.fields) continue;

    sourceTableFields.forEach(sourceField => {
      const targetField = targetStep.form.fields.find(f =>
        f.type === 'table' && (
          f.label === sourceField.label ||
          f.label?.toLowerCase().includes('article') ||
          f.id === sourceField.id
        )
      );
      if (!targetField) return;

      const sourceColIds = (sourceField.columns || []).map(c => c.id);
      const extraCols    = (targetField.columns || []).filter(
        tc => !sourceColIds.includes(tc.id)
      );

      targetField.data = (sourceField.data || []).map(row => {
        const newRow = { ...row };
        extraCols.forEach(col => {
          if (newRow[col.id] === undefined) newRow[col.id] = '';
        });
        return newRow;
      });

      console.log(`✅ Propagation "${sourceField.label}" → étape[${i}] "${targetStep.name}" — ${targetField.data.length} lignes, ${extraCols.length} col(s) extra vide(s)`);
    });
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

    const isCreator        = workflow.createdBy?.toString() === userId;
    const isStep0ByCreator = isCreator && stepIndex === 0;
    if (!isAdmin && !isStep0ByCreator && step.claims?.canValidate === false) {
      return res.status(403).json({ status: 'fail', message: "Vous n'avez pas la permission de valider cette étape" });
    }

    if (formData && step.form?.fields) {
      step.form.fields.forEach((field) => {
        if (formData[field.id] !== undefined) field.data = formData[field.id];
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

    propagateTableData(workflow, stepIndex);

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

    const nextIndex = evaluateNextStep(workflow, stepIndex, allFormData);

    if (nextIndex !== -1) {
      workflow.currentStep             = nextIndex;
      workflow.steps[nextIndex].status = 'in_progress';
      workflow.history.push({
        action: 'step_skipped_by_condition', stepIndex: nextIndex,
        stepName: workflow.steps[nextIndex].name,
        by: req.user._id, byName: req.user.firstName + ' ' + req.user.lastName,
        comment: 'Sélectionné par moteur de conditions', date: new Date(),
      });
    } else {
      const remainingSteps = workflow.steps.slice(stepIndex + 1);
      const hasMoreSteps   = remainingSteps.some(s => s.status === 'pending');

      if (hasMoreSteps) {
        const simpleNext = stepIndex + 1;
        if (simpleNext < workflow.steps.length) {
          workflow.currentStep              = simpleNext;
          workflow.steps[simpleNext].status = 'in_progress';
        }
      } else {
        workflow.status      = 'completed';
        workflow.completedAt = new Date();
        workflow.history.push({
          action: 'workflow_completed',
          by: req.user._id, byName: req.user.firstName + ' ' + req.user.lastName,
          date: new Date(),
        });
      }
    }

    workflow.markModified('steps');
    await workflow.save();

    try {
      const notifService = require('../services/notificationService');
      const byName = req.user.firstName + ' ' + req.user.lastName;
      if (workflow.status === 'completed') {
        await notifService.notifyWorkflowCompleted(req.tenantConnection, workflow);
      } else {
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
    }).sort({ createdAt: -1 }).lean();

    res.json({ status: 'success', data: { workflows, total: workflows.length } });
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
      const stepIdx = wf.steps.findIndex((step) => {
        if (step.status !== 'in_progress') return false;
        if (step.claims?.canView === false) return false;
        const assignedTo = step.assignedTo?.toString();
        const stepPost   = (step.assignedPost || '').toLowerCase().trim();
        const stepRole   = step.assignedRole  || '';
        const uPost      = userPost.toLowerCase().trim();
        const byId   = assignedTo === userId;
        const byPost = stepPost !== '' && uPost !== '' && (
          stepPost === uPost
          || stepPost.includes(uPost)
          || uPost.includes(stepPost)
        );
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
        docNumber:    wf.docNumber || '',
        history:      (wf.history || []).slice(-5),
        step:         { ...step.toObject(), claims: step.claims },
        step0Fields:  (wf.steps[0]?.form?.fields || []).map(f => ({
          ...f.toObject ? f.toObject() : f,
          data: f.data ?? null,
        })),
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

    const all = await Workflow.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 });

    const templates  = all.filter(w => w.isTemplate === true);
    const instances  = all.filter(w => w.isTemplate !== true);

    const stats = {
      total:     instances.length,
      draft:     instances.filter(w => w.status === 'draft').length,
      active:    instances.filter(w => w.status === 'active').length,
      completed: instances.filter(w => w.status === 'completed').length,
      rejected:  instances.filter(w => w.status === 'rejected').length,
      overdue:   0,
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

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        workflows:  instances.map(mapWorkflow),
        templates:  templates.map(mapWorkflow),
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

    // ── Nom d'affichage propre ────────────────────────────────────────────
    // Si le frontend fournit explicitement un nom, on le garde.
    // Sinon on construit "DA26-005 - Validation Responsable Achat.png"
    // plutôt que d'afficher le nom de fichier brut (souvent un UUID généré
    // par l'outil d'origine de l'utilisateur, ex: removebg-preview.png).
    let displayName = req.body.name;

    if (!displayName) {
      const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
      let docNumber = null;
      let stepName  = null;

      if (req.body.workflowId) {
        try {
          const Workflow = getWorkflowModel(req);
          const wf = await Workflow.findById(req.body.workflowId).select('docNumber steps').lean();
          if (wf) {
            docNumber = wf.docNumber || null;
            const idx = req.body.stepIndex !== undefined ? Number(req.body.stepIndex) : null;
            if (idx !== null && wf.steps?.[idx]) stepName = wf.steps[idx].name;
          }
        } catch (e) { /* on retombe sur le nom original si le workflow est introuvable */ }
      }

      if (docNumber && stepName) {
        displayName = `${docNumber} - ${stepName}.${ext}`;
      } else if (docNumber) {
        displayName = `${docNumber}.${ext}`;
      } else {
        // Dernier recours : on garde le nom original (mieux qu'un nom vide)
        displayName = req.file.originalname;
      }
    }

    const doc = await Document.create({
      name:           displayName,
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
      workflow:   req.body.workflowId || null,
      stepIndex:  req.body.stepIndex  !== undefined ? Number(req.body.stepIndex) : null,
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
    res.json({ status: 'success', documents, data: { documents } });
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

    if (visibility) {
      workflow.visibility = visibility;
      if (visibility === 'global') {
        workflow.allowedPosts = [];
        workflow.allowedRoles = [];
        workflow.allowedUsers = [];
      } else {
        if (allowedPosts !== undefined) workflow.allowedPosts = allowedPosts;
        if (allowedRoles !== undefined) workflow.allowedRoles = allowedRoles;
        if (allowedUsers !== undefined) workflow.allowedUsers = allowedUsers;
      }
    }

    const syncedSteps = steps.map((s, i) => {
      const matchingNode = nodes.find(n =>
        n.type === 'etape' && (
          n.label === s.name ||
          n.label?.toLowerCase() === s.name?.toLowerCase()
        )
      );
      const merged = matchingNode ? {
        ...s,
        assignedPost:     matchingNode.assignedPost     || s.assignedPost     || '',
        assignedPostName: matchingNode.assignedPostName || s.assignedPostName || s.assignedPost || '',
        assignedTo:       matchingNode.assignedTo       || s.assignedTo       || null,
        assignedToName:   matchingNode.assignedToName   || s.assignedToName   || '',
        delai:            matchingNode.delai            || s.delai            || '',
      } : s;

      return {
        ...merged,
        order:      merged.order ?? i,
        status:     'pending',
        conditions: merged.conditions || [],
        form: {
          fields: normalizeFormFields(
            (matchingNode?.form?.fields?.length > 0 ? matchingNode.form.fields : merged.form?.fields)
          ),
        },
        claims: {
          canValidate: merged.claims?.canValidate !== false,
          canReject:   merged.claims?.canReject   !== false,
          canModify:   merged.claims?.canModify   === true,
          canView:     merged.claims?.canView     !== false,
        },
      };
    });

    workflow.steps       = syncedSteps;
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

    if (visibility) {
      workflow.visibility = visibility;
      if (visibility === 'global') {
        workflow.allowedPosts = [];
        workflow.allowedRoles = [];
        workflow.allowedUsers = [];
      } else {
        if (allowedPosts) workflow.allowedPosts = allowedPosts;
        if (allowedRoles) workflow.allowedRoles = allowedRoles;
        if (allowedUsers) workflow.allowedUsers = allowedUsers;
      }
    }

    await workflow.save();
    res.json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET /workflows/:id/document-chain ────────────────────────────────────────
exports.getDocumentChain = async (req, res) => {
  res.json({ status: 'success', data: { chain: [] } });
};

// ── DELETE /workflows/:id ─────────────────────────────────────────────────────
exports.deleteWorkflow = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ status: 'fail', message: 'Workflow non trouvé' });
    }

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
exports.getActiveTemplates = async (req, res) => {
  try {
    const Workflow = getWorkflowModel(req);
    const userPost = (req.user.jobTitle || '').toLowerCase().trim();

    const all = await Workflow.find({
      status:     'active',
      isTemplate: true,
    }).sort({ createdAt: -1 });

    const visible = all.filter(wf => {
      const allowed = wf.allowedPosts || [];
      if (allowed.length === 0) return true;
      if (!userPost) return false;
      return allowed.some(p => {
        const pLower = p.toLowerCase().trim();
        return pLower === userPost
          || pLower.includes(userPost)
          || userPost.includes(pLower);
      });
    });

    res.json({ status: 'success', data: { workflows: visible } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── PATCH /workflows/:id/move-project ────────────────────────────────────────
exports.moveToProject = async (req, res) => {
  try {
    const Workflow  = getWorkflowModel(req);
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ status: 'fail', message: 'projectId requis' });
    await Workflow.findByIdAndUpdate(req.params.id, { project: projectId });
    await Workflow.updateMany({ templateRef: req.params.id }, { project: projectId });
    res.json({ status: 'success', message: 'Workflow et instances déplacés' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};