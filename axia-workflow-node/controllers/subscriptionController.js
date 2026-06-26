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

// ── Initialiser la base tenant ────────────────────────────────────────────────
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

    const userSchema = new Schema({
      firstName:          { type: String },
      lastName:           { type: String },
      email:              { type: String, required: true, unique: true },
      password:           { type: String, select: false },
      role:               { type: String, enum: ['company_admin', 'manager', 'employee'], default: 'employee' },
      isActive:           { type: Boolean, default: true },
      isCompanyAdmin:     { type: Boolean, default: false },
      mustChangePassword: { type: Boolean, default: true },
      jobTitle:           { type: String },
    }, { timestamps: true });

    userSchema.pre('save', async function() {
      if (!this.isModified('password')) return;
      this.password = await require('bcryptjs').hash(this.password, 10);
    });

    const User = safeModel(conn, 'User', userSchema);

    // ✅ Créer l'admin de la société avec role String
    if (tenant.adminEmail) {
      const existing = await User.findOne({ email: tenant.adminEmail });
      if (!existing) {
        const pwd = tenant.adminPasswordPlain || 'Admin@1234';
        await User.create({
          firstName:          tenant.adminFirstName || 'Admin',
          lastName:           tenant.adminLastName  || tenant.companyName,
          email:              tenant.adminEmail,
          password:           pwd,
          role:               'company_admin', // ✅ String enum, pas ObjectId
          isActive:           true,
          isCompanyAdmin:     true,
          mustChangePassword: true,
          jobTitle:           'Directeur',
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

// ── Envoyer email identifiants ────────────────────────────────────────────────
const sendCredentialsEmail = async (tenant, plainPwd, plan, months) => {
  try {
    const { google } = require('googleapis');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const htmlContent = `
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
        <ul style="color:#374151;line-height:1.8;">
          <li>Plan : <strong>${plan?.name || '—'}</strong></li>
          ${months ? `<li>Durée : <strong>${months} mois</strong></li>` : ''}
        </ul>
        <p style="padding:12px;background:#fef3c7;border-radius:6px;color:#92400e;">
          Changez votre mot de passe lors de votre première connexion.
        </p>
      </div>
    `;

    const message = [
      `From: "Axia Workflow" <${process.env.EMAIL}>`,
      `To: ${tenant.adminEmail}`,
      `Subject: Votre compte ${tenant.companyName} est activé`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log('[EMAIL] Envoyé via Gmail API à :', tenant.adminEmail);
  } catch (err) {
    console.error('[EMAIL] Erreur Gmail API :', err.message);
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

// ── POST /subscriptions/request ───────────────────────────────────────────────
exports.requestSubscription = async (req, res) => {
  try {
    const {
      companyName, matriculeFiscal, contactEmail, contactPhone,
      adminFirstName, adminLastName, adminEmail, adminPassword,
      planId, durationMonths = 1,
      sector, employeesCount, address, message,
    } = req.body;

    if (!companyName || !contactEmail || !adminFirstName || !adminLastName || !adminEmail || !planId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Champs obligatoires manquants : companyName, contactEmail, adminFirstName, adminLastName, adminEmail, planId'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ status: 'fail', message: 'Plan non trouvé ou inactif' });
    }

    if (matriculeFiscal) {
      const mf = matriculeFiscal.replace(/\s/g, '').toUpperCase();
      const existingTenant = await Tenant.findOne({ matriculeFiscal: mf });
      if (existingTenant) {
        const activeSub = await Subscription.findOne({ tenant: existingTenant._id, status: 'active' });
        if (activeSub) {
          return res.status(400).json({
            status: 'fail',
            message: 'Cette société possède déjà un abonnement actif.'
          });
        }
      }
    }

    const existingEmail = await Tenant.findOne({ adminEmail: adminEmail.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ status: 'fail', message: 'Cet email administrateur est déjà utilisé.' });
    }

    if (employeesCount && plan.maxUsers) {
      const empNum = parseInt(employeesCount.split('-')[0]) || 0;
      if (empNum > plan.maxUsers * 2) {
        return res.status(400).json({
          status: 'fail',
          message: `Votre nombre d'employés dépasse les capacités du plan ${plan.name}.`
        });
      }
    }

    const base = matriculeFiscal
      ? matriculeFiscal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      : companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const slug   = base + '_' + Date.now();
    const dbName = 'tenant_' + slug;

    const plainPwd  = adminPassword || ('TempPass@' + Math.random().toString(36).slice(-6));
    const hashedPwd = await bcrypt.hash(plainPwd, 10);

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
      adminPasswordPlain: plainPwd,
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

    const sub = await Subscription.create({
      tenant:         tenant._id,
      plan:           planId,
      status:         'pending',
      durationMonths: parseInt(durationMonths) || 1,
      requestMessage: message || '',
    });

    res.status(201).json({
      status:  'success',
      message: 'Demande envoyée avec succès. Notre équipe vous contactera dans 24h.',
      data:    { tenantId: tenant._id, subscriptionId: sub._id },
    });
  } catch (err) {
    console.error('[SUB] requestSubscription:', err.message);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /subscriptions/:id/approve ─────────────────────────────────────────
exports.approveSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('plan');
    if (!sub) return res.status(404).json({ status: 'fail', message: 'Abonnement non trouvé' });
    if (sub.status === 'active') {
      return res.status(400).json({ status: 'fail', message: 'Cet abonnement est déjà actif' });
    }

    const plan   = sub.plan;
    const tenant = await Tenant.findById(sub.tenant).select('+adminPasswordPlain');
    if (!tenant) return res.status(404).json({ status: 'fail', message: 'Tenant non trouvé' });

    const months    = sub.durationMonths || plan.durationMonths || 1;
    const startDate = new Date();
    const endDate   = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    sub.status     = 'active';
    sub.startDate  = startDate;
    sub.endDate    = endDate;
    sub.approvedBy = req.user._id;
    sub.approvedAt = new Date();
    await sub.save();

    const isFirstTime = tenant.isActive === false;

    tenant.status   = 'active';
    tenant.isActive = true;
    tenant.plan     = plan._id;
    tenant.subscription = { startDate, endDate, durationMonths: months, isActive: true, autoRenew: false };
    tenant.limits = {
      maxUsers:     plan.maxUsers     || 5,
      maxWorkflows: plan.maxWorkflows || 10,
      maxProjects:  plan.maxProjects  || 3,
      hasAI:        plan.hasAI        || false,
      hasAnalytics: plan.hasAnalytics || false,
    };
    await tenant.save();

    if (isFirstTime) {
      console.log('[SUB] Première activation — initialisation de la base...');
      await initTenantDb(tenant);

      const plainPwd = tenant.adminPasswordPlain;
      await sendCredentialsEmail(tenant, plainPwd, plan, months);

      await Tenant.findByIdAndUpdate(tenant._id, { $unset: { adminPasswordPlain: '' } });
      console.log('[SUB] Mot de passe en clair effacé pour :', tenant.dbName);
    } else {
      console.log('[SUB] Renouvellement — base existante pour :', tenant.dbName);
    }

    res.status(200).json({
      status: 'success',
      message: isFirstTime
        ? `Abonnement approuvé ! Base créée pour ${tenant.companyName}`
        : `Abonnement renouvelé pour ${tenant.companyName}`,
      data: { subscription: sub, tenant: { companyName: tenant.companyName, status: tenant.status, endDate: sub.endDate, durationMonths: months } }
    });
  } catch (err) {
    console.error('[SUB] approveSubscription:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /subscriptions/:id/reject ──────────────────────────────────────────
exports.rejectSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ status: 'fail', message: 'Abonnement non trouvé' });

    sub.status          = 'rejected';
    sub.rejectedBy      = req.user._id;
    sub.rejectedAt      = new Date();
    sub.rejectionReason = req.body.adminNote || '';
    await sub.save();

    await Tenant.findByIdAndUpdate(sub.tenant, { status: 'cancelled', isActive: false });

    res.status(200).json({ status: 'success', message: 'Demande rejetée' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── GET tous les abonnements ──────────────────────────────────────────────────
exports.getAllSubscriptions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.tenant) filter.tenant = req.query.tenant;

    const subscriptions = await Subscription.find(filter)
      .populate('tenant')
      .populate('plan')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', results: subscriptions.length, data: { subscriptions } });
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
    const expired = await Subscription.find({ status: 'active', endDate: { $lt: now } });

    for (const sub of expired) {
      sub.status = 'expired';
      await sub.save();
      await Tenant.findByIdAndUpdate(sub.tenant, {
        status: 'expired', isActive: false, 'subscription.isActive': false,
      });
      console.log('[SUB] Abonnement expiré :', sub.tenant);
    }

    if (expired.length > 0) {
      console.log(`[SUB] ${expired.length} abonnement(s) expiré(s)`);
    }
  } catch (err) {
    console.error('[SUB] checkExpiry:', err.message);
  }
};

// ── POST /subscriptions/payment-intent ───────────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  try {
    const {
      companyName, matriculeFiscal, contactEmail, contactPhone,
      adminFirstName, adminLastName, adminEmail,
      planId, durationMonths = 1,
      sector, employeesCount, address, message,
    } = req.body;

    if (!companyName || !contactEmail || !adminFirstName || !adminLastName || !adminEmail || !planId) {
      return res.status(400).json({ status: 'fail', message: 'Champs obligatoires manquants' });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ status: 'fail', message: 'Plan non trouvé ou inactif' });
    }

    const existingEmail = await Tenant.findOne({ adminEmail: adminEmail.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ status: 'fail', message: 'Cet email administrateur est déjà utilisé.' });
    }

    const discounts  = { 1: 1.00, 3: 0.95, 6: 0.90, 12: 0.80 };
    const multiplier = discounts[durationMonths] || 1.00;
    const totalDt    = Math.round(plan.price * durationMonths * multiplier);
    const amountCents = totalDt * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: {
        companyName, matriculeFiscal: matriculeFiscal || '',
        contactEmail, contactPhone: contactPhone || '',
        adminFirstName, adminLastName, adminEmail,
        planId, durationMonths: String(durationMonths),
        sector: sector || '', employeesCount: employeesCount || '',
        address: address || '', message: message || '',
      },
    });

    res.status(200).json({ status: 'success', clientSecret: paymentIntent.client_secret, amount: totalDt });
  } catch (err) {
    console.error('[SUB] createPaymentIntent:', err.message);
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── POST /subscriptions/webhook ───────────────────────────────────────────────
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[SUB] Webhook signature invalide:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const m  = pi.metadata;

    try {
      const plainPwd  = 'TempPass@' + Math.random().toString(36).slice(-6);
      const hashedPwd = await bcrypt.hash(plainPwd, 10);

      const base   = m.matriculeFiscal
        ? m.matriculeFiscal.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : m.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const slug   = base + '_' + Date.now();
      const dbName = 'tenant_' + slug;

      const tenant = await Tenant.create({
        companyName:        m.companyName,
        matriculeFiscal:    m.matriculeFiscal || undefined,
        contactEmail:       m.contactEmail,
        contactPhone:       m.contactPhone    || undefined,
        adminFirstName:     m.adminFirstName,
        adminLastName:      m.adminLastName,
        adminEmail:         m.adminEmail.toLowerCase(),
        adminPassword:      hashedPwd,
        adminPasswordPlain: plainPwd,
        sector:             m.sector          || undefined,
        employeesCount:     m.employeesCount  || undefined,
        address:            m.address         || undefined,
        slug, dbName,
        status: 'pending', isActive: false,
        plan: m.planId,
      });

      await Subscription.create({
        tenant:         tenant._id,
        plan:           m.planId,
        status:         'pending',
        durationMonths: parseInt(m.durationMonths) || 1,
        requestMessage: m.message || '',
        stripePaymentIntentId: pi.id,
      });

      const plan = await Plan.findById(m.planId);
      await sendCredentialsEmail(tenant, plainPwd, plan, parseInt(m.durationMonths));

      console.log('[SUB] Webhook: tenant créé après paiement:', tenant.companyName);
    } catch (err) {
      console.error('[SUB] Webhook traitement:', err.message);
    }
  }

  res.json({ received: true });
};