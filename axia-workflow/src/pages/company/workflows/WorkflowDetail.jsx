import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import workflowService from '../../../services/workflowService';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
// ── Composant Signature Canvas ────────────────────────────────────────────────
const SignatureCanvas = ({ value, onChange, required }) => {
  const canvasRef   = useRef(null);
  const isDrawing   = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mode, setMode] = useState('draw');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDraw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <button type="button" onClick={() => setMode('draw')} style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: mode === 'draw' ? '#4f46e5' : 'transparent', color: mode === 'draw' ? '#fff' : '#64748b' }}>
          ✏️ Dessiner
        </button>
        <button type="button" onClick={() => setMode('type')} style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px', background: mode === 'type' ? '#4f46e5' : 'transparent', color: mode === 'type' ? '#fff' : '#64748b' }}>
          ⌨️ Taper
        </button>
      </div>
      {mode === 'draw' ? (
        <div>
          <canvas ref={canvasRef} width={400} height={120} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{isEmpty ? 'Signez dans la zone ci-dessus' : '✓ Signature dessinée'}</span>
            <button type="button" onClick={clearCanvas} style={{ padding: '3px 10px', borderRadius: '5px', border: '1px solid #e2e8f0', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Effacer</button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px' }}>
          <input type="text" value={typeof value === 'string' && !value.startsWith('data:') ? value : ''} onChange={e => onChange(e.target.value)} placeholder="Tapez votre nom complet" style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'cursive', fontSize: '18px', color: '#0f172a', boxSizing: 'border-box' }} />
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Votre nom complet fera office de signature</p>
        </div>
      )}
    </div>
  );
};

// ── Noeud custom react-flow pour chaque étape ────────────────────────────────
const StepNode = ({ data }) => {
  const statusCfg = {
    completed:   { bg: '#f0fdf4', border: '#059669', color: '#059669', icon: '✓', label: 'Validée'    },
    in_progress: { bg: '#eff6ff', border: '#4f46e5', color: '#4f46e5', icon: '⟳', label: 'En cours'   },
    rejected:    { bg: '#fff5f5', border: '#dc2626', color: '#dc2626', icon: '✗', label: 'Rejetée'    },
    pending:     { bg: '#f8fafc', border: '#cbd5e1', color: '#94a3b8', icon: '',  label: 'En attente' },
  };
  const cfg = statusCfg[data.status] || statusCfg.pending;
  const isActive = data.status === 'in_progress';

  return (
    <div style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: '12px', padding: '12px 16px', minWidth: '160px', maxWidth: '200px', boxShadow: isActive ? `0 0 0 4px ${cfg.border}30, 0 4px 12px rgba(0,0,0,0.1)` : '0 2px 6px rgba(0,0,0,0.06)', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
      {isActive && (
        <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f59e0b', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>!</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: cfg.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
          {cfg.icon || data.order}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '1px 6px', borderRadius: '20px' }}>
          {cfg.label}
        </span>
      </div>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', color: '#0f172a', lineHeight: 1.3 }}>{data.name}</p>
      {(data.assignedToName || data.assignedPost || data.assignedRole) && (
        <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#64748b' }}>👤 {data.assignedToName || data.assignedPost || data.assignedRole}</p>
      )}
      {data.delai && (() => {
      const info = getDelaiInfo(
        { delai: data.delai, status: data.status, startedAt: data.startedAt },
        data.workflow
      );
      if (!info) return <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>⏱ {data.delai}</p>;
      if (info.depasse) return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
          🔴 En retard · {info.restant}
        </span>
      );
      if (data.status === 'in_progress') return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
          ⏱ {info.restant}
        </span>
      );
      return <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8' }}>⏱ {data.delai}</p>;
    })()}
      {data.completedAt && (
        <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#059669', fontWeight: 600 }}>✓ {new Date(data.completedAt).toLocaleDateString('fr-FR')}</p>
      )}
    </div>
  );
};

const TerminalNode = ({ data }) => (
  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: data.isEnd ? (data.allDone ? '#059669' : '#e2e8f0') : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '3px solid #fff' }}>
    <span>{data.isEnd ? (data.allDone ? '🏁' : '⬜') : '🚀'}</span>
  </div>
);

const allNodeTypes = { stepNode: StepNode, terminalNode: TerminalNode };
// ── Helper délai ─────────────────────────────────────────────────────────────
const parseDelaiMs = (delai) => {
  if (!delai) return null;
  const s = delai.trim().toLowerCase();
  const match = s.match(/^(\d+(?:[.,]\d+)?)\s*(h|heure|heures|j|jour|jours|d|min|minute|minutes)$/);
  if (!match) return null;
  const val = parseFloat(match[1].replace(',', '.'));
  const unit = match[2];
  if (unit === 'min' || unit === 'minute' || unit === 'minutes') return val * 60 * 1000;
  if (unit === 'h' || unit === 'heure' || unit === 'heures')     return val * 3600 * 1000;
  if (unit === 'j' || unit === 'jour'  || unit === 'jours' || unit === 'd') return val * 86400 * 1000;
  return null;
};

