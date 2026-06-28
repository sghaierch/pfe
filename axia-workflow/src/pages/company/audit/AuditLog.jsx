import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

const B = '#2563EB';
const font = "'Inter',-apple-system,sans-serif";

// ✅ FIX 1 : toutes les actions possibles sont couvertes
const ACTION_CFG = {
  workflow_started:          { label:'Workflow démarré',    color:B,        bg:'#EFF6FF', dot:'#3B82F6' },
  step_completed:            { label:'Étape validée',       color:'#16A34A', bg:'#F0FDF4', dot:'#22C55E' },
  step_rejected:             { label:'Étape rejetée',       color:'#DC2626', bg:'#FEF2F2', dot:'#EF4444' },
  workflow_completed:        { label:'Workflow terminé',    color:'#16A34A', bg:'#F0FDF4', dot:'#22C55E' },
  step_skipped_by_condition: { label:'Étape ignorée',       color:'#D97706', bg:'#FFFBEB', dot:'#FBBF24' },
  workflow_deactivated:      { label:'Workflow désactivé',  color:'#7C3AED', bg:'#F5F3FF', dot:'#8B5CF6' },
  workflow_archived:         { label:'Workflow archivé',    color:'#64748B', bg:'#F8FAFC', dot:'#94A3B8' },
  step_skipped:              { label:'Étape ignorée',       color:'#D97706', bg:'#FFFBEB', dot:'#FBBF24' },
};

const IArrowL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IFilter  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const ISearch  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ILoader  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IRefresh = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IClock   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IUser    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IDoc     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IEmpty   = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const IArrowR  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

const AuditLog = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  // ✅ FIX 2 : stats viennent du backend (total réel), pas filtrées côté client
  const [stats,   setStats]   = useState({ validated:0, rejected:0, started:0 });
  const [filters, setFilters] = useState({ action:'', user:'', from:'', to:'' });
  const [applied, setApplied] = useState({});

  const fetchAudit = useCallback(async (f = {}) => {
    setLoading(true);
    try {
      const res = await workflowService.getAuditLog(f);
      const data = res.data;
      setEntries(data?.entries || []);
      setTotal(data?.total || 0);
      // ✅ utilise les stats du backend si disponibles, sinon calcule sur les entrées reçues
      if (data?.stats) {
        setStats(data.stats);
      } else {
        const all = data?.entries || [];
        setStats({
          validated: all.filter(e => e.action === 'step_completed').length,
          rejected:  all.filter(e => e.action === 'step_rejected').length,
          started:   all.filter(e => e.action === 'workflow_started').length,
        });
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  const handleApply = () => { setApplied(filters); fetchAudit(filters); };
  const handleReset = () => {
    const empty = { action:'', user:'', from:'', to:'' };
    setFilters(empty); setApplied(empty); fetchAudit(empty);
  };

  const inpStyle = { width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'13px', color:'#0F172A', outline:'none', fontFamily:font, background:'#fff', transition:'border-color .15s' };
  const onFocus = e => { e.target.style.borderColor = B; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; };
  const onBlur  = e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; };

  const actionKeys = Object.keys(ACTION_CFG);
  const hasFilters = Object.values(applied).some(v => v);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .al-row:hover { background: #F8FAFC !important; }
        input:focus, select:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1200px', margin:'0 auto', fontFamily:font }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:'16px', marginBottom:'28px' }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:font, flexShrink:0 }}>
            <IArrowL/> Retour
          </button>
          <div style={{ flex:1 }}>
            <h1 style={{ margin:'0 0 4px', fontSize:'22px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px' }}>
              Journal d'audit
            </h1>
            <p style={{ margin:0, fontSize:'13px', color:'#64748B' }}>
              Traçabilité complète de toutes les actions — <strong style={{color:'#0F172A'}}>{total}</strong> entrée(s) au total
              {hasFilters && <span style={{ marginLeft:'8px', display:'inline-flex', alignItems:'center', gap:'4px', background:'#EFF6FF', color:B, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:'1px solid #BFDBFE' }}>Filtre actif</span>}
            </p>
          </div>
          <button onClick={() => fetchAudit(applied)}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:font, flexShrink:0 }}>
            <IRefresh/> Actualiser
          </button>
        </div>

        {/* ── Stats cards ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total entrées',    value:total,           color:B,         bg:'#EFF6FF', border:'#BFDBFE' },
            { label:'Étapes validées',  value:stats.validated, color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0' },
            { label:'Étapes rejetées',  value:stats.rejected,  color:'#DC2626', bg:'#FEF2F2', border:'#FECACA' },
            { label:'Workflows lancés', value:stats.started,   color:'#D97706', bg:'#FFFBEB', border:'#FDE68A' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:'14px', border:`1.5px solid ${s.border}`, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:'26px', fontWeight:900, color:s.color, lineHeight:1, marginBottom:'4px' }}>{s.value}</div>
              <div style={{ fontSize:'12px', color:'#64748B', fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', padding:'20px', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
            <IFilter/>
            <h3 style={{ margin:0, fontSize:'13px', fontWeight:800, color:'#0F172A', textTransform:'uppercase', letterSpacing:'0.06em' }}>Filtres</h3>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'12px', marginBottom:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#64748B', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Action</label>
              <select value={filters.action} onChange={e=>setFilters(p=>({...p,action:e.target.value}))} style={{...inpStyle,cursor:'pointer'}} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Toutes les actions</option>
                {actionKeys.map(k=><option key={k} value={k}>{ACTION_CFG[k].label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#64748B', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Utilisateur</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}><ISearch/></span>
                <input value={filters.user} onChange={e=>setFilters(p=>({...p,user:e.target.value}))} placeholder="Rechercher..." style={{...inpStyle,paddingLeft:'30px'}} onFocus={onFocus} onBlur={onBlur}/>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#64748B', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Du</label>
              <input type="date" value={filters.from} onChange={e=>setFilters(p=>({...p,from:e.target.value}))} style={inpStyle} onFocus={onFocus} onBlur={onBlur}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#64748B', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.06em' }}>Au</label>
              <input type="date" value={filters.to} onChange={e=>setFilters(p=>({...p,to:e.target.value}))} style={inpStyle} onFocus={onFocus} onBlur={onBlur}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={handleApply}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 20px', borderRadius:'9px', background:B, color:'#fff', border:'none', fontWeight:700, fontSize:'13px', cursor:'pointer', fontFamily:font, boxShadow:`0 3px 10px ${B}40` }}>
              <IFilter/> Appliquer
            </button>
            {hasFilters && (
              <button onClick={handleReset}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 20px', borderRadius:'9px', background:'#F1F5F9', color:'#475569', border:'1.5px solid #E2E8F0', fontWeight:600, fontSize:'13px', cursor:'pointer', fontFamily:font }}>
                <IRefresh/> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ background:'#fff', borderRadius:'14px', border:'1.5px solid #E2E8F0', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'170px 1fr 160px 160px 1fr', background:'#F8FAFC', borderBottom:'1.5px solid #E2E8F0' }}>
            {[
              { label:'Date & heure',     icon:<IClock/> },
              { label:'Workflow / Étape', icon:<IDoc/> },
              { label:'Action',           icon:null },
              { label:'Utilisateur',      icon:<IUser/> },
              { label:'Commentaire',      icon:null },
            ].map((h,i) => (
              <div key={i} style={{ padding:'12px 16px', fontSize:'11px', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:'5px' }}>
                {h.icon&&<span style={{color:'#94A3B8'}}>{h.icon}</span>}{h.label}
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:'64px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', color:'#64748B', fontSize:'15px' }}>
              <ILoader/> Chargement…
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding:'64px 40px', textAlign:'center' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'16px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}><IEmpty/></div>
              <p style={{ margin:'0 0 4px', fontWeight:700, fontSize:'14px', color:'#0F172A' }}>Aucune entrée d'audit</p>
              <p style={{ margin:0, color:'#94A3B8', fontSize:'13px' }}>{hasFilters?'Aucun résultat pour ces filtres.':'Le journal est vide pour le moment.'}</p>
            </div>
          ) : (
            entries.map((entry, i) => {
              // ✅ FIX 1 : fallback propre pour toute action inconnue
              const cfg = ACTION_CFG[entry.action] || {
                label:  entry.action?.replace(/_/g, ' ') || '—',
                color: '#64748B', bg:'#F8FAFC', dot:'#94A3B8'
              };
              return (
                <div key={i} className="al-row"
                  style={{ display:'grid', gridTemplateColumns:'170px 1fr 160px 160px 1fr', borderBottom:i<entries.length-1?'1px solid #F1F5F9':'none', background:i%2===0?'#fff':'#FAFAFA', transition:'background .12s' }}>

                  {/* Date */}
                  <div style={{ padding:'14px 16px', display:'flex', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:'12px', color:'#0F172A', fontWeight:600, display:'flex', alignItems:'center', gap:'4px' }}>
                        <IClock/>{new Date(entry.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'})}
                      </div>
                      <div style={{ fontSize:'11px', color:'#94A3B8', marginTop:'2px' }}>
                        {new Date(entry.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                      </div>
                    </div>
                  </div>

                  {/* Workflow / Step */}
                  <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <span onClick={()=>navigate('/dashboard/company/workflows/'+entry.workflowId)}
                      style={{ fontSize:'13px', fontWeight:700, color:B, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'4px' }}
                      onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
                      onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
                      <IDoc/>{entry.workflowName} <IArrowR/>
                    </span>
                    {entry.stepName && <span style={{ fontSize:'11px', color:'#94A3B8', marginTop:'3px' }}>Étape : {entry.stepName}</span>}
                  </div>

                  {/* Action badge */}
                  <div style={{ padding:'14px 16px', display:'flex', alignItems:'center' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:cfg.bg, color:cfg.color, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${cfg.dot}25`, whiteSpace:'nowrap' }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:cfg.dot, flexShrink:0 }}/>
                      {cfg.label}
                    </span>
                  </div>

                  {/* User */}
                  <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:'6px' }}>
                    {entry.byName ? (
                      <>
                        <div style={{ width:'26px', height:'26px', borderRadius:'7px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', color:B, flexShrink:0, fontSize:'10px', fontWeight:800 }}>
                          {entry.byName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize:'13px', color:'#0F172A', fontWeight:600 }}>{entry.byName}</span>
                      </>
                    ) : <span style={{ color:'#94A3B8', fontSize:'12px' }}>—</span>}
                  </div>

                  {/* Comment */}
                  <div style={{ padding:'14px 16px', display:'flex', alignItems:'center' }}>
                    {entry.comment
                      ? <div style={{ background:'#F8FAFC', borderRadius:'7px', padding:'5px 10px', border:'1px solid #E2E8F0', fontSize:'12px', color:'#64748B', fontStyle:'italic', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          "{entry.comment}"
                        </div>
                      : <span style={{ color:'#94A3B8', fontSize:'12px' }}>—</span>
                    }
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div style={{ marginTop:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ margin:0, fontSize:'12px', color:'#94A3B8' }}>
              <strong style={{color:'#0F172A'}}>{entries.length}</strong> entrée(s) affichée(s) sur <strong style={{color:'#0F172A'}}>{total}</strong> au total
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AuditLog;