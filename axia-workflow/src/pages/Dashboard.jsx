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

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n == null ? '—' : n);

const StatusBadge = ({ status }) => {
  const MAP = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'En attente' },
    active:    { bg: '#dcfce7', color: '#166534', label: 'Actif'      },
    approved:  { bg: '#dcfce7', color: '#166534', label: 'Approuvé'   },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Refusé'     },
    expired:   { bg: '#f1f5f9', color: '#64748b', label: 'Expiré'     },
    suspended: { bg: '#fef3c7', color: '#92400e', label: 'Suspendu'   },
    cancelled: { bg: '#f1f5f9', color: '#64748b', label: 'Annulé'     },
  };
  const s = MAP[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const TenantIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const SubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
  </svg>
);
const RevenueIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const PlanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

// ── KPI Card compacte ─────────────────────────────────────────────────────────
const KpiCard = ({ icon, label, value, sub, color, to, alert }) => (
  <Link to={to} className={`dash-kpi-card ${alert ? 'alert' : ''}`} style={{ '--kpi-color': color }}>
    <div className="dash-kpi-top">
      <div className="dash-kpi-icon" style={{ background: color + '15', color }}>{icon}</div>
      {alert && <span className="dash-kpi-alert"><AlertIcon /> Urgent</span>}
    </div>
    <div className="dash-kpi-value">{fmt(value)}</div>
    <div className="dash-kpi-label">{label}</div>
    {sub && <div className="dash-kpi-sub">{sub}</div>}
  </Link>
);

// ── Monthly builder ───────────────────────────────────────────────────────────
const buildMonthlyData = (subs) => {
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const now = new Date();
  return MONTHS.slice(0, now.getMonth() + 1).map((label, i) => {
    const thisMonth = subs.filter(s => {
      const d = new Date(s.createdAt);
      return d.getMonth() === i && d.getFullYear() === now.getFullYear();
    });
    const revenue = thisMonth
      .filter(s => s.status === 'active' || s.status === 'approved')
      .reduce((acc, s) => acc + (s.plan?.price || 0), 0);
    return { month: label, abonnements: thisMonth.length, revenue };
  });
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { getFullName } = useAuth();
  const [data,         setData]         = useState(null);
  const [recentSubs,   setRecentSubs]   = useState([]);
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [planDist,     setPlanDist]     = useState([]);
  const [subStatus,    setSubStatus]    = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [loading,      setLoading]      = useState(true);
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
        const subs    = subsRes.status    === 'fulfilled' ? (subsRes.value.data?.data || subsRes.value.data?.subscriptions || []) : [];
        const plans   = plansRes.status   === 'fulfilled' ? (plansRes.value.data?.data || plansRes.value.data?.plans || []) : [];
        const tenants = tenantsRes.status === 'fulfilled' ? (tenantsRes.value.data?.data || tenantsRes.value.data || []) : [];

        const pending       = subs.filter(s => s.status === 'pending').length;
        const activeCount   = subs.filter(s => s.status === 'active' || s.status === 'approved').length;
        const rejectedCount = subs.filter(s => s.status === 'rejected').length;
        const revenue       = subs.filter(s => s.status === 'active' || s.status === 'approved').reduce((acc, s) => acc + (s.plan?.price || 0), 0);
        const activeTenants    = tenants.filter(t => t.status === 'active').length;
        const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
        const pendingTenants   = tenants.filter(t => t.status === 'pending').length;
        const expiredTenants   = tenants.filter(t => t.status === 'expired').length;

        const in30days = new Date(Date.now() + 30 * 24 * 3600 * 1000);
        const soon = subs
          .filter(s => (s.status === 'active' || s.status === 'approved') && s.endDate && new Date(s.endDate) <= in30days && new Date(s.endDate) > now)
          .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        setExpiringSoon(soon);

        setData({ pendingSubs: pending, totalSubs: subs.length, activeSubs: activeCount, rejectedSubs: rejectedCount, revenue, activePlans: plans.filter(p => p.isActive).length, totalPlans: plans.length, activeTenants, suspendedTenants, pendingTenants, expiredTenants, totalTenants: tenants.length });
        setRecentSubs(subs.slice(0, 5));
        setMonthlyData(buildMonthlyData(subs));

        const planCount = {};
        subs.forEach(s => { const name = s.plan?.name || 'Inconnu'; planCount[name] = (planCount[name] || 0) + 1; });
        setPlanDist(Object.entries(planCount).map(([name, value]) => ({ name, value })));
        setSubStatus([
          { name: 'Actifs',     value: activeCount,   color: '#10b981' },
          { name: 'En attente', value: pending,        color: '#f59e0b' },
          { name: 'Refusés',    value: rejectedCount,  color: '#ef4444' },
        ]);
      } catch (err) {
        console.error('❌ Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const COLORS   = ['#4f46e5', '#0891b2', '#7c3aed', '#d97706', '#10b981', '#ef4444'];

  if (loading) return (
    <div className="dash-loading-screen">
      <div className="dash-spinner" />
      <span>Chargement...</span>
    </div>
  );

  const urgentCount = expiringSoon.filter(s => Math.ceil((new Date(s.endDate) - now) / 86400000) <= 7).length;

  return (
    <div className="dash-layout">

      {/* ══ LIGNE 1 — Topbar contextuelle ══ */}
      <div className="dash-topbar">
        <div className="dash-topbar-left">
          <div className="dash-greeting">
            <span className="dash-greeting-text">{greeting}, <strong>{getFullName()}</strong></span>
            <span className="dash-date">
              {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          {/* Alertes inline compactes */}
          {data?.pendingSubs > 0 && (
            <Link to="/dashboard/superadmin/subscriptions" className="dash-alert-chip yellow">
              <AlertIcon />
              {data.pendingSubs} demande{data.pendingSubs > 1 ? 's' : ''} en attente
            </Link>
          )}
          {urgentCount > 0 && (
            <Link to="/dashboard/superadmin/subscriptions" className="dash-alert-chip red">
              <AlertIcon />
              {urgentCount} expir{urgentCount > 1 ? 'ent' : 'e'} dans &lt;7j
            </Link>
          )}
          {expiringSoon.length > 0 && urgentCount === 0 && (
            <Link to="/dashboard/superadmin/subscriptions" className="dash-alert-chip orange">
              <AlertIcon />
              {expiringSoon.length} expir{expiringSoon.length > 1 ? 'ent' : 'e'} bientôt
            </Link>
          )}
        </div>
        <Link to="/dashboard/superadmin/subscriptions" className="dash-topbar-cta">
          Gérer les demandes <ArrowIcon />
        </Link>
      </div>

      {/* ══ LIGNE 2 — KPI Cards ══ */}
      <div className="dash-kpi-row">
        <KpiCard icon={<TenantIcon />}  label="Entreprises actives"  value={data?.activeTenants}  sub={`${data?.pendingTenants} en attente · ${data?.suspendedTenants} suspendu(s)`} color="#4f46e5" to="/dashboard/superadmin/tenants"       alert={data?.pendingTenants > 0} />
        <KpiCard icon={<SubIcon />}     label="Abonnements actifs"   value={data?.activeSubs}     sub={`${data?.pendingSubs} demande(s) en attente`}                                color="#0891b2" to="/dashboard/superadmin/subscriptions"  alert={data?.pendingSubs > 0} />
        <KpiCard icon={<RevenueIcon />} label="Revenus MRR"          value={`${data?.revenue ?? 0} dt`} sub="Récurrents ce mois"                                                   color="#10b981" to="/dashboard/superadmin/subscriptions" />
        <KpiCard icon={<PlanIcon />}    label="Plans actifs"         value={data?.activePlans}    sub={`${data?.totalPlans} au total`}                                              color="#7c3aed" to="/dashboard/superadmin/plans" />
        {data?.expiredTenants > 0 && (
          <KpiCard icon={<AlertIcon />} label="Entreprises expirées" value={data.expiredTenants}  sub="Renouvellement requis" color="#dc2626" to="/dashboard/superadmin/tenants" alert />
        )}
      </div>

      {/* ══ LIGNE 3 — Graphiques + Tableau ══ */}
      <div className="dash-content-grid">

        {/* Colonne gauche — graphiques empilés */}
        <div className="dash-charts-col">

          {/* Évolution mensuelle */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <h3>Évolution mensuelle</h3>
                <p>Abonnements & revenus {new Date().getFullYear()}</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="abonnements" name="Abonnements" stroke="#4f46e5" fill="url(#gradSubs)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenus + Distribution — côte à côte */}
          <div className="dash-charts-duo">
            <div className="dash-card">
              <div className="dash-card-header">
                <div><h3>Revenus (dt)</h3><p>Par mois</p></div>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '0.8rem' }} formatter={(v) => [`${v} dt`, 'Revenus']} />
                  <Bar dataKey="revenue" name="Revenus" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => <Cell key={i} fill={i === monthlyData.length - 1 ? '#7c3aed' : '#4f46e5'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <div><h3>Statuts</h3><p>Répartition</p></div>
              </div>
              {subStatus.every(s => s.value === 0) ? (
                <div className="dash-empty-chart">Aucune donnée</div>
              ) : (
                <div className="dash-pie-row">
                  <ResponsiveContainer width="50%" height={110}>
                    <PieChart>
                      <Pie data={subStatus} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value">
                        {subStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '0.78rem' }} />
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
          </div>

        </div>

        {/* Colonne droite — tableau + accès rapides */}
        <div className="dash-right-col">

          {/* Tableau demandes récentes */}
          <div className="dash-card dash-card-table">
            <div className="dash-card-header">
              <div>
                <h3>Demandes récentes</h3>
                <p>5 dernières reçues</p>
              </div>
              <Link to="/dashboard/superadmin/subscriptions" className="dash-link-small">
                Tout voir <ArrowIcon />
              </Link>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Plan</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentSubs.length === 0 ? (
                  <tr><td colSpan={4} className="dash-table-empty">Aucune demande</td></tr>
                ) : recentSubs.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="dash-table-company">
                        <div className="dash-table-avatar">{(s.tenant?.companyName)?.charAt(0)?.toUpperCase() || '?'}</div>
                        <span>{s.tenant?.companyName || '—'}</span>
                      </div>
                    </td>
                    <td><span className="dash-plan-chip">{s.plan?.name || '—'}</span></td>
                    <td className="dash-table-muted">{new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Accès rapides */}
          <div className="dash-quick-panel">
            <p className="dash-quick-title">Accès rapides</p>
            <div className="dash-quick-list">
              {[
                { icon: <TenantIcon />,  label: 'Entreprises',   sub: `${data?.totalTenants ?? 0} enregistrées`,  to: '/dashboard/superadmin/tenants',       color: '#4f46e5' },
                { icon: <PlanIcon />,    label: 'Créer un plan', sub: `${data?.activePlans ?? 0} plans actifs`,    to: '/dashboard/superadmin/plans/create',  color: '#7c3aed' },
                { icon: <SubIcon />,     label: 'Abonnements',   sub: `${data?.totalSubs ?? 0} au total`,          to: '/dashboard/superadmin/subscriptions', color: '#0891b2' },
              ].map(a => (
                <Link key={a.to} to={a.to} className="dash-quick-row" style={{ '--q-color': a.color }}>
                  <div className="dash-quick-icon" style={{ background: a.color + '15', color: a.color }}>{a.icon}</div>
                  <div className="dash-quick-info">
                    <span className="dash-quick-label">{a.label}</span>
                    <span className="dash-quick-sub">{a.sub}</span>
                  </div>
                  <span className="dash-quick-arrow"><ArrowIcon /></span>
                </Link>
              ))}
            </div>
          </div>

          {/* Alertes expirations compactes (si pertinent) */}
          {expiringSoon.length > 0 && (
            <div className="dash-expiry-panel">
              <p className="dash-expiry-title">
                <AlertIcon /> Expirations proches
              </p>
              <div className="dash-expiry-list">
                {expiringSoon.slice(0, 3).map(s => {
                  const days = Math.ceil((new Date(s.endDate) - now) / 86400000);
                  const urgent = days <= 7;
                  return (
                    <div key={s._id} className={`dash-expiry-row ${urgent ? 'urgent' : ''}`}>
                      <span className="dash-expiry-name">{s.tenant?.companyName || '—'}</span>
                      <span className={`dash-expiry-days ${urgent ? 'urgent' : ''}`}>J-{days}</span>
                    </div>
                  );
                })}
                {expiringSoon.length > 3 && (
                  <Link to="/dashboard/superadmin/subscriptions" className="dash-expiry-more">
                    +{expiringSoon.length - 3} autres <ArrowIcon />
                  </Link>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