const getDelaiInfo = (step, workflow) => {
  if (!step?.delai) return null;
  const delaiMs   = parseDelaiMs(step.delai);
  if (!delaiMs)   return { label: step.delai, depasse: false, restant: null };
  const startDate = step.startedAt ? new Date(step.startedAt) : new Date(workflow?.createdAt);
  const deadline  = new Date(startDate.getTime() + delaiMs);
  const now       = new Date();
  const depasse   = now > deadline;
  const diffMs    = Math.abs(deadline - now);
  const diffH     = Math.floor(diffMs / 3600000);
  const diffMin   = Math.floor((diffMs % 3600000) / 60000);
  const restant   = depasse
    ? (diffH > 0 ? `${diffH}h ${diffMin}min de retard` : `${diffMin}min de retard`)
    : (diffH > 0 ? `${diffH}h ${diffMin}min restantes` : `${diffMin}min restantes`);
  return { label: step.delai, depasse, restant, deadline };
};
const buildGraphFromSteps = (steps, canvasNodes, canvasEdges) => {
  // ── Sanitize helper ──────────────────────────────────────────────────────
  const isValidNode = (n) =>
    n &&
    n.id &&
    n.position &&
    typeof n.position.x === 'number' &&
    typeof n.position.y === 'number';

  if (canvasNodes && canvasNodes.length > 0 && canvasNodes.every(isValidNode)) {
    // Les canvasNodes sont valides → on les enrichit avec le statut actuel
    const enrichedNodes = canvasNodes.map(n => {
      if (n.type === 'stepNode') {
        const stepIndex = n.data?.stepIndex ?? (n.data?.order != null ? n.data.order - 1 : -1);
        const step = steps[stepIndex] || steps.find(s => s.name === n.data?.name);
        if (step) {
          return {
            ...n,
            position: { x: Number(n.position.x), y: Number(n.position.y) },
            data: {
              ...n.data,
              status: step.status,
              completedAt: step.completedAt,
              assignedToName: step.assignedToName,
              assignedPost: step.assignedPost,
              assignedRole: step.assignedRole,
              delai: step.delai,
            },
          };
        }
      }
      return {
        ...n,
        position: { x: Number(n.position.x), y: Number(n.position.y) },
      };
    });

    const enrichedEdges = (canvasEdges || []).map(e => ({
      ...e,
      animated: steps[parseInt(e.source?.replace('step-', ''))]?.status === 'in_progress',
      style: { stroke: '#4f46e5', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
    }));

    return { nodes: enrichedNodes, edges: enrichedEdges };
  }

  // ── Fallback : graphe linéaire généré automatiquement ────────────────────
  const GAP_X = 240, START_X = 60, Y = 80;
  const edgeColor = (step) =>
    step?.status === 'completed'   ? '#059669' :
    step?.status === 'rejected'    ? '#dc2626' :
    step?.status === 'in_progress' ? '#4f46e5' : '#cbd5e1';

  const nodes = [
    {
      id: 'start',
      type: 'terminalNode',
      position: { x: START_X, y: Y },
      data: { isEnd: false },
      draggable: false,
    },
    ...steps.map((step, i) => ({
      id: `step-${i}`,
      type: 'stepNode',
      position: { x: START_X + GAP_X * (i + 1), y: Y - 30 },
      data: { ...step, order: i + 1, stepIndex: i },
    })),
    {
      id: 'end',
      type: 'terminalNode',
      position: { x: START_X + GAP_X * (steps.length + 1), y: Y },
      data: { isEnd: true, allDone: steps.every(s => s.status === 'completed') },
      draggable: false,
    },
  ];

  const edges = [
    {
      id: 'e-start-0',
      source: 'start',
      target: 'step-0',
      animated: steps[0]?.status === 'in_progress',
      style: { stroke: edgeColor(steps[0]), strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor(steps[0]) },
    },
    ...steps.slice(0, -1).map((step, i) => ({
      id: `e-${i}-${i + 1}`,
      source: `step-${i}`,
      target: `step-${i + 1}`,
      animated: step.status === 'in_progress',
      style: { stroke: edgeColor(step), strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor(step) },
    })),
    {
      id: 'e-last-end',
      source: `step-${steps.length - 1}`,
      target: 'end',
      animated: steps[steps.length - 1]?.status === 'in_progress',
      style: { stroke: edgeColor(steps[steps.length - 1]), strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor(steps[steps.length - 1]) },
    },
  ];

  return { nodes, edges };
};

// ── Composant WorkflowGraph avec react-flow ───────────────────────────────────
const WorkflowGraph = ({ steps, currentStep, canvasNodes: savedNodes, canvasEdges: savedEdges }) => {
  const { nodes: initNodes, edges: initEdges } = React.useMemo(
    () => buildGraphFromSteps(steps || [], savedNodes, savedEdges),
    [steps, savedNodes, savedEdges]
  );
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  if (!steps || steps.length === 0) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Aucune étape à afficher</div>
  );

  return (
    <div style={{ height: '420px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={allNodeTypes} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.3} maxZoom={2} attributionPosition="bottom-right">
        <Background color="#f1f5f9" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'terminalNode') return '#059669';
            const s = n.data?.status;
            return s === 'completed' ? '#059669' : s === 'in_progress' ? '#4f46e5' : s === 'rejected' ? '#dc2626' : '#cbd5e1';
          }}
          style={{ borderRadius: '8px', border: '1px solid #e2e8f0',bottom: 10,right: 10, }}
        />
      </ReactFlow>
    </div>
  );
};

