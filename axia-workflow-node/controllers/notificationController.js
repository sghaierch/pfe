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

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET mes notifications — lecture seule pour l'utilisateur normal
// L'utilisateur voit SEULEMENT ses propres notifications.
// Il peut les marquer comme lues mais PAS les supprimer.
// ─────────────────────────────────────────────────────────────────────────────
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

// ✅ PATCH marquer TOUTES comme lues — utilisateur normal (ses propres notifs uniquement)
exports.markAllRead = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    // ⚠️ Filtre obligatoire sur recipient pour qu'un user ne puisse pas
    // marquer les notifs d'un autre utilisateur
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ✅ PATCH marquer UNE comme lue — utilisateur normal (seulement la sienne)
exports.markOneRead = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    // ⚠️ Double vérification : la notif doit appartenir à l'utilisateur connecté
    const notif = await Notification.findOne({
      _id:       req.params.id,
      recipient: req.user._id,   // ← sécurité : empêche de marquer la notif d'un autre
    });
    if (!notif) {
      return res.status(403).json({
        status:  'fail',
        message: 'Notification introuvable ou accès refusé',
      });
    }
    notif.isRead = true;
    await notif.save();
    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔒 SUPPRESSION — ADMIN SEULEMENT
// Un utilisateur normal n'a aucun accès à ces routes.
// Voir notificationRoutes.js : protégé par permitMW('company_admin')
// ─────────────────────────────────────────────────────────────────────────────

// ✅ DELETE une notification (admin seulement)
exports.deleteOne = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) {
      return res.status(404).json({ status: 'fail', message: 'Notification introuvable' });
    }
    res.status(200).json({ status: 'success', message: 'Notification supprimée' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ✅ DELETE toutes les notifications d'un utilisateur (admin seulement)
exports.deleteAllForUser = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    const { userId } = req.params;
    const result = await Notification.deleteMany({ recipient: userId });
    res.status(200).json({
      status:  'success',
      message: `${result.deletedCount} notification(s) supprimée(s)`,
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
};

// ✅ GET toutes les notifications (admin seulement — supervision globale)
exports.getAllNotifications = async (req, res) => {
  try {
    const Notification = getNotifModel(req);
    const { page = 1, limit = 50, userId, type } = req.query;
    const filter = {};
    if (userId) filter.recipient = userId;
    if (type)   filter.type      = type;
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('recipient', 'firstName lastName email');
    const total = await Notification.countDocuments(filter);
    res.status(200).json({ status:'success', data:{ notifications, total } });
  } catch (err) {
    res.status(500).json({ status:'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUSH — accessible à tous les utilisateurs authentifiés
// ─────────────────────────────────────────────────────────────────────────────
exports.subscribePush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ status:'fail', message:'Subscription invalide' });
    }
    const User = getUserModel(req);
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription:               subscription,
      'notificationPreferences.push': true,
    });
    res.status(200).json({ status:'success', message:'Push activé' });
  } catch (err) {
    res.status(500).json({ status:'fail', message: err.message });
  }
};

exports.unsubscribePush = async (req, res) => {
  try {
    const User = getUserModel(req);
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription:               null,
      'notificationPreferences.push': false,
    });
    res.status(200).json({ status:'success', message:'Push désactivé' });
  } catch (err) {
    res.status(500).json({ status:'fail', message: err.message });
  }
};

exports.getVapidKey = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data:   { publicKey: process.env.VAPID_PUBLIC_KEY },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES — admin seulement
// ─────────────────────────────────────────────────────────────────────────────
exports.getNotificationSettings = async (req, res) => {
  try {
    const Settings = getSettingsModel(req);
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.status(200).json({ status:'success', data:{ settings } });
  } catch (err) {
    res.status(500).json({ status:'fail', message: err.message });
  }
};

exports.saveNotificationSettings = async (req, res) => {
  try {
    const Settings = getSettingsModel(req);
    const { triggers, emailTemplates, emailSignature } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});
    if (triggers) {
      Object.keys(triggers).forEach(key => {
        if (settings.triggers[key] !== undefined) Object.assign(settings.triggers[key], triggers[key]);
      });
    }
    if (emailTemplates) {
      Object.keys(emailTemplates).forEach(key => {
        if (settings.emailTemplates[key] !== undefined) Object.assign(settings.emailTemplates[key], emailTemplates[key]);
      });
    }
    if (emailSignature !== undefined) settings.emailSignature = emailSignature;
    settings.updatedBy = req.user._id;
    settings.markModified('triggers');
    settings.markModified('emailTemplates');
    await settings.save();
    res.status(200).json({ status:'success', message:'Paramètres sauvegardés', data:{ settings } });
  } catch (err) {
    res.status(500).json({ status:'fail', message: err.message });
  }
};