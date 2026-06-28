const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

const getTemplateModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');

  // ✅ FIX : enregistrer DocumentType sur la connexion tenant AVANT tout populate
  // Sans ça, mongoose lève "Schema hasn't been registered for model DocumentType"
  const dtSchema = require('../models/documentTypeModel').schema;
  safeModel(conn, 'DocumentType', dtSchema);

  const schema = require('../models/workflowTemplateModel').schema;
  return safeModel(conn, 'WorkflowTemplate', schema);
};

// ── GET tous les templates ────────────────────────────────────────────────────
exports.getTemplates = async (req, res) => {
  try {
    const Template  = getTemplateModel(req);
    // ✅ FIX : populate docType pour avoir le nom et le préfixe dans la réponse
    const templates = await Template.find({ isActive: true })
      .populate('docType', 'name prefix')
      .sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', results: templates.length, data: { templates } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET un template ───────────────────────────────────────────────────────────
exports.getTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const template = await Template.findById(req.params.id)
      .populate('docType', 'name prefix');
    if (!template) return res.status(404).json({ status: 'fail', message: 'Template non trouvé' });
    res.status(200).json({ status: 'success', data: { template } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Helpers champs ────────────────────────────────────────────────────────────
const cleanFields = (fields = []) =>
  (fields || []).map(f => ({
    id:               f.id               || 'f_' + Date.now(),
    label:            f.label            || '',
    type:             f.type             || 'text',
    required:         f.required         || false,
    readOnly:         f.readOnly         || false,
    autoSource:       f.autoSource       || '',
    options:          f.options          || [],
    columns:          f.columns          || [],
    inheritTableFrom: f.inheritTableFrom || '',
    extraColumns:     f.extraColumns     || [],
  }));

const cleanSteps = (steps = []) =>
  steps.map((step, i) => ({
    name:             step.name             || `Étape ${i + 1}`,
    description:      step.description      || '',
    order:            i,
    postSlot:         step.postSlot         || `Poste ${String.fromCharCode(65 + i)}`,
    assignedPost:     step.assignedPost     || '',
    assignedPostName: step.assignedPostName || '',
    rempliPar:        step.rempliPar        || (i === 0 ? 'employe' : 'validateur'),
    delai:            step.delai            || 0,
    checklist: (step.checklist || []).map(c => ({
      id:       c.id       || 'c_' + Date.now(),
      label:    c.label    || '',
      required: c.required || false,
      checked:  false,
    })),
    claims: step.claims || {
      canValidate: true, canReject: true, canModify: false, canView: true,
    },
    form: {
      fields: cleanFields(step.form?.fields || []),
    },
  }));

// ── CREATE template ───────────────────────────────────────────────────────────
exports.createTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const { name, description, type, docType, steps } = req.body;

    if (!name || !type) {
      return res.status(400).json({ status: 'fail', message: 'Nom et type requis' });
    }

    const template = await Template.create({
      name,
      description: description || '',
      type,
      // ✅ FIX : docType est un ObjectId ou null — plus de String fixe
      docType: docType || null,
      steps:   cleanSteps(steps || []),
      createdBy: req.user._id,
    });

    res.status(201).json({ status: 'success', data: { template } });
  } catch (err) {
    console.error('❌ createTemplate ERROR:', err.message);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE template ───────────────────────────────────────────────────────────
exports.updateTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const { steps, docType, ...rest } = req.body;

    const updateBody = {
      ...rest,
      // ✅ FIX : docType ObjectId ou null
      docType: docType || null,
      ...(steps ? { steps: cleanSteps(steps) } : {}),
    };

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      updateBody,
      { new: true, runValidators: false }
    ).populate('docType', 'name prefix');

    if (!template) return res.status(404).json({ status: 'fail', message: 'Template non trouvé' });
    res.status(200).json({ status: 'success', data: { template } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.archiveTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const conn     = req.tenantConnection;

    // Vérifier si des workflows actifs utilisent ce template
    const workflowSchema = require('../models/workflowModel').schema;
    const Workflow = safeModel(conn, 'Workflow', workflowSchema);
    const activeWorkflows = await Workflow.countDocuments({ 
      templateRef: req.params.id, 
      status: 'active' 
    });

    if (activeWorkflows > 0) {
      return res.status(400).json({ 
        status: 'fail', 
        message: `Impossible d'archiver — ${activeWorkflows} workflow(s) actif(s) basé(s) sur ce template` 
      });
    }

    await Template.findByIdAndUpdate(req.params.id, { 
      isActive: false, 
      archivedAt: new Date() 
    });

    res.status(200).json({ status: 'success', message: 'Template archivé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── USE template — crée un workflow depuis un template ────────────────────────
// ✅ FIX : route POST /workflow-templates/:id/use manquante ajoutée
exports.useTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ status: 'fail', message: 'Template non trouvé' });

    const conn = req.tenantConnection;
    if (!conn) throw new Error('Connexion tenant manquante');

    const workflowSchema = require('../models/workflowModel').schema;
    const Workflow = safeModel(conn, 'Workflow', workflowSchema);

    const { name, projectId, assignedPosts = [] } = req.body;

    // Construire les étapes depuis le template
    const steps = template.steps.map((step, i) => ({
      name:             step.name,
      description:      step.description || '',
      order:            i,
      assignedPost:     assignedPosts[i] || step.assignedPost || '',
      assignedPostName: step.assignedPostName || '',
      isEmployeeStep:   step.rempliPar === 'employe',
      delai:            step.delai ? String(step.delai) : '',
      form:             step.form || { fields: [] },
      checklist:        step.checklist || [],
      claims:           step.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
      status:           'pending',
    }));

    const workflow = await Workflow.create({
      name:        name || template.name,
      description: template.description || '',
      isTemplate:  true,
      templateRef: template._id,
      project:     projectId || null,
      docType:     template.docType || null,
      createdBy:   req.user._id,
      status:      'draft',
      steps,
    });

    res.status(201).json({ status: 'success', data: { workflow } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};