import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import userService         from '../../../services/userService';
import roleService         from '../../../services/roleService';
import permissionService   from '../../../services/permissionService';
import subscriptionService from '../../../services/subscriptionService';
import planService         from '../../../services/planService';
import tenantService       from '../../../services/tenantService';
import { useAuth }         from '../../../contexts/AuthContext';
import '../../../styles/Dashboard.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n ?? '—';

const trend = (val) => ({
  up:   { icon: '↑', color: '#10b981' },
  flat: { icon: '→', color: '#94a3b8' },
  down: { icon: '↓', color: '#ef4444' },
}[val] || { icon: '→', color: '#94a3b8' });

// ── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, to, sub, trendDir, trendLabel }) => {
  const t = trend(trendDir);
  return (
    <Link to={to} className="dash-stat-card" style={{ '--accent': color }}>
      <div className="dash-stat-top">
        <div className="dash-stat-icon" style={{ background: color + '18', color }}>
          {icon}
        </div>
        <span className="dash-stat-trend" style={{ color: t.color }}>
          {t.icon} {trendLabel}
        </span>
      </div>
      <div className="dash-stat-value">{fmt(value)}</div>
      <div className="dash-stat-label">{label}</div>
      {sub && <div className="dash-stat-sub">{sub}</div>}
    </Link>
  );
};

// ── Badge statut ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const MAP = {
    pending:   { bg: '#fef3c7', color: '#92400e', label: 'En attente' },
    approved:  { bg: '#dcfce7', color: '#166534', label: 'Approuvé'  },
    active:    { bg: '#dcfce7', color: '#166534', label: 'Actif'      },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Refusé'    },
    expired:   { bg: '#f1f5f9', color: '#64748b', label: 'Expiré'    },
    suspended: { bg: '#fef3c7', color: '#92400e', label: 'Suspendu'  },
  };
  const s = MAP[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.75rem', fontWeight: 600
    }}>
      {s.label}
    </span>
  );
};

// ── Couleurs graphiques ───────────────────────────────────────────────────────
const COLORS = ['#4f46e5', '#0891b2', '#7c3aed', '#d97706', '#10b981', '#ef4444'];

// ── Calcul données mensuelles réelles depuis les abonnements ─────────────────
const buildMonthlyData = (subs) => {
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  return MONTHS.slice(0, currentMonth + 1).map((label, i) => {
    const subsThisMonth = subs.filter(s => {
      const d = new Date(s.createdAt);
      return d.getMonth() === i && d.getFullYear() === currentYear;
    });
    const revenue = subsThisMonth
      .filter(s => s.status === 'active' || s.status === 'approved')
      .reduce((acc, s) => acc + (s.plan?.price || 0), 0);
    return {
      month:         label,
      subscriptions: subsThisMonth.length,
      revenue,
    };
  });
};