// ── Historique Timeline ───────────────────────────────────────────────────────
const HistoryTimeline = ({ history }) => {
  if (!history || history.length === 0) return null;
  const actionConfig = {
    workflow_started:   { icon: '🚀', color: '#4f46e5', label: 'Workflow démarré' },
    step_completed:     { icon: '✅', color: '#059669', label: 'Étape validée' },
    step_rejected:      { icon: '❌', color: '#dc2626', label: 'Étape rejetée' },
    workflow_completed: { icon: '🎉', color: '#059669', label: 'Workflow terminé' },
  };
  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      <div style={{ position: 'absolute', left: '11px', top: '12px', bottom: '12px', width: '2px', background: '#e2e8f0' }} />
      {[...history].reverse().map((h, i) => {
        const cfg = actionConfig[h.action] || { icon: '•', color: '#94a3b8', label: h.action };
        const isFirst = i === 0;
        return (
          <div key={i} style={{ position: 'relative', marginBottom: '20px', paddingLeft: '20px' }}>
            <div style={{ position: 'absolute', left: '-13px', top: '8px', width: '20px', height: '20px', borderRadius: '50%', background: isFirst ? cfg.color : '#fff', border: `2px solid ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', zIndex: 1 }}>
              {isFirst ? <span style={{ color: '#fff', fontSize: '10px' }}>{cfg.icon}</span> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color }} />}
            </div>
            <div style={{ background: isFirst ? cfg.color + '10' : '#f8fafc', border: `1px solid ${isFirst ? cfg.color + '30' : '#e2e8f0'}`, borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '13px', color: isFirst ? cfg.color : '#0f172a' }}>{cfg.icon} {cfg.label}{h.stepName && ` — "${h.stepName}"`}</p>
                  {h.byName && <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#64748b' }}>Par <strong>{h.byName}</strong></p>}
                  {h.comment && (
                    <div style={{ marginTop: '6px', padding: '8px 10px', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#374151', fontStyle: 'italic' }}>"{h.comment}"</p>
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{new Date(h.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
// ── Composant Analyse IA ──────────────────────────────────────────────────────
const WorkflowAnalysis = ({ workflow }) => {
  const [analysis,  setAnalysis]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await workflowService.analyzeWorkflow(workflow);
      setAnalysis(res.data);
    } catch (err) {
      setError('Erreur analyse : ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const typeConfig = {
    warning: { bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: '⚠️' },
    success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '✅' },
    danger:  { bg: '#fff5f5', border: '#fecaca', color: '#dc2626', icon: '🚨' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: '💡' },
  };

  const priorityBadge = {
    haute:   { bg: '#fee2e2', color: '#dc2626', label: 'Haute' },
    moyenne: { bg: '#fef3c7', color: '#92400e', label: 'Moyenne' },
    info:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Info' },
  };

  const scoreColor = !analysis ? '#94a3b8'
    : analysis.score >= 75 ? '#059669'
    : analysis.score >= 50 ? '#f59e0b'
    : '#dc2626';

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            🤖 Analyse IA du workflow
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Obtenez des recommandations personnalisées basées sur les données réelles de ce workflow
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{ padding: '10px 20px', borderRadius: '8px', background: loading ? '#e2e8f0' : '#4f46e5', color: loading ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? '⏳ Analyse...' : '🔍 Analyser'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fff5f5', color: '#dc2626', fontWeight: 600, marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {!analysis && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🤖</p>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
            Cliquez sur "Analyser" pour obtenir des recommandations IA
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px' }}>
            L'IA analysera les étapes, délais, historique et points de blocage
          </p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4f46e5' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
          <p style={{ margin: 0, fontWeight: 600 }}>Analyse en cours...</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>L'IA examine votre workflow</p>
        </div>
      )}

      {analysis && !loading && (
        <div>
          {/* Score + Résumé */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', textAlign: 'center', minWidth: '120px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '36px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {analysis.score}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                Score /100
              </div>
              <div style={{ marginTop: '8px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                <div style={{ height: '100%', width: analysis.score + '%', background: scoreColor, borderRadius: '3px', transition: 'width 1s' }} />
              </div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#374151', fontStyle: 'italic', lineHeight: 1.6 }}>
                "{analysis.resume}"
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            Recommandations ({analysis.suggestions?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(analysis.suggestions || []).map((s, i) => {
              const tc = typeConfig[s.type] || typeConfig.info;
              const pb = priorityBadge[s.priorite] || priorityBadge.info;
              return (
                <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', background: tc.bg, border: '1px solid ' + tc.border }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', color: tc.color }}>
                        {tc.icon} {s.titre}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                        {s.detail}
                      </p>
                    </div>
                    <span style={{ background: pb.bg, color: pb.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                      {pb.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Relancer */}
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button onClick={handleAnalyze} style={{ padding: '7px 16px', borderRadius: '7px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
              🔄 Relancer l'analyse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
// ── WorkflowDetail principal ──────────────────────────────────────────────────
const WorkflowDetail = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [workflow,   setWorkflow]   = useState(null);
  const [documents,  setDocuments]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [comment,    setComment]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [formValues, setFormValues] = useState({});
  const [checklist,  setChecklist]  = useState([]);
  const [activeTab,  setActiveTab]  = useState('progression');
  const fileInputRef = useRef();

  // ── État pour le panneau Visibilité (admin uniquement) ───────────────────────
  const [visForm,    setVisForm]    = useState({ visibility: 'global', allowedRoles: [], allowedPosts: [] });
  const [visSaving,  setVisSaving]  = useState(false);
  const [visMsg,     setVisMsg]     = useState('');
  const [archiving,  setArchiving]  = useState(false);

  const roleName      = typeof user?.role === 'object' ? user?.role?.name : user?.role;
  const isAdmin       = roleName === 'company_admin' || user?.isCompanyAdmin;
  const currentUserId = user?._id?.toString();

  useEffect(() => { fetchData(); }, [id]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await workflowService.getById(id);
      const wf  = res.data ? res.data.workflow : null;
      setWorkflow(wf);
      setDocuments(res.data ? res.data.documents || [] : []);
      if (wf && wf.steps && wf.steps[wf.currentStep]) {
        const step     = wf.steps[wf.currentStep];
        const initForm = {};
        // FIX BUG 1 : le schema Mongoose utilise 'data' pas 'value'
        (step.form?.fields || []).forEach((f) => { initForm[f.id] = f.data ?? ''; });
        setFormValues(initForm);
        setChecklist((step.checklist || []).map((item) => ({ ...item })));
      }
      // ── Synchroniser le formulaire de visibilité avec les données chargées ──
      if (wf) {
        setVisForm({
          visibility:   wf.visibility   || 'global',
          allowedRoles: wf.allowedRoles || [],
          allowedPosts: wf.allowedPosts || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  // ── Sauvegarder la configuration de visibilité ───────────────────────────────
  const handleSaveVisibility = async () => {
    setVisSaving(true);
    setVisMsg('');
    try {
      await workflowService.updateVisibility(id, visForm);
      setVisMsg('SUCCESS Droits d\'accès mis à jour !');
      fetchData();
    } catch (err) {
      setVisMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setVisSaving(false); }
  };

  // ── Archiver le workflow ─────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!window.confirm('Archiver ce workflow ? Il ne sera plus visible dans les listes actives.')) return;
    setArchiving(true);
    try {
      await workflowService.archive(id);
      showMsg('SUCCESS Workflow archivé !');
      fetchData();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setArchiving(false); }
  };
  const handleFormChange      = (fieldId, value) => setFormValues(prev => ({ ...prev, [fieldId]: value }));
  const handleChecklistToggle = (index) => setChecklist(prev => {
    const u = [...prev]; u[index] = { ...u[index], checked: !u[index].checked }; return u;
  });

  const handleComplete = async () => {
    const step = workflow.steps[workflow.currentStep];
    const missingFields = (step.form?.fields || []).filter(f => {
      if (!f.required) return false;
      const val = formValues[f.id];
      if (f.type === 'signature') return !val || val === '';
      return !val;
    });
    if (missingFields.length > 0) { showMsg('ERREUR Champs obligatoires : ' + missingFields.map(f => f.label).join(', ')); return; }
    const missingChecks = checklist.filter(item => item.required && !item.checked);
    if (missingChecks.length > 0) { showMsg('ERREUR Checklist incomplète : ' + missingChecks.map(i => i.label).join(', ')); return; }
    setSaving(true);
    try {
      await workflowService.completeStep(id, { comment, formData: formValues, checklistData: checklist });
      setComment(''); setFormValues({}); setChecklist([]);
      showMsg('SUCCESS Étape validée !');
      fetchData();
    } catch (err) {
      showMsg('ERREUR : ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleReject = async () => {
    if (!comment.trim()) { showMsg('ERREUR Un commentaire est requis pour rejeter'); return; }
    setSaving(true);
    try {
      await workflowService.rejectStep(id, { comment });
      setComment('');
      showMsg('WARN Étape rejetée');
      fetchData();
    } catch (err) {
      showMsg('ERREUR : ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workflowId', id);
      formData.append('stepIndex', String(workflow.currentStep));
      await workflowService.uploadDocument(formData);
      showMsg('SUCCESS Document uploadé !');
      fetchData();
    } catch (err) {
      showMsg('ERREUR upload : ' + (err.response?.data?.message || err.message));
    } finally { setUploading(false); e.target.value = ''; }
  };

  const renderField = (field) => {
    const value   = formValues[field.id] !== undefined ? formValues[field.id] : '';
    const baseInp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
    const labelEl = (
      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
        {field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}
      </label>
    );

    // ── Champs automatiques (lecture seule) ──────────────────────────────────
    if (['auto_number', 'auto_user', 'auto_status'].includes(field.type)) {
      const autoVal = field.type === 'auto_user'
        ? (user?.firstName + ' ' + user?.lastName)
        : field.type === 'auto_status' ? 'En cours'
        : (value || 'Généré automatiquement');
      return (
        <div key={field.id} style={{ marginBottom: '14px' }}>
          {labelEl}
          <div style={{ ...baseInp, background: '#f8fafc', color: '#64748b', border: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px' }}>⚙</span>
            <span>{autoVal}</span>
          </div>
        </div>
      );
    }

    // ── Tableau dynamique ────────────────────────────────────────────────────
    if (field.type === 'table') {
      const columns = field.columns || [];
      const rows    = Array.isArray(value) ? value : [{}];
      const updateRow = (ri, colId, val) => {
        const updated = [...rows];
        updated[ri] = { ...updated[ri], [colId]: val };
        handleFormChange(field.id, updated);
      };
      const addRow = () => handleFormChange(field.id, [...rows, {}]);
      const removeRow = (ri) => handleFormChange(field.id, rows.filter((_, i) => i !== ri));
      return (
        <div key={field.id} style={{ marginBottom: '14px' }}>
          {labelEl}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {columns.map((col) => (
                    <th key={col.id} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      {col.label}{col.required && <span style={{ color: '#dc2626' }}> *</span>}
                    </th>
                  ))}
                  <th style={{ padding: '8px 12px', width: '40px', borderBottom: '1px solid #e2e8f0' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {columns.map((col) => (
                      <td key={col.id} style={{ padding: '6px 8px' }}>
                        <input
                          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                          value={row[col.id] || ''}
                          onChange={(e) => updateRow(ri, col.id, e.target.value)}
                          placeholder={col.label}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(ri)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '24px', height: '24px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={addRow}
            style={{ marginTop: '6px', padding: '5px 14px', borderRadius: '6px', border: '1px dashed #4f46e5', background: '#f5f3ff', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            + Ajouter une ligne
          </button>
        </div>
      );
    }

    // ── Fichier ──────────────────────────────────────────────────────────────
    if (field.type === 'file') return (
      <div key={field.id} style={{ marginBottom: '14px' }}>
        {labelEl}
        <input type="file" onChange={(e) => handleFormChange(field.id, e.target.files[0]?.name || '')} style={{ ...baseInp, padding: '6px' }} />
      </div>
    );

    if (field.type === 'signature') return (
      <div key={field.id} style={{ marginBottom: '14px' }}>{labelEl}<SignatureCanvas value={value} onChange={val => handleFormChange(field.id, val)} required={field.required} /></div>
    );
    if (field.type === 'select') return (
      <div key={field.id} style={{ marginBottom: '14px' }}>{labelEl}<select value={value} onChange={e => handleFormChange(field.id, e.target.value)} style={baseInp}><option value="">-- Choisir --</option>{(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}</select></div>
    );
    if (field.type === 'textarea') return (
      <div key={field.id} style={{ marginBottom: '14px' }}>{labelEl}<textarea value={value} onChange={e => handleFormChange(field.id, e.target.value)} rows={3} style={{ ...baseInp, resize: 'vertical' }} placeholder={field.label} /></div>
    );
    if (field.type === 'checkbox') return (
      <div key={field.id} style={{ marginBottom: '14px' }}><label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><input type="checkbox" checked={value === true || value === 'true'} onChange={e => handleFormChange(field.id, e.target.checked)} style={{ width: '18px', height: '18px' }} /><span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{field.label}{field.required && <span style={{ color: '#dc2626', marginLeft: '4px' }}>*</span>}</span></label></div>
    );
    return (
      <div key={field.id} style={{ marginBottom: '14px' }}>{labelEl}<input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} value={value} onChange={e => handleFormChange(field.id, e.target.value)} placeholder={field.label} style={baseInp} /></div>
    );
  };

  const getFileIcon  = (type) => ({ image: 'IMG', video: 'VID', pdf: 'PDF', document: 'DOC' }[type] || 'FILE');
  const formatSize   = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading)   return <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>;
  if (!workflow) return <div style={{ padding: '40px' }}>Workflow non trouvé</div>;

  const activeStep    = workflow.steps?.[workflow.currentStep] || null;
  const isActive      = workflow.status === 'active';
  const isCompleted   = workflow.status === 'completed';
  const isRejected    = workflow.status === 'rejected';
  const userPost      = user?.jobTitle || '';
  const assignedTo    = activeStep?.assignedTo?.toString();
  const assignedRole  = activeStep?.assignedRole;
  const assignedPost  = activeStep?.assignedPost;
  const isAssignedToMe   = assignedTo && assignedTo === currentUserId;
  const isAssignedByRole = !assignedTo && assignedRole && assignedRole === roleName;
  // FIX BUG 2 : comparaison insensible à la casse pour les postes
  const isAssignedByPost = !assignedTo && assignedPost &&
    assignedPost.toLowerCase().trim() === userPost.toLowerCase().trim();
  const canAct           = !isAdmin && (isAssignedToMe || isAssignedByRole || isAssignedByPost);
  const stepClaims       = activeStep?.claims || { canValidate: true, canReject: true, canModify: false, canView: true };
  // FIX BUG 3 : le créateur peut toujours valider step 0 (sa propre demande)
  // même si canValidate=false sur l'étape employé
  const isCreator         = workflow?.createdBy?._id?.toString() === currentUserId ||
                            workflow?.createdBy?.toString()       === currentUserId;
  const isStep0ByCreator  = isCreator && workflow?.currentStep === 0;
  const canValidateStep   = (canAct || isStep0ByCreator) && (isStep0ByCreator || stepClaims.canValidate !== false);
  const canRejectStep     = canAct && stepClaims.canReject !== false;

  const statusMap = {
    active:    { bg: '#eff6ff', color: '#1d4ed8', label: 'Actif' },
    completed: { bg: '#f0fdf4', color: '#166534', label: 'Terminé' },
    rejected:  { bg: '#fff5f5', color: '#dc2626', label: 'Rejeté' },
    draft:     { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon' },
  };
  const statusStyle = statusMap[workflow.status] || statusMap.draft;

  let msgBg = '#f1f5f9', msgColor = '#334155', msgText = msg;
  if (msg.startsWith('SUCCESS')) { msgBg = '#f0fdf4'; msgColor = '#166534'; msgText = msg.replace('SUCCESS ', ''); }
  else if (msg.startsWith('ERREUR')) { msgBg = '#fff5f5'; msgColor = '#dc2626'; msgText = msg.replace('ERREUR ', ''); }
  else if (msg.startsWith('WARN'))   { msgBg = '#fef3c7'; msgColor = '#92400e'; msgText = msg.replace('WARN ', ''); }

  const hasForm      = activeStep?.form?.fields?.length > 0;
  const hasChecklist = checklist.length > 0;

  const tabStyle = (tab) => ({
    padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
    background: activeTab === tab ? '#4f46e5' : 'transparent',
    color:      activeTab === tab ? '#fff' : '#64748b',
    borderRadius: '8px 8px 0 0',
    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
  });

  const totalSteps = workflow.steps?.length || 0;
  const doneSteps  = workflow.steps?.filter(s => s.status === 'completed').length || 0;
  const progress   = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{workflow.name}</h1>
            <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>{statusStyle.label}</span>
            {isAdmin && workflow.status === 'draft' && (
              <button onClick={() => navigate('/dashboard/company/workflows/' + workflow._id + '/edit')} style={{ padding: '6px 14px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>✏️ Modifier</button>
            )}
            {/* ── Bouton Archiver (admin, statuts terminé / rejeté / brouillon) ── */}
            {isAdmin && ['completed', 'rejected', 'draft'].includes(workflow.status) && (
              <button
                onClick={handleArchive}
                disabled={archiving}
                style={{ padding: '6px 14px', borderRadius: '8px', background: archiving ? '#e2e8f0' : '#64748b', color: archiving ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, cursor: archiving ? 'not-allowed' : 'pointer', fontSize: '13px' }}
              >
                {archiving ? '⏳ Archivage...' : '🗄️ Archiver'}
              </button>
            )}
          </div>
          {workflow.status !== 'draft' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '3px', maxWidth: '300px' }}>
                <div style={{ height: '100%', width: progress + '%', background: isCompleted ? '#059669' : isRejected ? '#dc2626' : '#4f46e5', borderRadius: '3px', transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{progress}% — {doneSteps}/{totalSteps} étapes</span>
              {workflow.dueDate && <span style={{ fontSize: '12px', color: '#94a3b8' }}>Échéance : {new Date(workflow.dueDate).toLocaleDateString('fr-FR')}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Message ── */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, background: msgBg, color: msgColor }}>{msgText}</div>
      )}

      {/* ── Onglets ── */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button style={tabStyle('progression')} onClick={() => setActiveTab('progression')}>📊 Progression</button>
        <button style={tabStyle('graphe')} onClick={() => setActiveTab('graphe')}>🔗 Graphe visuel</button>
        <button style={tabStyle('historique')} onClick={() => setActiveTab('historique')}>📋 Historique ({workflow.history?.length || 0})</button>
        {documents.length > 0 && (
        <button style={tabStyle('documents')} onClick={() => setActiveTab('documents')}>📎 Documents ({documents.length})</button>
        )}
       <button style={tabStyle('ia')} onClick={() => setActiveTab('ia')}>🤖 Analyse IA</button>
        {isAdmin && (
          <button style={tabStyle('acces')} onClick={() => setActiveTab('acces')}>🔒 Accès</button>
        )}
      </div>

      {/* ── TAB PROGRESSION ── */}
      {activeTab === 'progression' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto' }}>
            {(workflow.steps || []).map((step, i) => {
              const bg    = step.status === 'completed' ? '#059669' : step.status === 'in_progress' ? '#4f46e5' : step.status === 'rejected' ? '#dc2626' : '#e2e8f0';
              const color = step.status === 'pending' ? '#94a3b8' : '#fff';
              const lc    = step.status === 'in_progress' ? '#4f46e5' : step.status === 'completed' ? '#059669' : step.status === 'rejected' ? '#dc2626' : '#94a3b8';
              const lbl   = step.status === 'completed' ? '✓' : step.status === 'rejected' ? '✗' : String(i + 1);
              return (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '90px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', marginBottom: '8px', background: bg, color, border: step.status === 'in_progress' ? '3px solid #818cf8' : '3px solid transparent' }}>{lbl}</div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', maxWidth: '90px', color: lc }}>{step.name}</span>
                    {(step.assignedToName || step.assignedPost) && <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{step.assignedToName || step.assignedPost}</span>}
                    {step.status === 'completed' && step.comment && <span style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontStyle: 'italic', maxWidth: '90px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{step.comment}"</span>}
                  </div>
                  {i < workflow.steps.length - 1 && (
                    <div style={{ height: '3px', flex: 0.5, minWidth: '20px', marginBottom: '40px', background: step.status === 'completed' ? '#059669' : step.status === 'rejected' ? '#dc2626' : '#e2e8f0', borderRadius: '2px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          {isAdmin && (
            <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Détail des étapes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(workflow.steps || []).map((step, i) => {
                  const sc = { completed: { bg: '#f0fdf4', border: '#86efac', color: '#166534', label: 'Validée' }, in_progress: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', label: 'En cours' }, rejected: { bg: '#fff5f5', border: '#fecaca', color: '#dc2626', label: 'Rejetée' }, pending: { bg: '#f8fafc', border: '#e2e8f0', color: '#94a3b8', label: 'En attente' } }[step.status] || { bg: '#f8fafc', border: '#e2e8f0', color: '#94a3b8', label: 'En attente' };
                  return (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: '10px', background: sc.bg, border: '1px solid ' + sc.border, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: sc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: sc.color, flexShrink: 0 }}>{i + 1}</div>
  <div style={{ flex: 1 }}>
    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{step.name}</p>
    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{step.assignedToName ? 'Assigné à : ' + step.assignedToName : step.assignedPost ? 'Poste : ' + step.assignedPost : step.assignedRole ? 'Rôle : ' + step.assignedRole : 'Non assigné'}{step.completedAt ? ' · ' + new Date(step.completedAt).toLocaleDateString('fr-FR') : ''}</p>
    {step.comment && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>"{step.comment}"</p>}
    {(step.form?.fields || []).filter(f => f.type === 'signature' && f.data).map(f => (
      <div key={f.id} style={{ marginTop: '8px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{f.label} :</p>
        {f.data?.startsWith('data:') ? (
          <img src={f.data} alt="signature" style={{ maxHeight: '60px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', padding: '4px' }} />
        ) : (
          <span style={{ fontFamily: 'cursive', fontSize: '18px', color: '#0f172a' }}>{f.data}</span>
        )}
      </div>
    ))}
  </div>
  <span style={{ background: sc.border, color: sc.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{sc.label}</span>
</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB GRAPHE VISUEL ── */}
      {activeTab === 'graphe' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Visualisation graphique du processus
          </h2>
          <WorkflowGraph
            steps={workflow.steps}
            currentStep={workflow.currentStep}
            canvasNodes={workflow.canvasNodes}
            canvasEdges={workflow.canvasEdges}
          />
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            {[
              { color: '#059669', label: 'Validée' },
              { color: '#4f46e5', label: 'En cours' },
              { color: '#dc2626', label: 'Rejetée' },
              { color: '#cbd5e1', label: 'En attente' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.color }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB HISTORIQUE ── */}
      {activeTab === 'historique' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Historique détaillé</h2>
          {(workflow.history || []).length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Aucune action enregistrée</p>
          ) : (
            <HistoryTimeline history={workflow.history} />
          )}
        </div>
      )}

      {/* ── TAB DOCUMENTS ── */}
      {activeTab === 'documents' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Documents ({documents.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {documents.map(doc => {
              const url  = 'http://localhost:3002' + doc.url;
              const info = (doc.uploadedByName || '') + ' — ' + new Date(doc.createdAt).toLocaleString('fr-FR') + (doc.size ? ' — ' + formatSize(doc.size) : '');
              return (
                <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>{getFileIcon(doc.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName || doc.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>{info}</p>
                  </div>
                  <button onClick={() => window.open(url, '_blank')} style={{ background: '#4f46e5', color: '#fff', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>Voir</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* ── TAB ANALYSE IA ── */}
      {activeTab === 'ia' && (
        <WorkflowAnalysis workflow={workflow} />
      )}

      {/* ── TAB ACCÈS & VISIBILITÉ (admin only) ── */}
      {activeTab === 'acces' && isAdmin && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>🔒 Accès & Visibilité</h2>
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
            Contrôlez qui peut voir et interagir avec ce workflow. Ces paramètres s'appliquent à tous les statuts.
          </p>

          {/* Message de confirmation */}
          {visMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '13px',
              background: visMsg.startsWith('SUCCESS') ? '#f0fdf4' : '#fff5f5',
              color:      visMsg.startsWith('SUCCESS') ? '#166534' : '#dc2626' }}>
              {visMsg.replace(/^(SUCCESS|ERREUR)\s?/, '')}
            </div>
          )}

          {/* Toggle global / restreint */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '10px' }}>
              Mode de visibilité
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'global',     label: '🌐 Global',    desc: 'Visible par tous les utilisateurs de l\'organisation' },
                { value: 'restricted', label: '🔐 Restreint', desc: 'Visible uniquement par les rôles / postes configurés ci-dessous' },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setVisForm(p => ({ ...p, visibility: opt.value }))}
                  style={{ flex: 1, padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', border: '2px solid ' + (visForm.visibility === opt.value ? '#4f46e5' : '#e2e8f0'), background: visForm.visibility === opt.value ? '#ede9fe' : '#f8fafc' }}
                >
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '14px', color: visForm.visibility === opt.value ? '#4f46e5' : '#374151' }}>{opt.label}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Champs rôles et postes — visibles seulement en mode restreint */}
          {visForm.visibility === 'restricted' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                  Rôles autorisés
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '8px' }}>séparés par des virgules</span>
                </label>
                <input
                  value={(visForm.allowedRoles || []).join(', ')}
                  onChange={e => setVisForm(p => ({
                    ...p,
                    allowedRoles: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                  }))}
                  placeholder="Ex: manager, company_admin"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                  Postes autorisés
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '8px' }}>séparés par des virgules</span>
                </label>
                <input
                  value={(visForm.allowedPosts || []).join(', ')}
                  onChange={e => setVisForm(p => ({
                    ...p,
                    allowedPosts: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                  }))}
                  placeholder="Ex: Directeur RH, Comptable"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Aperçu résumé */}
              <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
                  ⚠️ En mode restreint, seuls les utilisateurs dont le rôle OU le poste figure dans les listes ci-dessus pourront voir ce workflow.
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleSaveVisibility}
            disabled={visSaving}
            style={{ padding: '11px 24px', borderRadius: '8px', background: visSaving ? '#e2e8f0' : '#4f46e5', color: visSaving ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, cursor: visSaving ? 'not-allowed' : 'pointer', fontSize: '14px' }}
          >
            {visSaving ? 'Sauvegarde...' : '💾 Sauvegarder les droits d\'accès'}
          </button>
        </div>
      )}

      {/* ── Étape courante — Action employé ── */}
      {isActive && activeStep && canAct && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #4f46e5', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Étape en cours : {activeStep.name}</h2>
          {(() => {
            const info = getDelaiInfo(activeStep, workflow);
            if (!info) return null;
            if (info.depasse) return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', border: '1px solid #fecaca', padding: '8px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔴</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '13px', color: '#dc2626' }}>Délai dépassé !</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#dc2626' }}>{info.restant} · Limite était le {info.deadline?.toLocaleString('fr-FR')}</p>
                </div>
              </div>
            );
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef3c7', border: '1px solid #fde68a', padding: '8px 14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>⏱</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#92400e' }}>{info.restant}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#92400e' }}>Limite : {info.deadline?.toLocaleString('fr-FR')}</p>
                </div>
              </div>
            );
          })()}
        </div>
          {hasForm && (
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <span style={{ background: '#4f46e5', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' }}>FORMULAIRE</span>
                Remplissez les champs requis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0 20px' }}>
                {activeStep.form.fields.map(field => renderField(field))}
              </div>
            </div>
          )}
          {hasChecklist && (
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <span style={{ background: '#7c3aed', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginRight: '8px' }}>CHECKLIST</span>
                {checklist.filter(i => i.checked).length}/{checklist.length} complètes
              </h3>
              {checklist.map((item, i) => (
                <div key={item.id || i} onClick={() => handleChecklistToggle(i)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', background: item.checked ? '#f0fdf4' : '#fff', border: '1px solid ' + (item.checked ? '#86efac' : '#e2e8f0'), userSelect: 'none' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: '2px solid ' + (item.checked ? '#059669' : '#d1d5db'), background: item.checked ? '#059669' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.checked && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: item.checked ? '#166534' : '#374151', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.label}</span>
                  {item.required && <span style={{ fontSize: '11px', color: item.checked ? '#059669' : '#dc2626', fontWeight: 700 }}>{item.checked ? 'OK' : 'REQUIS'}</span>}
                </div>
              ))}
            </div>
          )}
          <div onClick={() => !uploading && fileInputRef.current?.click()} style={{ background: '#f8fafc', borderRadius: '10px', border: '2px dashed #e2e8f0', padding: '16px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer' }}>
            <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" />
            {uploading ? <p style={{ color: '#4f46e5', fontWeight: 700, margin: 0 }}>Upload en cours...</p> : <p style={{ color: '#64748b', margin: 0, fontWeight: 600, fontSize: '14px' }}>+ Ajouter un document (max 50MB)</p>}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '6px', fontSize: '14px' }}>
              Commentaire <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '12px' }}>(optionnel pour valider, obligatoire pour rejeter)</span>
            </label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Votre commentaire..." rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {canValidateStep && (
              <button onClick={handleComplete} disabled={saving} style={{ flex: 1, padding: '13px', borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'En cours...' : "Valider l'étape"}
              </button>
            )}
            {canRejectStep && (
              <button onClick={handleReject} disabled={saving} style={{ padding: '13px 28px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>Rejeter</button>
            )}
            {canAct && !canValidateStep && !canRejectStep && (
              <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center', color: '#92400e', fontWeight: 600, fontSize: '13px', width: '100%' }}>
                Vous pouvez voir cette étape mais vous n'avez pas les permissions pour agir.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Message si pas assigné ── */}
      {isActive && activeStep && !isAdmin && !canAct && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', margin: '0 0 12px' }}>⏳</p>
          <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Cette étape n'est pas assignée à vous</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>L'étape "{activeStep.name}" est assignée à {activeStep.assignedToName || activeStep.assignedPost || activeStep.assignedRole || "quelqu'un d'autre"}.</p>
        </div>
      )}

      {/* ── Status final ── */}
      {(isCompleted || isRejected) && (
        <div style={{ background: isCompleted ? '#f0fdf4' : '#fff5f5', border: '2px solid ' + (isCompleted ? '#059669' : '#dc2626'), borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <h3 style={{ color: isCompleted ? '#059669' : '#dc2626', margin: '0 0 8px', fontSize: '20px' }}>
            {isCompleted ? '🎉 Workflow terminé avec succès !' : '❌ Workflow rejeté'}
          </h3>
          {(workflow.completedAt || workflow.updatedAt) && (
            <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Le {new Date(workflow.completedAt || workflow.updatedAt).toLocaleString('fr-FR')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowDetail;