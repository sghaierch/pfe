import API from './api';

const notificationService = {
  getAll:       async ()     => (await API.get('/notifications')).data,
  markAllRead:  async ()     => (await API.patch('/notifications/read-all')).data,
  markOneRead:  async (id)   => (await API.patch(`/notifications/${id}/read`)).data,

  // ✅ nouvelles méthodes push
  getVapidKey:    async ()   => (await API.get('/notifications/push/vapid-key')).data,
  subscribePush:  async (sub)=> (await API.post('/notifications/push/subscribe',   { subscription: sub })).data,
  unsubscribePush:async ()   => (await API.post('/notifications/push/unsubscribe')).data,
};

export default notificationService;