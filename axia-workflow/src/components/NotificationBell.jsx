import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';

// ── Type config ────────────────────────────────────────────────────────────
const TYPE_CFG = {
  step_assigned:      { label:'Tâche assignée',   bg:'#EFF6FF', color:'#2563EB', dot:'#3B82F6' },
  step_completed:     { label:'Étape validée',    bg:'#F0FDF4', color:'#16A34A', dot:'#22C55E' },
  step_rejected:      { label:'Étape rejetée',    bg:'#FEF2F2', color:'#DC2626', dot:'#EF4444' },
  workflow_completed: { label:'Workflow terminé', bg:'#FFFBEB', color:'#D97706', dot:'#FBBF24' },
  reminder:           { label:'Rappel',           bg:'#ECFEFF', color:'#0891B2', dot:'#22D3EE' },
};
const DEF_CFG = { label:'Notification', bg:'#F8FAFC', color:'#64748B', dot:'#94A3B8' };

const urlBase64ToUint8Array = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const base = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw  = window.atob(base);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
};

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IBell     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const ICheckAll = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/><polyline points="20 13 9 24 4 19" style={{opacity:0.5}}/></svg>;
const IClock    = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IBellOff  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IBellOn   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const ILoader   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IEmpty    = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const ICheck    = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const fmtDate = d => {
  const now  = new Date(), dt = new Date(d);
  const diff = Math.floor((now - dt) / 1000);
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400)return `Il y a ${Math.floor(diff/3600)} h`;
  return dt.toLocaleDateString('fr-FR', {day:'2-digit',month:'short'});
};

// ── Main component ─────────────────────────────────────────────────────────
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);
  const [pushEnabled,   setPushEnabled]   = useState(false);
  const [pushLoading,   setPushLoading]   = useState(false);
  const [activeFilter,  setActiveFilter]  = useState('all');
  const ref = useRef();

  useEffect(() => {
    fetchNotifications();
    checkPushStatus();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch {}
  };

  const checkPushStatus = () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setPushEnabled(Notification.permission === 'granted');
  };

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator)||!('PushManager' in window)) { alert('Navigateur non compatible.'); return; }
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { alert('Permission refusée.'); return; }
      const vapidRes = await notificationService.getVapidKey();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:urlBase64ToUint8Array(vapidRes.data?.publicKey) });
      await notificationService.subscribePush(sub.toJSON());
      setPushEnabled(true);
    } catch (err) { alert('Erreur : '+err.message); }
    finally { setPushLoading(false); }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); }
      await notificationService.unsubscribePush();
      setPushEnabled(false);
    } catch {}
    finally { setPushLoading(false); }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Un utilisateur normal peut SEULEMENT marquer comme lu — pas supprimer
  const handleMarkOne = async (id) => {
    await notificationService.markOneRead(id);
    setNotifications(prev => prev.map(n => n._id===id ? {...n, isRead:true} : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Filter
  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'read')   return  n.isRead;
    return true;
  });

  const unreadFiltered = notifications.filter(n => !n.isRead).length;

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .nb-notif:hover  { background: #F8FAFC !important; }
        .nb-notif-unread:hover { background: #EEF2FF !important; }
        .nb-bell:hover   { background: rgba(255,255,255,0.18) !important; }
      `}</style>

      {/* ── Bell button ── */}
      <button className="nb-bell" onClick={() => setOpen(!open)}
        style={{ position:'relative', background:'rgba(255,255,255,0.08)', border:'none', cursor:'pointer', width:'40px', height:'40px', borderRadius:'10px', color:'#FDE047', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .15s' }}>
        <IBell/>
        {unreadCount > 0 && (
          <span style={{ position:'absolute', top:'-3px', right:'-3px', background:'#EF4444', color:'#fff', borderRadius:'50%', minWidth:'17px', height:'17px', padding:'0 3px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:900, boxShadow:'0 0 0 2px #0F172A', boxSizing:'border-box' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{ position:'absolute', right:0, top:'52px', width:'400px', background:'#fff', borderRadius:'16px', boxShadow:'0 20px 56px rgba(15,23,42,0.18)', border:'1px solid #E2E8F0', zIndex:1000, display:'flex', flexDirection:'column', maxHeight:'560px', overflow:'hidden', animation:'slideDown 0.18s ease' }}>

          {/* ── Header ── */}
          <div style={{ padding:'16px 20px 0', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <h3 style={{ margin:0, fontSize:'16px', fontWeight:800, color:'#0F172A' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <span style={{ background:'#EF4444', color:'#fff', padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:800 }}>{unreadCount}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}
                  style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none', color:'#2563EB', fontSize:'12px', fontWeight:700, cursor:'pointer', padding:'5px 10px', borderRadius:'8px', background:'#EFF6FF' }}>
                  <ICheckAll/> Tout lire
                </button>
              )}
            </div>

            {/* ── Filter tabs ── */}
            <div style={{ display:'flex', gap:'4px', background:'#F1F5F9', padding:'3px', borderRadius:'10px', marginBottom:'0' }}>
              {[
                { key:'all',    label:'Toutes',    count:notifications.length },
                { key:'unread', label:'Non lues',  count:unreadFiltered },
                { key:'read',   label:'Lues',      count:notifications.length - unreadFiltered },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'6px 8px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'12px', fontWeight:700, fontFamily:"'Inter',sans-serif", transition:'all .15s', background:activeFilter===tab.key?'#fff':'transparent', color:activeFilter===tab.key?'#0F172A':'#64748B', boxShadow:activeFilter===tab.key?'0 1px 4px rgba(0,0,0,0.1)':'none' }}>
                  {tab.label}
                  <span style={{ padding:'1px 6px', borderRadius:'10px', fontSize:'10px', fontWeight:800, background:activeFilter===tab.key?'#2563EB':'#E2E8F0', color:activeFilter===tab.key?'#fff':'#64748B' }}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Notifications list ── */}
          <div style={{ overflowY:'auto', flex:1, marginTop:'8px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding:'48px 24px', textAlign:'center' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <IEmpty/>
                </div>
                <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:700, color:'#0F172A' }}>Aucune notification</p>
                <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>
                  {activeFilter==='unread'?'Toutes vos notifications sont lues !':'Rien à afficher pour le moment.'}
                </p>
              </div>
            ) : (
              filtered.map(notif => {
                const cfg = TYPE_CFG[notif.type] || DEF_CFG;
                const isUnread = !notif.isRead;
                return (
                  <div key={notif._id}
                    className={isUnread ? 'nb-notif-unread' : 'nb-notif'}
                    onClick={() => isUnread && handleMarkOne(notif._id)}
                    style={{ padding:'13px 20px', borderBottom:'1px solid #F8FAFC', background:isUnread?'#FAFBFF':'#fff', cursor:isUnread?'pointer':'default', display:'flex', gap:'13px', alignItems:'flex-start', transition:'background .12s' }}>

                    {/* Type indicator */}
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:cfg.dot }}/>
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      {/* Type badge */}
                      <span style={{ display:'inline-block', background:cfg.bg, color:cfg.color, padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:700, marginBottom:'4px', border:`1px solid ${cfg.dot}25` }}>
                        {cfg.label}
                      </span>
                      <p style={{ margin:'0 0 3px', fontWeight:isUnread?800:600, fontSize:'13px', color:'#0F172A', lineHeight:1.4 }}>
                        {notif.title}
                      </p>
                      <p style={{ margin:'0 0 6px', fontSize:'12px', color:'#64748B', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {notif.message}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'11px', color:'#94A3B8', fontWeight:500, display:'flex', alignItems:'center', gap:'4px' }}>
                          <IClock/>{fmtDate(notif.createdAt)}
                        </span>
                        {isUnread && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'10px', color:'#2563EB', fontWeight:700 }}>
                            <ICheck/> Marquer lu
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {isUnread && (
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#2563EB', flexShrink:0, marginTop:'6px' }}/>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ── Push footer ── */}
          <div style={{ padding:'12px 16px', background:'#F8FAFC', borderTop:'1.5px solid #F1F5F9', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:pushEnabled?'#F0FDF4':'#F1F5F9', border:`1.5px solid ${pushEnabled?'#BBF7D0':'#E2E8F0'}`, display:'flex', alignItems:'center', justifyContent:'center', color:pushEnabled?'#16A34A':'#64748B' }}>
                {pushEnabled ? <IBellOn/> : <IBellOff/>}
              </div>
              <div>
                <p style={{ margin:0, fontSize:'12px', fontWeight:700, color:pushEnabled?'#16A34A':'#374151' }}>
                  {pushEnabled ? 'Push activé' : 'Notifications push'}
                </p>
                <p style={{ margin:0, fontSize:'11px', color:'#94A3B8' }}>
                  {pushEnabled ? 'Alertes en temps réel activées' : 'Activez pour ne rien manquer'}
                </p>
              </div>
            </div>
            <button onClick={pushEnabled ? handleDisablePush : handleEnablePush} disabled={pushLoading}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'9px', border:'none', background:pushEnabled?'#FEF2F2':'#2563EB', color:pushEnabled?'#DC2626':'#fff', fontWeight:700, fontSize:'11px', cursor:pushLoading?'wait':'pointer', opacity:pushLoading?0.7:1, whiteSpace:'nowrap', fontFamily:"'Inter',sans-serif", transition:'all .15s' }}>
              {pushLoading ? <ILoader/> : pushEnabled ? <><IBellOff/> Désactiver</> : <><IBellOn/> Activer</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;