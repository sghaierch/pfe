import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import workflowService from '../../../services/workflowService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconBot     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="12" y1="3" x2="12" y2="7"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/></svg>;
const IconUser    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconSend    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const IconSave    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconArrowL  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const IconCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconLoader  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconLock    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconGlobe   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconX       = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconChevron = ({ open }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transition:'transform 0.2s',transform:open?'rotate(180deg)':'rotate(0deg)'}}><polyline points="6 9 12 15 18 9"/></svg>;

const B = '#2563EB';
const STORAGE_KEY = 'wf_assistant_messages';
const CONTEXT_KEY = 'wf_assistant_context';

// ── Off-topic detector ─────────────────────────────────────────────────────
const WORKFLOW_KEYWORDS = [
  'workflow','étape','step','formulaire','champ','validation','approbation',
  'poste','département','délai','checklist','employé','responsable','processus',
  'demande','document','automatique','condition','assigner','rôle','permission',
  'claim','transition','activité','circuit','approbateur','validateur','template',
  'configuration','créer','modifier','supprimer','démarrer','type','statut',
];
const isOffTopic = (text) => {
  const lower = text.toLowerCase();
  const hasKeyword = WORKFLOW_KEYWORDS.some(kw => lower.includes(kw));
  // Allow short confirmations and basic clarifications
  if (text.trim().split(' ').length <= 4) return false;
  return !hasKeyword;
};

