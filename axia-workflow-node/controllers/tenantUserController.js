const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService'); 
const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

const getTenantModels = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const userSchema = require('../models/userModel').schema;
  const roleSchema = require('../models/roleModel').schema;
  return {
    User: safeModel(conn, 'User', userSchema),
    Role: safeModel(conn, 'Role', roleSchema),
  };
};

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

// ── GET ONE USER ───────────────────────────────────────────────────
exports.getUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const Department = getDeptModel(req);

    const user = await User.findById(req.params.id)
      .populate('role', 'name')
      .select('-password -confirmPassword')
      .lean();

    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    // Join département manuellement
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
    const Department = getDeptModel(req); // force enregistrement du modèle

    const users = await User.find()
      .populate('role', 'name')
      .select('-password -confirmPassword')
      .sort({ createdAt: -1 })
      .lean();

    // Récupère tous les départements pour le join manuel
    const departments = await Department.find().lean();
    const deptMap = {};
    departments.forEach(d => { deptMap[String(d._id)] = d.name; });

    // Enrichit chaque user avec le nom du département
    const enriched = users.map(u => ({
      ...u,
      department: u.department
        ? { _id: u.department, name: deptMap[String(u.department)] || '—' }
        : null,
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

// ── GET ROLES ──────────────────────────────────────────────────────
exports.getRoles = async (req, res) => {
  try {
    const { Role } = getTenantModels(req);
    const roles = await Role.find().sort({ name: 1 });
    res.status(200).json({ status: 'success', data: { roles } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── CREATE USER ────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { User, Role } = getTenantModels(req);

    const {
      firstName, lastName, email, password,
      roleId, department, jobTitle, phoneNumber
    } = req.body;

    if (!firstName || !lastName || !email || !password || !roleId) {
      return res.status(400).json({ status: 'fail', message: 'Champs obligatoires manquants' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Email déjà utilisé' });

    const role = await Role.findById(roleId);
    if (!role) return res.status(400).json({ status: 'fail', message: 'Rôle invalide' });
    const hashedPassword = await bcrypt.hash(password, 10)  
    const user = await User.create({
      firstName, lastName,
      email: email.toLowerCase(),
      password: hashedPassword,   // ← hash manuel = correct
      role: roleId,
      department: department || undefined,
      jobTitle: jobTitle || undefined,
      phoneNumber: phoneNumber || undefined,
      isActive: true,
      isCompanyAdmin: role.name === 'company_admin',
      mustChangePassword: true,
    });
    const userOut = await User.findById(user._id).populate('role', 'name').select('-password');
    res.status(201).json({ status: 'success', data: { user: userOut } });

  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── UPDATE USER ────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    const updatedData = { ...req.body, email: req.body.email?.toLowerCase() };

    const user = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true })
      .populate('role', 'name')
      .select('-password -confirmPassword');

    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });

    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── DELETE USER ────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { User } = getTenantModels(req);

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ status: 'fail', message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};




// ── GET ME ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const { User } = getTenantModels(req);
    const user = await User.findById(req.user._id)
      .populate('role', 'name')
      .select('-password -confirmPassword')
      .lean();
    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });
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
    ).populate('role', 'name').select('-password -confirmPassword');
    if (!user) return res.status(404).json({ status: 'fail', message: 'Utilisateur non trouvé' });
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

    // Validation mot de passe fort
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

// ── FORGET PASSWORD ────────────────────────────────────────────────────────────
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ status: 'fail', message: 'Email requis' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user      = null;
    let UserModel = null;

    // ── 1. Chercher dans la base globale ──────────────────────────────────────
    const GlobalUser = require('../models/userModel');
    user = await GlobalUser.findOne({ email: normalizedEmail }).select('+password');
    if (user) UserModel = GlobalUser;

    // ── 2. Chercher dans toutes les bases tenant ───────────────────────────────
    if (!user) {
      const mongoose = require('mongoose');
      const Tenant   = require('../models/tenantModel');
      const tenants  = await Tenant.find({ isActive: true, status: 'active' }).lean();

      for (const tenant of tenants) {
        try {
          const rawUri = process.env.DATABASE_URL.replace('<db_password>', process.env.DATABASE_PASSWORD);
          const tenantDbUrl = rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, '$1' + tenant.dbName);

          const conn = await mongoose.createConnection(tenantDbUrl, {
            serverSelectionTimeoutMS: 5000,
          });

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
            // Fermer la connexion après usage
            res.on('finish', () => { setTimeout(() => conn.close(), 1000); });
            break;
          } else {
            await conn.close();
          }
        } catch (e) {
          console.warn('⚠️ Tenant ' + (tenant.dbName || tenant.slug) + ':', e.message);
        }
      }
    }

    // ── Réponse sécurisée si non trouvé ───────────────────────────────────────
    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: 'Si cet email existe, vous recevrez un mot de passe temporaire.',
      });
    }

    // ── Générer et sauvegarder le mot de passe temporaire ─────────────────────
    const tempPassword   = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await UserModel.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true, runValidators: false }
    );

    // ── Envoyer l'email ───────────────────────────────────────────────────────
    await sendEmail({
      to:      normalizedEmail,
      subject: 'Réinitialisation mot de passe — Axia Workflow',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
          <h2 style="color:#1e293b;">Réinitialisation du mot de passe</h2>
          <p>Bonjour <strong>${user.firstName || ''} ${user.lastName || ''}</strong>,</p>
          <p>Votre mot de passe temporaire :</p>
          <div style="background:#f1f5f9;padding:16px;text-align:center;border-radius:6px;margin:16px 0;">
            <span style="font-size:22px;font-weight:bold;color:#dc2626;letter-spacing:4px;">
              ${tempPassword}
            </span>
          </div>
          <p>Modifiez-le dès votre prochaine connexion.</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;">
          <p style="font-size:12px;color:#64748b;text-align:center;">© ${new Date().getFullYear()} Axia Workflow</p>
        </div>
      `,
    });

    res.status(200).json({
      status:  'success',
      message: 'Si cet email existe, vous recevrez un mot de passe temporaire.',
    });

  } catch (error) {
    console.error('❌ forgetPassword:', error.message);
    res.status(500).json({ status: 'error', message: 'Erreur serveur' });
  }
};
// ── GET POSTS ─────────────────────────────────────────────────────
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
    console.error('❌ getPosts:', err.message);
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

// ── DELETE POST ────────────────────────────────────────────────────
exports.deletePost = async (req, res) => {
  try {
    const Post = getPostModel(req);
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Poste supprimé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};