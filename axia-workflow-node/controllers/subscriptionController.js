const Subscription = require('../models/subscriptionModel');
const Tenant       = require('../models/tenantModel');
const Plan         = require('../models/planModel');
const bcrypt       = require('bcryptjs');
const mongoose     = require('mongoose');
const nodemailer   = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// ── Helpers ───────────────────────────────────────────────────────────────────
const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

// Remplace initTenantDb dans subscriptionController.js ET tenantController.js

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

    const { Schema } = mongoose;

    // ✅ FIX : role comme String enum (compatible avec authController)
    const userSchema = new Schema({
      firstName:          { type: String },
      lastName:           { type: String },
      email:              { type: String, required: true, unique: true },
      password:           { type: String, select: false },
      role:               {
        type: String,
        enum: ['company_admin', 'manager', 'employee'],
        default: 'employee'
      },
      isActive:           { type: Boolean, default: true },
      isCompanyAdmin:     { type: Boolean, default: false },
      mustChangePassword: { type: Boolean, default: true },
      jobTitle:           { type: String },
      department:         { type: Schema.Types.ObjectId, ref: 'Department' },
      pushSubscription: {
        endpoint: String,
        keys: { p256dh: String, auth: String },
      },
      notificationPreferences: {
        email: { type: Boolean, default: true },
        push:  { type: Boolean, default: false },
      },
    }, { timestamps: true });

    // ✅ Hash automatique du mot de passe (pre save)
    userSchema.pre('save', async function() {
      if (!this.isModified('password')) return;
      const bcrypt = require('bcryptjs');
      this.password = await bcrypt.hash(this.password, 10);
    });

    userSchema.methods.comparePassword = async function(entered) {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(entered, this.password);
    };

    // ✅ Département
    const departmentSchema = new Schema({
      name:        { type: String, required: true },
      description: { type: String },
    }, { timestamps: true });

    const safeModel = (conn, name, schema) => {
      try { return conn.model(name); }
      catch { return conn.model(name, schema); }
    };

    const User       = safeModel(conn, 'User', userSchema);
    const Department = safeModel(conn, 'Department', departmentSchema);

    // Créer département par défaut
    let defaultDept = await Department.findOne({ name: 'Direction' });
    if (!defaultDept) {
      defaultDept = await Department.create({
        name: 'Direction',
        description: 'Département de direction générale',
      });
    }

    // ✅ Créer l'admin de la société
    if (tenant.adminEmail) {
      const existing = await User.findOne({ email: tenant.adminEmail });
      if (!existing) {
        const pwd = tenant.adminPasswordPlain || 'Admin@1234';
        await User.create({
          firstName:          tenant.adminFirstName || 'Admin',
          lastName:           tenant.adminLastName  || tenant.companyName,
          email:              tenant.adminEmail,
          password:           pwd,          // sera hashé par pre('save')
          role:               'company_admin',
          isActive:           true,
          isCompanyAdmin:     true,
          mustChangePassword: true,
          jobTitle:           'Directeur Général',
          department:         defaultDept._id,
        });
      }
    }

    await conn.close();
    console.log('[DB] Base tenant initialisée :', tenant.dbName);
    return true;
  } catch (err) {
    console.error('[DB] initTenantDb erreur :', err.message);
    return false;
  }
};


