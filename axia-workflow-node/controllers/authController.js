const User = require("../models/userModel");
const Tenant = require("../models/tenantModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const mongoose = require("mongoose");

// ── Schemas allégés pour les tenant DBs ──────────────────────────────────────
// ✅ role est maintenant un String enum — plus de roleSchema ni permissionSchema
const tenantUserSchema = new mongoose.Schema({
  firstName:   { type: String, required: true },
  lastName:    { type: String, required: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true, select: false },
  role:        { type: String, enum: ['company_admin', 'employee'], default: 'employee' },
  department:  { type: mongoose.Schema.Types.ObjectId },
  jobTitle:    { type: String },
  phoneNumber: { type: String },
  age:         { type: Number },
  isActive:           { type: Boolean, default: true },
  isCompanyAdmin:     { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: true },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push:  { type: Boolean, default: true },
    sms:   { type: Boolean, default: false },
  },
  lastLogin:        { type: Date },
  pass_update_date: { type: Date },
}, { timestamps: true });

tenantUserSchema.methods.comparePassword = async function (enteredPass, userPassword) {
  const bcrypt = require("bcryptjs");
  return await bcrypt.compare(enteredPass, userPassword);
};

// ── Helper URI tenant ─────────────────────────────────────────────────────────
const buildTenantUri = (dbName) => {
  const rawUri = process.env.DATABASE_URL.replace("<db_password>", process.env.DATABASE_PASSWORD);
  return rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, `$1${dbName}`);
};

// ── Cache des connexions tenant ───────────────────────────────────────────────
const tenantConnections = {};

const getTenantConnection = async (tenant) => {
  const key = tenant.dbName;
  const existing = tenantConnections[key];

  if (existing && existing.readyState === 1) return existing;

  if (existing && existing.readyState !== 1) {
    console.warn(`⚠️ Connexion ${key} cassée, reconnexion...`);
    try { await existing.close(); } catch (_) {}
    delete tenantConnections[key];
  }

  const conn = await mongoose.createConnection(buildTenantUri(key), {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS:          30000,
    connectTimeoutMS:         15000,
    heartbeatFrequencyMS:     10000,
    maxPoolSize:              5,
    minPoolSize:              1,
  });

  await new Promise((resolve, reject) => {
    if (conn.readyState === 1) return resolve();
    conn.once("connected", resolve);
    conn.once("error", reject);
    setTimeout(() => reject(new Error(`Timeout connexion MongoDB pour ${key}`)), 15000);
  });

  conn.on("disconnected", () => { delete tenantConnections[key]; });
  conn.on("error", () => { delete tenantConnections[key]; });

  tenantConnections[key] = conn;
  console.log(`✅ Connexion tenant: ${key}`);
  return conn;
};

// ── Helper modèles tenant ─────────────────────────────────────────────────────
// ✅ Plus que User — Role et Permission supprimés
const getTenantModels = (conn) => {
  if (conn.models["User"]) delete conn.models["User"];
  return {
    TenantUser: conn.model("User", tenantUserSchema),
  };
};

