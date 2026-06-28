import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const T = {
  blue:'#2563EB', blueSoft:'#EFF6FF', blueBorder:'#BFDBFE',
  green:'#16A34A', greenSoft:'#F0FDF4', greenBorder:'#BBF7D0',
  red:'#DC2626', redSoft:'#FEF2F2', redBorder:'#FECACA',
  purple:'#7C3AED', purpleSoft:'#F5F3FF', purpleBorder:'#DDD6FE',
  slate:'#0F172A', slateM:'#475569', slateL:'#94A3B8',
  bg:'#F1F5F9', surface:'#FFFFFF', border:'#E2E8F0',
};
const font = "'Inter',-apple-system,sans-serif";

const IArrowL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const ISearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IX       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IFile    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IArrowR  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ILoader  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IFlow    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="4" height="4" rx="1"/><rect x="10" y="3" width="4" height="4" rx="1"/><rect x="17" y="3" width="4" height="4" rx="1"/><path d="M5 7v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"/><rect x="8" y="17" width="8" height="4" rx="1"/><line x1="12" y1="13" x2="12" y2="17"/></svg>;
const IUsers   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ILock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

// Palette couleurs pour les préfixes
const PALETTE = ['#2563EB','#D97706','#7C3AED','#16A34A','#0891B2','#DB2777','#EA580C','#65A30D'];
const prefixColor = (prefix) => PALETTE[(prefix?.charCodeAt(0) || 0) % PALETTE.length];