const sendCredentialsEmail = async (tenant, plainPwd, plan, months) => {
  try {
    const Mailjet = require('node-mailjet');
    const mailjet = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );

    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [{
        From: { Email: process.env.EMAIL, Name: 'Axia Workflow' },
        To:   [{ Email: tenant.adminEmail, Name: tenant.adminFirstName }],
        Subject: `Votre compte ${tenant.companyName} est activé`,
        HTMLPart: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
            <h2 style="color:#166534;">Bienvenue, ${tenant.adminFirstName} !</h2>
            <p>Votre abonnement pour <strong>${tenant.companyName}</strong> a été approuvé.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0;">
              <tr style="background:#f0fdf4;">
                <td style="padding:10px;font-weight:bold;border:1px solid #d1fae5;">Email</td>
                <td style="padding:10px;border:1px solid #d1fae5;">${tenant.adminEmail}</td>
              </tr>
              <tr>
                <td style="padding:10px;font-weight:bold;border:1px solid #d1fae5;">Mot de passe</td>
                <td style="padding:10px;border:1px solid #d1fae5;font-family:monospace;">${plainPwd}</td>
              </tr>
            </table>
            <p style="padding:12px;background:#fef3c7;border-radius:6px;color:#92400e;">
              Changez votre mot de passe lors de votre première connexion.
            </p>
          </div>
        `,
      }]
    });

    console.log('[EMAIL] Envoyé via Mailjet à :', tenant.adminEmail);
  } catch (err) {
    console.error('[EMAIL] Erreur Mailjet :', err.message);
  }
};



// ── GET plans publics ─────────────────────────────────────────────────────────
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ status: 'success', data: { plans } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── POST /subscriptions/request — demande publique ────────────────────────────
exports.requestSubscription = async (req, res) => {
  try {
    const {
      companyName, matriculeFiscal, contactEmail, contactPhone,
      adminFirstName, adminLastName, adminEmail, adminPassword,
      planId, durationMonths = 1,
      sector, employeesCount, address, message,
    } = req.body;

    // Validation obligatoires
    if (!companyName || !contactEmail || !adminFirstName || !adminLastName || !adminEmail || !planId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Champs obligatoires manquants : companyName, contactEmail, adminFirstName, adminLastName, adminEmail, planId'
      });
    }

    // Vérifier le plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ status: 'fail', message: 'Plan non trouvé ou inactif' });
    }

    // ✅ Vérifier unicité matricule fiscal
  if (matriculeFiscal) {
  const mf = matriculeFiscal.replace(/\s/g, '').toUpperCase();
  const existingTenant = await Tenant.findOne({ matriculeFiscal: mf });
  
  if (existingTenant) {
    // Vérifier si l'abonnement existant est encore actif
    const activeSub = await Subscription.findOne({
      tenant: existingTenant._id,
      status: 'active',
    });

    if (activeSub) {
      // Abonnement actif → bloquer complètement
      return res.status(400).json({
        status: 'fail',
        message: 'Cette société possède déjà un abonnement actif. Contactez le support pour un renouvellement.'
      });
    }
    // ✅ Sinon abonnement expiré/rejeté → renouvellement autorisé
   }
  }

    // Vérifier unicité email admin
    const existingEmail = await Tenant.findOne({ adminEmail: adminEmail.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        status: 'fail',
        message: 'Cet email administrateur est déjà utilisé.'
      });
    }

    // ✅ Vérifier limite employees vs plan
    if (employeesCount && plan.maxUsers) {
      const empNum = parseInt(employeesCount.split('-')[0]) || 0;
      if (empNum > plan.maxUsers * 2) {
        return res.status(400).json({
          status: 'fail',
          message: `Votre nombre d'employés (${employeesCount}) dépasse les capacités du plan ${plan.name} (max ${plan.maxUsers} utilisateurs). Choisissez un plan supérieur.`
        });
      }
    }

    // Générer slug unique depuis matricule ou nom
    const base = matriculeFiscal
      ? matriculeFiscal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      : companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const slug   = base + '_' + Date.now();
    const dbName = 'tenant_' + slug;

    // ✅ FIX : Garder le mot de passe en clair pour l'email, puis hacher
    const plainPwd  = adminPassword || ('TempPass@' + Math.random().toString(36).slice(-6));
    const hashedPwd = await bcrypt.hash(plainPwd, 10);

    // Créer le tenant en statut pending
    const tenant = await Tenant.create({
      companyName,
      matriculeFiscal: matriculeFiscal ? matriculeFiscal.replace(/\s/g, '').toUpperCase() : undefined,
      slug,
      dbName,
      contactEmail:       contactEmail.toLowerCase(),
      contactPhone,
      adminFirstName,
      adminLastName,
      adminEmail:         adminEmail.toLowerCase(),
      adminPassword:      hashedPwd,
      adminPasswordPlain: plainPwd,   // ✅ FIX : stocké temporairement pour l'email
      plan:               planId,
      sector,
      employeesCount,
      address,
      status:    'pending',
      isActive:  false,
      limits: {
        maxUsers:     plan.maxUsers     || 5,
        maxWorkflows: plan.maxWorkflows || 10,
        maxProjects:  plan.maxProjects  || 3,
        hasAI:        plan.hasAI        || false,
        hasAnalytics: plan.hasAnalytics || false,
      },
    });

    // Créer la demande d'abonnement
    const sub = await Subscription.create({
      tenant:          tenant._id,
      plan:            planId,
      status:          'pending',
      durationMonths:  parseInt(durationMonths) || 1,
      requestMessage:  message || '',
    });

    res.status(201).json({
      status:  'success',
      message: 'Demande envoyée avec succès. Notre équipe vous contactera dans 24h.',
      data:    { tenantId: tenant._id, subscriptionId: sub._id },
    });
  } catch (err) {
    console.error('❌ requestSubscription:', err.message);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /subscriptions/:id/approve — SuperAdmin approuve ───────────────────
exports.approveSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('plan');
    if (!sub) return res.status(404).json({ status: 'fail', message: 'Abonnement non trouvé' });
    if (sub.status === 'active') {
      return res.status(400).json({ status: 'fail', message: 'Cet abonnement est déjà actif' });
    }

    const plan   = sub.plan;
    // ✅ FIX : utiliser .select('+adminPasswordPlain') pour récupérer le champ caché
    const tenant = await Tenant.findById(sub.tenant).select('+adminPasswordPlain');
    if (!tenant) return res.status(404).json({ status: 'fail', message: 'Tenant non trouvé' });

    // ✅ Calculer dates selon la durée choisie
    const months    = sub.durationMonths || plan.durationMonths || 1;
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    // Mettre à jour l'abonnement
    sub.status      = 'active';
    sub.startDate   = startDate;
    sub.endDate     = endDate;
    sub.approvedBy  = req.user._id;
    sub.approvedAt  = new Date();
    await sub.save();

    // ✅ Vérifier si la base tenant existe déjà
    const isFirstTime = tenant.isActive === false;

    // Mettre à jour le tenant
    tenant.status   = 'active';
    tenant.isActive = true;
    tenant.plan     = plan._id;
    tenant.subscription = {
      startDate,
      endDate,
      durationMonths: months,
      isActive:       true,
      autoRenew:      false,
    };
    tenant.limits = {
      maxUsers:     plan.maxUsers     || 5,
      maxWorkflows: plan.maxWorkflows || 10,
      maxProjects:  plan.maxProjects  || 3,
      hasAI:        plan.hasAI        || false,
      hasAnalytics: plan.hasAnalytics || false,
    };
    await tenant.save();

    // ✅ Initialiser la base si première fois, sinon réutiliser
    if (isFirstTime) {
      console.log('🆕 Première activation — initialisation de la base...');
      await initTenantDb(tenant);

      // ✅ FIX : Envoyer les identifiants par email à l'admin de la société
      const plainPwd = tenant.adminPasswordPlain;
      await sendCredentialsEmail(tenant, plainPwd, plan, months);

      // ✅ FIX : Effacer le mot de passe en clair maintenant qu'il a été envoyé
      await Tenant.findByIdAndUpdate(tenant._id, { $unset: { adminPasswordPlain: '' } });
      console.log('🔒 Mot de passe en clair effacé pour :', tenant.dbName);

    } else {
      console.log('♻️ Renouvellement — base existante réutilisée pour :', tenant.dbName);
    }

    res.status(200).json({
      status: 'success',
      message: isFirstTime
        ? `Abonnement approuvé ! Base de données créée pour ${tenant.companyName}`
        : `Abonnement renouvelé pour ${tenant.companyName}`,
      data: {
        subscription: sub,
        tenant: {
          companyName: tenant.companyName,
          status:      tenant.status,
          endDate:     sub.endDate,
          durationMonths: months,
        }
      }
    });
  } catch (err) {
    console.error('❌ approveSubscription:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /subscriptions/:id/reject ──────────────────────────────────────────
exports.rejectSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ status: 'fail', message: 'Abonnement non trouvé' });

    sub.status           = 'rejected';
    sub.rejectedBy       = req.user._id;
    sub.rejectedAt       = new Date();
    sub.rejectionReason = req.body.adminNote || '';
    await sub.save();

    await Tenant.findByIdAndUpdate(sub.tenant, {
      status: 'cancelled', isActive: false,
    });

    res.status(200).json({ status: 'success', message: 'Demande rejetée' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET tous les abonnements (superadmin) ─────────────────────────────────────
exports.getAllSubscriptions = async (req, res) => {
  try {
    const filter = {};
 
    // ✅ Filtre optionnel par tenant (pour SubscriptionHistory)
    if (req.query.tenant) {
      filter.tenant = req.query.tenant;
    }
 
    const subscriptions = await Subscription.find(filter)
      .populate('tenant')
      .populate('plan')
      .sort({ createdAt: -1 });
 
    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      data: { subscriptions },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /subscriptions/:id/status ──────────────────────────────────────────
exports.updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const sub = await Subscription.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!sub) return res.status(404).json({ status: 'fail', message: 'Non trouvé' });

    if (status === 'suspended' || status === 'expired') {
      await Tenant.findByIdAndUpdate(sub.tenant, { status, isActive: false });
    } else if (status === 'active') {
      await Tenant.findByIdAndUpdate(sub.tenant, { status: 'active', isActive: true });
    }

    res.status(200).json({ status: 'success', data: { subscription: sub } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── DELETE abonnement ─────────────────────────────────────────────────────────
exports.deleteSubscription = async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'success', message: 'Abonnement supprimé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Vérifier expirations (cron) ───────────────────────────────────────────────
exports.checkExpiry = async () => {
  try {
    const now     = new Date();
    const expired = await Subscription.find({
      status:  'active',
      endDate: { $lt: now },
    });

    for (const sub of expired) {
      sub.status = 'expired';
      await sub.save();
      await Tenant.findByIdAndUpdate(sub.tenant, {
        status:  'expired',
        isActive: false,
        'subscription.isActive': false,
      });
      console.log('⏰ Abonnement expiré automatiquement :', sub.tenant);
    }

    if (expired.length > 0) {
      console.log(`✅ ${expired.length} abonnement(s) expiré(s) traité(s)`);
    }
  } catch (err) {
    console.error('❌ checkExpiry:', err.message);
  }
};
exports.createPaymentIntent = async (req, res) => {
  try {
    const {
      companyName, matriculeFiscal, contactEmail, contactPhone,
      adminFirstName, adminLastName, adminEmail,
      planId, durationMonths = 1,
      sector, employeesCount, address, message, // ✅ FIX : address ajouté
    } = req.body;

    // Validation
    if (!companyName || !contactEmail || !adminFirstName || !adminLastName || !adminEmail || !planId) {
      return res.status(400).json({ status: 'fail', message: 'Champs obligatoires manquants' });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ status: 'fail', message: 'Plan non trouvé ou inactif' });
    }

    // Vérifier unicité email admin
    const existingEmail = await Tenant.findOne({ adminEmail: adminEmail.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ status: 'fail', message: 'Cet email administrateur est déjà utilisé.' });
    }

    // Calculer le montant avec la remise durée
    const discounts = { 1: 1.00, 3: 0.95, 6: 0.90, 12: 0.80 };
    const multiplier = discounts[durationMonths] || 1.00;
    const totalDt = Math.round(plan.price * durationMonths * multiplier);
    const amountCents = totalDt * 100; // Stripe en centimes

    // Créer le PaymentIntent avec les metadata (récupérées dans le webhook)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur', // ou 'tnd' si supporté — sinon utilisez 'eur'
      metadata: {
        companyName, matriculeFiscal: matriculeFiscal || '',
        contactEmail, contactPhone: contactPhone || '',
        adminFirstName, adminLastName, adminEmail,
        planId, durationMonths: String(durationMonths),
        sector: sector || '', employeesCount: employeesCount || '',
        address: address || '', // ✅ FIX : address ajouté dans les metadata Stripe
        message: message || '',
      },
    });

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
      amount: totalDt,
    });
  } catch (err) {
    console.error('❌ createPaymentIntent:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── POST /subscriptions/webhook — Stripe confirme le paiement ────────────────
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const m  = pi.metadata;

    try {
      // Générer mot de passe temporaire
      const plainPwd  = 'TempPass@' + Math.random().toString(36).slice(-6);
      const hashedPwd = await bcrypt.hash(plainPwd, 10);

      const base   = m.matriculeFiscal
        ? m.matriculeFiscal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : m.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const slug   = base + '_' + Date.now();
      const dbName = 'tenant_' + slug;

      const tenant = await Tenant.create({
        companyName:     m.companyName,
        matriculeFiscal: m.matriculeFiscal || undefined,
        contactEmail:    m.contactEmail,
        contactPhone:    m.contactPhone    || undefined,
        adminFirstName:  m.adminFirstName,
        adminLastName:   m.adminLastName,
        adminEmail:      m.adminEmail.toLowerCase(),
        adminPassword:   hashedPwd,
        adminPasswordPlain: plainPwd,
        sector:          m.sector          || undefined,
        employeesCount:  m.employeesCount  || undefined,
        address:         m.address         || undefined, // ✅ FIX : champ address ajouté
        slug,
        dbName,
        status:  'pending',
        isActive: false,
        plan:    m.planId,
      });

      const sub = await Subscription.create({
        tenant:         tenant._id,
        plan:           m.planId,
        status:         'pending',
        durationMonths: parseInt(m.durationMonths) || 1,
        requestMessage: m.message || '',
        stripePaymentIntentId: pi.id, // utile pour traçabilité
      });

      const plan = await Plan.findById(m.planId);
      await sendCredentialsEmail(tenant, plainPwd, plan, parseInt(m.durationMonths));

      console.log('✅ Webhook: tenant créé après paiement:', tenant.companyName);
    } catch (err) {
      console.error('❌ Webhook traitement:', err.message);
    }
  }

  res.json({ received: true });
};