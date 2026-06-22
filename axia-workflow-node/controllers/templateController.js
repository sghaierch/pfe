const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

const getTemplateModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const schema = require('../models/workflowTemplateModel').schema;
  return safeModel(conn, 'WorkflowTemplate', schema);
};

// ── GET tous les templates ────────────────────────────────────────────────────
exports.getTemplates = async (req, res) => {
  try {
    const Template  = getTemplateModel(req);
    const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', results: templates.length, data: { templates } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET un template ───────────────────────────────────────────────────────────
exports.getTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ status: 'fail', message: 'Template non trouvé' });
    res.status(200).json({ status: 'success', data: { template } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── CREATE template ───────────────────────────────────────────────────────────
exports.createTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const { name, description, type, docType, steps } = req.body;

    if (!name || !type) {
      return res.status(400).json({ status: 'fail', message: 'Nom et type requis' });
    }

    // ✅ Chaque étape contient ses propres champs dans step.form.fields
    // Pas de propagation globale — chaque étape est indépendante
    const cleanSteps = (steps || []).map((step, i) => ({
      name:             step.name             || `Étape ${i + 1}`,
      description:      step.description      || '',
      order:            i,
      postSlot:         step.postSlot         || `Poste ${String.fromCharCode(65 + i)}`,
      assignedPost:     step.assignedPost     || '',
      assignedPostName: step.assignedPostName || '',
      rempliPar:        step.rempliPar        || (i === 0 ? 'employe' : 'validateur'), // ✅ persister le rôle
      delai:            step.delai            || 0,
      checklist:        (step.checklist || []).map(c => ({
        id:       c.id       || 'c_' + Date.now(),
        label:    c.label    || '',
        required: c.required || false,
        checked:  false,
      })),
      claims: step.claims || {
        canValidate: true, canReject: true, canModify: false, canView: true,
      },
      // ✅ Champs propres à cette étape — envoyés depuis le frontend dans step.form.fields
      form: {
        fields: ((step.form?.fields) || []).map(f => ({
          id:         f.id         || 'f_' + Date.now(),
          label:      f.label      || '',
          type:       f.type       || 'text',
          required:   f.required   || false,
          readOnly:   f.readOnly   || false,
          autoSource:       f.autoSource       || '',
          options:          f.options          || [],
          columns:          f.columns          || [],
          inheritTableFrom: f.inheritTableFrom || '',   // ← AJOUTER
          extraColumns:     f.extraColumns     || [],   // ← AJOUTER
        })),
      },
    }));

    const template = await Template.create({
      name,
      description: description || '',
      type,
      docType:     docType || '',
      steps:       cleanSteps,
      createdBy:   req.user._id,
    });

    res.status(201).json({ status: 'success', data: { template } });
  } catch (err) {
    console.error('❌ createTemplate ERROR:', JSON.stringify(err.errors, null, 2));
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE template ───────────────────────────────────────────────────────────
exports.updateTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    const { steps, ...rest } = req.body;

    // ✅ Retraiter les étapes sans propagation globale
    const cleanSteps = steps
      ? steps.map((step, i) => ({
          name:             step.name             || `Étape ${i + 1}`,
          description:      step.description      || '',
          order:            i,
          postSlot:         step.postSlot         || `Poste ${String.fromCharCode(65 + i)}`,
          assignedPost:     step.assignedPost     || '',
          assignedPostName: step.assignedPostName || '',
          rempliPar:        step.rempliPar        || (i === 0 ? 'employe' : 'validateur'), // ✅
          delai:            step.delai            || 0,
          checklist:        (step.checklist || []).map(c => ({
            id:       c.id       || 'c_' + Date.now(),
            label:    c.label    || '',
            required: c.required || false,
            checked:  false,
          })),
          claims: step.claims || {
            canValidate: true, canReject: true, canModify: false, canView: true,
          },
          form: {
            fields: ((step.form?.fields) || []).map(f => ({
              id:         f.id         || 'f_' + Date.now(),
              label:      f.label      || '',
              type:       f.type       || 'text',
              required:   f.required   || false,
              readOnly:   f.readOnly   || false,
              autoSource:       f.autoSource       || '',
              options:          f.options          || [],
              columns:          f.columns          || [],
              inheritTableFrom: f.inheritTableFrom || '',   // ← AJOUTER
              extraColumns:     f.extraColumns     || [],   // ← AJOUTER
            })),
          },
        }))
      : undefined;

    const updateBody = cleanSteps
      ? { ...rest, steps: cleanSteps }
      : rest;

    const template = await Template.findByIdAndUpdate(
      req.params.id,
      updateBody,
      { new: true, runValidators: false }
    );
    if (!template) return res.status(404).json({ status: 'fail', message: 'Template non trouvé' });
    res.status(200).json({ status: 'success', data: { template } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── DELETE template ───────────────────────────────────────────────────────────
exports.deleteTemplate = async (req, res) => {
  try {
    const Template = getTemplateModel(req);
    await Template.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Template supprimé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};