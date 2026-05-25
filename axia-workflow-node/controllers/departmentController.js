const getDeptModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  if (conn.models['Department']) return conn.models['Department'];
  const DepartmentModel = require('../models/departmentModel');
  const schema = DepartmentModel.schema || DepartmentModel;
  return conn.model('Department', schema);
};

const getPostModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  if (conn.models['Post']) return conn.models['Post'];
  const postSchema = require('../models/postModel').schema;
  return conn.model('Post', postSchema);
};

// ── GET tous les départements ─────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const Department = getDeptModel(req);
    const Post       = getPostModel(req);

    const departments = await Department.find().sort({ name: 1 }).lean();

    const postCounts = await Post.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    postCounts.forEach(p => { countMap[String(p._id)] = p.count; });

    const enriched = departments.map(dept => ({
      ...dept,
      postCount: countMap[String(dept._id)] || 0,
    }));

    res.status(200).json({ status: 'success', results: enriched.length, data: { departments: enriched } });
  } catch (err) {
    console.error('❌ getDepartments:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── CREATE département ────────────────────────────────────────────
exports.createDepartment = async (req, res) => {
  try {
    const Department = getDeptModel(req);
    const { name } = req.body;
    if (!name) return res.status(400).json({ status: 'fail', message: 'Nom requis' });

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Département déjà existant' });

    const dep = await Department.create({ name: name.trim() });
    res.status(201).json({ status: 'success', data: { department: { ...dep.toObject(), postCount: 0 } } });
  } catch (err) {
    console.error('❌ createDepartment:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE département ────────────────────────────────────────────
exports.updateDepartment = async (req, res) => {
  try {
    const Department = getDeptModel(req);
    const dep = await Department.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!dep) return res.status(404).json({ status: 'fail', message: 'Département non trouvé' });
    res.status(200).json({ status: 'success', data: { department: dep } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};
// ── DELETE département ────────────────────────────────────────────
exports.deleteDepartment = async (req, res) => {
  try {
    const Department = getDeptModel(req);
    const Post       = getPostModel(req); // ← récupère le bon modèle sur la bonne connexion tenant

    // 1. Supprime tous les postes liés
    await Post.deleteMany({ department: req.params.id });

    // 2. Supprime le département
    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({ status: 'success', message: 'Département et ses postes supprimés' });
  } catch (err) {
    console.error('❌ deleteDepartment:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET postes d'un département ───────────────────────────────────
exports.getPostsByDepartment = async (req, res) => {
  try {
    const Post = getPostModel(req);
    const posts = await Post.find({ department: req.params.deptId }).lean();
    res.status(200).json({ status: 'success', data: { posts } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── CREATE poste ──────────────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ status: 'fail', message: 'Nom du poste requis' });

    const post = await Post.create({
      name: name.trim(),
      description: description || '',
      department: req.params.deptId,
      isActive: true,
    });
    res.status(201).json({ status: 'success', data: { post } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE poste ──────────────────────────────────────────────────
exports.updatePost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    const { name, description } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description !== undefined && { description }) },
      { new: true }
    );
    if (!post) return res.status(404).json({ status: 'fail', message: 'Poste non trouvé' });
    res.status(200).json({ status: 'success', data: { post } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── DELETE poste ──────────────────────────────────────────────────
exports.deletePost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Poste supprimé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};