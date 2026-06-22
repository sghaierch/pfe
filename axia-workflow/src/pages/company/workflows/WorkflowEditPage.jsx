import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkflowEditor from './WorkflowEditor';
import workflowService from '../../../services/workflowService';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconLoader = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin .9s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconArrowL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const WorkflowEditPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workflowService.getById(id);
        const wf  = res.data?.workflow;
        if (!wf) { setError('Workflow introuvable'); return; }
        if (wf.status !== 'draft') {
          setError('Ce workflow est déjà démarré (statut : ' + wf.status + '). Seuls les brouillons sont modifiables.');
          return;
        }
        setWorkflow(wf);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async ({ steps, nodes, edges, visibility, allowedRoles, allowedPosts }) => {
    await workflowService.update(id, {
      name: workflow.name, description: workflow.description, dueDate: workflow.dueDate,
      steps, nodes, edges, visibility, allowedRoles, allowedPosts,
    });
    navigate('/dashboard/company/workflows/' + id);
  };

  const handleCancel = () => navigate('/dashboard/company/workflows/' + id);

  const buildInitialNodes = (wf) => {
    if (!wf) return undefined;
    if (wf.canvasNodes?.length > 0) return wf.canvasNodes;
    const debutNode = { id:'debut', type:'debut', label:'Début', x:280, y:40, form:{fields:[]}, checklist:[], claims:{canValidate:true,canReject:true,canModify:false,canView:true} };
    const stepNodes = (wf.steps||[]).map((step,i) => ({
      id: 'etape_'+(step._id||i), type:'etape', label:step.name, x:280, y:140+i*140,
      description:step.description||'', assignedTo:step.assignedTo?._id?.toString()||step.assignedTo?.toString()||null,
      assignedToName:step.assignedToName||'', assignedRole:step.assignedRole||'',
      assignedPost:step.assignedPost||'', assignedPostName:step.assignedPostName||'',
      delai:step.delai||'', form:step.form||{fields:[]}, checklist:step.checklist||[],
      claims:step.claims||{canValidate:true,canReject:true,canModify:false,canView:true},
    }));
    const finNode = { id:'fin_auto', type:'fin', label:'Fin', x:280, y:140+stepNodes.length*140, form:{fields:[]}, checklist:[], claims:{canValidate:true,canReject:true,canModify:false,canView:true} };
    return [debutNode, ...stepNodes, finNode];
  };

  const buildInitialEdges = (wf) => {
    if (!wf) return undefined;
    if (wf.canvasEdges?.length > 0) return wf.canvasEdges;
    const nodes = buildInitialNodes(wf);
    if (!nodes || nodes.length < 2) return [];
    return nodes.slice(0,-1).map((node,i) => ({ from:node.id, to:nodes[i+1].id, label:'' }));
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        height:'100vh', background:'#F1F5F9',
        fontFamily:"'Inter',-apple-system,sans-serif",
      }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#EFF6FF', border:'1.5px solid #BFDBFE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <IconLoader/>
          </div>
          <p style={{ color:'#64748B', fontWeight:600, fontSize:'15px', margin:0 }}>
            Chargement du workflow…
          </p>
        </div>
      </div>
    </>
  );

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#F1F5F9',
      fontFamily:"'Inter',-apple-system,sans-serif",
    }}>
      <div style={{
        textAlign:'center', background:'#fff', padding:'44px 40px',
        borderRadius:'20px', boxShadow:'0 8px 32px rgba(0,0,0,0.1)',
        maxWidth:'480px', width:'90%', border:'1.5px solid #E2E8F0',
      }}>
        <div style={{
          width:'60px', height:'60px', borderRadius:'16px',
          background:'#FEF2F2', border:'1.5px solid #FECACA',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 20px',
        }}>
          <IconAlert/>
        </div>
        <h2 style={{ color:'#DC2626', margin:'0 0 12px', fontSize:'18px', fontWeight:800, letterSpacing:'-0.2px' }}>
          Modification impossible
        </h2>
        <p style={{ color:'#64748B', margin:'0 0 28px', lineHeight:1.7, fontSize:'14px' }}>
          {error}
        </p>
        <button
          onClick={handleCancel}
          style={{
            display:'inline-flex', alignItems:'center', gap:'7px',
            padding:'11px 24px', borderRadius:'10px',
            background:'#2563EB', color:'#fff', border:'none',
            fontWeight:700, cursor:'pointer', fontSize:'14px',
            fontFamily:"'Inter',sans-serif",
            boxShadow:'0 4px 14px rgba(37,99,235,0.4)',
          }}
        >
          <IconArrowL/> Retour au workflow
        </button>
      </div>
    </div>
  );

  // ── Editor ─────────────────────────────────────────────────────────────────
  return (
    <WorkflowEditor
      projectId={workflow?.project}
      workflowName={workflow?.name}
      initialNodes={buildInitialNodes(workflow)}
      initialEdges={buildInitialEdges(workflow)}
      initialVisibility={workflow?.visibility || 'global'}
      initialAllowedRoles={workflow?.allowedRoles || []}
      initialAllowedPosts={workflow?.allowedPosts || []}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default WorkflowEditPage;