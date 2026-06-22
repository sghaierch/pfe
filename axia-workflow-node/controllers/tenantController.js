const Tenant = require("../models/tenantModel");
const bcrypt       = require('bcryptjs');
const mongoose     = require('mongoose');
const nodemailer   = require('nodemailer');

// ── Helper : initialiser la base tenant ───────────────────────────────────────
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
        const pwd = tenant.adminPasswordPlain || tenant.adminPassword || 'Admin@1234';
        await User.create({
          firstName:      tenant.adminFirstName || 'Admin',
          lastName:       tenant.adminLastName  || tenant.companyName,
          email:          tenant.adminEmail,
          password:       pwd,
          role:           createdRoles['company_admin'],
          isActive:       true,
          isCompanyAdmin: true,
          mustChangePassword: true,
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

// ── Envoyer email identifiants (mutualisé avec subscriptionController) ────────
const sendCredentialsEmail = async (tenant, plainPwd, plan, months) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD_APPLICATION,
      },
    });

    await transporter.sendMail({
      from:    `"${process.env.APP_NAME || 'Support'}" <${process.env.EMAIL}>`,
      to:      tenant.adminEmail,
      subject: `✅ Votre compte ${tenant.companyName} est activé`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#166534;">✅ Bienvenue, ${tenant.adminFirstName} !</h2>
          <p>Votre compte pour <strong>${tenant.companyName}</strong> a été approuvé avec succès.</p>
          <p>Voici vos identifiants de connexion :</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr style="background:#f0fdf4;">
              <td style="padding:10px 16px;font-weight:bold;border:1px solid #d1fae5;">Email</td>
              <td style="padding:10px 16px;border:1px solid #d1fae5;">${tenant.adminEmail}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:bold;border:1px solid #d1fae5;">Mot de passe</td>
              <td style="padding:10px 16px;border:1px solid #d1fae5;font-family:monospace;">${plainPwd}</td>
            </tr>
          </table>
          <p>📋 Détails de votre abonnement :</p>
          <ul style="color:#374151;line-height:1.8;">
            <li>Plan : <strong>${plan?.name || '—'}</strong></li>
            ${months ? `<li>Durée : <strong>${months} mois</strong></li>` : ''}
          </ul>
          <p style="margin-top:20px;padding:12px;background:#fef3c7;border-radius:6px;color:#92400e;">
            🔐 <strong>Important :</strong> Pensez à changer votre mot de passe lors de votre première connexion.
          </p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">
            Si vous avez des questions, contactez notre support.
          </p>
        </div>
      `,
    });

    console.log('📧 Email identifiants envoyé à :', tenant.adminEmail);
  } catch (emailErr) {
    console.error('⚠️ Email non envoyé (non bloquant) :', emailErr.message);
  }
};

// ── GET tous les tenants ──────────────────────────────────────────────────────
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

// ── GET un tenant par ID ──────────────────────────────────────────────────────
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('plan');
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });
    res.status(200).json({ status: "success", data: tenant });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// ── PATCH approuver un tenant (depuis la fiche tenant, sans passer par abonnements) ──
exports.approveTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .select('+adminPasswordPlain')
      .populate('plan');
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    const isFirstTime = tenant.isActive === false;

    // Calculer les dates d'abonnement
    const durationMonths = req.body.durationMonths || tenant.subscription?.durationMonths || 1;
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

    tenant.status   = 'active';
    tenant.isActive = true;
    tenant.subscription = {
      startDate,
      endDate,
      durationMonths: parseInt(durationMonths),
      isActive:  true,
      autoRenew: false,
    };
    await tenant.save();

    // Synchroniser l'abonnement lié s'il existe
    const Subscription = require('../models/subscriptionModel');
    const pendingSub = await Subscription.findOne({ tenant: tenant._id, status: 'pending' });
    if (pendingSub) {
      pendingSub.status     = 'active';
      pendingSub.startDate  = startDate;
      pendingSub.endDate    = endDate;
      pendingSub.approvedBy = req.user?._id;
      pendingSub.approvedAt = new Date();
      await pendingSub.save();
    }

    if (isFirstTime) {
      console.log('🆕 Première activation — initialisation de la base...');
      await initTenantDb(tenant);

      // Envoyer l'email avec les identifiants
      const plainPwd = tenant.adminPasswordPlain || 'Admin@1234';
      await sendCredentialsEmail(tenant, plainPwd, tenant.plan, durationMonths);

      // Effacer le mot de passe en clair
      await Tenant.findByIdAndUpdate(tenant._id, { $unset: { adminPasswordPlain: '' } });
      console.log('🔒 Mot de passe en clair effacé pour :', tenant.dbName);
    } else {
      console.log('♻️ Réactivation — base existante réutilisée pour :', tenant.dbName);
    }

    const updated = await Tenant.findById(tenant._id).populate('plan');
    res.status(200).json({
      status: "success",
      message: isFirstTime ? "Tenant approuvé, base créée et email envoyé" : "Tenant réactivé",
      data: updated
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── PATCH rejeter un tenant ───────────────────────────────────────────────────
exports.rejectTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    tenant.status          = 'rejected';
    tenant.isActive        = false;
    tenant.rejectionReason = req.body.reason || '';
    await tenant.save();

    // Synchroniser l'abonnement lié
    const Subscription = require('../models/subscriptionModel');
    await Subscription.updateMany(
      { tenant: tenant._id, status: 'pending' },
      { status: 'rejected', rejectedAt: new Date(), rejectionReason: req.body.reason || '' }
    );

    const updated = await Tenant.findById(tenant._id).populate('plan');
    res.status(200).json({ status: "success", message: "Tenant rejeté", data: updated });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── PATCH suspendre ───────────────────────────────────────────────────────────
exports.suspendTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    tenant.status   = 'suspended';
    tenant.isActive = false;
    await tenant.save();

    res.status(200).json({ status: "success", message: "Tenant suspendu", data: tenant });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── PATCH réactiver ───────────────────────────────────────────────────────────
exports.reactivateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    tenant.status   = 'active';
    tenant.isActive = true;
    await tenant.save();

    res.status(200).json({ status: "success", message: "Tenant réactivé", data: tenant });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── DELETE supprimer ──────────────────────────────────────────────────────────
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: "fail", message: "Tenant non trouvé" });

    await Tenant.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: "success", message: "Tenant supprimé (la DB MongoDB reste intacte)" });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── PATCH changer le plan ─────────────────────────────────────────────────────
exports.changeTenantPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ status: 'fail', message: 'planId requis' });

    const Plan = require('../models/planModel');
    const Subscription = require('../models/subscriptionModel');

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ status: 'fail', message: 'Plan non trouvé' });

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ status: 'fail', message: 'Tenant non trouvé' });

    // ✅ 1. Clôturer TOUS les anciens abonnements actifs
    await Subscription.updateMany(
      { tenant: tenant._id, status: 'active' },
      { status: 'cancelled', endDate: new Date() }
    );

    // ✅ 2. Récupérer la durée restante de l'ancien abonnement (ou 1 mois par défaut)
    const durationMonths = tenant.subscription?.durationMonths || 1;
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // ✅ 3. Créer un nouvel abonnement actif avec le nouveau plan
    await Subscription.create({
      tenant:        tenant._id,
      plan:          planId,
      status:        'active',
      startDate,
      endDate,
      durationMonths,
      approvedBy:    req.user?._id,
      approvedAt:    new Date(),
    });

    // ✅ 4. Mettre à jour le tenant
    const updated = await Tenant.findByIdAndUpdate(
      req.params.id,
      {
        plan: planId,
        'subscription.startDate':      startDate,
        'subscription.endDate':        endDate,
        'subscription.durationMonths': durationMonths,
        'subscription.isActive':       true,
        'limits.maxUsers':     plan.maxUsers,
        'limits.maxWorkflows': plan.maxWorkflows,
        'limits.maxProjects':  plan.maxProjects,
        'limits.hasAI':        plan.hasAI,
        'limits.hasAnalytics': plan.hasAnalytics,
      },
      { new: true }
    ).populate('plan');

    res.status(200).json({ status: 'success', message: 'Plan mis à jour', data: updated });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── POST renvoyer les identifiants par email ──────────────────────────────────
exports.resendCredentials = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .select('+adminPasswordPlain')
      .populate('plan');
    if (!tenant) return res.status(404).json({ status: 'fail', message: 'Tenant non trouvé' });
    if (!tenant.adminEmail) return res.status(400).json({ status: 'fail', message: 'Pas d\'email admin' });

    // On génère un nouveau mot de passe si l'ancien n'est plus disponible
    let plainPwd = tenant.adminPasswordPlain;
    if (!plainPwd) {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
      plainPwd = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

      // Mettre à jour le mot de passe dans la base tenant
      const rawUri = process.env.DATABASE_URL.replace('<db_password>', process.env.DATABASE_PASSWORD);
      const dbUrl  = rawUri.replace(/(\w+\.mongodb\.net\/)([^?]*)/, '$1' + tenant.dbName);
      try {
        const conn = await mongoose.createConnection(dbUrl, { serverSelectionTimeoutMS: 8000 });
        await new Promise((resolve, reject) => {
          if (conn.readyState === 1) return resolve();
          conn.once('connected', resolve);
          conn.once('error', reject);
          setTimeout(() => reject(new Error('Timeout')), 8000);
        });
        const userSchema = require('../models/userModel').schema;
        const safeModel = (c, n, s) => { try { return c.model(n); } catch { return c.model(n, s); } };
        const User = safeModel(conn, 'User', userSchema);
        const hashed = await bcrypt.hash(plainPwd, 12);
        await User.findOneAndUpdate({ email: tenant.adminEmail }, { password: hashed, mustChangePassword: true });
        await conn.close();
      } catch (dbErr) {
        console.error('⚠️ Impossible de MàJ le mdp dans la base tenant :', dbErr.message);
        // Non bloquant — on envoie quand même l'email avec le nouveau mdp
      }
    }

    await sendCredentialsEmail(tenant, plainPwd, tenant.plan, tenant.subscription?.durationMonths);

    res.status(200).json({ status: 'success', message: 'Email renvoyé avec succès à ' + tenant.adminEmail });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH renouveler l'abonnement (tenant expired) ────────────────────────────
exports.renewSubscription = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('plan');
    if (!tenant) return res.status(404).json({ status: 'fail', message: 'Tenant non trouvé' });

    const durationMonths = parseInt(req.body.durationMonths) || 1;
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    tenant.status   = 'active';
    tenant.isActive = true;
    tenant.subscription = {
      startDate,
      endDate,
      durationMonths,
      isActive:  true,
      autoRenew: false,
    };
    await tenant.save();

    // Créer un nouvel abonnement actif dans Subscription
    const Subscription = require('../models/subscriptionModel');
    // Clôturer les éventuels abonnements expirés
    await Subscription.updateMany(
      { tenant: tenant._id, status: { $in: ['expired', 'active'] } },
      { status: 'cancelled', endDate: new Date() }
    );
    await Subscription.create({
      tenant:        tenant._id,
      plan:          tenant.plan._id,
      status:        'active',
      startDate,
      endDate,
      durationMonths,
      approvedBy:    req.user?._id,
      approvedAt:    new Date(),
    });

    const updated = await Tenant.findById(tenant._id).populate('plan');
    res.status(200).json({
      status: 'success',
      message: `Abonnement renouvelé pour ${durationMonths} mois`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH modifier les limites manuellement (sans changer de plan) ────────────
exports.updateTenantLimits = async (req, res) => {
  try {
    const {
      maxUsers, maxWorkflows, maxProjects, maxStorage,
      hasAI, hasAnalytics,
    } = req.body;

    const update = {};
    if (maxUsers     !== undefined) update['limits.maxUsers']     = parseInt(maxUsers);
    if (maxWorkflows !== undefined) update['limits.maxWorkflows'] = parseInt(maxWorkflows);
    if (maxProjects  !== undefined) update['limits.maxProjects']  = parseInt(maxProjects);
    if (maxStorage   !== undefined) update['limits.maxStorage']   = parseInt(maxStorage);
    if (hasAI        !== undefined) update['limits.hasAI']        = Boolean(hasAI);
    if (hasAnalytics !== undefined) update['limits.hasAnalytics'] = Boolean(hasAnalytics);

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Aucune limite à mettre à jour' });
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate('plan');

    if (!tenant) return res.status(404).json({ status: 'fail', message: 'Tenant non trouvé' });
    res.status(200).json({ status: 'success', message: 'Limites mises à jour', data: tenant });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};