// ── Créer le token JWT ────────────────────────────────────────────────────────
const createToken = (id, tenantId = null) => {
  const payload = tenantId ? { id, tenantId } : { id };
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// SIGNUP
// ══════════════════════════════════════════════════════════════════════════════
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role, age, department, jobTitle, phoneNumber } = req.body;

    const newUser = await User.create({
      firstName, lastName, email, password, confirmPassword,
      role: role || 'superadmin',
      age, department, jobTitle, phoneNumber,
    });

    const token = createToken(newUser._id);
    newUser.password = undefined;

    res.status(201).json({ status: "success", token, data: { user: newUser } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SIGNIN
// ══════════════════════════════════════════════════════════════════════════════
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ status: "fail", message: "Email et mot de passe requis" });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 TENTATIVE DE CONNEXION:", email);

    // ── 1. SuperAdmin (DB principale) ─────────────────────────────────────────
    // ✅ FIX : plus de .populate('role') — role est un String direct
    const superadminUser = await User.findOne({ email }).select("+password");

    if (superadminUser && superadminUser.role === 'superadmin') {
      if (!(await superadminUser.comparePassword(password, superadminUser.password)))
        return res.status(401).json({ status: "fail", message: "Email ou mot de passe incorrect" });

      if (!superadminUser.isActive)
        return res.status(403).json({ status: "fail", message: "Votre compte a été désactivé" });

      const token = createToken(superadminUser._id);
      superadminUser.password = undefined;

      console.log("✅ Connexion SuperAdmin réussie");
      return res.status(200).json({
        status: "success",
        message: "Connexion réussie",
        token,
        data: {
          user: {
            ...superadminUser.toObject(),
            // ✅ On envoie role sous forme d'objet {name} pour compatibilité frontend
            role: { name: superadminUser.role },
          }
        }
      });
    }

    // ── 2. Chercher dans les tenants ──────────────────────────────────────────
    const activeTenants = await Tenant.find({ status: "active", isActive: true }).populate("plan");
    console.log(`📊 ${activeTenants.length} tenant(s) actif(s)`);

    let foundTenant = null;
    let foundUser   = null;

    for (const tenant of activeTenants) {
      try {
        const conn = await getTenantConnection(tenant);
        const { TenantUser } = getTenantModels(conn);

        // ✅ Plus de populate role/permissions — role est un String direct
        let user = await TenantUser.findOne({ email: email.toLowerCase(), isCompanyAdmin: true })
          .select("+password");

        if (!user) {
          user = await TenantUser.findOne({ email: email.toLowerCase() })
            .select("+password");
        }

        if (user) {
          foundTenant = tenant;
          foundUser   = user;
          break;
        }
      } catch (dbError) {
        console.error(`❌ Erreur connexion ${tenant.dbName}:`, dbError.message);
        continue;
      }
    }

    if (!foundTenant || !foundUser)
      return res.status(401).json({ status: "fail", message: "Email ou mot de passe incorrect" });

    if (!(await foundUser.comparePassword(password, foundUser.password)))
      return res.status(401).json({ status: "fail", message: "Email ou mot de passe incorrect" });

    if (!foundUser.isActive)
      return res.status(403).json({ status: "fail", message: "Votre compte a été désactivé" });

    const token = createToken(foundUser._id, foundTenant._id);
    foundUser.password = undefined;

    const userWithTenant = {
      ...foundUser.toObject(),
      tenant: {
        _id:         foundTenant._id,
        companyName: foundTenant.companyName,
        dbName:      foundTenant.dbName,
        slug:        foundTenant.slug,
        plan:        foundTenant.plan,
        mustChangePassword: foundUser.mustChangePassword,
      },
    };

    console.log(`✅ Connexion réussie — ${foundTenant.companyName} / ${foundUser.firstName}`);
    return res.status(200).json({ status: "success", message: "Connexion réussie", token, data: { user: userWithTenant } });

  } catch (error) {
    console.error("❌ ERREUR SIGNIN:", error);
    return res.status(500).json({ status: "error", message: "Erreur lors de la connexion", error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════════════════════════════════════
exports.logout = async (req, res) => {
  res.status(200).json({ status: "success", message: "Déconnexion réussie" });
};

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE protectorMW
// ══════════════════════════════════════════════════════════════════════════════
exports.protectorMW = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer"))
      token = req.headers.authorization.split(" ")[1];

    if (!token)
      return res.status(401).json({ status: "fail", message: "Vous n'êtes pas connecté." });

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    // ── SuperAdmin ────────────────────────────────────────────────────────────
    if (!decoded.tenantId) {
      // ✅ FIX : plus de .populate('role')
      const theUser = await User.findById(decoded.id);
      if (!theUser || !theUser.isActive)
        return res.status(401).json({ status: "fail", message: "Utilisateur non trouvé ou désactivé." });

      req.user         = theUser;
      req.isSuperAdmin = true;
      return next();
    }

    // ── Tenant user ───────────────────────────────────────────────────────────
    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant || !tenant.isActive || tenant.status !== "active")
      return res.status(403).json({ status: "fail", message: "Votre entreprise n'est plus active" });

    let tenantConnection;
    try {
      tenantConnection = await getTenantConnection(tenant);
    } catch (connErr) {
      return res.status(503).json({
        status: "error",
        message: "Serveur temporairement indisponible. Réessayez dans quelques secondes.",
      });
    }

    const { TenantUser } = getTenantModels(tenantConnection);
    // ✅ Plus de populate — role est un String direct
    const theUser = await TenantUser.findById(decoded.id);

    if (!theUser || !theUser.isActive)
      return res.status(401).json({ status: "fail", message: "Utilisateur non trouvé ou désactivé." });

    req.user             = theUser;
    req.tenant           = tenant;
    req.tenantConnection = tenantConnection;
    req.isSuperAdmin     = false;
    next();

  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(401).json({ status: "fail", message: "Token expiré." });
    return res.status(401).json({ status: "fail", message: "Token invalide ou expiré." });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE permitMW
// ══════════════════════════════════════════════════════════════════════════════
exports.permitMW = (...allowedRolesOrPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ status: "fail", message: "Non authentifié" });

      // ✅ FIX : role est un String direct pour superadmin
      const roleName = typeof req.user.role === 'string'
        ? req.user.role
        : req.user.role?.name;

      if (!roleName) return res.status(403).json({ status: "fail", message: "Aucun rôle assigné" });

      if (allowedRolesOrPermissions.includes(roleName)) return next();

      // Vérification des permissions (pour les tenant users)
      if (req.user.role?.permissions?.length > 0) {
        const permissionNames = req.user.role.permissions.map(p => p.name);
        if (allowedRolesOrPermissions.some(p => permissionNames.includes(p))) return next();
      }

      return res.status(403).json({ status: "fail", message: "Vous n'avez pas la permission" });
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Erreur vérification permissions" });
    }
  };
};