const EmployeeRequestList = () => {
  const navigate = useNavigate();

  // ── Étape 1 : liste des types de documents accessibles ──────────────────
  const [docTypes,     setDocTypes]     = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error,        setError]        = useState('');
  const [search,       setSearch]       = useState('');

  // ── Étape 2 : workflows d'un type sélectionné ───────────────────────────
  const [selectedType,   setSelectedType]   = useState(null); // docType sélectionné
  const [workflows,      setWorkflows]      = useState([]);
  const [loadingWf,      setLoadingWf]      = useState(false);
  const [searchWf,       setSearchWf]       = useState('');

  // ── Chargement initial : types de documents accessibles ─────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // ✅ Essaie d'abord la route doc-types (groupée par type)
        const res  = await API.get('/workflows/templates/doc-types');
        const list = res.data?.data?.documentTypes || [];
        setDocTypes(list);
      } catch {
        // ✅ Fallback : charge les workflows actifs directement
        try {
          const res2 = await API.get('/workflows/templates/active');
          const wfs  = res2.data?.data?.workflows || [];
          // Dédupliquer par docType
          const seen = new Set();
          const fakeDocTypes = [];
          wfs.forEach(wf => {
            const dt = wf.docType;
            if (dt && !seen.has(String(dt._id || dt))) {
              seen.add(String(dt._id || dt));
              fakeDocTypes.push({
                ...(typeof dt === 'object' ? dt : { _id: dt, prefix: '', name: wf.name }),
                workflowCount: 1,
              });
            }
          });
          if (fakeDocTypes.length > 0) {
            setDocTypes(fakeDocTypes);
          } else {
            // Dernier fallback : afficher les workflows directement comme types
            setDocTypes(wfs.map(wf => ({
              _id: wf._id, name: wf.name,
              prefix: wf.docType?.prefix || '?',
              digits: 3, workflowCount: 1,
              description: wf.description,
            })));
          }
        } catch {
          setError('Impossible de charger les types de demandes.');
        }
      } finally { setLoadingTypes(false); }
    };
    load();
  }, []);

  // ── Quand l'employé sélectionne un type → charger les workflows de ce type ──
  const handleSelectType = async (docType) => {
    setSelectedType(docType);
    setWorkflows([]);
    setSearchWf('');
    setLoadingWf(true);
    try {
      const res = await API.get(`/workflows/templates/by-doctype/${docType._id}`);
      setWorkflows(res.data?.data?.workflows || []);
    } catch {
      setError('Impossible de charger les workflows.');
    } finally { setLoadingWf(false); }
  };

  // ── Filtres ──────────────────────────────────────────────────────────────
  const filteredTypes = docTypes.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.prefix?.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredWf = workflows.filter(wf =>
    wf.name?.toLowerCase().includes(searchWf.toLowerCase()) ||
    (wf.description || '').toLowerCase().includes(searchWf.toLowerCase())
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingTypes) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:T.bg, fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ marginBottom:'14px' }}><ILoader/></div>
        <p style={{ color:T.slateM, fontWeight:600, margin:0 }}>Chargement…</p>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .req-card:hover{transform:translateY(-2px)!important;box-shadow:0 6px 20px rgba(37,99,235,0.12)!important;border-color:#BFDBFE!important;}
        .wf-card:hover{transform:translateY(-1px)!important;box-shadow:0 4px 16px rgba(37,99,235,0.1)!important;border-color:#BFDBFE!important;}
      `}</style>
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:font }}>
        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px 24px 60px' }}>

          {/* ── Bouton retour ── */}
          <button
            onClick={() => selectedType ? setSelectedType(null) : navigate('/dashboard/employee')}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.surface, border:`1.5px solid ${T.border}`, padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:T.slateM, fontSize:'13px', marginBottom:'20px', fontFamily:font }}>
            <IArrowL/> {selectedType ? 'Changer de type' : 'Retour'}
          </button>

          {/* ── Fil d'Ariane ── */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'24px', flexWrap:'wrap' }}>
            <span
              onClick={() => setSelectedType(null)}
              style={{ fontSize:'13px', fontWeight: selectedType ? 600 : 800, color: selectedType ? T.blue : T.slate, cursor: selectedType ? 'pointer' : 'default', textDecoration: selectedType ? 'underline' : 'none' }}>
              Nouvelle demande
            </span>
            {selectedType && (
              <>
                <IArrowR/>
                <span style={{ fontSize:'13px', fontWeight:800, color:T.slate }}>
                  {selectedType.name}
                </span>
              </>
            )}
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', background:T.redSoft, color:T.red, fontWeight:600, border:`1.5px solid ${T.redBorder}`, fontSize:'14px' }}>
              <IAlert/> {error}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ÉTAPE 1 — Liste des types de documents
          ════════════════════════════════════════════════════════════════ */}
          {!selectedType && (
            <div style={{ animation:'fadeUp 0.25s ease' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'24px' }}>
                <div>
                  <h1 style={{ margin:'0 0 6px', fontSize:'26px', fontWeight:900, color:T.slate }}>Nouvelle demande</h1>
                  <p style={{ margin:0, color:T.slateM, fontSize:'14px' }}>Choisissez le type de document à soumettre</p>
                </div>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.blueSoft, color:T.blue, padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:700, border:`1.5px solid ${T.blueBorder}` }}>
                  <IFile/> {docTypes.length} type{docTypes.length > 1 ? 's' : ''} disponible{docTypes.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Search types */}
              <div style={{ background:T.surface, borderRadius:'14px', padding:'14px 18px', border:`1.5px solid ${T.border}`, marginBottom:'20px', boxShadow:'0 1px 4px rgba(15,23,42,0.04)' }}>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:T.slateL, pointerEvents:'none', display:'flex' }}><ISearch/></span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un type de document…"
                    style={{ width:'100%', boxSizing:'border-box', padding:'10px 36px 10px 38px', borderRadius:'10px', border:`1.5px solid ${T.border}`, fontSize:'14px', outline:'none', background:'#F8FAFC', fontFamily:font, color:T.slate }}
                    onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.background=T.surface;}}
                    onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.background='#F8FAFC';}}/>
                  {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.slateL, cursor:'pointer', display:'flex' }}><IX/></button>}
                </div>
              </div>

              {/* Cartes types de documents */}
              {filteredTypes.length === 0 ? (
                <div style={{ background:T.surface, borderRadius:'16px', padding:'60px 40px', textAlign:'center', border:`1.5px solid ${T.border}` }}>
                  <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:T.blue }}><IFile/></div>
                  <h3 style={{ color:T.slate, margin:'0 0 8px', fontFamily:font, fontWeight:800 }}>Aucun type disponible</h3>
                  <p style={{ color:T.slateM, margin:0, fontSize:'14px' }}>{search ? `Aucun résultat pour "${search}"` : 'Contactez votre administrateur.'}</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {filteredTypes.map((dt, i) => {
                    const color = prefixColor(dt.prefix);
                    return (
                      <div key={dt._id} className="req-card"
                        onClick={() => handleSelectType(dt)}
                        style={{ background:T.surface, borderRadius:'14px', border:`1.5px solid ${T.border}`, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', gap:'18px', boxShadow:'0 1px 4px rgba(15,23,42,0.04)', transition:'all .15s ease' }}>
                        {/* Icône préfixe colorée */}
                        <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:`${color}12`, border:`1.5px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'16px', color, letterSpacing:'1px' }}>{dt.prefix}</span>
                        </div>
                        {/* Contenu */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px', flexWrap:'wrap' }}>
                            <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:T.slate }}>{dt.name}</h3>
                            <span style={{ background:`${color}12`, color, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:800, fontFamily:'monospace', border:`1px solid ${color}30` }}>
                              {dt.prefix}
                            </span>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:T.blueSoft, color:T.blue, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${T.blueBorder}` }}>
                              <IFlow/> {dt.workflowCount} workflow{dt.workflowCount > 1 ? 's' : ''}
                            </span>
                          </div>
                          <p style={{ margin:0, fontSize:'13px', color:T.slateM, lineHeight:1.5 }}>{dt.description || 'Soumettre une demande de type ' + dt.name}</p>
                        </div>
                        {/* Flèche */}
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.blue, flexShrink:0 }}><IArrowR/></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              ÉTAPE 2 — Workflows de ce type accessibles à l'employé
          ════════════════════════════════════════════════════════════════ */}
          {selectedType && (
            <div style={{ animation:'fadeUp 0.25s ease' }}>
              {/* Header étape 2 */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'13px', background:`${prefixColor(selectedType.prefix)}12`, border:`1.5px solid ${prefixColor(selectedType.prefix)}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'16px', color:prefixColor(selectedType.prefix) }}>{selectedType.prefix}</span>
                  </div>
                  <div>
                    <h1 style={{ margin:'0 0 3px', fontSize:'22px', fontWeight:900, color:T.slate }}>{selectedType.name}</h1>
                    <p style={{ margin:0, color:T.slateM, fontSize:'13px' }}>Choisissez le circuit de validation</p>
                  </div>
                </div>
                {!loadingWf && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.blueSoft, color:T.blue, padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:700, border:`1.5px solid ${T.blueBorder}` }}>
                    <IFlow/> {workflows.length} workflow{workflows.length > 1 ? 's' : ''} disponible{workflows.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Search workflows */}
              {workflows.length > 2 && (
                <div style={{ background:T.surface, borderRadius:'14px', padding:'14px 18px', border:`1.5px solid ${T.border}`, marginBottom:'20px', boxShadow:'0 1px 4px rgba(15,23,42,0.04)' }}>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:T.slateL, pointerEvents:'none', display:'flex' }}><ISearch/></span>
                    <input value={searchWf} onChange={e=>setSearchWf(e.target.value)} placeholder="Rechercher un workflow…"
                      style={{ width:'100%', boxSizing:'border-box', padding:'10px 36px 10px 38px', borderRadius:'10px', border:`1.5px solid ${T.border}`, fontSize:'14px', outline:'none', background:'#F8FAFC', fontFamily:font, color:T.slate }}
                      onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.background=T.surface;}}
                      onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.background='#F8FAFC';}}/>
                    {searchWf && <button onClick={()=>setSearchWf('')} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.slateL, cursor:'pointer', display:'flex' }}><IX/></button>}
                  </div>
                </div>
              )}

              {/* Liste workflows */}
              {loadingWf ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px', color:T.slateL, gap:'12px', fontSize:'14px' }}>
                  <ILoader/> Chargement des workflows…
                </div>
              ) : filteredWf.length === 0 ? (
                <div style={{ background:T.surface, borderRadius:'16px', padding:'60px 40px', textAlign:'center', border:`1.5px solid ${T.border}` }}>
                  <div style={{ fontSize:'32px', marginBottom:'12px' }}>📋</div>
                  <h3 style={{ color:T.slate, margin:'0 0 8px', fontWeight:800 }}>Aucun workflow disponible</h3>
                  <p style={{ color:T.slateM, margin:0, fontSize:'14px' }}>
                    {searchWf ? `Aucun résultat pour "${searchWf}"` : "Aucun workflow actif pour ce type n'est accessible avec votre poste."}
                  </p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {filteredWf.map(wf => {
                    const isGlobal = (wf.allowedPosts || []).length === 0;
                    const stepCount = wf.steps?.length || 0;
                    return (
                      <div key={wf._id} className="wf-card"
                        onClick={() => navigate('/dashboard/employee/submit-request?workflowId=' + wf._id)}
                        style={{ background:T.surface, borderRadius:'14px', border:`1.5px solid ${T.border}`, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', gap:'18px', boxShadow:'0 1px 4px rgba(15,23,42,0.04)', transition:'all .15s ease' }}>
                        {/* Icône workflow */}
                        <div style={{ width:'48px', height:'48px', borderRadius:'13px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:T.blue }}>
                          <IFlow/>
                        </div>
                        {/* Contenu */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', flexWrap:'wrap' }}>
                            <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:T.slate }}>{wf.name}</h3>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background: isGlobal ? T.greenSoft : T.purpleSoft, color: isGlobal ? T.green : T.purple, border: `1px solid ${isGlobal ? T.greenBorder : T.purpleBorder}` }}>
                              {isGlobal ? <><IUsers/> Tous les employés</> : <><ILock/> Poste spécifique</>}
                            </span>
                          </div>
                          {/* Étapes visuelles */}
                          <div style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap' }}>
                            {wf.steps?.slice(0, 5).map((step, si) => (
                              <React.Fragment key={si}>
                                <span style={{ padding:'2px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:600, background: si === 0 ? '#E0F2FE' : T.blueSoft, color: si === 0 ? '#0891B2' : T.blue, border: `1px solid ${si === 0 ? '#7DD3FC' : T.blueBorder}` }}>
                                  {step.name}
                                </span>
                                {si < Math.min(stepCount, 5) - 1 && <span style={{ color:T.slateL, fontSize:'12px' }}>→</span>}
                              </React.Fragment>
                            ))}
                            {stepCount > 5 && <span style={{ fontSize:'11px', color:T.slateL }}>+{stepCount - 5}</span>}
                          </div>
                          {wf.description && <p style={{ margin:'5px 0 0', fontSize:'12px', color:T.slateM }}>{wf.description}</p>}
                        </div>
                        {/* Flèche */}
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.blue, flexShrink:0 }}><IArrowR/></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeRequestList;