const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

// ✅ Plus de roleModel — role est un String enum directement sur l'user
const TENANT_ROLES = ['company_admin', 'employee'];

const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

// ✅ getTenantModels ne charge plus que User (plus de Role)
const getTenantModels = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const userSchema = require('../models/userModel').schema;
  return {
    User: safeModel(conn, 'User', userSchema),
  };
};

const getDeptModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  if (conn.models['Department']) return conn.models['Department'];
  const DepartmentModel = require('../models/departmentModel');
  return conn.model('Department', DepartmentModel.schema || DepartmentModel);
};

const getPostModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  if (conn.models['Post']) return conn.models['Post'];
  const postSchema = require('../models/postModel').schema;
  return conn.model('Post', postSchema);
};

// ── GET ROLES — retourne les rôles enum statiques ──────────────────
exports.getRoles = async (req, res) => {
  // ✅ Plus de base de données — on retourne les rôles en dur
  const roles = TENANT_ROLES.map((name, i) => ({
    _id:   name,   // on utilise le nom comme ID pour la compatibilité frontend
    name,
    label: name === 'company_admin' ? 'Administrateur' : 'Employé',
  }));
  res.status(200).json({ status: 'success', data: { roles } });
};

// ── GET ONE USER ───────────────────────────────────────────────────
exports.getUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const Department = getDeptModel(req);

    // ✅ Plus de .populate('role') — role est un String direct
    const user = await User.findById(req.params.id)
      .select('-password -confirmPassword')
      .lean();

    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    if (user.department) {
      const dept = await Department.findById(user.department).lean();
      user.department = dept ? { _id: dept._id, name: dept.name } : null;
    }

    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET USERS ──────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const Department = getDeptModel(req);

    // ✅ Plus de .populate('role')
    const users = await User.find()
      .select('-password -confirmPassword')
      .sort({ createdAt: -1 })
      .lean();

    const departments = await Department.find().lean();
    const deptMap = {};
    departments.forEach(d => { deptMap[String(d._id)] = d.name; });

    const enriched = users.map(u => ({
      ...u,
      department: u.department
        ? { _id: u.department, name: deptMap[String(u.department)] || '—' }
        : null,
      // ✅ On enrichit role pour compatibilité frontend : { _id, name }
      role: u.role ? { _id: u.role, name: u.role } : null,
    }));

    res.status(200).json({
      status: 'success',
      results: enriched.length,
      data: { users: enriched }
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── CREATE USER ────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    const { firstName, lastName, email, password, role, department, jobTitle, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ status: 'fail', message: 'Champs obligatoires manquants' });
    }

    // ✅ Validation du rôle via enum
    if (!TENANT_ROLES.includes(role)) {
      return res.status(400).json({
        status: 'fail',
        message: `Rôle invalide. Valeurs acceptées : ${TENANT_ROLES.join(', ')}`
      });
    }

    // ✅ Département + Poste obligatoires pour les employés
    if (role === 'employee') {
      if (!department) {
        return res.status(400).json({ status: 'fail', message: 'Le département est requis pour un employé' });
      }
      if (!jobTitle) {
        return res.status(400).json({ status: 'fail', message: 'Le poste est requis pour un employé' });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Email déjà utilisé' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email:            email.toLowerCase(),
      password:         hashedPassword,
      role,                                          // ✅ String direct
      department:       department || undefined,
      jobTitle:         jobTitle   || undefined,
      phoneNumber:      phoneNumber || undefined,
      isActive:         true,
      isCompanyAdmin:   role === 'company_admin',    // ✅ dérivé du role String
      mustChangePassword: true,
    });

    const userOut = await User.findById(user._id).select('-password -confirmPassword').lean();

    // ✅ Enrichir role pour compatibilité frontend
    userOut.role = { _id: userOut.role, name: userOut.role };

    res.status(201).json({ status: 'success', data: { user: userOut } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE USER ────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    const updateData = { ...req.body };
    if (updateData.email) updateData.email = updateData.email.toLowerCase();

    // ✅ Validation du rôle si fourni
    if (updateData.role) {
      if (!TENANT_ROLES.includes(updateData.role)) {
        return res.status(400).json({
          status: 'fail',
          message: `Rôle invalide. Valeurs acceptées : ${TENANT_ROLES.join(', ')}`
        });
      }
      updateData.isCompanyAdmin = updateData.role === 'company_admin';
    }

    // ✅ Si le rôle est employé (nouveau ou existant), département + poste requis
    const { User: UserModel2 } = getTenantModels(req);
    const existingUser = await UserModel2.findById(req.params.id).lean();
    const effectiveRole = updateData.role || existingUser?.role;
    if (effectiveRole === 'employee') {
      const effectiveDept = updateData.department !== undefined ? updateData.department : existingUser?.department;
      const effectivePost = updateData.jobTitle !== undefined ? updateData.jobTitle : existingUser?.jobTitle;
      if (!effectiveDept) {
        return res.status(400).json({ status: 'fail', message: 'Le département est requis pour un employé' });
      }
      if (!effectivePost) {
        return res.status(400).json({ status: 'fail', message: 'Le poste est requis pour un employé' });
      }
    }

    // ✅ Ne jamais permettre de modifier le mot de passe via cet endpoint
    delete updateData.password;
    delete updateData.confirmPassword;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: false
    }).select('-password -confirmPassword').lean();

    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    user.role = user.role ? { _id: user.role, name: user.role } : null;

    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── ARCHIVE USER ──────────────────────────────────────────────────
