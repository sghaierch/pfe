// public/sw.js — Service Worker pour Web Push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || '/logo192.png',
      badge: data.badge || '/logo192.png',
      tag:   data.tag   || 'axia-notif',
      data:  { url: data.url || '/' },
    })
  );
});

// ✅ Clic sur la notification → ouvre l'URL correspondante
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data?.url || '/';
      // Si un onglet est déjà ouvert → le focus
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon → ouvrir un nouvel onglet
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});