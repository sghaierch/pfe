const Tenant = require("../models/tenantModel");
const bcrypt       = require('bcryptjs');
const mongoose     = require('mongoose');

// ── Helper : initialiser la base tenant (copié depuis subscriptionController) ─
const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

const initTenantDb = async (tenant) => {
  try {
    const rawUri = process.env.DATABASE_URL.replace('<db_password>', process.env.DATABASE_PASSWORD);
    const dbUrl  = rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, '$1' + tenant.dbName);
    const conn   = await mongoose.createConnection(dbUrl, { serverSelectionTimeoutMS: 10000 });

    await new Promise((resolve, reject) => {
      if (conn.readyState === 1) return resolve();
      conn.once('connected', resolve);
      conn.once('error', reject);
      setTimeout(() => reject(new Error('Timeout connexion tenant')), 10000);
    });

    const roleSchema = require('../models/roleModel').schema;
    const userSchema = require('../models/userModel').schema;
    const Role = safeModel(conn, 'Role', roleSchema);
    const User = safeModel(conn, 'User', userSchema);

    const roleNames    = ['company_admin', 'manager', 'employee'];
    const createdRoles = {};
    for (const name of roleNames) {
      let role = await Role.findOne({ name });
      if (!role) role = await Role.create({ name, permissions: [] });
      createdRoles[name] = role._id;
    }

    if (tenant.adminEmail) {
      const existing = await User.findOne({ email: tenant.adminEmail });
      if (!existing) {
        const pwd = tenant.adminPassword || await bcrypt.hash('Admin@1234', 10);
        await User.create({
          firstName:      tenant.adminFirstName || 'Admin',
          lastName:       tenant.adminLastName  || tenant.companyName,
          email:          tenant.adminEmail,
          password:       pwd,
          role:           createdRoles['company_admin'],
          isActive:       true,
          isCompanyAdmin: true,
          mustChangePassword: false,
          jobTitle:       'Directeur',
        });
      }
    }

    await conn.close();
    console.log('✅ Base tenant initialisée :', tenant.dbName);
    return true;
  } catch (err) {
    console.error('❌ initTenantDb:', err.message);
    return false;
  }
};

// Obtenir tous les tenants
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate('plan')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: "success",
      results: tenants.length,
      data: tenants
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Obtenir un tenant par ID
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('plan');
    
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });
    }
    
    res.status(200).json({ status: "success", data: tenant });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Approuver un tenant
exports.approveTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    const isFirstTime = tenant.isActive === false;

    tenant.status = 'active';
    tenant.isActive = true;
    await tenant.save();

    if (isFirstTime) {
      console.log('🆕 Première activation — initialisation de la base...');
      await initTenantDb(tenant);
    } else {
      console.log('♻️ Réactivation — base existante réutilisée pour :', tenant.dbName);
    }

    res.status(200).json({ status: "success", message: isFirstTime ? "Tenant approuvé et base créée" : "Tenant réactivé", data: tenant });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Rejeter un tenant
exports.rejectTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    tenant.status = 'rejected';
    tenant.isActive = false;
    tenant.rejectionReason = req.body.reason || '';
    await tenant.save();

    res.status(200).json({ status: "success", message: "Tenant rejeté", data: tenant });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Suspendre un tenant
exports.suspendTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });
    }
    
    tenant.status = 'suspended';
    tenant.isActive = false;
    await tenant.save();
    
    res.status(200).json({
      status: "success",
      message: "Tenant suspendu",
      data: tenant
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Réactiver un tenant
exports.reactivateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });
    }
    
    tenant.status = 'active';
    tenant.isActive = true;
    await tenant.save();
    
    res.status(200).json({
      status: "success",
      message: "Tenant réactivé",
      data: tenant
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// Supprimer un tenant (⚠️ Dangereux - à utiliser avec précaution)
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    
    if (!tenant) {
      return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });
    }
    
    // ⚠️ Attention : ne supprime pas la DB MongoDB du tenant
    await Tenant.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: "success",
      message: "Tenant supprimé (la DB MongoDB reste intacte)"
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};