exports.archiveUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ status: 'fail', message: 'Vous ne pouvez pas archiver votre propre compte' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    // Vérifier tâches en cours
    const conn = req.tenantConnection;
    const workflowSchema = require('../models/workflowModel').schema;
    const Workflow = conn.models['Workflow'] || conn.model('Workflow', workflowSchema);
    const activeTasks = await Workflow.countDocuments({
      steps: { $elemMatch: { assignedTo: req.params.id, status: 'in_progress' } }
    });
    if (activeTasks > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Impossible d'archiver — ${activeTasks} tâche(s) en cours assignée(s) à cet utilisateur`
      });
    }

    await User.findByIdAndUpdate(req.params.id, {
      isActive: false,
      archivedAt: new Date(),
    });

    res.status(200).json({ status: 'success', message: 'Utilisateur archivé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET ME ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const user = await User.findById(req.user._id)
      .select('-password -confirmPassword')
      .lean();
    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    user.role = user.role ? { _id: user.role, name: user.role } : null;
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE ME ──────────────────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const { firstName, lastName, phoneNumber, jobTitle } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phoneNumber, jobTitle },
      { new: true, runValidators: false }
    ).select('-password -confirmPassword').lean();

    user.role = user.role ? { _id: user.role, name: user.role } : null;
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── CHANGE PASSWORD ────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ status: 'fail', message: 'Champs requis manquants' });

    const passwordRegex = /^(?=(?:.*\d){5,})(?=(?:.*[a-zA-Z]){3,})(?=(?:.*[*\-\/+]){2,}).{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le mot de passe doit contenir minimum 10 caractères : 5 chiffres, 3 lettres, et 2 caractères spéciaux (* - / +)'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ status: 'fail', message: 'Mot de passe actuel incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ status: 'success', message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── FORGET PASSWORD ────────────────────────────────────────────────
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'fail', message: 'Email requis' });

    const normalizedEmail = email.toLowerCase().trim();
    let user      = null;
    let UserModel = null;

    // 1. Base globale
    const GlobalUser = require('../models/userModel');
    user = await GlobalUser.findOne({ email: normalizedEmail }).select('+password');
    if (user) UserModel = GlobalUser;

    // 2. Bases tenants
    if (!user) {
      const mongoose = require('mongoose');
      const Tenant   = require('../models/tenantModel');
      const tenants  = await Tenant.find({ isActive: true, status: 'active' }).lean();

      for (const tenant of tenants) {
        try {
          const rawUri = process.env.DATABASE_URL.replace('<db_password>', process.env.DATABASE_PASSWORD);
          const tenantDbUrl = rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, '$1' + tenant.dbName);
          const conn = await mongoose.createConnection(tenantDbUrl, { serverSelectionTimeoutMS: 5000 });

          await new Promise((resolve, reject) => {
            if (conn.readyState === 1) return resolve();
            conn.once('connected', resolve);
            conn.once('error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
          });

          const userSchema = require('../models/userModel').schema;
          const TenantUser = conn.models['User'] || conn.model('User', userSchema);
          const found = await TenantUser.findOne({ email: normalizedEmail }).select('+password');

          if (found) {
            user      = found;
            UserModel = TenantUser;
            res.on('finish', () => { setTimeout(() => conn.close(), 1000); });
            break;
          } else {
            await conn.close();
          }
        } catch (e) {
          console.warn('⚠️ Tenant ' + tenant.dbName + ':', e.message);
        }
      }
    }

    if (!user) {
      return res.status(200).json({ status: 'success', message: 'Si cet email existe, vous recevrez un mot de passe temporaire.' });
    }

    const tempPassword   = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await UserModel.findByIdAndUpdate(user._id, { password: hashedPassword }, { runValidators: false });

    await sendEmail({
      to:      normalizedEmail,
      subject: 'Réinitialisation mot de passe — Axia Workflow',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Réinitialisation du mot de passe</h2>
          <p>Bonjour <strong>${user.firstName || ''} ${user.lastName || ''}</strong>,</p>
          <p>Votre mot de passe temporaire :</p>
          <div style="background:#f1f5f9;padding:16px;text-align:center;border-radius:6px;margin:16px 0;">
            <span style="font-size:22px;font-weight:bold;color:#dc2626;letter-spacing:4px;">${tempPassword}</span>
          </div>
          <p>Modifiez-le dès votre prochaine connexion.</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#64748b;text-align:center;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      `,
    });

    res.status(200).json({ status: 'success', message: 'Si cet email existe, vous recevrez un mot de passe temporaire.' });
  } catch (error) {
    console.error('❌ forgetPassword:', error.message);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};

// ── GET POSTS ──────────────────────────────────────────────────────
exports.getPosts = async (req, res) => {
  try {
    const Post       = getPostModel(req);
    const Department = getDeptModel(req);

    const posts       = await Post.find().sort({ name: 1 }).lean();
    const departments = await Department.find().lean();
    const deptMap = {};
    departments.forEach(d => { deptMap[String(d._id)] = d.name; });

    const enriched = posts.map(post => ({
      ...post,
      departmentName: post.department ? (deptMap[String(post.department)] || null) : null,
    }));

    res.status(200).json({ status: 'success', results: enriched.length, data: { posts: enriched } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── CREATE POST ────────────────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    const { name, description, department } = req.body;
    if (!name) return res.status(400).json({ status: 'fail', message: 'Nom du poste requis' });
    const existing = await Post.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Ce poste existe déjà' });
    const post = await Post.create({ name: name.trim(), description, department, isActive: true });
    res.status(201).json({ status: 'success', data: { post } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE POST ────────────────────────────────────────────────────
exports.updatePost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ status: 'fail', message: 'Poste non trouvé' });
    res.status(200).json({ status: 'success', data: { post } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── ARCHIVE POST ──────────────────────────────────────────────────
exports.archivePost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ status: 'fail', message: 'Poste non trouvé' });

    // Vérifier si des utilisateurs actifs ont ce poste
    const { User } = getTenantModels(req);
    const usersWithPost = await User.countDocuments({
      jobTitle: { $regex: new RegExp('^' + post.name.trim() + '$', 'i') },
      isActive: { $ne: false }
    });
    if (usersWithPost > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Impossible d'archiver — ${usersWithPost} utilisateur(s) ont ce poste. Réaffectez-les d'abord.`
      });
    }

    await Post.findByIdAndUpdate(req.params.id, {
      isActive: false,
      archivedAt: new Date(),
    });

    res.status(200).json({ status: 'success', message: 'Poste archivé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};