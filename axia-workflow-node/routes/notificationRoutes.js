const express = require('express');
const router  = express.Router();
const { protectorMW, permitMW } = require('../controllers/authController');
const {
  getMyNotifications,
  markAllRead,
  markOneRead,
  subscribePush,
  unsubscribePush,
  getVapidKey,
  getNotificationSettings,   // ✅ nouveau
  saveNotificationSettings,  // ✅ nouveau
} = require('../controllers/notificationController');

router.use(protectorMW);

router.get('/',                 getMyNotifications);
router.patch('/read-all',       markAllRead);   // ⚠️ DOIT être avant /:id/read
router.patch('/:id/read',       markOneRead);   // sinon 'read-all' est capturé comme :id
router.get('/push/vapid-key',   getVapidKey);
router.post('/push/subscribe',  subscribePush);
router.post('/push/unsubscribe',unsubscribePush);

// ✅ Paramètres notifications — admin seulement
router.get('/settings',         getNotificationSettings);
router.patch('/settings',       permitMW('company_admin'), saveNotificationSettings);

module.exports = router;