// ── Dashboard principal ───────────────────────────────────────────────────────
const Dashboard = () => {
  const { getFullName } = useAuth();
  const [stats, setStats] = useState({
    users: null,
    roles: null,
    permissions: null,
    pendingSubs: null,
    totalSubs: null,
    plans: null,
    revenue: null,
    tenants: null,
    activeTenants: null
  });
  const [recentSubs, setRecentSubs] = useState([]);
  const [planDist, setPlanDist] = useState([]);
  const [subStatus, setSubStatus] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
       // ✅ Après — chaque appel est indépendant
const [u, r, p, s, pl, t] = await Promise.allSettled([
  userService.getAllGlobal(),
  roleService.getAll(),
  permissionService.getAll(),
  subscriptionService.getAllSubscriptions(),
  planService.getAll(),
  tenantService.getAllTenants(),
]);


console.log('users response:', u);
console.log('subs response:', s);
console.log('tenants response:', t);
console.log('plans response:', pl);
       const users   = u.status   === 'fulfilled' ? (u.value.data?.users        || []) : [];
const roles   = r.status   === 'fulfilled' ? (r.value.data?.roles        || []) : [];
const perms   = p.status   === 'fulfilled' ? (p.value.data?.permissions  || []) : [];
const subs    = s.status   === 'fulfilled' ? (s.value.data?.data || s.value.data?.subscriptions || []) : [];
const plans   = pl.status  === 'fulfilled' ? (pl.value.data?.data || pl.value.data?.plans       || []) : [];
const tenants = t.status   === 'fulfilled' ? (t.value.data?.data || t.value.data             || []) : [];

        const pending       = subs.filter(x => x.status === 'pending').length;
        const approved      = subs.filter(x => x.status === 'active' || x.status === 'approved').length;
        const rejected      = subs.filter(x => x.status === 'rejected').length;
        const activeTenants = tenants.filter(x => x.status === 'active').length;

        // Revenus réels — plan.price déjà populé via populate('plan')
        const revenue = subs
          .filter(x => x.status === 'active' || x.status === 'approved')
          .reduce((acc, sub) => acc + (sub.plan?.price || 0), 0);

        setStats({
          users:       users.length,
          roles:       roles.length,
          permissions: perms.length,
          pendingSubs: pending,
          totalSubs:   subs.length,
          plans:       plans.filter(pl => pl.isActive).length,
          revenue,
          tenants:     tenants.length,
          activeTenants
        });

        setRecentSubs(subs.slice(0, 6));

        // Données mensuelles réelles
        setMonthlyData(buildMonthlyData(subs));

        // Distribution par plan
        const planCount = {};
        subs.forEach(sub => {
          const name = sub.plan?.name || sub.planName || 'Inconnu';
          planCount[name] = (planCount[name] || 0) + 1;
        });
        setPlanDist(Object.entries(planCount).map(([name, value]) => ({ name, value })));

        // Statut des abonnements
        setSubStatus([
          { name: 'Actifs',     value: approved, color: '#10b981' },
          { name: 'En attente', value: pending,  color: '#d97706' },
          { name: 'Refusés',    value: rejected, color: '#ef4444' },
        ]);

      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) return (
    <div className="sa-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="dash-loader">
        <div className="dash-spinner" />
        <p>Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  return (
    <div className="sa-page dash-page">

      {/* ── Header ── */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-welcome-title">
            {greeting}, {getFullName()} 👋
          </h1>
          <p className="dash-welcome-sub">
            {now.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            {stats.pendingSubs > 0 && (
              <span className="dash-alert-pill">
                🔔 {stats.pendingSubs} demande{stats.pendingSubs > 1 ? 's' : ''} en attente
              </span>
            )}
          </p>
        </div>
        <Link to="/dashboard/superadmin/subscriptions" className="sa-btn-primary">
          Voir les demandes →
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpi-grid">
        <StatCard
          icon="🏢"
          label="Entreprises"
          value={stats.activeTenants}
          color="#4f46e5"
          to="/dashboard/superadmin/tenants"
          sub={`${stats.tenants} total`}
          trendDir="up"
          trendLabel="+5%"
        />
        <StatCard
          icon="💎"
          label="Plans actifs"
          value={stats.plans}
          color="#0891b2"
          to="/dashboard/superadmin/plans"
          sub="Plans disponibles"
          trendDir="flat"
          trendLabel="stable"
        />
        <StatCard
          icon="📋"
          label="Abonnements"
          value={stats.totalSubs}
          color="#7c3aed"
          to="/dashboard/superadmin/subscriptions"
          sub={`${stats.pendingSubs} en attente`}
          trendDir="up"
          trendLabel="+8%"
        />
        <StatCard
          icon="💰"
          label="Revenus MRR"
          value={`${stats.revenue}dt`}
          color="#10b981"
          to="/dashboard/superadmin/subscriptions"
          sub="Revenus mensuels récurrents"
          trendDir="up"
          trendLabel="+23%"
        />
        <StatCard
          icon="👥"
          label="Utilisateurs"
          value={stats.users}
          color="#d97706"
          to="/dashboard/superadmin/users"
          sub="Total inscrits"
          trendDir="up"
          trendLabel="+12%"
        />
        <StatCard
          icon="🛡️"
          label="Rôles"
          value={stats.roles}
          color="#ef4444"
          to="/dashboard/superadmin/roles"
          sub="Rôles configurés"
          trendDir="flat"
          trendLabel="stable"
        />
      </div>

      {/* ── Graphiques ligne 1 ── */}
      <div className="dash-charts-row">

        {/* Évolution abonnements */}
        <div className="dash-chart-card dash-chart-wide">
          <div className="dash-chart-header">
            <div>
              <h3>Évolution mensuelle</h3>
              <p>Abonnements sur l'année</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '12px' }} />
              <Area type="monotone" dataKey="subscriptions" name="Abonnements" stroke="#10b981" fill="url(#gradSubs)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition abonnements */}
        <div className="dash-chart-card dash-chart-narrow">
          <div className="dash-chart-header">
            <div>
              <h3>Statuts abonnements</h3>
              <p>Répartition globale</p>
            </div>
          </div>
          {subStatus.every(s => s.value === 0) ? (
            <div className="dash-chart-empty">Aucune donnée</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={subStatus} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value"
                  >
                    {subStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '0.82rem' }}
                  />
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
            </>
          )}
        </div>
      </div>

      {/* ── Graphiques ligne 2 ── */}
      <div className="dash-charts-row">

        {/* Revenus mensuels */}
        <div className="dash-chart-card dash-chart-medium">
          <div className="dash-chart-header">
            <div>
              <h3>Revenus mensuels (dt)</h3>
              <p>Basé sur les abonnements actifs</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}
                formatter={(v) => [`${v}dt`, 'Revenus']}
              />
              <Bar dataKey="revenue" name="Revenus" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                {monthlyData.map((_, i) => (
                  <Cell key={i} fill={i === monthlyData.length - 1 ? '#7c3aed' : '#4f46e5'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution par plan */}
        <div className="dash-chart-card dash-chart-medium">
          <div className="dash-chart-header">
            <div>
              <h3>Distribution par plan</h3>
              <p>Abonnements par type de plan</p>
            </div>
          </div>
          {planDist.length === 0 ? (
            <div className="dash-chart-empty">Aucun abonnement</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={planDist} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '0.82rem' }}
                />
                <Bar dataKey="value" name="Abonnements" radius={[0, 6, 6, 0]}>
                  {planDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Tableau abonnements récents ── */}
      <div className="dash-chart-card" style={{ marginTop: 0 }}>
        <div className="dash-chart-header">
          <div>
            <h3>Demandes d'abonnement récentes</h3>
            <p>Les 6 dernières demandes reçues</p>
          </div>
          <Link to="/dashboard/superadmin/subscriptions" className="sa-link">
            Voir tout →
          </Link>
        </div>
        <table className="sa-table">
          <thead>
            <tr>
              <th>Entreprise</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Employés</th>
              <th>Date</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {recentSubs.length === 0 ? (
              <tr>
                <td colSpan={6} className="sa-empty">Aucune demande pour le moment</td>
              </tr>
            ) : recentSubs.map(s => (
              <tr key={s._id}>
                <td>
                  <div className="sa-user-cell">
                    <div className="sa-avatar" style={{ background: '#4f46e5' }}>
                      {(s.tenant?.companyName || s.companyName)?.charAt(0)?.toUpperCase()}
                    </div>
                    <strong>{s.tenant?.companyName || s.companyName || '—'}</strong>
                  </div>
                </td>
                <td style={{ color: '#64748b' }}>{s.tenant?.contactEmail || s.tenant?.adminEmail || s.email || '—'}</td>
                <td>
                  <span className="sa-plan-tag">{s.plan?.name || s.planName || '—'}</span>
                </td>
                <td style={{ color: '#64748b' }}>{s.tenant?.employeesCount || s.employees || '—'}</td>
                <td style={{ color: '#64748b' }}>
                  {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Accès rapides ── */}
      <div className="dash-quick-actions">
        <h3 className="dash-section-title">Accès rapides</h3>
        <div className="dash-quick-grid">
          {[
            { icon:'🏢', label:'Voir les entreprises',    to:'/dashboard/superadmin/tenants',         color:'#4f46e5' },
            { icon:'💎', label:'Créer un plan',           to:'/dashboard/superadmin/plans/create',    color:'#10b981' },
            { icon:'📋', label:'Gérer abonnements',       to:'/dashboard/superadmin/subscriptions',   color:'#d97706' },
            { icon:'👤', label:'Créer un utilisateur',    to:'/dashboard/superadmin/users/create',    color:'#0891b2' },
            { icon:'🛡️', label:'Créer un rôle',          to:'/dashboard/superadmin/roles/create',    color:'#7c3aed' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="dash-quick-item">
              <div className="dash-quick-icon" style={{ background: a.color + '15', color: a.color }}>
                {a.icon}
              </div>
              <span>{a.label}</span>
              <span className="dash-quick-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;