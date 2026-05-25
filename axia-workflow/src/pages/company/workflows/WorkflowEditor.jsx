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
  etape:        { label: 'Etape',        color: '#3b82f6', shape: 'rect'    },
  condition:    { label: 'Condition',    color: '#10b981', shape: 'diamond' },
  validation:   { label: 'Validation',  color: '#7c3aed', shape: 'rect'    },
  notification: { label: 'Notification',color: '#f59e0b', shape: 'rect'    },
  fin:          { label: 'Fin',          color: '#6b7280', shape: 'pill'    },
};

const PALETTE_ITEMS = [
  { type: 'etape',        label: 'Etape',        color: '#3b82f6', icon: '='  },
  { type: 'condition',    label: 'Condition',    color: '#10b981', icon: '<>' },
  { type: 'validation',   label: 'Validation',   color: '#7c3aed', icon: 'V'  },
  { type: 'notification', label: 'Notification', color: '#f59e0b', icon: 'N'  },
  { type: 'fin',          label: 'Fin',          color: '#6b7280', icon: 'O'  },
];

const FIELD_TYPES = [
  { type: 'text',        label: 'Texte',        icon: 'T'   },
  { type: 'number',      label: 'Nombre',       icon: '123' },
  { type: 'date',        label: 'Date',         icon: 'D'   },
  { type: 'select',      label: 'Liste',        icon: 'L'   },
  { type: 'textarea',    label: 'Zone texte',   icon: 'TT'  },
  { type: 'file',        label: 'Fichier',      icon: 'F'   },
  { type: 'checkbox',    label: 'Case',         icon: 'CB'  },
  { type: 'signature',   label: 'Signature',    icon: 'SG'  },
  { type: 'table',       label: 'Tableau',      icon: 'TB'  },
  { type: 'auto_number', label: 'Auto',      icon: 'N°'  },
  { type: 'auto_user',   label: 'Demandeur',    icon: '👤'  },
  { type: 'auto_status', label: 'Statut Auto',  icon: '⚙'  },
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
          <div style={{ background: '#4f46e5', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
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
            <span style={{ background: '#4f46e5', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
              {node.form.fields.length} champs
            </span>
          )}
          {hasChecklist && (
            <span style={{ background: '#7c3aed', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
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
    opacity:    isDragging ? 0.4 : 1,
    background: '#fff',
    borderRadius: '6px',
    border:     isDragging ? '2px dashed #4f46e5' : '1px solid #e2e8f0',
    padding:    '8px',
    marginBottom: '6px',
    cursor:     'default',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>

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
        <span style={{
          background: '#e0e7ff', color: '#4f46e5',
          padding: '1px 6px', borderRadius: '3px',
          fontSize: '10px', fontWeight: 700, flexShrink: 0,
        }}>
          {FIELD_TYPES.find((f) => f.type === field.type)?.icon || 'T'}
        </span>

        {/* Label éditable */}
        <input
          value={field.label}
          onChange={(e) => updateField(fi, 'label', e.target.value)}
          style={{ flex: 1, padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' }}
        />

        {/* Supprimer */}
        <button
          onClick={() => removeField(fi)}
          style={{
            background: '#fee2e2', color: '#dc2626', border: 'none',
            width: '20px', height: '20px', borderRadius: '4px',
            cursor: 'pointer', fontSize: '11px', fontWeight: 700, flexShrink: 0,
          }}
        >X</button>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>Colonnes du tableau</span>
            <button
              onClick={() => {
                const cols = field.columns || [];
                updateField(fi, 'columns', [...cols, { id: 'col_' + Date.now(), label: 'Colonne ' + (cols.length + 1), type: 'text', required: false }]);
              }}
              style={{ padding: '2px 8px', borderRadius: '4px', background: '#0ea5e9', color: '#fff', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
            >
              + Colonne
            </button>
          </div>
          {(field.columns || []).length === 0 && (
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Aucune colonne — cliquez sur "+ Colonne"</p>
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

const PropertiesPanel = ({ node, onChange, onDelete, users, posts }) => {
  const [tab,      setTab]      = useState('info');
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

  const cfg       = NODE_TYPES[node.type] || NODE_TYPES.etape;
  const fields    = node.form?.fields    || [];
  const checklist = node.checklist       || [];
  const canConfig = node.type === 'etape' || node.type === 'validation' || node.type === 'debut';
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
                { key: 'canView',     label: 'Peut voir',     color: '#4f46e5' },
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
      {tab === 'assign' && canConfig && (
        <div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px', fontWeight: 600 }}>
            Choisissez comment assigner cette étape :
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
              1. Par poste (recommandé)
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
              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}
            >
              <option value="">-- Choisir un poste --</option>
              {posts.map((p) => (
                <option key={p._id} value={p.name}>
                  {p.name} {p.departmentName ? '(' + p.departmentName + ')' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>OU</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
              2. Par personne spécifique
            </label>
            {users.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>Chargement...</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div
                  onClick={() => {
                    onChange('assignedTo', null);
                    onChange('assignedToName', '');
                    onChange('assignedPost', '');
                    onChange('assignedPostName', '');
                  }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #f1f5f9', background: !node.assignedTo ? '#eff6ff' : '#fff' }}
                >
                  Aucun (utiliser le poste)
                </div>
                {users.map((u) => {
                  const isSelected = node.assignedTo === u._id;
                  return (
                    <div
                      key={u._id}
                      onClick={() => {
                        onChange('assignedTo', u._id);
                        onChange('assignedToName', u.firstName + ' ' + u.lastName);
                        onChange('assignedPost', '');
                        onChange('assignedPostName', '');
                        onChange('assignedRole', '');
                      }}
                      style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: isSelected ? '#eff6ff' : '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isSelected ? '#4f46e5' : '#e0e7ff', color: isSelected ? '#fff' : '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                        {u.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '13px', color: isSelected ? '#4f46e5' : '#0f172a' }}>
                          {u.firstName + ' ' + u.lastName}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                          {u.jobTitle || u.role?.name || ''}
                        </p>
                      </div>
                      {isSelected && <span style={{ color: '#4f46e5', fontWeight: 700 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {(node.assignedPost || node.assignedTo) && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                {node.assignedTo
                  ? '✓ Assigné à : ' + (node.assignedToName || 'Utilisateur sélectionné')
                  : '✓ Assigné au poste : ' + (node.assignedPostName || node.assignedPost)}
              </p>
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
                style={{ padding: '4px 8px', borderRadius: '5px', background: '#e0e7ff', color: '#4f46e5', fontSize: '11px', fontWeight: 700, cursor: 'grab', userSelect: 'none' }}
              >
                {ft.icon} {ft.label}
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
              border:     dragOver ? '2px dashed #4f46e5' : '2px dashed #e2e8f0',
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
            + Ajouter une tache
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

        const addCondition = () => {
          onChange('conditions', [...conditions, { field: '', operator: 'equals', value: '' }]);
        };

        const updateCondition = (ci, key, val) => {
          const updated = [...conditions];
          updated[ci] = { ...updated[ci], [key]: val };
          onChange('conditions', updated);
        };

        const removeCondition = (ci) => {
          onChange('conditions', conditions.filter((_, i) => i !== ci));
        };

        return (
          <div>
            {/* Explication */}
            <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', border: '1px solid #bfdbfe' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>
                🔀 Conditions de transition
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', lineHeight: '1.5' }}>
                Cette étape ne sera activée que si <strong>toutes</strong> les conditions
                sont satisfaites. Laissez vide = toujours activée (ordre séquentiel).
              </p>
            </div>

            {conditions.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', margin: '12px 0' }}>
                Aucune condition — étape toujours activée
              </p>
            )}

            {conditions.map((cond, ci) => (
              <div key={ci} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                    Condition {ci + 1}
                  </span>
                  <button
                    onClick={() => removeCondition(ci)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                  >X</button>
                </div>

                {/* Champ */}
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Champ du formulaire (ID ou label)
                  </label>
                  <input
                    value={cond.field}
                    onChange={(e) => updateCondition(ci, 'field', e.target.value)}
                    placeholder="Ex: montant  ou  Montant demandé"
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Opérateur */}
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Opérateur
                  </label>
                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(ci, 'operator', e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>

                {/* Valeur */}
                <div>
                  <label style={{ fontSize: '11px', color: '#374151', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                    Valeur de comparaison
                  </label>
                  <input
                    value={cond.value}
                    onChange={(e) => updateCondition(ci, 'value', e.target.value)}
                    placeholder="Ex: 5000  ou  Approuvé"
                    style={{ width: '100%', padding: '5px 8px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Aperçu */}
                {cond.field && cond.value && (
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: '#e0f2fe', borderRadius: '5px' }}>
                    <code style={{ fontSize: '11px', color: '#0369a1' }}>
                      {cond.field} {OPERATORS.find(o => o.value === cond.operator)?.label?.split(' ')[0]} {cond.value}
                    </code>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={addCondition}
              style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '2px dashed #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '12px', marginTop: '4px' }}
            >
              + Ajouter une condition
            </button>
          </div>
        );
      })()}
    </div>
  );
};

// ─── WorkflowEditor principal ─────────────────────────────────────────────────

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
}) => {
  const [nodes, setNodes] = useState(initialNodes || [{
    id: 'debut', type: 'debut', label: 'Debut', x: 280, y: 40,
    form: { fields: [] }, checklist: [],
    claims: { canValidate: true, canReject: true, canModify: false, canView: true },
  }]);
  const [edges,        setEdges]        = useState(initialEdges || []);
  const [selected,     setSelected]     = useState(null);
  const [connecting,   setConnecting]   = useState(null);
  const [history,      setHistory]      = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [users,        setUsers]        = useState([]);
  const [allPosts,     setAllPosts]     = useState([]);
  const [visibility,   setVisibility]   = useState(initialVisibility);
  const [allowedRoles, setAllowedRoles] = useState(initialAllowedRoles);
  const [allowedPosts] = useState([]);

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
    // ── Récupère les champs du node Debut (formulaire employé) ──────────────
    const debutNode  = nodes.find((n) => n.type === 'debut');
    const debutFields = (debutNode?.form?.fields || []).map((f) => ({
      ...f,
      options:    Array.isArray(f.options) ? f.options : [],
      columns:    Array.isArray(f.columns) ? f.columns : [],
      readOnly:   f.readOnly   || false,
      autoSource: f.autoSource || '',
    }));

    // ── Étapes réelles : exclure debut, fin, notification, condition
    //    ET exclure tout node Etape nommé "Demande Employé" (doublon accidentel)
    const otherNodes = nodes.filter((n) =>
      !['debut', 'fin', 'notification', 'condition'].includes(n.type) &&
      !(n.label?.trim().toLowerCase() === 'demande employé')
    );

    // ── Étape 0 : toujours "Demande Employé" avec les champs du Debut ───────
    const step0 = {
      name:             'Demande Employé',
      description:      debutNode?.description || '',
      order:            0,
      assignedTo:       null,
      assignedToName:   '',
      assignedRole:     '',
      assignedPost:     '',
      assignedPostName: '',
      delai:            '',
      type:             'etape',
      form:             { fields: debutFields },
      checklist:        (debutNode?.checklist || []).map((item) => ({ ...item, checked: false })),
      conditions:       [],
      status:           'pending',
      claims:           { canValidate: true, canReject: false, canModify: false, canView: true },
    };

    // ── Étapes suivantes : validation, confirmation, etc. ───────────────────
    const otherSteps = otherNodes.map((n, i) => ({
      name:             n.label || NODE_TYPES[n.type]?.label || 'Etape',
      description:      n.description     || '',
      order:            i + 1,
      assignedTo:       n.assignedTo      || null,
      assignedToName:   n.assignedToName  || '',
      assignedRole:     n.assignedRole    || '',
      assignedPost:     n.assignedPost    || '',
      assignedPostName: n.assignedPostName || '',
      delai:            n.delai           || '',
      type:             'etape',
      form: {
        fields: (n.form?.fields || []).map((f) => ({
          ...f,
          options:    Array.isArray(f.options) ? f.options : [],
          columns:    Array.isArray(f.columns) ? f.columns : [],
          readOnly:   f.readOnly   || false,
          autoSource: f.autoSource || '',
        })),
      },
      checklist:  (n.checklist || []).map((item) => ({ ...item, checked: false })),
      conditions: n.conditions || [],
      status:     'pending',
      claims:     n.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
    }));

    const steps = [step0, ...otherSteps];

    if (otherSteps.length === 0) {
      alert('Ajoutez au moins une étape de validation ou confirmation sur le canvas');
      return;
    }

    setSaving(true);
    try {
      await onSave({ steps, nodes, edges, visibility, allowedRoles, allowedPosts });
    } finally {
      setSaving(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selected) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f1f5f9' }}>

      {/* ── Topbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: '#1e293b', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#4f46e5', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '14px' }}>
            Axia Workflow
          </div>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
            {workflowName || 'Editeur de Workflow'}
          </span>
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
                onClick={() => setVisibility(opt.value)}
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

          <button
            onClick={onCancel}
            style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid #475569', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px' }}
          >
            Annuler
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '7px 20px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '13px', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder le workflow'}
          </button>
        </div>
      </div>

      {/* ── Bande roles restreints ── */}
      {visibility === 'restricted' && (
        <div style={{ background: '#fff5f5', borderBottom: '1px solid #fecaca', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700 }}>
            🔒 Restreint — Rôles autorisés :
          </span>
          {['company_admin', 'manager', 'employee'].map((role) => (
            <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#374151' }}>
              <input
                type="checkbox"
                checked={allowedRoles.includes(role)}
                onChange={(e) =>
                  setAllowedRoles(e.target.checked
                    ? [...allowedRoles, role]
                    : allowedRoles.filter((r) => r !== role))
                }
              />
              {role}
            </label>
          ))}
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
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === 0 ? '#dc2626' : i === 1 ? '#059669' : '#3b82f6', flexShrink: 0 }} />
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditor;
