import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const T = {
  blue:'#2563EB', blueSoft:'#EFF6FF', blueBorder:'#BFDBFE',
  green:'#16A34A', greenSoft:'#F0FDF4', greenBorder:'#BBF7D0',
  red:'#DC2626', redSoft:'#FEF2F2', redBorder:'#FECACA',
  slate:'#0F172A', slateM:'#475569', slateL:'#94A3B8',
  bg:'#F1F5F9', surface:'#FFFFFF', border:'#E2E8F0',
};
const font = "'Inter',-apple-system,sans-serif";

const IArrowL  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const ISearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IX       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IFile    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IArrowR  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const ILoader  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IRepeat  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;

const EmployeeRequestList = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await API.get('/document-types');
        const list = res.data?.data?.documentTypes?.filter(t => t.isActive) || [];
        setTemplates(Array.isArray(list) ? list : []);
      } catch (err) {
        setError('Impossible de charger les types de demandes.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .req-card:hover{transform:translateY(-2px)!important;box-shadow:0 6px 20px rgba(37,99,235,0.15)!important;}`}</style>
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:font }}>
        <div style={{ maxWidth:'860px', margin:'0 auto', padding:'32px 24px 60px' }}>

          {/* Back + Header */}
          <button onClick={()=>navigate('/dashboard/employee')}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.surface, border:`1.5px solid ${T.border}`, padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:T.slateM, fontSize:'13px', marginBottom:'20px', fontFamily:font }}>
            <IArrowL/> Retour
          </button>

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap', marginBottom:'28px' }}>
            <div>
              <h1 style={{ margin:'0 0 6px', fontSize:'26px', fontWeight:900, color:T.slate }}>Nouvelle demande</h1>
              <p style={{ margin:0, color:T.slateM, fontSize:'14px' }}>Choisissez le type de demande à soumettre</p>
            </div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:T.blueSoft, color:T.blue, padding:'6px 14px', borderRadius:'20px', fontSize:'13px', fontWeight:700, border:`1.5px solid ${T.blueBorder}` }}>
              <IFile/>{templates.length} type{templates.length>1?'s':''} disponible{templates.length>1?'s':''}
            </span>
          </div>

          {error&&(
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderRadius:'10px', marginBottom:'20px', background:T.redSoft, color:T.red, fontWeight:600, border:`1.5px solid ${T.redBorder}`, fontSize:'14px' }}>
              <IAlert/> {error}
            </div>
          )}

          {/* Search */}
          <div style={{ background:T.surface, borderRadius:'14px', padding:'16px 20px', border:`1.5px solid ${T.border}`, marginBottom:'24px', boxShadow:'0 1px 4px rgba(15,23,42,0.04)' }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:T.slateL, pointerEvents:'none', display:'flex' }}><ISearch/></span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un type de demande…"
                style={{ width:'100%', boxSizing:'border-box', padding:'10px 36px 10px 38px', borderRadius:'10px', border:`1.5px solid ${T.border}`, fontSize:'14px', outline:'none', background:'#F8FAFC', fontFamily:font, color:T.slate, transition:'all .15s' }}
                onFocus={e=>{e.target.style.borderColor=T.blue;e.target.style.background=T.surface;}}
                onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.background='#F8FAFC';}}/>
              {search&&(
                <button onClick={()=>setSearch('')} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:T.slateL, cursor:'pointer', display:'flex' }}><IX/></button>
              )}
            </div>
          </div>

          {/* List */}
          {filtered.length===0 ? (
            <div style={{ background:T.surface, borderRadius:'16px', padding:'60px 40px', textAlign:'center', border:`1.5px solid ${T.border}` }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:T.blue }}><IFile/></div>
              <h3 style={{ color:T.slate, margin:'0 0 8px', fontFamily:font, fontWeight:800 }}>Aucun type de demande disponible</h3>
              <p style={{ color:T.slateM, margin:0, fontSize:'14px' }}>{search?`Aucun résultat pour "${search}"`:' Contactez votre administrateur.'}</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {filtered.map((template,i) => (
                <div key={template._id} className="req-card"
                  onClick={()=>navigate('/dashboard/employee/submit-request?template='+template._id)}
                  style={{ background:T.surface, borderRadius:'14px', border:`1.5px solid ${T.border}`, padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', gap:'18px', boxShadow:'0 1px 4px rgba(15,23,42,0.04)', transition:'all .15s ease', animationDelay:`${i*0.04}s` }}>
                  {/* Icon */}
                  <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:T.blue }}><IFile/></div>
                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px', flexWrap:'wrap' }}>
                      <h3 style={{ margin:0, fontSize:'15px', fontWeight:700, color:T.slate, fontFamily:font }}>{template.name}</h3>
                      <span style={{ background:'#DBEAFE', color:T.blue, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:800, fontFamily:'monospace', border:`1px solid ${T.blueBorder}` }}>{template.prefix}26</span>
                      {template.workflowName&&(
                        <span style={{ background:T.greenSoft, color:T.green, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, display:'inline-flex', alignItems:'center', gap:'4px', border:`1px solid ${T.greenBorder}` }}>
                          <IRepeat/> {template.workflowName}
                        </span>
                      )}
                    </div>
                    <p style={{ margin:0, fontSize:'13px', color:T.slateM, lineHeight:1.5 }}>{template.description||'Soumettre une demande de type '+template.name}</p>
                  </div>
                  {/* Arrow */}
                  <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:T.blueSoft, border:`1.5px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.blue, flexShrink:0 }}><IArrowR/></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeRequestList;