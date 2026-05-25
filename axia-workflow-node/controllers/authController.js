const User = require("../models/userModel");
const Role = require("../models/roleModel");
const Tenant = require("../models/tenantModel");
const Permission = require("../models/permissionModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const mongoose = require("mongoose");

// ── Schemas allégés pour les tenant DBs ──────────────────────────────────────
const tenantUserSchema = new mongoose.Schema({
  firstName:   { type: String, required: true },
  lastName:    { type: String, required: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true, select: false },
  role:        { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
  department:  { type: String },
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

const tenantRoleSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
  isSystemRole: { type: Boolean, default: false },
}, { timestamps: true });

const tenantPermissionSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  category:    { type: String, default: "general" },
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

// ── Helper URI tenant ─────────────────────────────────────────────────────────
const buildTenantUri = (dbName) => {
  const rawUri = process.env.DATABASE_URL.replace("<db_password>", process.env.DATABASE_PASSWORD);
  return rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, `$1${dbName}`);
};

// ── ✅ FIX TIMEOUT : Cache des connexions + reconnexion automatique ────────────
const tenantConnections = {};

const getTenantConnection = async (tenant) => {
  const key = tenant.dbName;
  const existing = tenantConnections[key];

  // ✅ Réutilise si la connexion est déjà ouverte (readyState 1 = connected)
  if (existing && existing.readyState === 1) {
    return existing;
  }

  // ✅ Si la connexion existe mais est cassée, on la supprime du cache
  if (existing && existing.readyState !== 1) {
    console.warn(`⚠️ Connexion ${key} cassée (state: ${existing.readyState}), reconnexion...`);
    try { await existing.close(); } catch (_) {}
    delete tenantConnections[key];
  }

  const tenantDbUrl = buildTenantUri(key);

  // ✅ FIX TIMEOUT : timeouts augmentés + connectTimeoutMS ajouté
  const conn = await mongoose.createConnection(tenantDbUrl, {
    serverSelectionTimeoutMS: 15000,   // 15s pour sélectionner un serveur
    socketTimeoutMS:          30000,   // 30s pour les opérations
    connectTimeoutMS:         15000,   // 15s pour établir la connexion
    heartbeatFrequencyMS:     10000,   // ping toutes les 10s pour détecter les coupures
    maxPoolSize:              5,       // max 5 connexions simultanées par tenant
    minPoolSize:              1,       // garde au moins 1 connexion ouverte
  });

  // ✅ Attendre que la connexion soit vraiment prête
  await new Promise((resolve, reject) => {
    if (conn.readyState === 1) return resolve();
    conn.once("connected", resolve);
    conn.once("error", reject);
    setTimeout(() => reject(new Error(`Timeout connexion MongoDB pour ${key}`)), 15000);
  });

  // ✅ Surveiller les déconnexions pour nettoyer le cache automatiquement
  conn.on("disconnected", () => {
    console.warn(`⚠️ Tenant ${key} déconnecté — sera recréé à la prochaine requête`);
    delete tenantConnections[key];
  });

  conn.on("error", (err) => {
    console.error(`❌ Erreur connexion tenant ${key}:`, err.message);
    delete tenantConnections[key];
  });

  tenantConnections[key] = conn;
  console.log(`✅ Nouvelle connexion tenant créée: ${key}`);
  return conn;
};

// ── Helper : obtenir les modèles tenant sans conflit ─────────────────────────
const getTenantModels = (conn) => {
  // ✅ FIX : on supprime et recrée les modèles à chaque fois pour éviter
  //    les conflits de schema entre différents tenants
  if (conn.models["User"])       delete conn.models["User"];
  if (conn.models["Role"])       delete conn.models["Role"];
  if (conn.models["Permission"]) delete conn.models["Permission"];

  return {
    TenantUser:       conn.model("User",       tenantUserSchema),
    TenantRole:       conn.model("Role",       tenantRoleSchema),
    TenantPermission: conn.model("Permission", tenantPermissionSchema),
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
    const { firstName, lastName, email, password, confirmPassword, roleName, age, department, jobTitle, phoneNumber } = req.body;

    const role = await Role.findOne({ name: roleName });
    if (!role) return res.status(400).json({ status: "fail", message: "Rôle non trouvé" });

    const newUser = await User.create({
      firstName, lastName, email, password, confirmPassword,
      role: role._id, age, department, jobTitle, phoneNumber,
    });

    const token = createToken(newUser._id);
    await newUser.populate({ path: "role", populate: { path: "permissions" } });
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

    if (!email || !password) {
      return res.status(400).json({ status: "fail", message: "Email et mot de passe requis" });
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 TENTATIVE DE CONNEXION:", email);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ── 1. SuperAdmin (DB principale) ─────────────────────────────────────────
    const superadminUser = await User.findOne({ email })
      .select("+password")
      .populate({ path: "role", populate: { path: "permissions" } });

    if (superadminUser && superadminUser.role?.name === "superadmin") {
      if (!(await superadminUser.comparePassword(password, superadminUser.password))) {
        return res.status(401).json({ status: "fail", message: "Email ou mot de passe incorrect" });
      }
      if (!superadminUser.isActive) {
        return res.status(403).json({ status: "fail", message: "Votre compte a été désactivé" });
      }
      const token = createToken(superadminUser._id);
      superadminUser.password = undefined;
      console.log("✅ Connexion SuperAdmin réussie");
      return res.status(200).json({ status: "success", message: "Connexion réussie", token, data: { user: superadminUser } });
    }

    // ── 2. Chercher dans les tenants ──────────────────────────────────────────
    const activeTenants = await Tenant.find({ status: "active", isActive: true }).populate("plan");
    console.log(`📊 ${activeTenants.length} tenant(s) actif(s)`);

    let foundTenant = null;
    let foundUser   = null;

    for (const tenant of activeTenants) {
      console.log(`\n🔍 Recherche dans: ${tenant.companyName} (${tenant.dbName})`);
      try {
        const conn = await getTenantConnection(tenant);
        const { TenantUser, TenantRole, TenantPermission } = getTenantModels(conn);

        // Cherche d'abord admin, puis user normal
        let user = await TenantUser.findOne({ email: email.toLowerCase(), isCompanyAdmin: true })
          .select("+password")
          .populate({ path: "role", model: TenantRole, populate: { path: "permissions", model: TenantPermission } });

        if (!user) {
          user = await TenantUser.findOne({ email: email.toLowerCase() })
            .select("+password")
            .populate({ path: "role", model: TenantRole, populate: { path: "permissions", model: TenantPermission } });
        }

        if (user) {
          console.log(`✅ Utilisateur trouvé dans ${tenant.companyName}`);
          foundTenant = tenant;
          foundUser   = user;
          break;
        }
      } catch (dbError) {
        // ✅ FIX TIMEOUT : on log l'erreur mais on continue les autres tenants
        console.error(`❌ Erreur connexion ${tenant.dbName}:`, dbError.message);
        continue;
      }
    }

    if (!foundTenant || !foundUser) {
      console.log("\n❌ Utilisateur non trouvé dans aucun tenant");
      return res.status(401).json({ status: "fail", message: "Email ou mot de passe incorrect" });
    }

    if (!(await foundUser.comparePassword(password, foundUser.password))) {
      return res.status(401).json({ status: "fail", message: "Email ou mot de passe incorrect" });
    }
    if (!foundUser.isActive) {
      return res.status(403).json({ status: "fail", message: "Votre compte a été désactivé" });
    }

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

    console.log(`\n✅ Connexion réussie — ${foundTenant.companyName} / ${foundUser.firstName}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return res.status(200).json({ status: "success", message: "Connexion réussie", token, data: { user: userWithTenant } });

  } catch (error) {
    console.error("\n❌ ERREUR CRITIQUE SIGNIN:", error);
    return res.status(500).json({ status: "error", message: "Erreur lors de la connexion", error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ══════════════════════════════════════════════════════════════════════════════
exports.logout = async (req, res) => {
  try {
    res.status(200).json({ status: "success", message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Erreur lors de la déconnexion" });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE protectorMW
// ══════════════════════════════════════════════════════════════════════════════
exports.protectorMW = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ status: "fail", message: "Vous n'êtes pas connecté." });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_KEY);

    // ── SuperAdmin ────────────────────────────────────────────────────────────
    if (!decoded.tenantId) {
      const theUser = await User.findById(decoded.id).populate({
        path: "role",
        populate: { path: "permissions" },
      });
      if (!theUser || !theUser.isActive) {
        return res.status(401).json({ status: "fail", message: "Utilisateur non trouvé ou désactivé." });
      }
      req.user         = theUser;
      req.isSuperAdmin = true;
      return next();
    }

    // ── Tenant user ───────────────────────────────────────────────────────────
    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant || !tenant.isActive || tenant.status !== "active") {
      return res.status(403).json({ status: "fail", message: "Votre entreprise n'est plus active" });
    }

    // ✅ FIX TIMEOUT : connexion cachée avec reconnexion auto si coupée
    let tenantConnection;
    try {
      tenantConnection = await getTenantConnection(tenant);
    } catch (connErr) {
      console.error("❌ Erreur protectorMW connexion tenant:", connErr.message);
      // ✅ FIX : retourner 503 (Service indisponible) au lieu de 401
      // pour que le frontend ne déconnecte pas l'utilisateur par erreur
      return res.status(503).json({
        status: "error",
        message: "Serveur temporairement indisponible. Réessayez dans quelques secondes.",
      });
    }

    const { TenantUser, TenantRole, TenantPermission } = getTenantModels(tenantConnection);

    const theUser = await TenantUser.findById(decoded.id).populate({
      path:     "role",
      model:    TenantRole,
      populate: { path: "permissions", model: TenantPermission },
    });

    if (!theUser || !theUser.isActive) {
      return res.status(401).json({ status: "fail", message: "Utilisateur non trouvé ou désactivé." });
    }

    req.user             = theUser;
    req.tenant           = tenant;
    req.tenantConnection = tenantConnection;
    req.isSuperAdmin     = false;

    next();

  } catch (err) {
    console.error("❌ Erreur protectorMW:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ status: "fail", message: "Token expiré." });
    }
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
      if (!req.user.role) return res.status(403).json({ status: "fail", message: "Aucun rôle assigné" });

      if (allowedRolesOrPermissions.includes(req.user.role.name)) return next();

      if (req.user.role.permissions?.length > 0) {
        const permissionNames = req.user.role.permissions.map(p => p.name);
        if (allowedRolesOrPermissions.some(p => permissionNames.includes(p))) return next();
      }

      return res.status(403).json({ status: "fail", message: "Vous n'avez pas la permission" });
    } catch (error) {
      return res.status(500).json({ status: "error", message: "Erreur vérification permissions" });
    }
  };
};