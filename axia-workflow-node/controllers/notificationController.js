const safeModel = (conn, name, schema) => {
  try { return conn.model(name); }
  catch { return conn.model(name, schema); }
};

const getNotifModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const schema = require('../models/notificationModel').schema;
  return safeModel(conn, 'Notification', schema);
};

const getUserModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const schema = require('../models/userModel').schema;
  return safeModel(conn, 'User', schema);
};

const getSettingsModel = (req) => {
  const conn = req.tenantConnection;
  if (!conn) throw new Error('Connexion tenant manquante');
  const schema = require('../models/notificationSettingsModel').schema;
  return safeModel(conn, 'NotificationSettings', schema);
};

// ── GET mes notifications ─────────────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id, isRead: false
    });
    res.status(200).json({ status: 'success', data: { notifications, unreadCount } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Marquer toutes comme lues ─────────────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Marquer une comme lue ─────────────────────────────────────────────────────
exports.markOneRead = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Subscribe push ────────────────────────────────────────────────────────────
exports.subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ status: 'fail', message: 'Subscription invalide' });
    }
    const User = getUserModel(req);
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription:               subscription,
      'notificationPreferences.push': true,
    });
    res.status(200).json({ status: 'success', message: 'Push activé ✅' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Unsubscribe push ──────────────────────────────────────────────────────────
exports.unsubscribePush = async (req, res) => {
  try {
    const User = getUserModel(req);
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription:               null,
      'notificationPreferences.push': false,
    });
    res.status(200).json({ status: 'success', message: 'Push désactivé' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ── Vapid key ─────────────────────────────────────────────────────────────────
exports.getVapidKey = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data:   { publicKey: process.env.VAPID_PUBLIC_KEY },
  });
};

// ✅ GET paramètres notifications du tenant ────────────────────────────────────
exports.getNotificationSettings = async (req, res) => {
  try {
    const Settings = getSettingsModel(req);
    let settings = await Settings.findOne();
    // Créer les paramètres par défaut si inexistants
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json({ status: 'success', data: { settings } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ✅ PATCH sauvegarder paramètres notifications ────────────────────────────────
exports.saveNotificationSettings = async (req, res) => {
  try {
    const Settings  = getSettingsModel(req);
    const { triggers, emailTemplates, emailSignature } = req.body;

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});

    // Mettre à jour uniquement les champs envoyés
    if (triggers) {
      Object.keys(triggers).forEach(key => {
        if (settings.triggers[key] !== undefined) {
          Object.assign(settings.triggers[key], triggers[key]);
        }
      });
    }

    if (emailTemplates) {
      Object.keys(emailTemplates).forEach(key => {
        if (settings.emailTemplates[key] !== undefined) {
          Object.assign(settings.emailTemplates[key], emailTemplates[key]);
        }
      });
    }

    if (emailSignature !== undefined) {
      settings.emailSignature = emailSignature;
    }

    settings.updatedBy = req.user._id;
    settings.markModified('triggers');
    settings.markModified('emailTemplates');
    await settings.save();

    res.status(200).json({
      status:  'success',
      message: 'Paramètres sauvegardés',
      data:    { settings },
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};