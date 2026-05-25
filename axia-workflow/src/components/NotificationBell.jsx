import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';

const TYPE_ICONS = {
  step_assigned:      '📋',
  step_completed:     '✅',
  step_rejected:      '❌',
  workflow_completed: '🎉',
  reminder:           '⏰',
};

// ✅ Convertir la clé VAPID base64 en Uint8Array (requis par l'API navigateur)
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);
  const [pushEnabled,   setPushEnabled]   = useState(false);  // ✅ nouveau
  const [pushLoading,   setPushLoading]   = useState(false);  // ✅ nouveau
  const ref = useRef();

  useEffect(() => {
    fetchNotifications();
    checkPushStatus(); // ✅ vérifier si push déjà activé
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) { console.error(err); }
  };

  // ✅ Vérifier si le navigateur a déjà une permission push
  const checkPushStatus = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const perm = Notification.permission;
    setPushEnabled(perm === 'granted');
  };

  // ✅ Activer les notifications push
  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Votre navigateur ne supporte pas les notifications push.');
      return;
    }

    setPushLoading(true);
    try {
      // 1. Enregistrer le Service Worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 2. Demander la permission
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        alert('Permission refusée. Activez les notifications dans les paramètres de votre navigateur.');
        return;
      }

      // 3. Récupérer la clé publique VAPID depuis le backend
      const vapidRes = await notificationService.getVapidKey();
      const vapidKey = vapidRes.data?.publicKey;

      // 4. S'abonner au push
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,  // obligatoire
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 5. Envoyer la subscription au backend pour la sauvegarder
      await notificationService.subscribePush(subscription.toJSON());

      setPushEnabled(true);
      alert('✅ Notifications push activées !');
    } catch (err) {
      console.error('❌ Push subscribe error:', err);
      alert('Erreur lors de l\'activation : ' + err.message);
    } finally {
      setPushLoading(false);
    }
  };

  // ✅ Désactiver les notifications push
  const handleDisablePush = async () => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await notificationService.unsubscribePush();
      setPushEnabled(false);
    } catch (err) {
      console.error('❌ Push unsubscribe error:', err);
    } finally {
      setPushLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkOne = async (id) => {
    await notificationService.markOneRead(id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(!open)}
        style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#94a3b8', fontSize: '20px' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#dc2626', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '44px', width: '360px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', zIndex: 1000, maxHeight: '520px', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              Notifications
              {unreadCount > 0 && <span style={{ background: '#dc2626', color: '#fff', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', marginLeft: '6px' }}>{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Tout lire
              </button>
            )}
          </div>

          {/* ✅ Bannière push — activation/désactivation */}
          <div style={{ padding: '10px 16px', background: pushEnabled ? '#f0fdf4' : '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{pushEnabled ? '🔔' : '🔕'}</span>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: pushEnabled ? '#166534' : '#374151' }}>
                  {pushEnabled ? 'Push activé' : 'Push désactivé'}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  {pushEnabled ? 'Vous recevez des notifications' : 'Activez pour ne rien manquer'}
                </p>
              </div>
            </div>
            <button
              onClick={pushEnabled ? handleDisablePush : handleEnablePush}
              disabled={pushLoading}
              style={{
                padding: '5px 12px', borderRadius: '6px', border: 'none',
                background: pushEnabled ? '#fee2e2' : '#4f46e5',
                color:      pushEnabled ? '#dc2626'  : '#fff',
                fontWeight: 700, fontSize: '11px', cursor: pushLoading ? 'wait' : 'pointer',
                whiteSpace: 'nowrap', opacity: pushLoading ? 0.7 : 1,
              }}
            >
              {pushLoading ? '...' : pushEnabled ? 'Désactiver' : 'Activer'}
            </button>
          </div>

          {/* Liste notifications */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontSize: '28px', margin: '0 0 8px' }}>🔔</p>
                <p style={{ margin: 0, fontSize: '13px' }}>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkOne(notif._id)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', background: notif.isRead ? '#fff' : '#f0f7ff', cursor: notif.isRead ? 'default' : 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{TYPE_ICONS[notif.type] || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 3px', fontWeight: notif.isRead ? 400 : 700, fontSize: '13px', color: '#0f172a' }}>{notif.title}</p>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.message}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                  {!notif.isRead && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0, marginTop: '4px' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;