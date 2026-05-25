import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

const FIELD_ICONS  = { text:'T', number:'123', date:'D', select:'L', textarea:'TT', file:'F', checkbox:'CB', signature:'SG', table:'⊞', auto_number:'#', auto_user:'👤', auto_status:'●' };
const FIELD_LABELS = { text:'Texte', number:'Nombre', date:'Date', select:'Liste', textarea:'Zone texte', file:'Fichier', checkbox:'Case à cocher', signature:'Signature', table:'Tableau', auto_number:'N° Auto', auto_user:'Demandeur', auto_status:'Statut Auto' };

// ── StepCard — prévisualisation détaillée avec types lisibles ────────────────
const StepCard = ({ step, index }) => {
  const [open, setOpen] = React.useState(true); // ✅ FIX : ouvert par défaut
  const isEmploye = index === 0;
  const fields    = step.form?.fields || step.fields || [];
  const checklist = step.checklist || [];

  // ✅ FIX : couleurs par type de champ pour les rendre lisibles
  const typeColors = {
    text:        { bg:'#f0f9ff', color:'#0369a1', border:'#bae6fd' },
    number:      { bg:'#fefce8', color:'#854d0e', border:'#fde68a' },
    date:        { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0' },
    select:      { bg:'#faf5ff', color:'#6b21a8', border:'#d8b4fe' },
    textarea:    { bg:'#fff7ed', color:'#9a3412', border:'#fed7aa' },
    file:        { bg:'#f8fafc', color:'#475569', border:'#cbd5e1' },
    checkbox:    { bg:'#ecfdf5', color:'#065f46', border:'#6ee7b7' },
    signature:   { bg:'#fdf2f8', color:'#86198f', border:'#f0abfc' },
    table:       { bg:'#eff6ff', color:'#1e40af', border:'#93c5fd' },
    auto_number: { bg:'#fdf4ff', color:'#7e22ce', border:'#e9d5ff' },
    auto_user:   { bg:'#fdf4ff', color:'#7e22ce', border:'#e9d5ff' },
    auto_status: { bg:'#fdf4ff', color:'#7e22ce', border:'#e9d5ff' },
  };

  return (
    <div style={{ borderRadius:'10px', border:'1px solid '+(isEmploye?'#a5f3fc':'#e2e8f0'), overflow:'hidden', marginBottom:'8px' }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ padding:'10px 14px', background:isEmploye?'#ecfeff':'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:isEmploye?'#06b6d4':'#4f46e5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0 }}>{index+1}</div>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontWeight:700, fontSize:'13px', color:'#0f172a' }}>{step.name}</p>
          <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>
            {isEmploye ? '👥 Tous les employés' : ('👤 '+(step.assignedPost||'Non assigné'))}
            {step.delai && !isEmploye ? ' · ⏱ '+step.delai : ''}
          </p>
        </div>
        <span style={{ fontSize:'11px', color:'#94a3b8', background:'#f1f5f9', padding:'2px 8px', borderRadius:'10px' }}>
          {fields.length} champ{fields.length>1?'s':''} {open?'▲':'▼'}
        </span>
      </div>
      {open && (
        <div style={{ padding:'10px 14px', background:'#fff', borderTop:'1px solid #f1f5f9' }}>
          {fields.length > 0 && (
            <div style={{ marginBottom:'8px' }}>
              <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:700, color:'#4f46e5' }}>📋 CHAMPS ({fields.length})</p>
              {fields.map((f,fi) => {
                const tc = typeColors[f.type] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
                return (
                  <div key={fi}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 8px', background:'#fafafa', borderRadius:'6px', marginBottom:'4px', border:'1px solid #f1f5f9' }}>
                      <span style={{ background:tc.bg, color:tc.color, border:'1px solid '+tc.border, padding:'2px 7px', borderRadius:'4px', fontSize:'10px', fontWeight:700, flexShrink:0, whiteSpace:'nowrap' }}>
                        {FIELD_LABELS[f.type] || f.type}
                      </span>
                      <span style={{ flex:1, fontSize:'12px', color:'#374151', fontWeight:500 }}>{f.label||('Champ '+(fi+1))}</span>
                      {f.required && <span style={{ fontSize:'9px', color:'#dc2626', fontWeight:700, background:'#fef2f2', padding:'1px 5px', borderRadius:'3px' }}>REQ</span>}
                      {f.readOnly && <span style={{ fontSize:'9px', color:'#7c3aed', fontWeight:700, background:'#faf5ff', padding:'1px 5px', borderRadius:'3px' }}>AUTO</span>}
                    </div>
                    {f.type==='select' && (f.options||[]).length>0 && (
                      <div style={{ marginLeft:'8px', marginBottom:'4px', display:'flex', gap:'4px', flexWrap:'wrap' }}>
                        {f.options.map((o,oi)=><span key={oi} style={{ background:'#faf5ff', border:'1px solid #c4b5fd', borderRadius:'3px', padding:'1px 6px', fontSize:'10px', color:'#6d28d9' }}>{o}</span>)}
                      </div>
                    )}
                    {f.type==='table' && (f.columns||[]).length>0 && (
                      <div style={{ marginLeft:'8px', marginBottom:'4px', padding:'4px 8px', background:'#eff6ff', borderRadius:'5px', display:'flex', gap:'4px', flexWrap:'wrap' }}>
                        {f.columns.map((c,ci)=><span key={ci} style={{ background:'#fff', border:'1px solid #93c5fd', borderRadius:'3px', padding:'1px 6px', fontSize:'10px', color:'#1e40af' }}>{c.label}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginBottom: checklist.length>0?'8px':0 }}>
            <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, color:'#f59e0b' }}>🔐 PERMISSIONS</p>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {isEmploye
                ? <><span style={{ background:'#f0fdf4', color:'#059669', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:600 }}>✅ Soumettre</span><span style={{ background:'#f1f5f9', color:'#94a3b8', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:600 }}>❌ Pas de validation</span></>
                : <><span style={{ background:'#f0fdf4', color:'#059669', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:600 }}>✅ Valider</span><span style={{ background:'#fef2f2', color:'#dc2626', padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:600 }}>✕ Rejeter</span></>
              }
            </div>
          </div>
          {checklist.length>0 && (
            <div>
              <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, color:'#7c3aed' }}>☑ CHECKLIST ({checklist.length})</p>
              {checklist.map((c,ci)=>(
                <div key={ci} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'#374151', marginBottom:'2px' }}>
                  <span>☐</span><span style={{ flex:1 }}>{c.label}</span>
                  {c.required && <span style={{ fontSize:'9px', color:'#dc2626', fontWeight:700 }}>REQ</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
const WorkflowAssistant = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId      = searchParams.get('projectId');

  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [context,   setContext]   = useState({});
  const [wfJson,    setWfJson]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [savedMsg,  setSavedMsg]  = useState('');
  const bottomRef = useRef(null);

  // Message d'accueil initial
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `👋 Bonjour ! Je suis votre assistant IA pour la création de workflows.\n\nJe vais vous guider étape par étape. Commençons !\n\n**Quel est le processus métier que vous souhaitez automatiser ?**\n\n_(Ex: validation des congés, approbation des achats, onboarding employé...)_`,
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await workflowService.chatAssistant(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        context
      );
      const data = res.data;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      if (data.workflowJson) {
        setWfJson(data.workflowJson);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ **Workflow généré !** Vous pouvez le prévisualiser et le sauvegarder ci-dessous.',
          isSystem: true,
        }]);
      }

      // FIX : enrichir le contexte avec toutes les infos extraites de la conversation
      setContext(prev => {
        const updated = { ...prev };
        const msg = data.message.toLowerCase();

        // Détecter le nom du workflow mentionné
        const nomMatch = data.message.match(/workflow[  :]+(["']?)([^"',]+)/i);
        if (nomMatch) updated.workflowName = nomMatch[2].trim();

        // Détecter les postes mentionnés
        if (msg.includes('poste') || msg.includes('responsable') || msg.includes('directeur')) {
          updated.lastTopic = 'postes';
        } else if (msg.includes('étape') || msg.includes('step')) {
          updated.lastTopic = 'étapes';
        } else if (msg.includes('formulaire') || msg.includes('champ')) {
          updated.lastTopic = 'formulaires';
        } else if (msg.includes('délai') || msg.includes('jours')) {
          updated.lastTopic = 'délais';
        }

        // Compter les étapes mentionnées
        const etapeMatch = data.message.match(/(\d+)\s+étapes?/i);
        if (etapeMatch) updated.stepCount = parseInt(etapeMatch[1]);

        // Si workflowJson généré, enrichir avec ses données
        if (data.workflowJson) {
          updated.workflowName = data.workflowJson.workflowName || updated.workflowName;
          updated.stepCount    = data.workflowJson.steps?.length || updated.stepCount;
          updated.steps        = data.workflowJson.steps?.map(s => s.name) || [];
          updated.isComplete   = true;
        }

        return updated;
      });
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erreur : ' + (err.response?.data?.message || err.message),
      }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSaveWorkflow = async () => {
  // FIX : projectId optionnel — on peut sauvegarder sans projet
  if (!wfJson) return;
  setSaving(true);
  try {
    // ── Sanitiser les étapes avant envoi ────────────────────────────────────
    const cleanSteps = (wfJson.steps || []).map((step, si) => {
      // form.fields : s'assurer que c'est un array d'objets valides
      let fields = [];
      if (Array.isArray(step.form?.fields)) {
        fields = step.form.fields
          .filter(f => f && typeof f === 'object' && f.id && f.label)
          .map((f, fi) => ({
            id:       f.id       || 'f_' + si + '_' + fi,
            label:    f.label    || 'Champ ' + (fi + 1),
            type:     ['text','number','date','select','textarea','file','checkbox','signature'].includes(f.type)
                      ? f.type : 'text',
            required: f.required === true,
            options:  Array.isArray(f.options) ? f.options : [],
          }));
      }
      // Si fields vide ou invalide → champs par défaut
      if (fields.length === 0) {
        fields = [
          { id: 'f_' + si + '_1', label: 'Décision', type: 'select', required: true, options: ['Approuvé', 'Refusé'] },
          { id: 'f_' + si + '_2', label: 'Commentaire', type: 'textarea', required: false, options: [] },
        ];
      }

      // checklist : s'assurer que c'est un array d'objets valides
      let checklist = [];
      if (Array.isArray(step.checklist)) {
        checklist = step.checklist
          .filter(c => c && typeof c === 'object' && c.label)
          .map((c, ci) => ({
            id:       c.id      || 'c_' + si + '_' + ci,
            label:    c.label,
            required: c.required === true,
            checked:  false,
          }));
      }

      return {
        name:         step.name         || 'Étape ' + (si + 1),
        description:  step.description  || '',
        order:        si,
        assignedPost: step.assignedPost || '',
        assignedToName: '',
        assignedRole: '',
        delai:        step.delai        || '',
        form:         { fields },
        checklist,
        claims: {
          canValidate: step.claims?.canValidate !== false,
          canReject:   step.claims?.canReject   !== false,
          canModify:   step.claims?.canModify   === true,
          canView:     step.claims?.canView     !== false,
        },
        status: 'pending',
      };
    });

    const createRes = await workflowService.create({
      name:        wfJson.workflowName || 'Workflow IA',
      isTemplate:  true,
      description: wfJson.description || '',
      projectId:   projectId,
      steps:       cleanSteps,
      visibility:  wfJson.visibility || 'global',
      nodes:       [],
      edges:       [],
    });

    // ✅ FIX — démarrer immédiatement → isTemplate:true + status:active → visible aux employés
    const workflowId = createRes?.data?.workflow?._id || createRes?.workflow?._id || createRes?.data?._id;
    if (workflowId) {
      await workflowService.start(workflowId);
    }

    setSavedMsg('SUCCESS');
    setTimeout(() => {
      if (projectId && projectId !== 'null') {
        navigate('/dashboard/company/projects/' + projectId);
      } else {
        navigate('/dashboard/company/projects');
      }
    }, 1500);
  } catch (err) {
    setSavedMsg('ERREUR : ' + (err.response?.data?.message || err.message));
  } finally { setSaving(false); }
};

  // Suggestions de réponse rapide selon le contexte
  const quickReplies = [
    { label: '✅ Oui', text: 'Oui' },
    { label: '❌ Non', text: 'Non' },
    { label: '➕ Ajouter une étape', text: 'Je veux ajouter une étape supplémentaire' },
    { label: '✓ Le workflow est complet', text: 'Le workflow est complet, génère le JSON final' },
    { label: '🔄 Recommencer', text: 'Recommençons depuis le début' },
  ];

  const renderMessage = (msg, i) => {
    const isUser = msg.role === 'user';
    const isSystem = msg.isSystem;

    if (isSystem) return (
      <div key={i} style={{ textAlign: 'center', margin: '12px 0' }}>
        <span style={{ background: '#f0fdf4', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid #86efac' }}>
          {msg.content}
        </span>
      </div>
    );

    return (
      <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
        {!isUser && (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>
            🤖
          </div>
        )}
        <div style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? '#4f46e5' : '#f8fafc',
          color: isUser ? '#fff' : '#0f172a',
          fontSize: '14px',
          lineHeight: 1.6,
          border: isUser ? 'none' : '1px solid #e2e8f0',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
        </div>
        {isUser && (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginLeft: '8px', alignSelf: 'flex-end' }}>
            👤
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)}
          style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
          Retour
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
            🤖 Assistant IA — Création de workflow
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
            Je vous guide étape par étape dans la configuration de votre workflow
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: wfJson ? '1fr 340px' : '1fr', gap: '20px' }}>

        {/* Chat */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '600px' }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, i) => renderMessage(msg, i))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[0, 1, 2].map(d => (
                      <div key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.4s ease-in-out ' + (d * 0.2) + 's infinite' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Boutons de réponse rapide — sous le dernier message IA */}
            {!loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !wfJson && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px', paddingLeft: '40px' }}>
                {quickReplies.map((qr, qi) => (
                  <button
                    key={qi}
                    onClick={() => {
                      const text = qr.text;
                      const newMessages = [...messages, { role: 'user', content: text }];
                      setMessages(newMessages);
                      setLoading(true);
                      workflowService.chatAssistant(
                        newMessages.map(m => ({ role: m.role, content: m.content })),
                        context
                      ).then(res => {
                        const data = res.data;
                        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
                        if (data.workflowJson) {
                          setWfJson(data.workflowJson);
                          setMessages(prev => [...prev, { role: 'assistant', content: '✅ Workflow généré ! Prévisualisez et sauvegardez ci-dessous.', isSystem: true }]);
                        }
                      }).catch(err => {
                        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur : ' + err.message }]);
                      }).finally(() => setLoading(false));
                    }}
                    style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all .15s' }}
                    onMouseEnter={e => { e.target.style.background = '#ede9fe'; e.target.style.borderColor = '#4f46e5'; }}
                    onMouseLeave={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; }}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre réponse... (Entrée pour envoyer)"
              rows={2}
              disabled={loading}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ padding: '10px 20px', borderRadius: '8px', background: loading || !input.trim() ? '#e2e8f0' : '#4f46e5', color: loading || !input.trim() ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '18px', alignSelf: 'flex-end' }}
            >
              ➤
            </button>
          </div>
        </div>

        {/* Prévisualisation workflow généré */}
        {wfJson && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #4f46e5', padding: '20px', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              ✅ Workflow généré
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>{wfJson.workflowName}</p>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px', maxHeight: '600px', overflowY: 'auto' }}>
              {(wfJson.steps || []).map((step, i) => (
                <StepCard key={i} step={step} index={i} />
              ))}
            </div>

            {savedMsg === 'SUCCESS' ? (
              <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', color: '#059669', fontWeight: 700, textAlign: 'center', fontSize: '13px' }}>
                ✅ Sauvegardé ! Redirection...
              </div>
            ) : (
              <>
                {savedMsg && <div style={{ padding: '8px', background: '#fff5f5', borderRadius: '6px', color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>{savedMsg}</div>}
                <button
                  onClick={handleSaveWorkflow}
                  disabled={saving}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', background: saving ? '#e2e8f0' : '#059669', color: saving ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '6px' }}
                >
                  {saving ? 'Sauvegarde...' : '💾 Sauvegarder le workflow'}
                </button>
                {!projectId && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                    ℹ️ Sera sauvegardé sans projet — vous pourrez l'assigner ensuite
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowAssistant;