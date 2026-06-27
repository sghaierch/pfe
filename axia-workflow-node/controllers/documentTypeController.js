// ── Helper : récupère le modèle DocumentType sur la connexion tenant ──────────
const getModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');

  if (conn.models['DocumentType']) return conn.models['DocumentType'];

  const { schema } = require('../models/documentTypeModel');
  return conn.model('DocumentType', schema);
};

// ── Helper : récupère le modèle Workflow sur la connexion tenant ──────────────
const getWorkflowModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');

  if (conn.models['Workflow']) return conn.models['Workflow'];

  const workflowSchema = require('../models/workflowModel').schema;
  return conn.model('Workflow', workflowSchema);
};

// ── GET tous les types de documents ──────────────────────────────────────────
exports.getDocumentTypes = async (req, res) => {
  try {
    const DT = getModel(req);
    const Workflow = getWorkflowModel(req);

    const types = await DT.find().sort({ name: 1 }).lean();

    // Join manuel avec les workflows (évite le problème populate multi-tenant)
    // Seuls les workflows templates actifs peuvent être liés à un type de document
    const workflows = await Workflow.find({ isTemplate: true, status: 'active' }).lean();
    const wfMap = {};
    workflows.forEach(w => { wfMap[String(w._id)] = w.name; });

    const enriched = types.map(t => ({
      ...t,
      workflowName: t.defaultWorkflow ? (wfMap[String(t.defaultWorkflow)] || null) : null,
      example: `${t.prefix}${new Date().getFullYear().toString().slice(-2)}-${String(t.counter + 1).padStart(t.digits, '0')}`,
    }));

    res.json({ status: 'success', data: { documentTypes: enriched } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── GET un type par ID ────────────────────────────────────────────────────────
exports.getDocumentTypeById = async (req, res) => {
  try {
    const DT = getModel(req);
    const type = await DT.findById(req.params.id);
    if (!type) return res.status(404).json({ status: 'fail', message: 'Type introuvable' });
    res.json({ status: 'success', data: { documentType: type } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── CREATE ────────────────────────────────────────────────────────────────────
exports.createDocumentType = async (req, res) => {
  try {
    const DT = getModel(req);
    const { name, prefix, digits = 3, description, defaultWorkflow } = req.body;

    if (!name || !prefix) {
      return res.status(400).json({ status: 'fail', message: 'Nom et préfixe requis' });
    }

    const cleanPrefix = prefix.trim().toUpperCase();

    const existingName = await DT.findOne({ name: name.trim(), isActive: true });
    if (existingName) {
      return res.status(400).json({ status: 'fail', message: 'Ce type de document existe déjà' });
    }

    const existingPrefix = await DT.findOne({ prefix: cleanPrefix, isActive: true });
    if (existingPrefix) {
      return res.status(400).json({
        status: 'fail',
        message: `Le préfixe "${cleanPrefix}" est déjà utilisé par "${existingPrefix.name}"`,
      });
    }

    const docType = await DT.create({
      name: name.trim(),
      prefix: cleanPrefix,
      digits,
      description,
      defaultWorkflow: defaultWorkflow || undefined,
      isActive: true,
      counter: 0,
    });

    res.status(201).json({ status: 'success', data: { documentType: docType } });
  } catch (err) {
    // Filet de sécurité : si deux requêtes arrivent en même temps, l'index
    // unique en DB rejette le doublon avec un code 11000.
    if (err.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Nom ou préfixe déjà utilisé par un autre type' });
    }
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
exports.updateDocumentType = async (req, res) => {
  try {
    const DT = getModel(req);

    if (req.body.prefix) req.body.prefix = req.body.prefix.toUpperCase();
    
    // ✅ Ajoute cette ligne
    if (req.body.defaultWorkflow === '' || req.body.defaultWorkflow === null) {
      req.body.defaultWorkflow = undefined;
    }

    const updated = await DT.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ status: 'fail', message: 'Type introuvable' });

    res.json({ status: 'success', data: { documentType: updated } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Nom ou préfixe déjà utilisé par un autre type' });
    }
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.generateNumber = async (req, res) => {
  try {
    const DT = getModel(req);
    const type = await DT.findById(req.params.id);
    if (!type) return res.status(404).json({ status: 'fail', message: 'Type introuvable' });

    type.counter += 1;
    await type.save();

    const year = new Date().getFullYear().toString().slice(-2);
    const number = `${type.prefix}${year}-${String(type.counter).padStart(type.digits, '0')}`;

    res.json({ status: 'success', data: { number, counter: type.counter } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── DELETE (soft — désactive) ─────────────────────────────────────────────────
exports.deleteDocumentType = async (req, res) => {
  try {
    const DT = getModel(req);
    await DT.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ status: 'success', message: 'Type de document désactivé' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};