// ── Field type colors ──────────────────────────────────────────────────────
const FIELD_LABELS = {
  text:'Texte', number:'Nombre', date:'Date', select:'Liste', textarea:'Zone texte',
  file:'Fichier', checkbox:'Case', signature:'Signature', table:'Tableau',
  auto_number:'N° Auto', auto_user:'Demandeur', auto_status:'Statut Auto',
};
const TYPE_COLORS = {
  text:        { bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' },
  number:      { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' },
  date:        { bg:'#F0FDF4', color:'#16A34A', border:'#BBF7D0' },
  select:      { bg:'#FAF5FF', color:'#7C3AED', border:'#DDD6FE' },
  textarea:    { bg:'#FFF7ED', color:'#C2410C', border:'#FED7AA' },
  file:        { bg:'#F8FAFC', color:'#475569', border:'#CBD5E1' },
  checkbox:    { bg:'#ECFDF5', color:'#065F46', border:'#6EE7B7' },
  signature:   { bg:'#FDF4FF', color:'#86198F', border:'#F0ABFC' },
  table:       { bg:'#EFF6FF', color:'#1E40AF', border:'#93C5FD' },
  auto_number: { bg:'#F5F3FF', color:'#6D28D9', border:'#C4B5FD' },
  auto_user:   { bg:'#F5F3FF', color:'#6D28D9', border:'#C4B5FD' },
  auto_status: { bg:'#F5F3FF', color:'#6D28D9', border:'#C4B5FD' },
};

// ── StepCard ───────────────────────────────────────────────────────────────
const StepCard = ({ step, index }) => {
  const [open, setOpen] = useState(true);
  const isEmploye = index === 0;
  const fields = step.form?.fields || step.fields || [];
  const stepColor = isEmploye ? '#0891B2' : B;
  const stepBg    = isEmploye ? '#E0F2FE' : '#EFF6FF';

  return (
    <div style={{ borderRadius:'10px', border:`1.5px solid ${stepColor}20`, overflow:'hidden', marginBottom:'8px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding:'10px 14px', background:stepBg, cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'24px', height:'24px', borderRadius:'7px', background:stepColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, flexShrink:0 }}>
          {index + 1}
        </div>
        <p style={{ margin:0, fontWeight:700, fontSize:'13px', color:'#0F172A', flex:1 }}>{step.name}</p>
        {fields.length > 0 && (
          <span style={{ background:'#fff', color:stepColor, padding:'1px 7px', borderRadius:'10px', fontSize:'10px', fontWeight:700, border:`1px solid ${stepColor}30` }}>
            {fields.length} champ{fields.length > 1 ? 's' : ''}
          </span>
        )}
        <span style={{color:'#94A3B8'}}><IconChevron open={open}/></span>
      </div>
      {open && fields.length > 0 && (
        <div style={{ padding:'10px 14px', background:'#fff' }}>
          {fields.map((f, fi) => {
            const tc = TYPE_COLORS[f.type] || TYPE_COLORS.text;
            return (
              <div key={fi} style={{ display:'flex', gap:'6px', alignItems:'center', padding:'5px 8px', background:'#F8FAFC', borderRadius:'7px', marginBottom:'5px' }}>
                <span style={{ background:tc.bg, color:tc.color, border:`1px solid ${tc.border}`, padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:700, flexShrink:0 }}>
                  {FIELD_LABELS[f.type] || f.type}
                </span>
                <span style={{ fontSize:'12px', color:'#334155', fontWeight:500 }}>{f.label || 'Champ'}</span>
                {f.required && <span style={{ marginLeft:'auto', fontSize:'9px', color:'#DC2626', fontWeight:700 }}>REQUIS</span>}
              </div>
            );
          })}
        </div>
      )}
      {open && fields.length === 0 && (
        <div style={{ padding:'10px 14px', background:'#fff', fontSize:'12px', color:'#94A3B8' }}>Aucun champ configuré</div>
      )}
    </div>
  );
};

// ── Typing dots ────────────────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display:'flex', gap:'4px', alignItems:'center', padding:'6px 2px' }}>
    {[0,1,2].map(d => (
      <div key={d} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#94A3B8', animation:`typingDot 1.4s ease-in-out ${d*0.2}s infinite` }}/>
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const WorkflowAssistant = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId      = searchParams.get('projectId');

  const WELCOME = {
    role: 'assistant',
    content: `Bonjour ! Je suis votre assistant spécialisé dans la configuration des workflows.\n\nJe suis là pour vous aider à :\n• Concevoir les étapes de votre workflow\n• Choisir les bons champs de formulaire\n• Configurer les délais et permissions\n• Générer automatiquement la structure\n\nQuel processus métier souhaitez-vous automatiser ?`,
    timestamp: Date.now(),
  };

  // ── Persistent messages ────────────────────────────────────────────────
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [WELCOME];
  });

  const [context, setContext] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CONTEXT_KEY) || '{}'); }
    catch { return {}; }
  });

  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [wfJson,       setWfJson]       = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [savedMsg,     setSavedMsg]     = useState('');
  const [allowedPosts, setAllowedPosts] = useState([]);
  const [allPosts,     setAllPosts]     = useState([]);
  const bottomRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }
    catch {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(CONTEXT_KEY, JSON.stringify(context)); }
    catch {}
  }, [context]);

  useEffect(() => {
    import('../../../services/departmentService').then(m => {
      m.default.getAllPosts().then(p => setAllPosts(p || [])).catch(() => {});
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONTEXT_KEY);
    setMessages([WELCOME]);
    setContext({});
    setWfJson(null);
    setSavedMsg('');
  };

  const OFF_TOPIC_REPLY = `Je suis désolé, mais je suis uniquement en mesure de vous assister sur des sujets liés aux **workflows** : conception des étapes, champs de formulaire, délais, permissions, postes et processus d'approbation.\n\nN'hésitez pas à me poser toute question concernant la configuration de votre workflow.`;

  const sendMessage = useCallback(async (textOverride) => {
    const text = (textOverride ?? input ?? '').trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // ── Off-topic check ──────────────────────────────────────────────────
    if (isOffTopic(text)) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: OFF_TOPIC_REPLY,
          timestamp: Date.now(),
          isOffTopic: true,
        }]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await workflowService.chatAssistant(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        { ...context, availablePosts: allPosts.map(p => p.name) }
      );
      const data = res.data;
      const assistantMsg = { role:'assistant', content:data.message, timestamp:Date.now() };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.workflowJson) {
        setWfJson(data.workflowJson);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Votre workflow a été généré avec succès. Consultez le panneau de prévisualisation pour vérifier la structure, puis sauvegardez.',
          isSystem: true,
          timestamp: Date.now(),
        }]);
      }

      setContext(prev => {
        const updated = { ...prev };
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
        content: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer.',
        isError: true,
        timestamp: Date.now(),
      }]);
    } finally { setLoading(false); }
  }, [input, messages, loading, context, allPosts]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSaveWorkflow = async () => {
    if (!wfJson) return;
    setSaving(true);
    try {
      const cleanSteps = (wfJson.steps || []).map((step, si) => {
        let fields = [];
        if (Array.isArray(step.form?.fields)) {
          fields = step.form.fields.filter(f => f && typeof f === 'object').map((f, fi) => ({
            id: f.id || 'f_'+si+'_'+fi, label: f.label||'Champ '+(fi+1), type: f.type||'text',
            required: f.required===true, readOnly: f.readOnly===true,
            options: Array.isArray(f.options)?f.options:[], columns: Array.isArray(f.columns)?f.columns:[],
            inheritTableFrom: f.inheritTableFrom||'', extraColumns: Array.isArray(f.extraColumns)?f.extraColumns:[],
          }));
        }
        if (fields.length === 0) {
          fields = [
            { id:'f_'+si+'_1', label:'Décision', type:'select', required:true, options:['Approuvé','Refusé'] },
            { id:'f_'+si+'_2', label:'Commentaire', type:'textarea', required:false, options:[] },
          ];
        }
        let checklist = [];
        if (Array.isArray(step.checklist)) {
          checklist = step.checklist.filter(c=>c&&typeof c==='object'&&c.label).map((c,ci)=>({ id:c.id||'c_'+si+'_'+ci, label:c.label, required:c.required===true, checked:false }));
        }
        return {
          name: step.name||'Étape '+(si+1), description:step.description||'', order:si,
          assignedPost: step.assignedPost||'', assignedToName:'', assignedRole:step.assignedPost||'',
          delai: step.delai||'', form:{ fields }, checklist,
          claims:{ canValidate:si===0?false:(step.claims?.canValidate!==false), canReject:si===0?false:(step.claims?.canReject!==false), canModify:si===0?true:(step.claims?.canModify===true), canView:step.claims?.canView!==false },
          status:'pending',
        };
      });

      const createRes = await workflowService.create({
        name: wfJson.workflowName||context.workflowName||'Workflow IA',
        isTemplate:true, description:wfJson.description||'',
        projectId, steps:cleanSteps,
        visibility: allowedPosts.length>0?'restricted':'global', allowedPosts,
        nodes:[], edges:[],
      });

      const workflowId = createRes?.data?.workflow?._id||createRes?.workflow?._id||createRes?.data?._id;
      if (workflowId) await workflowService.start(workflowId);

      setSavedMsg('SUCCESS');
      // Clear chat history after successful save
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONTEXT_KEY);
      setTimeout(() => {
        if (projectId && projectId !== 'null') navigate('/dashboard/company/projects/'+projectId);
        else navigate('/dashboard/company/projects');
      }, 1800);
    } catch (err) {
      setSavedMsg('ERREUR : '+(err.response?.data?.message||err.message));
    } finally { setSaving(false); }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  };

  const renderMessage = (msg, i) => {
    const isUser   = msg.role === 'user';
    const isSystem = msg.isSystem;

    if (isSystem) return (
      <div key={i} style={{ display:'flex', justifyContent:'center', margin:'14px 0' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#F0FDF4', color:'#16A34A', padding:'7px 16px', borderRadius:'20px', fontSize:'13px', fontWeight:600, border:'1.5px solid #BBF7D0' }}>
          <IconCheck/> {msg.content}
        </span>
      </div>
    );

    const isOT  = msg.isOffTopic;
    const isErr = msg.isError;

    return (
      <div key={i} style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:'16px', gap:'10px', alignItems:'flex-end' }}>
        {!isUser && (
          <div style={{ width:'34px', height:'34px', borderRadius:'10px', background: isOT||isErr ? '#FEF2F2' : `linear-gradient(135deg,${B},#0EA5E9)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {isOT||isErr ? <IconAlert/> : <IconBot/>}
          </div>
        )}

        <div style={{ maxWidth:'72%' }}>
          <div style={{
            padding:'12px 16px', fontSize:'14px', lineHeight:1.7,
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: isUser ? B : isOT ? '#FFFBEB' : isErr ? '#FEF2F2' : '#F8FAFC',
            color: isUser ? '#fff' : isOT ? '#92400E' : isErr ? '#DC2626' : '#0F172A',
            border: isUser ? 'none' : isOT ? '1.5px solid #FDE68A' : isErr ? '1.5px solid #FECACA' : '1.5px solid #E2E8F0',
            boxShadow: isUser ? `0 2px 10px ${B}30` : '0 1px 4px rgba(0,0,0,0.05)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
          </div>
          {msg.timestamp && (
            <p style={{ margin:'4px 0 0', fontSize:'10px', color:'#CBD5E1', textAlign: isUser ? 'right' : 'left', paddingLeft: isUser ? 0 : '4px', paddingRight: isUser ? '4px' : 0 }}>
              {formatTime(msg.timestamp)}
            </p>
          )}
        </div>

        {isUser && (
          <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'#EFF6FF', border:`1.5px solid #BFDBFE`, color:B, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <IconUser/>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes typingDot    { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-5px);opacity:1} }
        @keyframes fadeIn       { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .wfa-send-btn:hover:not(:disabled) { background: #1D4ED8 !important; transform: scale(1.05); }
        .wfa-clear-btn:hover { background: #FEF2F2 !important; color: #DC2626 !important; }
        .wfa-msg { animation: fadeIn 0.25s ease; }
        textarea:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; outline: none; }
      `}</style>

      <div style={{ padding:'28px', maxWidth:'1000px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px', flexWrap:'wrap' }}>
          <button onClick={() => navigate(-1)}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F1F5F9', border:'1.5px solid #E2E8F0', padding:'8px 14px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
            <IconArrowL/> Retour
          </button>

          <div style={{ flex:1 }}>
            <h1 style={{ margin:0, fontSize:'20px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.3px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg,${B},#0EA5E9)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
                <IconBot/>
              </span>
              Assistant IA — Configuration de Workflow
            </h1>
            <p style={{ margin:'3px 0 0 46px', fontSize:'13px', color:'#64748B' }}>
              Posez vos questions sur la conception et la configuration de vos workflows
            </p>
          </div>

          <button className="wfa-clear-btn" onClick={clearHistory}
            style={{ display:'flex', alignItems:'center', gap:'6px', background:'#F8FAFC', border:'1.5px solid #E2E8F0', padding:'7px 13px', borderRadius:'9px', cursor:'pointer', fontWeight:600, color:'#64748B', fontSize:'13px', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}>
            <IconTrash/> Effacer
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: wfJson ? '1fr 340px' : '1fr', gap:'20px', alignItems:'start' }}>

          {/* ── Chat panel ── */}
          <div style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #E2E8F0', display:'flex', flexDirection:'column', height:'660px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', overflow:'hidden' }}>

            {/* Chat header */}
            <div style={{ padding:'14px 20px', borderBottom:'1.5px solid #F1F5F9', background:'#F8FAFC', display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#22C55E', boxShadow:'0 0 6px rgba(34,197,94,0.5)' }}/>
              <span style={{ fontSize:'13px', fontWeight:700, color:'#0F172A' }}>Assistant Workflow</span>
              <span style={{ fontSize:'12px', color:'#94A3B8', marginLeft:'auto' }}>
                {messages.filter(m=>m.role==='user').length} message{messages.filter(m=>m.role==='user').length > 1 ? 's' : ''} envoyé{messages.filter(m=>m.role==='user').length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column' }}>
              {messages.map((msg, i) => (
                <div key={i} className="wfa-msg">{renderMessage(msg, i)}</div>
              ))}

              {loading && (
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-end', marginBottom:'16px' }}>
                  <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:`linear-gradient(135deg,${B},#0EA5E9)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <IconBot/>
                  </div>
                  <div style={{ padding:'12px 16px', background:'#F8FAFC', borderRadius:'16px 16px 16px 4px', border:'1.5px solid #E2E8F0' }}>
                    <TypingDots/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Input area */}
            <div style={{ padding:'16px 20px', borderTop:'1.5px solid #F1F5F9', background:'#F8FAFC', flexShrink:0 }}>
              <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value ?? '')}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question sur la configuration du workflow… (Entrée pour envoyer)"
                  rows={2}
                  disabled={loading}
                  style={{ flex:1, padding:'11px 14px', borderRadius:'10px', border:'1.5px solid #E2E8F0', fontSize:'14px', resize:'none', fontFamily:"'Inter',sans-serif", color:'#0F172A', background:'#fff', transition:'all 0.15s', lineHeight:1.5 }}
                />
                <button className="wfa-send-btn" onClick={() => sendMessage()} disabled={loading || !(input ?? '').trim()}
                  style={{ width:'44px', height:'44px', borderRadius:'10px', background: loading||!(input??'').trim() ? '#E2E8F0' : B, color: loading||!(input??'').trim() ? '#94A3B8' : '#fff', border:'none', cursor: loading||!(input??'').trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s', boxShadow: !(input??'').trim() ? 'none' : `0 3px 10px ${B}40` }}>
                  {loading ? <IconLoader/> : <IconSend/>}
                </button>
              </div>
              <p style={{ margin:'8px 0 0', fontSize:'11px', color:'#94A3B8', textAlign:'center' }}>
                Maj+Entrée pour aller à la ligne · L'historique est conservé après rechargement
              </p>
            </div>
          </div>

          {/* ── Preview panel ── */}
          {wfJson && (
            <div style={{ background:'#fff', borderRadius:'16px', border:`1.5px solid ${B}30`, padding:'20px', boxShadow:`0 4px 20px ${B}15`, position:'sticky', top:'24px' }}>
              {/* Preview header */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', paddingBottom:'14px', borderBottom:'1.5px solid #F1F5F9' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:'#F0FDF4', border:'1.5px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', color:'#16A34A' }}>
                  <IconCheck/>
                </div>
                <div>
                  <h3 style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#0F172A' }}>Workflow généré</h3>
                  <p style={{ margin:0, fontSize:'12px', color:'#64748B' }}>{wfJson.workflowName}</p>
                </div>
              </div>

              {/* Access control */}
              <div style={{ marginBottom:'14px', padding:'12px', background:'#EFF6FF', borderRadius:'10px', border:'1.5px solid #BFDBFE' }}>
                <p style={{ margin:'0 0 8px', fontSize:'11px', fontWeight:800, color:B, textTransform:'uppercase', letterSpacing:'0.07em', display:'flex', alignItems:'center', gap:'5px' }}>
                  {allowedPosts.length > 0 ? <><IconLock/> Accès restreint</> : <><IconGlobe/> Accès global</>}
                </p>
                <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'8px', minHeight:'20px' }}>
                  {allowedPosts.length === 0 ? (
                    <span style={{ fontSize:'12px', color:'#16A34A', fontWeight:600 }}>Tous les employés peuvent soumettre</span>
                  ) : allowedPosts.map(p => (
                    <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#fff', color:B, padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1.5px solid #BFDBFE` }}>
                      {p}
                      <button onClick={() => setAllowedPosts(prev => prev.filter(x => x !== p))}
                        style={{ background:'#DBEAFE', border:'none', color:B, cursor:'pointer', width:'14px', height:'14px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', padding:0, flexShrink:0 }}>
                        <IconX/>
                      </button>
                    </span>
                  ))}
                </div>
                <select value="" onChange={e => { const v=e.target.value; if(v&&!allowedPosts.includes(v)) setAllowedPosts(prev=>[...prev,v]); }}
                  style={{ width:'100%', padding:'7px 10px', borderRadius:'8px', border:'1.5px solid #BFDBFE', fontSize:'12px', color:'#0F172A', outline:'none', fontFamily:"'Inter',sans-serif", background:'#fff' }}>
                  <option value="">+ Restreindre à un poste…</option>
                  {allPosts.filter(p => !allowedPosts.includes(p.name)).map(p => (
                    <option key={p._id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Steps preview */}
              <div style={{ maxHeight:'380px', overflowY:'auto', marginBottom:'14px' }}>
                {(wfJson.steps || []).map((step, i) => <StepCard key={i} step={step} index={i}/>)}
              </div>

              {/* Save */}
              {savedMsg === 'SUCCESS' ? (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 14px', background:'#F0FDF4', borderRadius:'10px', color:'#16A34A', fontWeight:700, fontSize:'13px', border:'1.5px solid #BBF7D0' }}>
                  <IconCheck/> Sauvegardé ! Redirection en cours…
                </div>
              ) : (
                <>
                  {savedMsg && (
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', background:'#FEF2F2', borderRadius:'9px', color:'#DC2626', fontSize:'12px', fontWeight:600, marginBottom:'10px', border:'1.5px solid #FECACA' }}>
                      <IconAlert/> {savedMsg.replace('ERREUR : ','')}
                    </div>
                  )}
                  <button onClick={handleSaveWorkflow} disabled={saving}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', borderRadius:'10px', background:saving?'#E2E8F0':'#16A34A', color:saving?'#94A3B8':'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:saving?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", boxShadow:saving?'none':'0 4px 12px rgba(22,163,74,0.35)', transition:'all 0.15s', marginBottom:'6px' }}>
                    {saving ? <><IconLoader/> Sauvegarde…</> : <><IconSave/> Sauvegarder le workflow</>}
                  </button>
                  {!projectId && (
                    <p style={{ margin:0, fontSize:'11px', color:'#94A3B8', textAlign:'center' }}>
                      Sera sauvegardé sans projet — assignable ultérieurement
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WorkflowAssistant;