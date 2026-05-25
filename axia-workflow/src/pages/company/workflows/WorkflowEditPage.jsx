import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WorkflowEditor from './WorkflowEditor';
import workflowService from '../../../services/workflowService';



const WorkflowEditPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workflowService.getById(id);
        const wf  = res.data?.workflow;

        if (!wf) { setError('Workflow introuvable'); return; }

        // ✅ RÈGLE MÉTIER : on refuse l'édition si le workflow n'est pas draft
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

  // ── Sauvegarder les modifications ────────────────────────────────────────────
  const handleSave = async ({ steps, nodes, edges, visibility, allowedRoles, allowedPosts }) => {
    await workflowService.update(id, {
      name:         workflow.name,
      description:  workflow.description,
      dueDate:      workflow.dueDate,
      steps,
      nodes,
      edges,
      visibility,
      allowedRoles,
      allowedPosts,
    });
    // Retour à la page de détail après sauvegarde
    navigate('/dashboard/company/workflows/' + id);
  };

  const handleCancel = () => navigate('/dashboard/company/workflows/' + id);

  // ── Construire les nodes initiaux depuis les étapes sauvegardées ─────────────
  // WorkflowEditor travaille avec des "nodes canvas". On reconstruit ces nodes
  // depuis les étapes du workflow pour préremplir l'éditeur.
  const buildInitialNodes = (wf) => {
    if (!wf) return undefined;

    // Si le workflow a déjà des canvasNodes sauvegardés, on les utilise directement
    if (wf.canvasNodes && wf.canvasNodes.length > 0) {
      return wf.canvasNodes;
    }

    // Sinon on reconstruit depuis les étapes (workflows créés avant la feature canvas)
    const debutNode = {
      id: 'debut', type: 'debut', label: 'Debut',
      x: 280, y: 40,
      form: { fields: [] }, checklist: [],
      claims: { canValidate: true, canReject: true, canModify: false, canView: true },
    };

    const stepNodes = (wf.steps || []).map((step, i) => ({
      id:               'etape_' + (step._id || i),
      type:             'etape',
      label:            step.name,
      x:                280,
      y:                140 + i * 140,
      description:      step.description   || '',
      assignedTo:       step.assignedTo?._id?.toString() || step.assignedTo?.toString() || null,
      assignedToName:   step.assignedToName  || '',
      assignedRole:     step.assignedRole    || '',
      assignedPost:     step.assignedPost    || '',
      assignedPostName: step.assignedPostName || '',
      delai:            step.delai           || '',
      form:             step.form            || { fields: [] },
      checklist:        step.checklist       || [],
      claims:           step.claims          || { canValidate: true, canReject: true, canModify: false, canView: true },
    }));

    const finNode = {
      id: 'fin_auto', type: 'fin', label: 'Fin',
      x: 280, y: 140 + stepNodes.length * 140,
      form: { fields: [] }, checklist: [],
      claims: { canValidate: true, canReject: true, canModify: false, canView: true },
    };

    return [debutNode, ...stepNodes, finNode];
  };

  const buildInitialEdges = (wf) => {
    if (!wf) return undefined;

    // Si des edges canvas sont sauvegardés, on les utilise
    if (wf.canvasEdges && wf.canvasEdges.length > 0) {
      return wf.canvasEdges;
    }

    // Sinon on construit une chaîne linéaire simple
    const nodes = buildInitialNodes(wf);
    if (!nodes || nodes.length < 2) return [];

    return nodes.slice(0, -1).map((node, i) => ({
      from: node.id,
      to:   nodes[i + 1].id,
      label: '',
    }));
  };

  // ── Rendu ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Chargement du workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '480px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚫</div>
          <h2 style={{ color: '#dc2626', margin: '0 0 12px' }}>Modification impossible</h2>
          <p style={{ color: '#64748b', margin: '0 0 24px' }}>{error}</p>
          <button
            onClick={handleCancel}
            style={{ padding: '10px 24px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Retour au workflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorkflowEditor
      projectId={workflow?.project}
      workflowName={workflow?.name}
      initialNodes={buildInitialNodes(workflow)}
      initialEdges={buildInitialEdges(workflow)}
      initialVisibility={workflow?.visibility || 'global'}
      initialAllowedRoles={workflow?.allowedRoles || []}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default WorkflowEditPage;
