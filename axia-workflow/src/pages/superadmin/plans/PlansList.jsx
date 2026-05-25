import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import planService from '../../../services/planService';

const PlansList = () => {
  const [plans,       setPlans]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.msg) {
      setMsg(location.state.msg);
      setTimeout(() => setMsg(''), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await planService.getAll();
      setPlans(res.data?.plans || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleToggle = async (plan) => {
    try {
      await planService.toggle(plan._id);
      showMsg(`✅ Plan ${plan.isActive ? 'désactivé' : 'activé'}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    try {
      await planService.delete(deleteModal._id);
      showMsg('✅ Plan supprimé');
      setDeleteModal(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="sa-page">
      <div className="sa-page-header">
        <div>
          <h1>Plans & Tarification</h1>
          <p>{plans.length} plan(s) — {plans.filter(p => p.isActive).length} actif(s)</p>
        </div>
        <Link to="/dashboard/superadmin/plans/create" className="sa-btn-primary">
          + Nouveau plan
        </Link>
      </div>

      {msg && <div className="sa-msg-success">{msg}</div>}

      {loading ? <div className="sa-loading">Chargement...</div> : (
        <>
          {plans.length === 0 ? (
            <div className="sa-empty-state">
              <div className="sa-empty-icon">💎</div>
              <h3>Aucun plan créé</h3>
              <p>Créez votre premier plan pour commencer</p>
              <Link to="/dashboard/superadmin/plans/create" className="sa-btn-primary">
                + Créer un plan
              </Link>
            </div>
          ) : (
            <div className="sa-cards-grid">
              {plans.map(plan => (
                <div
                  key={plan._id}
                  className={`sa-plan-card ${!plan.isActive ? 'inactive' : ''}`}
                  style={{ borderTopColor: plan.color }}
                >
                  <div className="sa-plan-card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 className="sa-plan-card-name">{plan.name}</h3>
                        {plan.isPopular && (
                          <span className="sa-popular-badge">⭐ Populaire</span>
                        )}
                      </div>
                      <p className="sa-plan-card-desc">{plan.description || '—'}</p>
                    </div>
                    <div className="sa-plan-price-box">
                      <span className="sa-plan-price">{plan.price}dt</span>
                      <span className="sa-plan-cycle">
                        /{plan.billingCycle === 'monthly' ? 'mois' : 'an'}
                      </span>
                    </div>
                  </div>

                  <div className="sa-plan-limits">
                    <span>👥 {plan.maxUsers} utilisateurs</span>
                    <span>🔄 {plan.maxWorkflows} workflows</span>
                  </div>

                  <div className="sa-plan-features">
                    {plan.features?.slice(0, 3).map((f, i) => (
                      <div key={i} className="sa-plan-feature">✓ {f}</div>
                    ))}
                    {plan.features?.length > 3 && (
                      <div className="sa-plan-feature-more">
                        +{plan.features.length - 3} autres
                      </div>
                    )}
                  </div>

                  <div className="sa-plan-card-footer">
                    <button
                      className={`sa-status-badge ${plan.isActive ? 'active' : 'inactive'}`}
                      onClick={() => handleToggle(plan)}
                    >
                      {plan.isActive ? '✓ Actif' : '✗ Inactif'}
                    </button>
                    <div className="sa-actions">
                      <Link
                        to={`/dashboard/superadmin/plans/edit/${plan._id}`}
                        className="sa-btn-edit"
                      >
                        ✏️ Modifier
                      </Link>
                      <button
                        className="sa-btn-delete"
                        onClick={() => setDeleteModal(plan)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {deleteModal && (
        <div
          className="sa-modal-overlay"
          onClick={e => e.target === e.currentTarget && setDeleteModal(null)}
        >
          <div className="sa-modal sa-modal-sm">
            <div className="sa-modal-header">
              <h3>Supprimer le plan</h3>
              <button className="sa-modal-close" onClick={() => setDeleteModal(null)}>✕</button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Supprimer <strong>{deleteModal.name}</strong> ?
              Les abonnements existants ne seront pas affectés.
            </p>
            <div className="sa-modal-footer">
              <button className="sa-btn-secondary" onClick={() => setDeleteModal(null)}>
                Annuler
              </button>
              <button className="sa-btn-danger" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansList;