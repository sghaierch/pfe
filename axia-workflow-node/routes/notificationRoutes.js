const express = require('express');
const router  = express.Router();
const { protectorMW, permitMW } = require('../controllers/authController');
const {
  // ── Utilisateur normal (ses propres notifs — lecture + marquer lu seulement) ──
  getMyNotifications,
  markAllRead,
  markOneRead,
  // ── Tous les utilisateurs authentifiés (push) ──
  getVapidKey,
  subscribePush,
  unsubscribePush,
  // ── Admin seulement ──
  getAllNotifications,
  deleteOne,
  deleteAllForUser,
  getNotificationSettings,
  saveNotificationSettings,
} = require('../controllers/notificationController');

// ── Middleware global : toutes les routes nécessitent d'être connecté ──────
router.use(protectorMW);

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES UTILISATEUR NORMAL
// Un utilisateur normal peut :
//   ✅ Voir SES notifications  (GET /)
//   ✅ Marquer toutes comme lues (PATCH /read-all)
//   ✅ Marquer une comme lue   (PATCH /:id/read)
//   ❌ NE PEUT PAS supprimer
//   ❌ NE PEUT PAS voir les notifs des autres
// ══════════════════════════════════════════════════════════════════════════════
router.get('/',          getMyNotifications);

// ⚠️  ORDRE IMPORTANT : /read-all DOIT être AVANT /:id/read
// sinon Express capture 'read-all' comme un :id
router.patch('/read-all',  markAllRead);
router.patch('/:id/read',  markOneRead);

// ── Push (tous les utilisateurs connectés) ─────────────────────────────────
router.get('/push/vapid-key',    getVapidKey);
router.post('/push/subscribe',   subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES ADMIN SEULEMENT — permitMW('company_admin') bloque les simples users
// Un admin peut :
//   ✅ Voir TOUTES les notifications (supervision)
//   ✅ Supprimer une notification spécifique
//   ✅ Supprimer toutes les notifs d'un utilisateur
//   ✅ Gérer les paramètres de notification
// ══════════════════════════════════════════════════════════════════════════════
router.get('/admin/all',                    permitMW('company_admin'), getAllNotifications);
router.delete('/admin/:id',                 permitMW('company_admin'), deleteOne);
router.delete('/admin/user/:userId/all',    permitMW('company_admin'), deleteAllForUser);
router.get('/settings',                     permitMW('company_admin'), getNotificationSettings);
router.patch('/settings',                   permitMW('company_admin'), saveNotificationSettings);

module.exports = router;