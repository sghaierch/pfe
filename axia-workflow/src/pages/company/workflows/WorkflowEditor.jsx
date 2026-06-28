import React, { useState, useRef, useCallback, useEffect } from 'react';
import workflowService from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Constantes ───────────────────────────────────────────────────────────────

const NODE_TYPES = {
  debut:        { label: 'Debut',        color: '#059669', shape: 'pill'    },
  etape:        { label: 'Etape',        color: '#2563EB', shape: 'rect'    },
  fin:          { label: 'Fin',          color: '#6b7280', shape: 'pill'    },
};

const PALETTE_ITEMS = [
  { type: 'etape',        label: 'Etape',        color: '#2563EB', icon: '='  },
  { type: 'fin',          label: 'Fin',          color: '#6b7280', icon: 'O'  },
];

const FIELD_TYPES = [
  { type: 'text',      label: 'Texte',      icon: 'T',  color: '#2563EB' },
  { type: 'number',    label: 'Nombre',     icon: '123',color: '#7C3AED' },
  { type: 'date',      label: 'Date',       icon: 'D',  color: '#0891B2' },
  { type: 'select',    label: 'Liste',      icon: 'L',  color: '#D97706' },
  { type: 'textarea',  label: 'Zone texte', icon: 'TT', color: '#059669' },
  { type: 'file',      label: 'Fichier',    icon: 'F',  color: '#DC2626' },
  { type: 'checkbox',  label: 'Case',       icon: '✓',  color: '#64748B' },
  { type: 'signature', label: 'Signature',  icon: 'SG', color: '#7C3AED' },
  { type: 'table',     label: 'Tableau',    icon: '⊞',  color: '#0891B2' },
];

// ─── CanvasNode ───────────────────────────────────────────────────────────────

const CanvasNode = ({ node, selected, onSelect, onDragStart, onConnect, connecting, users }) => {
  const cfg          = NODE_TYPES[node.type] || NODE_TYPES.etape;
  const hasForm      = (node.form?.fields?.length || 0) > 0;
  const hasChecklist = (node.checklist?.length || 0) > 0;
  const assignedUser = users.find((u) => u._id === node.assignedTo);

  return (
    <div
      style={{ position: 'absolute', left: node.x, top: node.y, minWidth: '150px', zIndex: selected ? 10 : 5 }}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(e, node.id); }}
    >
      <div style={{
        padding: '10px 16px', background: cfg.color, color: '#fff',
        fontWeight: 700, fontSize: '13px', textAlign: 'center', cursor: 'move',
        userSelect: 'none',
        borderRadius: cfg.shape === 'pill' ? '999px' : cfg.shape === 'diamond' ? '0' : '10px',
        transform: cfg.shape === 'diamond' ? 'rotate(45deg)' : 'none',
        boxShadow: selected
          ? '0 0 0 3px #fff, 0 0 0 5px ' + cfg.color
          : '0 4px 12px rgba(0,0,0,0.2)',
      }}>
        <span style={{
          transform: cfg.shape === 'diamond' ? 'rotate(-45deg)' : 'none',
          display: 'block', pointerEvents: 'none',
        }}>
          {node.label || cfg.label}
        </span>
      </div>

      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
        {assignedUser && (
          <div style={{ background: '#1e293b', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {assignedUser.firstName + ' ' + assignedUser.lastName}
          </div>
        )}
        {!assignedUser && node.assignedPost && (
          <div style={{ background: '#2563EB', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
            {node.assignedPost}
          </div>
        )}
        {!assignedUser && !node.assignedPost && node.assignedRole && (
          <div style={{ background: '#64748b', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
            {node.assignedRole}
          </div>
        )}
        <div style={{ display: 'flex', gap: '3px' }}>
          {hasForm && (
            <span style={{ background: '#2563EB', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
              {node.form.fields.length} champs
            </span>
          )}
          {hasChecklist && (
            <span style={{ background: '#7C3AED', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
              {node.checklist.length} taches
            </span>
          )}
          {node.claims && (node.claims.canValidate === false || node.claims.canReject === false) && (
            <span style={{ background: '#f59e0b', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
              claims
            </span>
          )}
        </div>
      </div>

      {/* Point de connexion */}
      <div
        title="Connecter a une autre etape"
        onClick={(e) => { e.stopPropagation(); onConnect(node.id); }}
        style={{
          position: 'absolute',
          bottom: (hasForm || hasChecklist || assignedUser || node.assignedPost) ? '-18px' : '-10px',
          left: '50%', transform: 'translateX(-50%)',
          width: '18px', height: '18px', borderRadius: '50%',
          background: connecting === node.id ? '#fbbf24' : '#fff',
          border: '2px solid ' + cfg.color, cursor: 'crosshair', zIndex: 20,
        }}
      />
    </div>
  );
};

// ─── Arrows SVG ──────────────────────────────────────────────────────────────

const Arrows = ({ edges, nodes, onDeleteEdge }) => {
  const getCenter = (nodeId) => {
    const n = nodes.find((x) => x.id === nodeId);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + 75, y: n.y + 22 };
  };
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const from = getCenter(e.from);
        const to   = getCenter(e.to);
        const mx   = (from.x + to.x) / 2;
        const my   = (from.y + to.y) / 2;
        return (
          <g key={i}>
            <path
              d={`M${from.x},${from.y} C${from.x},${from.y + 60} ${to.x},${to.y - 60} ${to.x},${to.y}`}
              fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#arr)"
            />
            {e.label && (
              <text x={mx} y={my - 6} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                {e.label}
              </text>
            )}
            <circle cx={mx} cy={my} r="8" fill="white" stroke="#e2e8f0" strokeWidth="1"
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onClick={() => onDeleteEdge(i)}
            />
            <text x={mx} y={my + 4} textAnchor="middle" fontSize="10" fill="#dc2626"
              style={{ pointerEvents: 'none' }}>x</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── SortableField — un champ drag & drop dans le formulaire ─────────────────
// ✅ CORRIGÉ : composant autonome avec useSortable correctement appelé

const SortableField = ({ field, fi, updateField, removeField }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity:     isDragging ? 0.5 : 1,
    background:  isDragging ? '#EFF6FF' : '#fff',
    borderRadius:'10px',
    border:      isDragging ? '2px dashed #2563EB' : '1.5px solid #E2E8F0',
    padding:     '10px 12px',
    marginBottom:'8px',
    cursor:      'default',
    boxShadow:   isDragging ? '0 4px 14px rgba(37,99,235,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px', minWidth: 0 }}>

        {/* Poignée drag — listeners uniquement ici */}
        <span
          {...attributes}
          {...listeners}
          title="Glisser pour réordonner"
          style={{
            cursor: 'grab', color: '#94a3b8', fontSize: '16px',
            flexShrink: 0, userSelect: 'none', padding: '0 2px',
            lineHeight: 1, touchAction: 'none',
          }}
        >
          ⠿
        </span>

        {/* Badge type */}
        {(() => {
          const ft = FIELD_TYPES.find(f => f.type === field.type);
          const isAuto = ['auto_user','auto_status','auto_number'].includes(field.type);
          const bc = ft?.color || (isAuto ? '#D97706' : '#64748B');
          return (
            <span style={{ background:`${bc}15`, color:bc, border:`1px solid ${bc}30`, padding:'2px 7px', borderRadius:'5px', fontSize:'10px', fontWeight:800, flexShrink:0, fontFamily:'monospace' }}>
              {ft?.icon || (isAuto ? '⚡' : 'T')}
            </span>
          );
        })()}

        {/* Label éditable */}
        <input
          value={field.label}
          onChange={(e) => updateField(fi, 'label', e.target.value)}
          style={{ flex: 1, minWidth: 0, padding: '4px 8px', borderRadius: '6px', border: '1.5px solid #E2E8F0', fontSize: '12px', outline: 'none' }}
        />

        {/* Supprimer */}
        <button
          onClick={() => removeField(fi)}
          title="Supprimer"
          style={{ background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', width:'22px', height:'22px', borderRadius:'6px', cursor:'pointer', fontSize:'15px', fontWeight:900, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, transition:'all 0.12s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#DC2626';e.currentTarget.style.color='#fff';}}
          onMouseLeave={e=>{e.currentTarget.style.background='#FEF2F2';e.currentTarget.style.color='#DC2626';}}
        >×</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={field.required || false}
            onChange={(e) => updateField(fi, 'required', e.target.checked)}
          />
          Obligatoire
        </label>
        {field.type === 'select' && (
          <input
            value={(field.options || []).join(', ')}
            onChange={(e) => updateField(fi, 'options', e.target.value.split(',').map((s) => s.trim()))}
            placeholder="Option1, Option2, Option3"
            style={{ flex: 1, padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}
          />
        )}
        {['auto_number', 'auto_user', 'auto_status'].includes(field.type) && (
          <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
            Lecture seule — rempli auto
          </span>
        )}
      </div>

      {/* ── Éditeur de colonnes pour type tableau ── */}
      {field.type === 'table' && (
  <div style={{ marginTop: '8px', padding: '8px', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>

    {/* ✅ Case "tableau hérité" — visible seulement si fi > 0 (pas l'étape employé) */}
    {/* fi === 0 = étape employé, on ne peut pas hériter de rien */}
    <div style={{ marginBottom: '8px', padding: '6px 10px', background: field.inheritTableFrom ? '#e0f2fe' : '#f8fafc', borderRadius: '5px', border: `1px solid ${field.inheritTableFrom ? '#7dd3fc' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        id={`inherit_${field.id}`}
        checked={!!field.inheritTableFrom}
        onChange={e => updateField(fi, 'inheritTableFrom', e.target.checked ? 'auto' : '')}
      />
      <label htmlFor={`inherit_${field.id}`} style={{ fontSize: '11px', fontWeight: 700, color: field.inheritTableFrom ? '#0369a1' : '#64748b', cursor: 'pointer' }}>
        📋 Tableau hérité de l'étape employé (données propagées automatiquement)
      </label>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>
        {field.inheritTableFrom ? 'Colonnes supplémentaires (ajoutées à cette étape)' : 'Colonnes du tableau'}
      </span>
      <button
        onClick={() => {
          const cols = field.columns || [];
          updateField(fi, 'columns', [...cols, { id: 'col_' + Date.now(), label: 'Colonne ' + (cols.length + 1), type: 'text', required: false }]);
        }}
        style={{ padding: '2px 8px', borderRadius: '4px', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
      >
        + {field.inheritTableFrom ? 'Colonne supplémentaire' : 'Colonne'}
      </button>
    </div>

    {(field.columns || []).length === 0 && (
      <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
        {field.inheritTableFrom
          ? 'Aucune colonne supplémentaire — les colonnes de l\'employé sont héritées automatiquement'
          : 'Aucune colonne — cliquez sur "+ Colonne"'}
      </p>
    )}

    {(field.columns || []).map((col, ci) => (
      <div key={col.id || ci} style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
        <input
          value={col.label}
          onChange={(e) => {
            const cols = [...(field.columns || [])];
            cols[ci] = { ...cols[ci], label: e.target.value };
            updateField(fi, 'columns', cols);
          }}
          placeholder="Nom colonne"
          style={{ flex: 1, padding: '3px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontSize: '11px' }}
        />
        <select
          value={col.type || 'text'}
          onChange={(e) => {
            const cols = [...(field.columns || [])];
            cols[ci] = { ...cols[ci], type: e.target.value };
            updateField(fi, 'columns', cols);
          }}
          style={{ padding: '3px 5px', borderRadius: '4px', border: '1px solid #bae6fd', fontSize: '11px' }}
        >
          <option value="text">Texte</option>
          <option value="number">Nombre</option>
          <option value="date">Date</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', color: '#64748b', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={col.required || false}
            onChange={(e) => {
              const cols = [...(field.columns || [])];
              cols[ci] = { ...cols[ci], required: e.target.checked };
              updateField(fi, 'columns', cols);
            }}
          />
          Req
        </label>
        <button
          onClick={() => {
            const cols = (field.columns || []).filter((_, i) => i !== ci);
            updateField(fi, 'columns', cols);
          }}
          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '18px', height: '18px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}
        >×</button>
      </div>
    ))}
  </div>
)}
    </div>
  );
};

// ─── PropertiesPanel ──────────────────────────────────────────────────────────
// ✅ CORRIGÉ : sensors et handleDragEnd sont ICI dans le composant (règles des hooks respectées)

  const PropertiesPanel = ({ node, onChange, onDelete, users, posts, allowedPosts, setAllowedPosts, isFirstEtape }) => {  const [tab,      setTab]      = useState('info');
  const [dragOver, setDragOver] = useState(false);

  // ✅ sensors définis dans ce composant (pas dans WorkflowEditor ni hors composant)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Réinitialiser l'onglet quand on change de node
  useEffect(() => { setTab('info'); }, [node?.id]);

  if (!node) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
          Cliquez sur un element du canvas pour le configurer
        </p>
      </div>
    );
  }

  // ✅ FIX : Début et Fin = nœuds fixes, pas de configuration
  if (node.type === 'debut' || node.type === 'fin') {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: NODE_TYPES[node.type]?.color }} />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
            {node.type === 'debut' ? 'Début' : 'Fin'}
          </span>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontSize: '22px' }}>
            {node.type === 'debut' ? '🟢' : '⬛'}
          </p>
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13px', color: '#374151' }}>
            Nœud {node.type === 'debut' ? 'Début' : 'Fin'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
            {node.type === 'debut'
              ? 'Point de départ du workflow. Les champs du formulaire employé se configurent dans le premier nœud Étape.'
              : 'Point de fin du workflow. Connectez la dernière étape à ce nœud.'}
          </p>
        </div>
      </div>
    );
  }

  const cfg       = NODE_TYPES[node.type] || NODE_TYPES.etape;
  const fields    = node.form?.fields    || [];
  const checklist = node.checklist       || [];
  // ✅ FIX : debut comme fin — non configurable, juste un point de départ visuel
  const canConfig = node.type === 'etape' || node.type === 'validation';
  const claims    = node.claims || { canValidate: true, canReject: true, canModify: false, canView: true };

  // ── Handlers formulaire ──
  const addField = (type) => {
    const isAuto = ['auto_number', 'auto_user', 'auto_status'].includes(type);
    const autoLabels = { auto_number: 'N° de document', auto_user: 'Demandeur', auto_status: 'Statut' };
    const f = {
      id:       'f_' + Date.now(),
      label:    isAuto ? autoLabels[type] : (type === 'table' ? 'Tableau articles' : 'Nouveau champ'),
      type,
      required: false,
      readOnly: isAuto,
      options:  type === 'select' ? ['Option 1', 'Option 2'] : [],
      columns:  type === 'table'  ? [
        { id: 'col_' + Date.now() + '_1', label: 'Article',  type: 'text',   required: true  },
        { id: 'col_' + Date.now() + '_2', label: 'Quantité', type: 'number', required: true  },
        { id: 'col_' + Date.now() + '_3', label: 'Prix',     type: 'number', required: false },
      ] : [],
    };
    onChange('form', { fields: [...fields, f] });
  };

  const updateField = (fi, key, val) => {
    const updated = [...fields];
    updated[fi] = { ...updated[fi], [key]: val };
    onChange('form', { fields: updated });
  };

  const removeField = (fi) => onChange('form', { fields: fields.filter((_, i) => i !== fi) });

  // ✅ handleDragEnd ici dans le composant — accès à fields et onChange
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange('form', { fields: arrayMove(fields, oldIndex, newIndex) });
  };

  // ── Handlers checklist ──
  const addItem = () => {
    onChange('checklist', [
      ...checklist,
      { id: 'c_' + Date.now(), label: 'Nouvelle tache', required: false, checked: false },
    ]);
  };

  const updateItem = (ci, key, val) => {
    const updated = [...checklist];
    updated[ci] = { ...updated[ci], [key]: val };
    onChange('checklist', updated);
  };

  const removeItem = (ci) => onChange('checklist', checklist.filter((_, i) => i !== ci));

  const updateClaim = (key, val) => onChange('claims', { ...claims, [key]: val });

  const tabBtn = (t, label) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      style={{
        padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: '11px',
        background: tab === t ? cfg.color : '#f1f5f9',
        color:      tab === t ? '#fff'     : '#64748b',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: '16px' }}>
      {/* Header node */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color }} />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{cfg.label}</span>
        </div>
        {node.id !== 'debut' && (
          <button
            onClick={onDelete}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
          >
            Supprimer
          </button>
        )}
      </div>

      {/* Onglets */}
      {canConfig && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {tabBtn('info', 'Info')}
          {tabBtn('assign', 'Assigner (' + (node.assignedTo || node.assignedPost ? '1' : '0') + ')')}
          {tabBtn('form', 'Formulaire (' + fields.length + ')')}
          {tabBtn('checklist', 'Checklist (' + checklist.length + ')')}
          {tabBtn('conditions', 'Conditions (' + (node.conditions?.length || 0) + ')')}
        </div>
      )}

      {/* ── TAB INFO ── */}
      {tab === 'info' && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
              Nom de l'etape *
            </label>
            <input
              value={node.label || ''}
              onChange={(e) => onChange('label', e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
              Description
            </label>
            <input
              value={node.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Description optionnelle..."
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          {canConfig && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '4px' }}>
                Delai
              </label>
              <select
                value={node.delai || ''}
                onChange={(e) => onChange('delai', e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              >
                <option value="">Sans delai</option>
                <option value="1j">1 jour</option>
                <option value="2j">2 jours</option>
                <option value="3j">3 jours</option>
                <option value="1s">1 semaine</option>
                <option value="2s">2 semaines</option>
              </select>
            </div>
          )}

          {/* Claims */}
          {canConfig && (
            <div style={{ marginBottom: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#374151', marginBottom: '8px' }}>
                Permissions (Claims)
              </label>
              {[
                { key: 'canValidate', label: 'Peut valider',  color: '#059669' },
                { key: 'canReject',   label: 'Peut rejeter',  color: '#dc2626' },
                { key: 'canModify',   label: 'Peut modifier', color: '#f59e0b' },
                { key: 'canView',     label: 'Peut voir',     color: '#2563EB' },
              ].map((claim) => (
                <label key={claim.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={claims[claim.key] !== false}
                    onChange={(e) => updateClaim(claim.key, e.target.checked)}
                    style={{ width: '14px', height: '14px' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: claim.color }}>{claim.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB ASSIGNER ── */}
      {/* ── TAB ASSIGNER ── */}
{tab === 'assign' && canConfig && (
  <div>
    {isFirstEtape ? (
      // Message "étape employé automatique"
      <div style={{
        background: '#f0fdf4', borderRadius: '12px',
        padding: '20px', border: '1px solid #86efac',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '28px', margin: '0 0 10px' }}>👥</p>
        <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '14px', color: '#166534' }}>
          Étape de soumission employé
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
          Cette étape est automatiquement assignée à l'employé qui soumet la demande.
        </p>
        <div style={{
          marginTop: '12px', padding: '8px 16px',
          background: '#dcfce7', borderRadius: '8px',
          fontSize: '12px', color: '#166534', fontWeight: 700,
        }}>
          ✓ Assigné automatiquement au demandeur
        </div>
      </div>
    ) : (
      // ✅ Formulaire d'assignation normal pour toutes les autres étapes
      <div>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px', fontWeight: 600 }}>
          Choisissez comment assigner cette étape :
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
            Poste responsable de cette étape
          </label>
          <select
            value={node.assignedPost || ''}
            onChange={(e) => {
              onChange('assignedPost', e.target.value);
              onChange('assignedPostName', e.target.value);
              onChange('assignedTo', null);
              onChange('assignedToName', '');
              onChange('assignedRole', '');
            }}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: '8px',
              border: node.assignedPost ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
              fontSize: '13px', color: node.assignedPost ? '#0F172A' : '#94A3B8',
              background: '#fff', cursor: 'pointer', outline: 'none',
              fontFamily: "'Inter',sans-serif",
              boxShadow: node.assignedPost ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <option value="" disabled hidden>-- Choisir un poste --</option>
            {posts.map((p) => (
              <option key={p._id} value={p.name}>
                {p.name}{p.departmentName ? ' · ' + p.departmentName : ''}
              </option>
            ))}
          </select>
        </div>

        {node.assignedPost && (
          <div style={{ marginTop: '10px', padding: '10px 14px', background: '#F0FDF4', borderRadius: '9px', border: '1.5px solid #86EFAC', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#166534' }}>
              Poste assigné : <strong>{node.assignedPost}</strong>
            </p>
          </div>
        )}
      </div>
    )}
  </div>
)}
      {/* ── TAB FORMULAIRE avec DnD ── */}
      {tab === 'form' && canConfig && (
        <div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', fontWeight: 600 }}>
            Cliquez ou glissez un type de champ :
          </p>

          {/* Palette des types de champs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {FIELD_TYPES.map((ft) => (
              <div
                key={ft.type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('fieldType', ft.type)}
                onClick={() => addField(ft.type)}
                style={{
                  padding: '5px 10px', borderRadius: '7px',
                  background: '#fff',
                  border: `1.5px solid ${ft.color || '#2563EB'}30`,
                  color: ft.color || '#2563EB',
                  fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', userSelect: 'none',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = (ft.color||'#2563EB')+'15'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                <span>{ft.icon}</span> {ft.label}
              </div>
            ))}
          </div>

          {/* Zone de dépôt + liste triable */}
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const t = e.dataTransfer.getData('fieldType');
              if (t) addField(t);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            style={{
              minHeight: '60px', borderRadius: '8px',
              border:     dragOver ? '2px dashed #2563EB' : '2px dashed #e2e8f0',
              padding:    '8px',
              background: dragOver ? '#eff6ff' : '#f8fafc',
            }}
          >
            {fields.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', margin: '12px 0', fontSize: '12px' }}>
                Cliquez ou glissez un champ ici
              </p>
            ) : (
              // ✅ DndContext + SortableContext correctement intégrés
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field, fi) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      fi={fi}
                      updateField={updateField}
                      removeField={removeField}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CHECKLIST ── */}
      {tab === 'checklist' && canConfig && (
        <div>
          {checklist.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '12px 0' }}>
              Aucune tache — cliquez pour en ajouter
            </p>
          )}
          {checklist.map((item, ci) => (
            <div key={item.id || ci} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 8px', background: '#f8fafc', borderRadius: '6px', marginBottom: '6px', border: '1px solid #e2e8f0' }}>
              <input
                value={item.label}
                onChange={(e) => updateItem(ci, 'label', e.target.value)}
                style={{ flex: 1, padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
                <input type="checkbox" checked={item.required || false} onChange={(e) => updateItem(ci, 'required', e.target.checked)} />
                Requis
              </label>
              <button
                onClick={() => removeItem(ci)}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}
              >X</button>
            </div>
          ))}
          <button
            onClick={addItem}
            style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '2px dashed #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}
          >
            + Ajouter une tâche
          </button>
        </div>
      )}
            {/* ── TAB CONDITIONS ── */}
      {tab === 'conditions' && canConfig && (() => {
        const conditions = node.conditions || [];
        const OPERATORS = [
          { value: 'equals',     label: '= Égal à'       },
          { value: 'not_equals', label: '≠ Différent de' },
          { value: 'contains',   label: '⊃ Contient'     },
          { value: 'greater',    label: '> Supérieur à'  },
          { value: 'less',       label: '< Inférieur à'  },
        ];
        const addCondition = () => onChange('conditions', [...conditions, { field: '', operator: 'equals', value: '' }]);
        const updateCondition = (ci, key, val) => { const u = [...conditions]; u[ci] = { ...u[ci], [key]: val }; onChange('conditions', u); };
        const removeCondition = (ci) => onChange('conditions', conditions.filter((_, i) => i !== ci));
        return (
          <div>
            <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>🔀 Conditions de transition</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#2563EB', lineHeight: '1.5' }}>
                Cette étape ne sera activée que si <strong>toutes</strong> les conditions sont satisfaites. Laissez vide = toujours activée.
              </p>
            </div>
            {conditions.length === 0 && <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '12px 0' }}>Aucune condition — étape toujours activée</p>}
            {conditions.map((cond, ci) => (
              <div key={ci} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Condition {ci + 1}</span>
                  <button onClick={() => removeCondition(ci)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>X</button>
                </div>
                <input value={cond.field} onChange={(e) => updateCondition(ci, 'field', e.target.value)} placeholder="Champ du formulaire (ID ou label)" style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box', marginBottom: '6px' }} />
                <select value={cond.operator} onChange={(e) => updateCondition(ci, 'operator', e.target.value)} style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '6px' }}>
                  {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
                <input value={cond.value} onChange={(e) => updateCondition(ci, 'value', e.target.value)} placeholder="Valeur de comparaison" style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button onClick={addCondition} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '2px dashed #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}>+ Ajouter une condition</button>
          </div>
        );
      })()}
    </div>
  );
};
const WorkflowEditor = ({
  projectId,
  workflowName = '',
  onSave,
  onCancel,
  // ✅ NOUVELLES PROPS pour l'édition — optionnelles, avec valeurs par défaut
  initialNodes = null,
  initialEdges = null,
  initialVisibility = 'global',
  initialAllowedRoles = [],
  initialAllowedPosts = [],
  initialDocType = '',     // ✅ type de document initial (pour édition)
  }) => {
  const [nodes, setNodes] = useState(initialNodes || [{
    id: 'debut', type: 'debut', label: 'Debut', x: 280, y: 40,
    form: { fields: [] }, checklist: [],
    claims: { canValidate: true, canReject: true, canModify: false, canView: true },
  }]);
  const [edges,setEdges] = useState(initialEdges || []);
  const [selected,setSelected] = useState(null);
  const [connecting,setConnecting] = useState(null);
  const [history,setHistory] = useState([]);
  const [saving,setSaving] = useState(false);
  const [users,setUsers] = useState([]);
  const [alertMsg, setAlertMsg] = useState('');
  const [allPosts,setAllPosts] = useState([]);
  const [visibility,setVisibility] = useState(initialVisibility);
  const [allowedRoles,] = useState(initialAllowedRoles);
 const allowedPostsRef = useRef(initialAllowedPosts || []);
  const [allowedPosts, setAllowedPostsState] = useState(initialAllowedPosts || []);
  const setAllowedPosts = (updater) => {
    const next = typeof updater === 'function' ? updater(allowedPostsRef.current) : updater;
    allowedPostsRef.current = next;
    setAllowedPostsState(next);
  };
  // ✅ Type de document sélectionné pour ce workflow
  const [docType,  setDocType]  = useState(initialDocType || '');
  const [docTypes, setDocTypes] = useState([]);
  // ✅ Charger les types de documents disponibles
  useEffect(() => {
    import('../../../services/api').then(m => {
      m.default.get('/document-types').then(res => {
        setDocTypes(res.data?.data?.documentTypes?.filter(dt => dt.isActive !== false) || []);
      }).catch(() => {});
    });
  // eslint-disable-next-line
  }, []);

  useEffect(() => {
  console.log('allPosts:', allPosts.length);
}, [allPosts]);
  const canvasRef = useRef();
  const dragging  = useRef(null);

  // Chargement users + postes
 useEffect(() => {
  const load = async () => {
    try {
      const [usersRes, postsData] = await Promise.all([
        workflowService.getUsers(),
        departmentService.getAllPosts(),
      ]);
      setUsers(usersRes.data?.users || []);
      setAllPosts(postsData || []);
      console.log('✅ postsData:', postsData); // ← ajoute ça
    } catch (err) { console.error('Erreur chargement:', err); }
  };
  load();
}, []);

  const pushHistory = (action) => {
    setHistory((h) => [...h.slice(-19), { action, time: new Date().toLocaleTimeString('fr-FR') }]);
  };

  // Drop d'un node depuis la palette vers le canvas
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    if (!type) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left - 75;
    const y    = e.clientY - rect.top  - 22;
    const id   = type + '_' + Date.now();
    setNodes((n) => [...n, {
      id, type, label: NODE_TYPES[type]?.label || 'Etape', x, y,
      assignedTo: null, assignedToName: '', assignedRole: '',
      assignedPost: '', assignedPostName: '',
      delai: '', description: '',
      form: { fields: [] }, checklist: [],
      conditions: [],   // ✅ MOTEUR CONDITIONS
      claims: { canValidate: true, canReject: true, canModify: false, canView: true },
    }]);
    pushHistory('Ajoute : ' + (NODE_TYPES[type]?.label || type));
  };

  // Déplacement d'un node sur le canvas
  const handleNodeDragStart = useCallback((e, nodeId) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragging.current = {
      id: nodeId,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top  - node.y,
    };
    const onMove = (ev) => {
      const r = canvasRef.current.getBoundingClientRect();
      setNodes((prev) => prev.map((n) =>
        n.id === nodeId
          ? { ...n, x: Math.max(0, ev.clientX - r.left - dragging.current.offsetX), y: Math.max(0, ev.clientY - r.top - dragging.current.offsetY) }
          : n
      ));
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [nodes]);

  // Connexion entre nodes
  const handleConnect = (nodeId) => {
    if (!connecting) { setConnecting(nodeId); return; }
    if (connecting === nodeId) { setConnecting(null); return; }
    const exists = edges.find((e) => e.from === connecting && e.to === nodeId);
    if (!exists) {
      const fromNode = nodes.find((n) => n.id === connecting);
      setEdges((prev) => [...prev, {
        from: connecting, to: nodeId,
        label: fromNode?.type === 'condition' ? 'Oui' : '',
      }]);
      pushHistory('Connexion : ' + connecting + ' -> ' + nodeId);
    }
    setConnecting(null);
  };

  // Mise à jour d'une propriété du node sélectionné
  const handlePropChange = (key, value) => {
    setNodes((prev) => prev.map((n) => n.id === selected ? { ...n, [key]: value } : n));
  };

  // Suppression du node sélectionné
  const handleDeleteNode = () => {
    if (!selected || selected === 'debut') return;
    setEdges((prev) => prev.filter((e) => e.from !== selected && e.to !== selected));
    setNodes((prev) => prev.filter((n) => n.id !== selected));
    pushHistory('Supprime : ' + selected);
    setSelected(null);
  };

  // Sauvegarde
  const handleSave = async () => {
    // ── Tous les nœuds étape (exclure debut, fin, notification, condition) ──
    const etapeNodes = nodes.filter((n) =>
      !['debut', 'fin', 'notification', 'condition'].includes(n.type)
    );

    if (etapeNodes.length === 0) {
      setAlertMsg('Ajoutez au moins une étape sur le canvas');
      return;
    }

    // ✅ FIX : le premier nœud etape = étape Employé (isEmployeeStep: true)
    // Les suivants = étapes de validation assignées à des postes
    const steps = etapeNodes.map((n, i) => ({
      name:             n.label || NODE_TYPES[n.type]?.label || 'Etape',
      description:      n.description     || '',
      order:            i,
      isEmployeeStep:   i === 0,   // ✅ premier nœud = étape employé
      assignedTo:       i === 0 ? null : (n.assignedTo || null),
      assignedToName:   i === 0 ? '' : (n.assignedToName || ''),
      assignedRole:     i === 0 ? '' : (n.assignedRole || ''),
      assignedPost:     i === 0 ? '' : (n.assignedPost || ''),
      assignedPostName: i === 0 ? '' : (n.assignedPostName || ''),
      delai:            n.delai           || '',
      type:             'etape',
      // APRÈS ✅
form: {
  fields: (n.form?.fields || []).map((f) => ({
    ...f,
    options:          Array.isArray(f.options)      ? f.options      : [],
    readOnly:         f.readOnly   || false,
    autoSource:       f.autoSource || '',
    inheritTableFrom: f.inheritTableFrom || '',
    // Si hérité : columns = vide, extraColumns = colonnes saisies ici
    // Si non hérité : columns = toutes les colonnes, extraColumns = vide
    columns:          f.inheritTableFrom
      ? []
      : Array.isArray(f.columns) ? f.columns : [],
    extraColumns:     f.inheritTableFrom
      ? (Array.isArray(f.columns) ? f.columns : [])
      : [],
  })),
},
      checklist:  (n.checklist || []).map((item) => ({ ...item, checked: false })),
      conditions: n.conditions || [],
      status:     'pending',
      claims:     i === 0
        // Étape employé : peut modifier sa demande, pas valider/rejeter
        ? { canValidate: true, canReject: false, canModify: true, canView: true }
        : (n.claims || { canValidate: true, canReject: true, canModify: false, canView: true }),
    }));

    if (!docType) {
      setAlertMsg('Choisissez un type de document avant de sauvegarder');
      return;
    }
    if (steps.length < 2) {
    setAlertMsg('Ajoutez au moins une étape de validation après l\'étape Employé');
    return;
    }
  setSaving(true);
  try {
    console.log('🔍 allowedPosts avant save:', allowedPosts);
    await onSave({ steps, nodes, edges, visibility, allowedRoles, allowedPosts: allowedPostsRef.current, docType: docType || null });
  } catch (err) {
    console.error('Erreur save:', err);
  } finally {
    setSaving(false);
  }
  };

  const selectedNode = nodes.find((n) => n.id === selected) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9' }}>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        * { font-family: 'Inter', -apple-system, sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
        .wf-field-tag:hover { background: #DBEAFE !important; }
        .wf-palette-item:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 5px 14px rgba(0,0,0,0.25) !important; }
        .wf-tab-btn:hover { opacity: 0.85; }
        .wf-user-row:hover { background: #EFF6FF !important; }
      `}</style>

      {/* ── Topbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: '#1e293b', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#2563EB', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '14px' }}>
            Axia Workflow
          </div>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
            {workflowName || 'Editeur de Workflow'}
          </span>

          {/* ✅ Sélecteur type de document — déroulant */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#0f172a', padding:'4px 4px 4px 10px', borderRadius:'8px', border: docType ? '1px solid #3b82f6' : '1px solid #334155' }}>
            <span style={{ fontSize:'11px', color:'#64748b', whiteSpace:'nowrap', fontWeight:600 }}>📄</span>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              style={{
                padding: '4px 8px', borderRadius: '6px',
                border: 'none', background: 'transparent',
                color: docType ? '#93c5fd' : '#64748b',
                fontSize: '12px', fontWeight: docType ? 700 : 400,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                minWidth: '150px', outline: 'none',
              }}
            >
              <option value="" disabled hidden>Type de document…</option>
              {docTypes.map(dt => (
                <option key={dt._id} value={dt._id} style={{ background:'#1e293b', color:'#e2e8f0' }}>{dt.prefix} — {dt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Toggle visibilité */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#334155', padding: '6px 12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Visibilité :</span>
            {[
              { value: 'global',     label: '🌍 Global',   color: '#059669' },
              { value: 'restricted', label: '🔒 Restreint', color: '#dc2626' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setVisibility(opt.value);
                  // Global → vider les postes automatiquement
                  if (opt.value === 'global') setAllowedPosts([]);
                }}
                style={{ padding: '3px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: visibility === opt.value ? opt.color : 'transparent', color: visibility === opt.value ? '#fff' : '#94a3b8' }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {connecting && (
            <span style={{ background: '#fbbf24', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
              Cliquez sur le noeud destination...
            </span>
          )}
{/* Message d'erreur inline — remplace alert() */}
{alertMsg && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#fee2e2', color: '#dc2626',
    padding: '6px 14px', borderRadius: '8px',
    fontSize: '12px', fontWeight: 700,
    border: '1px solid #fecaca',
    animation: 'fadeIn 0.2s ease',
  }}>
    ⚠️ {alertMsg}
    <button
      onClick={() => setAlertMsg('')}
      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 900, fontSize: '14px', padding: '0 0 0 4px' }}
    >×</button>
  </div>
)}
          <button
            onClick={onCancel}
            style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px' }}
          >
            Annuler
          </button>
<button
  onClick={handleSave}
  disabled={saving}
  style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px', opacity: saving ? 0.7 : 1 }}
>
  {saving ? 'Sauvegarde...' : 'Sauvegarder le workflow'}
</button>
      
        </div>
      </div>

     
      {/* ── Bande restriction d'accès par poste — toujours visible ── */}
{/* ── Bande restriction d'accès — design pro ── */}
      {/* ── Bande restriction d'accès par poste — design pro ── */}
      {visibility === 'restricted' && (
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
          borderBottom: '1px solid #c4b5fd',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {/* Icône + label */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#7C3AED', color: '#fff',
            padding: '4px 12px', borderRadius: '20px',
            fontSize: '12px', fontWeight: 700, flexShrink: 0,
          }}>
            👤 Accès employés
          </div>

          {/* Tags postes sélectionnés */}
          {allowedPosts.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#dcfce7', color: '#166534',
              padding: '4px 12px', borderRadius: '20px',
              fontSize: '12px', fontWeight: 700,
              border: '1px solid #86efac',
            }}>
              🌍 Tous les employés
            </div>
          ) : (
            allowedPosts.map(post => (
              <div key={post} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#fff', color: '#2563EB',
                padding: '4px 10px 4px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 700,
                border: '2px solid #a5b4fc',
                boxShadow: '0 1px 3px rgba(79,70,229,0.15)',
              }}>
                <span>👤 {post}</span>
                <button
                  onClick={() => setAllowedPosts(prev => prev.filter(p => p !== post))}
                  style={{
                    background: '#ede9fe', border: 'none',
                    color: '#7C3AED', cursor: 'pointer',
                    width: '16px', height: '16px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 900, padding: 0, lineHeight: 1,
                  }}
                >×</button>
              </div>
            ))
          )}

          {/* Select ajouter poste */}
          <select
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val && !allowedPosts.includes(val))
                setAllowedPosts(prev => [...prev, val]);
            }}
            style={{
              padding: '5px 10px', borderRadius: '20px',
              border: '2px dashed #a5b4fc',
              fontSize: '12px', color: '#2563EB',
              background: '#fff', cursor: 'pointer',
              fontWeight: 600, outline: 'none',
            }}
          >
            <option value="">＋ Restreindre à un poste...</option>
            {allPosts
              .filter(p => !allowedPosts.includes(p.name))
              .map(p => (
                <option key={p._id} value={p.name}>{p.name}</option>
              ))
            }
          </select>

          {allowedPosts.length > 0 && (
            <span style={{ fontSize: '11px', color: '#7C3AED', marginLeft: 'auto', fontWeight: 600 }}>
              🔒 {allowedPosts.length} poste(s) autorisé(s)
            </span>
          )}
        </div>
      )}
      {/* ── Corps 3 colonnes ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Palette gauche */}
        <div style={{ width: '180px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '16px 10px', flexShrink: 0, overflowY: 'auto' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Elements
          </p>
          {PALETTE_ITEMS.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('nodeType', item.type)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '8px', background: item.color, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'grab', marginBottom: '7px', userSelect: 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
            >
              <span style={{ fontWeight: 900, fontSize: '14px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
          <div style={{ marginTop: '16px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#374151' }}>Utilisateurs</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{users.length} chargés</p>
          </div>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            Glisser-deposer les elements
          </p>
        </div>

        {/* Canvas centre */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => { setSelected(null); if (connecting) setConnecting(null); }}
            style={{ flex: 1, position: 'relative', overflow: 'auto', background: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '28px 28px', cursor: connecting ? 'crosshair' : 'default', minHeight: '400px' }}
          >
            <Arrows
              edges={edges}
              nodes={nodes}
              onDeleteEdge={(i) => setEdges((prev) => prev.filter((_, idx) => idx !== i))}
            />
            {nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                selected={selected === node.id}
                connecting={connecting}
                onSelect={setSelected}
                onDragStart={handleNodeDragStart}
                onConnect={handleConnect}
                users={users}
              />
            ))}
          </div>

          {/* Historique */}
          <div style={{ height: '110px', background: '#fff', borderTop: '1px solid #e2e8f0', padding: '10px 16px', overflowY: 'auto', flexShrink: 0 }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', margin: '0 0 6px' }}>
              Historique des actions
            </p>
            {history.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>
                Aucune action — commencez a glisser des elements
              </p>
            ) : (
              [...history].reverse().map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 0 ? '#dc2626' : i === 1 ? '#059669' : '#2563EB', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>{h.action}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto' }}>{h.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panneau droite */}
        <div style={{ width: '290px', background: '#fff', borderLeft: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {selectedNode ? 'Configurer : ' + (selectedNode.label || 'Element') : 'Proprietes'}
            </h3>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
          <PropertiesPanel
          node={selectedNode}
          onChange={handlePropChange}
          onDelete={handleDeleteNode}
          users={users}
          posts={allPosts}
          allowedPosts={allowedPosts}
          setAllowedPosts={setAllowedPosts}
          isFirstEtape={
            selectedNode?.type === 'etape' &&
            nodes.filter(n => n.type === 'etape')[0]?.id === selectedNode?.id
          }
          />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;