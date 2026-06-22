// Remix Icons are loaded via Dashboard.css @import
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import subscriptionService from '../../../services/subscriptionService';
import planService          from '../../../services/planService';
import tenantService        from '../../../services/tenantService';
import { useAuth }          from '../../../contexts/AuthContext';
import '../../../styles/Dashboard.css';

const fmt = (n) => (n == null ? '—' : n);

const StatusBadge = ({ status }) => {
  const MAP = {
    pending:   { label: 'En attente', cls: 'pending'   },
    active:    { label: 'Actif',      cls: 'active'    },
    approved:  { label: 'Approuvé',   cls: 'approved'  },
    rejected:  { label: 'Refusé',     cls: 'rejected'  },
    expired:   { label: 'Expiré',     cls: 'expired'   },
    suspended: { label: 'Suspendu',   cls: 'suspended' },
    cancelled: { label: 'Annulé',     cls: 'cancelled' },
  };
  const s = MAP[status] || { label: status, cls: 'expired' };
  return <span className={`dash-status-badge ${s.cls}`}>{s.label}</span>;
};

const buildMonthlyData = (subs) => {
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const now = new Date();
  return MONTHS.slice(0, now.getMonth() + 1).map((label, i) => {
    const m = subs.filter(s => { const d = new Date(s.createdAt); return d.getMonth() === i && d.getFullYear() === now.getFullYear(); });
    const revenue = m.filter(s => s.status === 'active' || s.status === 'approved').reduce((acc, s) => acc + (s.plan?.price || 0), 0);
    return { month: label, abonnements: m.length, revenue };
  });
};

const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', borderRadius: '7px', padding: '6px 10px', fontSize: '10px' }}>
      <p style={{ margin: '0 0 2px', color: '#64748b', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: 0, color: '#f1f5f9', fontWeight: 700 }}>{payload[0].value}{payload[0].name === 'revenue' ? ' dt' : ''}</p>
    </div>
  );
};

const PlanDistBars = ({ planDist }) => {
  const COLORS = ['#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe'];
  const max = Math.max(...planDist.map(p => p.value), 1);
  return (
    <div style={{ marginTop: '4px' }}>
      {planDist.slice(0, 4).map((p, i) => (
        <div key={p.name} className="dash-plan-bar-row">
          <span className="dash-plan-bar-label">{p.name}</span>
          <div className="dash-plan-bar-track">
            <div className="dash-plan-bar-fill" style={{ width: `${(p.value / max) * 100}%`, background: COLORS[i % COLORS.length] }} />
          </div>
          <span className="dash-plan-bar-count">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { getFullName } = useAuth();
  const [data, setData]               = useState(null);
  const [recentSubs, setRecentSubs]   = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [planDist, setPlanDist]       = useState([]);
  const [subStatus, setSubStatus]     = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading, setLoading]         = useState(true);
  const now = new Date();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [subsRes, plansRes, tenantsRes] = await Promise.allSettled([
          subscriptionService.getAllSubscriptions(),
          planService.getAll(),
          tenantService.getAllTenants(),
        ]);
        const subs    = subsRes.status    === 'fulfilled' ? (subsRes.value.data?.data    || subsRes.value.data?.subscriptions || []) : [];
        const plans   = plansRes.status   === 'fulfilled' ? (plansRes.value.data?.data   || plansRes.value.data?.plans        || []) : [];
        const tenants = tenantsRes.status === 'fulfilled' ? (tenantsRes.value.data?.data || tenantsRes.value.data             || []) : [];

        const pending       = subs.filter(s => s.status === 'pending').length;
        const activeCount   = subs.filter(s => s.status === 'active' || s.status === 'approved').length;
        const rejectedCount = subs.filter(s => s.status === 'rejected').length;
        const revenue       = subs.filter(s => s.status === 'active' || s.status === 'approved').reduce((a, s) => a + (s.plan?.price || 0), 0);
        const activeTenants    = tenants.filter(t => t.status === 'active').length;
        const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
        const pendingTenants   = tenants.filter(t => t.status === 'pending').length;
        const expiredTenants   = tenants.filter(t => t.status === 'expired').length;

        const in30 = new Date(Date.now() + 30 * 24 * 3600 * 1000);
        const soon = subs.filter(s => {
          if (s.status !== 'active' && s.status !== 'approved') return false;
          if (!s.endDate) return false;
          const e = new Date(s.endDate);
          return e <= in30 && e > now;
        }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        setExpiringSoon(soon);

        setData({ pendingSubs: pending, totalSubs: subs.length, activeSubs: activeCount, rejectedSubs: rejectedCount, revenue, activePlans: plans.filter(p => p.isActive).length, totalPlans: plans.length, activeTenants, suspendedTenants, pendingTenants, expiredTenants, totalTenants: tenants.length });
        setRecentSubs(subs.slice(0, 4));
        setMonthlyData(buildMonthlyData(subs));

        const pc = {};
        subs.forEach(s => { const n = s.plan?.name || 'Inconnu'; pc[n] = (pc[n] || 0) + 1; });
        setPlanDist(Object.entries(pc).map(([name, value]) => ({ name, value })));
        setSubStatus([
          { name: 'Actifs',     value: activeCount,  color: '#10b981' },
          { name: 'En attente', value: pending,       color: '#f59e0b' },
          { name: 'Refusés',    value: rejectedCount, color: '#ef4444' },
        ]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) return (
    <div className="dash-layout dash-loading-wrap">
      <div className="dash-spinner" />
      <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500, marginTop: '8px' }}>Chargement...</p>
    </div>
  );

  const urgentSoon = expiringSoon.filter(s => Math.ceil((new Date(s.endDate) - now) / 86400000) <= 7);

  const kpis = [
    { to: '/dashboard/superadmin/tenants',       accent: data?.pendingTenants > 0 ? '#ef4444' : '#2563eb', isAlert: data?.pendingTenants > 0, icon: 'ri-building-2-line',  iconBg: data?.pendingTenants > 0 ? '#fee2e2' : '#dbeafe', iconColor: data?.pendingTenants > 0 ? '#ef4444' : '#2563eb', value: fmt(data?.activeTenants), label: 'Entreprises actives', sub: `${data?.pendingTenants} en attente · ${data?.suspendedTenants} suspendu(s)`, badge: data?.pendingTenants > 0 ? 'Urgent' : null },
    { to: '/dashboard/superadmin/subscriptions', accent: data?.pendingSubs > 0 ? '#ef4444' : '#0ea5e9',    isAlert: data?.pendingSubs > 0,    icon: 'ri-file-list-3-line', iconBg: data?.pendingSubs > 0 ? '#fee2e2' : '#e0f2fe',    iconColor: data?.pendingSubs > 0 ? '#ef4444' : '#0ea5e9',    value: fmt(data?.activeSubs),    label: 'Abonnements actifs',  sub: `${data?.pendingSubs} demande(s) en attente`,                                 badge: data?.pendingSubs > 0 ? 'Urgent' : null },
    { to: '/dashboard/superadmin/subscriptions', accent: '#10b981', icon: 'ri-coin-line',        iconBg: '#d1fae5', iconColor: '#10b981', value: `${data?.revenue ?? 0} dt`, label: 'Revenus MRR',       sub: 'Revenus mensuels récurrents' },
    { to: '/dashboard/superadmin/plans',         accent: '#2563eb', icon: 'ri-price-tag-3-line', iconBg: '#dbeafe', iconColor: '#2563eb', value: fmt(data?.activePlans),     label: 'Plans disponibles', sub: `${data?.totalPlans} plans au total` },
    ...(expiringSoon.length > 0 ? [{ to: '/dashboard/superadmin/subscriptions', accent: '#f59e0b', isAlert: true, icon: 'ri-alarm-warning-line', iconBg: '#fef3c7', iconColor: '#d97706', value: expiringSoon.length, label: 'Expirent dans 30j', sub: 'Renouvellement requis', badge: 'Urgent' }] : []),
  ];

  return (
    <div className="dash-layout">

      {/* ── Ligne 1 : Welcome ── */}
      <div className="dash-welcome">
        <div className="dash-welcome-left">
          <div className="dash-welcome-avatar">{getFullName().charAt(0).toUpperCase()}</div>
          <div>
            <h1 className="dash-welcome-title">{greeting}, <span>{getFullName()}</span></h1>
            <p className="dash-welcome-date">{now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="dash-welcome-pills">
              {data?.pendingSubs > 0 && <span className="dash-pill yellow"><i className="ri-time-line"></i>{data.pendingSubs} demande{data.pendingSubs > 1 ? 's' : ''} en attente</span>}
              {expiringSoon.length > 0 && <span className="dash-pill red"><i className="ri-alarm-warning-line"></i>{expiringSoon.length} expir{expiringSoon.length > 1 ? 'ent' : 'e'} bientôt</span>}
            </div>
          </div>
        </div>
        <Link to="/dashboard/superadmin/subscriptions" className="dash-welcome-cta">
          Gérer les demandes <i className="ri-arrow-right-line"></i>
        </Link>
      </div>

      {/* ── Ligne 2 : KPI ── */}
      <div className="dash-kpi-row">
        {kpis.map((k, i) => (
          <Link key={i} to={k.to} className={`dash-kpi-card${k.isAlert ? ' alert' : ''}`} style={{ '--kpi-accent': k.accent }}>
            <div className="dash-kpi-top">
              <div className="dash-kpi-icon" style={{ background: k.iconBg, color: k.iconColor }}><i className={k.icon}></i></div>
              {k.badge && <span className="dash-kpi-badge">{k.badge}</span>}
            </div>
            <div className="dash-kpi-value">{k.value}</div>
            <div className="dash-kpi-label">{k.label}</div>
            <div className="dash-kpi-sub">{k.sub}</div>
          </Link>
        ))}
      </div>

      {/* ── Ligne 3 : Contenu ── */}
      <div className="dash-content-grid">

        {/* Colonne gauche */}
        <div className="dash-charts-col">
          {/* Charts */}
          <div className="dash-charts-duo">
            <div className="dash-card">
              <div className="dash-card-header">
                <div><h3>Évolution mensuelle</h3><p>Abonnements cette année</p></div>
              </div>
              <ResponsiveContainer width="100%" height={75}>
                <AreaChart data={monthlyData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <Area type="monotone" dataKey="abonnements" stroke="#2563eb" fill="url(#gS)" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#2563eb' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="dash-card">
              <div className="dash-card-header">
                <div><h3>Revenus mensuels</h3><p>En dinars tunisiens</p></div>
              </div>
              <ResponsiveContainer width="100%" height={75}>
                <BarChart data={monthlyData} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 7, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <Bar dataKey="revenue" name="revenue" radius={[3, 3, 0, 0]}>
                    {monthlyData.map((_, i) => <Cell key={i} fill={i === monthlyData.length - 1 ? '#2563eb' : '#bfdbfe'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="dash-card dash-card-table">
            <div className="dash-card-header">
              <div><h3>Demandes récentes</h3><p>Dernières demandes d'abonnement</p></div>
              <Link to="/dashboard/superadmin/subscriptions" className="dash-link-small">Voir tout <i className="ri-arrow-right-line"></i></Link>
            </div>
            <table className="dash-table">
              <thead>
                <tr><th>Entreprise</th><th>Email</th><th>Plan</th><th>Durée</th><th>Date</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {recentSubs.length === 0
                  ? <tr><td colSpan={6} className="dash-table-empty">Aucune demande</td></tr>
                  : recentSubs.map(s => (
                    <tr key={s._id}>
                      <td><div className="dash-table-company"><div className="dash-table-avatar">{s.tenant?.companyName?.charAt(0)?.toUpperCase() || '?'}</div><span>{s.tenant?.companyName || '—'}</span></div></td>
                      <td className="dash-table-muted">{s.tenant?.adminEmail || '—'}</td>
                      <td><span className="dash-plan-chip">{s.plan?.name || '—'}</span></td>
                      <td className="dash-table-muted">{s.durationMonths ? `${s.durationMonths} mois` : '—'}</td>
                      <td className="dash-table-muted">{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td><StatusBadge status={s.status} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="dash-right-col">

          {/* Pie */}
          <div className="dash-card dash-card-pie">
            <div className="dash-card-header"><div><h3>Statuts abonnements</h3><p>Répartition globale</p></div></div>
            {subStatus.every(s => s.value === 0) ? <div className="dash-empty-chart">Aucune donnée</div> : (
              <div className="dash-pie-row">
                <ResponsiveContainer width={90} height={85}>
                  <PieChart>
                    <Pie data={subStatus} cx="50%" cy="50%" innerRadius={26} outerRadius={40} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {subStatus.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dash-pie-legend">
                  {subStatus.map((s, i) => (
                    <div key={i} className="dash-pie-legend-item">
                      <span className="dash-pie-dot" style={{ background: s.color }} />
                      <span className="dash-pie-legend-label">{s.name}</span>
                      <span className="dash-pie-legend-val">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Plan dist */}
          <div className="dash-card dash-card-plan">
            <div className="dash-card-header"><div><h3>Distribution par plan</h3><p>Abonnements par type</p></div></div>
            {planDist.length === 0 ? <div className="dash-empty-chart">Aucun</div> : <PlanDistBars planDist={planDist} />}
          </div>

          {/* Expiry */}
          {expiringSoon.length > 0 && (
            <div className="dash-expiry-panel">
              <div className="dash-expiry-title">
                <i className="ri-alarm-warning-line"></i> Expirent bientôt
                {urgentSoon.length > 0 && <span className="dash-expiry-urgent-badge">{urgentSoon.length} urgent{urgentSoon.length > 1 ? 's' : ''}</span>}
              </div>
              <div className="dash-expiry-list">
                {expiringSoon.slice(0, 3).map(s => {
                  const days = Math.ceil((new Date(s.endDate) - now) / 86400000);
                  const urg = days <= 7;
                  return (
                    <div key={s._id} className={`dash-expiry-row${urg ? ' urgent' : ''}`}>
                      <span className="dash-expiry-name">{s.tenant?.companyName || '—'}</span>
                      <span className={`dash-expiry-days${urg ? ' urgent' : ''}`}>J-{days}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick access */}
          <div className="dash-quick-panel">
            <div className="dash-quick-title">Accès rapides</div>
            <div className="dash-quick-list">
              {[
                { icon: 'ri-building-2-line',  label: 'Entreprises',   sub: 'Gérer les comptes',      to: '/dashboard/superadmin/tenants',       color: '#2563eb', bg: '#dbeafe' },
                { icon: 'ri-price-tag-3-line', label: 'Créer un plan', sub: 'Nouveau plan tarifaire', to: '/dashboard/superadmin/plans/create',  color: '#10b981', bg: '#d1fae5' },
                { icon: 'ri-file-list-3-line', label: 'Abonnements',   sub: 'Gérer les demandes',     to: '/dashboard/superadmin/subscriptions', color: '#f59e0b', bg: '#fef3c7' },
              ].map(a => (
                <Link key={a.to} to={a.to} className="dash-quick-row">
                  <div className="dash-quick-icon" style={{ background: a.bg, color: a.color }}><i className={a.icon}></i></div>
                  <div className="dash-quick-info">
                    <span className="dash-quick-label">{a.label}</span>
                    <span className="dash-quick-sub">{a.sub}</span>
                  </div>
                  <i className="ri-arrow-right-s-line dash-quick-arrow"></i>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;