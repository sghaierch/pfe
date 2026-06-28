import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import templateService from '../../../services/templateService';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── TYPE CONFIG ────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  validation_confirmation: {
    label: 'Validation + Confirmation', color: '#2563EB', bg: '#EFF6FF',
    validationSteps: [
      { name: 'Validation',   role: 'validateur',   color: '#2563EB', bg: '#EFF6FF' },
      { name: 'Confirmation', role: 'confirmateur', color: '#059669', bg: '#F0FDF4' },
    ],
  },
  confirmation_only: {
    label: 'Juste Confirmation', color: '#059669', bg: '#F0FDF4',
    validationSteps: [
      { name: 'Confirmation', role: 'confirmateur', color: '#059669', bg: '#F0FDF4' },
    ],
  },
  automatic: {
    label: 'Automatique', color: '#D97706', bg: '#FFFBEB',
    validationSteps: [],
  },
};

const EMPLOYE_STEP_CONFIG = {
  name: 'Demande Employé', role: 'employe',
  color: '#0891B2', bg: '#E0F2FE', fixed: true,
};

const FIELD_TYPES = [
  { type: 'text',        label: 'Texte',       icon: 'T'   },
  { type: 'number',      label: 'Nombre',      icon: '123' },
  { type: 'date',        label: 'Date',        icon: 'D'   },
  { type: 'select',      label: 'Liste',       icon: 'L'   },
  { type: 'textarea',    label: 'Zone texte',  icon: 'TT'  },
  { type: 'checkbox',    label: 'Case',        icon: 'CB'  },
  { type: 'signature',   label: 'Signature',   icon: 'SG'  },
  { type: 'table',       label: 'Tableau',     icon: 'TB'  },
  { type: 'auto_number', label: 'N° Auto',     icon: '#'   },
  { type: 'auto_user',   label: 'Demandeur',   icon: '@'   },
  { type: 'auto_status', label: 'Statut Auto', icon: '~'   },
];

// ── Icons ──────────────────────────────────────────────────────────────────
const IconPlus     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="10" y2="17"/><line x1="14" y1="12" x2="14" y2="17"/></svg>;
const IconSearch   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconX        = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconSave     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconLoader   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin .9s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const IconLock     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconArrowR   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IconLayout   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;

// ── Drag handle icon ───────────────────────────────────────────────────────
const IconGrip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9"  cy="5"  r="1" fill="currentColor"/><circle cx="15" cy="5"  r="1" fill="currentColor"/>
    <circle cx="9"  cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
    <circle cx="9"  cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
  </svg>
);

const B = '#2563EB';

// ── Helpers ────────────────────────────────────────────────────────────────
const makeField = (type) => ({
  id: 'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  label: type === 'auto_number' ? 'Numéro document' : type === 'auto_user' ? 'Demandeur' : type === 'auto_status' ? 'Statut' : 'Nouveau champ',
  type, required: false,
  readOnly: ['auto_number', 'auto_user', 'auto_status'].includes(type),
  autoSource: '', options: type === 'select' ? ['Option 1'] : [],
  columns: type === 'table' ? [
    { id: 'col_article',  label: 'Article',  type: 'text',   required: true },
    { id: 'col_quantite', label: 'Quantité', type: 'number', required: true },
  ] : [],
});

const buildStepsForType = (type, existingSteps = []) => {
  const cfg = TYPE_CONFIG[type];
  const allDefs = [EMPLOYE_STEP_CONFIG, ...(cfg?.validationSteps || [])];
  return allDefs.map((def, i) => {
    const existing = existingSteps[i];
    return {
      name: def.name, role: def.role, fixed: def.fixed || false, order: i,
      postSlot: i === 0 ? '' : `Poste ${String.fromCharCode(64 + i)}`,
      description: existing?.description || '', delai: existing?.delai || 0,
      _delaiUnit: existing?._delaiUnit || 'heures',
      checklist: existing?.checklist || [], fields: existing?.fields || [],
      claims: existing?.claims || { canValidate:true, canReject:true, canModify:false, canView:true },
    };
  });
};

// ── Shared input style ─────────────────────────────────────────────────────
const getInp = (focused) => ({
  width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:'9px',
  border: focused ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
  fontSize:'14px', color:'#0F172A', outline:'none', background:'#fff',
  fontFamily:"'Inter',sans-serif",
  boxShadow: focused ? `0 0 0 3px rgba(37,99,235,0.1)` : 'none',
  transition:'border-color 0.15s, box-shadow 0.15s',
});

const SInput = ({ value, onChange, placeholder, type='text', min }) => {
  const [f, setF] = useState(false);
  return <input type={type} min={min} value={value} onChange={onChange} placeholder={placeholder}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={getInp(f)}/>;
};
const SSelect = ({ value, onChange, children, width }) => {
  const [f, setF] = useState(false);
  return <select value={value} onChange={onChange}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}
    style={{...getInp(f), width:width||'100%', cursor:'pointer'}}>{children}</select>;
};
const STextarea = ({ value, onChange, placeholder, rows=3 }) => {
  const [f, setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...getInp(f), resize:'vertical'}}/>;
};

const Lbl = ({ children }) => (
  <label style={{ display:'block', fontWeight:700, fontSize:'11px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'6px' }}>
    {children}
  </label>
);

const StepSection = ({ title, children }) => (
  <div style={{ borderTop:'1.5px dashed #E2E8F0', paddingTop:'16px', marginTop:'4px' }}>
    <p style={{ margin:'0 0 12px', fontWeight:700, fontSize:'12px', color:'#64748B', textTransform:'uppercase', letterSpacing:'0.07em' }}>{title}</p>
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════════
// ── Sortable Field Row (DnD Kit) ──────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const SortableFieldRow = ({
  field, fi, si, totalFields,
  updateStepField, removeStepField,
  addStepFieldColumn, updateStepFieldColumn, removeStepFieldColumn,
  form,
}) => {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  // ── Column editor (identique à l'original) ──────────────────────
  const isEmployeStep = form.steps[si]?.role === 'employe';

  const renderColumnEditor = () => (
    <div style={{ marginTop:'10px', padding:'14px', background:'#F0F9FF', borderRadius:'10px', border:'1.5px solid #BAE6FD' }}>
      {!isEmployeStep && (
        <div style={{ marginBottom:'12px', padding:'10px 12px', background: field.inheritTableFrom ? '#E0F2FE' : '#F8FAFC', borderRadius:'8px', border:`1.5px solid ${field.inheritTableFrom ? '#7DD3FC' : '#E2E8F0'}`, display:'flex', alignItems:'center', gap:'10px' }}>
          <input type="checkbox" id={`inherit_${si}_${fi}`} checked={!!field.inheritTableFrom}
            onChange={e => {
              const step0TableField = form.steps[0]?.fields?.find(f => f.type === 'table');
              updateStepField(si, fi, 'inheritTableFrom', e.target.checked ? (step0TableField?.id || 'auto') : '');
            }}/>
          <label htmlFor={`inherit_${si}_${fi}`} style={{ fontSize:'12px', fontWeight:700, color: field.inheritTableFrom ? '#0369A1' : '#64748B', cursor:'pointer' }}>
            Tableau hérité de l'étape employé — données propagées automatiquement
          </label>
        </div>
      )}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <p style={{ margin:0, fontSize:'12px', fontWeight:700, color:'#0369A1' }}>
          {isEmployeStep ? 'Colonnes du tableau' : (field.inheritTableFrom ? 'Colonnes supplémentaires' : 'Colonnes du tableau')}
        </p>
        <button onClick={() => addStepFieldColumn(si, fi)}
          style={{ padding:'4px 12px', borderRadius:'7px', background:'#0EA5E9', color:'#fff', border:'none', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
          + {!isEmployeStep && field.inheritTableFrom ? 'Colonne supplémentaire' : 'Colonne'}
        </button>
      </div>
      {!isEmployeStep && field.inheritTableFrom && (() => {
        const step0Table = form.steps[0]?.fields?.find(f => f.type === 'table');
        return (step0Table?.columns || []).map((col, ci) => (
          <div key={col.id || ci} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px', opacity:0.5, pointerEvents:'none' }}>
            <input value={col.label} readOnly style={{ ...getInp(false), flex:1, background:'#F1F5F9', color:'#94A3B8' }}/>
            <span style={{ fontSize:'11px', color:'#94A3B8', background:'#F1F5F9', padding:'4px 8px', borderRadius:'6px' }}>{col.type}</span>
            <span style={{ fontSize:'10px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'2px' }}><IconLock/> hérité</span>
          </div>
        ));
      })()}
      {(field.columns || []).map((col, ci) => (
        <div key={col.id || ci} style={{ display:'grid', gridTemplateColumns:'2fr 1fr auto auto', gap:'7px', alignItems:'center', marginBottom:'7px' }}>
          <input value={col.label} onChange={e => updateStepFieldColumn(si, fi, ci, 'label', e.target.value)} placeholder="Nom colonne" style={getInp(false)}/>
          <SSelect value={col.type || 'text'} onChange={e => updateStepFieldColumn(si, fi, ci, 'type', e.target.value)}>
            <option value="text">Texte</option>
            <option value="number">Nombre</option>
            <option value="date">Date</option>
          </SSelect>
          <label style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#64748B', fontWeight:500, whiteSpace:'nowrap' }}>
            <input type="checkbox" checked={col.required||false} onChange={e => updateStepFieldColumn(si, fi, ci, 'required', e.target.checked)}/> Req
          </label>
          <button onClick={() => removeStepFieldColumn(si, fi, ci)}
            style={{ width:'28px', height:'28px', background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA', borderRadius:'7px', cursor:'pointer', fontWeight:800, fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>
      ))}
      {(field.columns||[]).length === 0 && <p style={{ margin:0, fontSize:'11px', color:'#94A3B8' }}>Cliquez "+ Colonne" pour ajouter</p>}
    </div>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        background: isDragging ? '#EFF6FF' : '#fff',
        borderRadius:'10px',
        border: isDragging ? `1.5px solid ${B}` : '1.5px solid #E2E8F0',
        padding:'12px 14px',
        marginBottom:'8px',
        boxShadow: isDragging ? `0 8px 24px rgba(37,99,235,0.18)` : '0 1px 3px rgba(0,0,0,0.04)',
        transition:'box-shadow 0.15s, border-color 0.15s',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'auto 2fr 0.9fr auto auto', gap:'8px', alignItems:'center' }}>

          {/* ── Drag handle ── */}
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              color: '#CBD5E1',
              display:'flex', alignItems:'center', justifyContent:'center',
              padding:'4px 6px', borderRadius:'6px',
              transition:'color 0.15s, background 0.15s',
              userSelect:'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = B; e.currentTarget.style.background = '#EFF6FF'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'transparent'; }}
            title="Glisser pour réordonner"
          >
            <IconGrip />
          </div>

          {/* Label */}
          <input
            value={field.label}
            onChange={e => updateStepField(si, fi, 'label', e.target.value)}
            placeholder="Label du champ"
            style={getInp(false)}
          />

          {/* Type badge */}
          <span style={{ background:'#EFF6FF', color:B, padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:800, textAlign:'center', fontFamily:'monospace' }}>
            {FIELD_TYPES.find(t => t.type === field.type)?.label || field.type}
          </span>

          {/* Required */}
          <label style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#64748B', fontWeight:600, whiteSpace:'nowrap', cursor:'pointer' }}>
            <input type="checkbox" checked={field.required||false} onChange={e => updateStepField(si, fi, 'required', e.target.checked)}/>
            Requis
          </label>

          {/* Delete */}
          <button onClick={() => removeStepField(si, fi)}
            style={{ width:'28px', height:'28px', background:'#FFF7ED', color:'#F59E0B', border:'1.5px solid #FED7AA', borderRadius:'7px', cursor:'pointer', fontWeight:800, fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>

        {field.type === 'select' && (
          <div style={{ marginTop:'10px' }}>
            <Lbl>Options (une par ligne)</Lbl>
            <STextarea rows={3} value={(field.options||[]).join('\n')}
              onChange={e => updateStepField(si, fi, 'options', e.target.value.split('\n').filter(Boolean))}
              placeholder="Option 1&#10;Option 2"/>
          </div>
        )}
        {field.type === 'table' && renderColumnEditor()}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// ── Sortable Fields List ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════
const SortableFieldsList = ({ si, fields, form, updateStepField, removeStepField, addStepFieldColumn, updateStepFieldColumn, removeStepFieldColumn, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    onReorder(si, arrayMove(fields, oldIndex, newIndex));
  };

  if (fields.length === 0) {
    return (
      <div style={{ padding:'20px', textAlign:'center', background:'#F8FAFC', borderRadius:'10px', border:'2px dashed #E2E8F0', color:'#94A3B8', fontSize:'13px' }}>
        Cliquez sur un type de champ ci-dessus pour l'ajouter
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        {fields.map((field, fi) => (
          <SortableFieldRow
            key={field.id}
            field={field}
            fi={fi}
            si={si}
            totalFields={fields.length}
            form={form}
            updateStepField={updateStepField}
            removeStepField={removeStepField}
            addStepFieldColumn={addStepFieldColumn}
            updateStepFieldColumn={updateStepFieldColumn}
            removeStepFieldColumn={removeStepFieldColumn}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const TemplatesList = () => {
  const navigate = useNavigate();

  const [templates,   setTemplates]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [search,      setSearch]      = useState('');

  const emptyForm = () => ({
    name:'', description:'', type:'validation_confirmation',
    steps: buildStepsForType('validation_confirmation'),
  });
  const [form, setForm] = useState(emptyForm());

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await templateService.getAll();
      setTemplates(res.data?.templates || []);
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 4000); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return templates;
    return templates.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      TYPE_CONFIG[t.type]?.label?.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const handleTypeChange = (type) => setForm(p => ({ ...p, type, steps: buildStepsForType(type, p.steps) }));
  const handleNewTemplate = () => { setEditId(null); setForm(emptyForm()); setShowForm(true); };

  const handleEdit = async (template) => {
    setEditId(template._id); setShowForm(true);
    try {
      const res = await templateService.getById(template._id);
      const t = res.data?.template || template;
      setForm({
        name: t.name, description: t.description || '', type: t.type, docType: t.docType || '',
        steps: (t.steps || []).map((s, i) => ({
          ...s, role: s.role || s.rempliPar || (i === 0 ? 'employe' : 'validateur'),
          fields: s.form?.fields || s.fields || [],
          _delaiUnit: !s.delai ? 'heures' : s.delai % 1440 === 0 ? 'jours' : s.delai % 60 === 0 ? 'heures' : 'minutes',
        })),
      });
    } catch {
      setForm({
        name: template.name, description: template.description || '', type: template.type,
        steps: (template.steps || []).map((s, i) => ({
          ...s, role: s.role || (i === 0 ? 'employe' : 'validateur'),
          fields: s.form?.fields || s.fields || [], _delaiUnit: 'heures',
        })),
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { showMsg('ERREUR Nom requis'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, type: form.type,
        steps: form.steps.map(({ _delaiUnit, fields, fixed, role, ...s }) => ({
          ...s, role, fixed: fixed || false,
          form: {
            fields: (fields || []).map(f => ({
              id: f.id || 'f_' + Date.now(), label: f.label || '', type: f.type || 'text',
              required: f.required || false, readOnly: f.readOnly || false,
              autoSource: f.autoSource || '', options: f.options || [],
              columns: f.inheritTableFrom ? [] : (f.columns || []).map(c => ({ id: c.id || 'col_'+Date.now(), label: c.label||'', type: c.type||'text', required: c.required||false, width: c.width||'auto' })),
              extraColumns: f.inheritTableFrom ? (f.columns || []).map(c => ({ id: c.id||'col_'+Date.now(), label: c.label||'', type: c.type||'text', required: c.required||false, width: c.width||'auto' })) : [],
              inheritTableFrom: f.inheritTableFrom || '',
            })),
          },
        })),
      };
      if (editId) { await templateService.update(editId, payload); showMsg('SUCCESS Template modifié !'); }
      else { await templateService.create(payload); showMsg('SUCCESS Template créé !'); }
      setShowForm(false); setEditId(null); fetchTemplates();
    } catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
    finally { setSaving(false); }
  };
const handleArchive = async () => {
    if (!deleteModal) return;
    try { await templateService.archive(deleteModal._id); showMsg('SUCCESS Template archivé'); setDeleteModal(null); fetchTemplates(); }
    catch (err) { showMsg('ERREUR ' + (err.response?.data?.message || err.message)); }
  };

  // ── Step field helpers ─────────────────────────────────────────────────
  const addStepField = (si, type) => {
    const updated = [...form.steps];
    updated[si] = { ...updated[si], fields: [...(updated[si].fields||[]), makeField(type)] };
    setForm(p => ({ ...p, steps: updated }));
  };
  const updateStepField = (si, fi, key, val) => {
    const updated = [...form.steps];
    updated[si].fields[fi] = { ...updated[si].fields[fi], [key]: val };
    setForm(p => ({ ...p, steps: updated }));
  };
  const removeStepField = (si, fi) => {
    const updated = [...form.steps];
    updated[si].fields = updated[si].fields.filter((_, i) => i !== fi);
    setForm(p => ({ ...p, steps: updated }));
  };

  // ── Drag & drop reorder handler ────────────────────────────────────────
  const reorderStepFields = (si, newFields) => {
    const updated = [...form.steps];
    updated[si] = { ...updated[si], fields: newFields };
    setForm(p => ({ ...p, steps: updated }));
  };

  const updateStep = (si, key, value) => {
    const updated = [...form.steps];
    updated[si] = { ...updated[si], [key]: value };
    setForm(p => ({ ...p, steps: updated }));
  };
  const addChecklistItem = (si) => {
    const updated = [...form.steps];
    updated[si].checklist = [...(updated[si].checklist||[]), { id: 'c_'+Date.now(), label: 'Nouvelle tâche', required: false, checked: false }];
    setForm(p => ({ ...p, steps: updated }));
  };
  const updateChecklistItem = (si, ci, key, val) => {
    const updated = [...form.steps];
    updated[si].checklist[ci] = { ...updated[si].checklist[ci], [key]: val };
    setForm(p => ({ ...p, steps: updated }));
  };
  const removeChecklistItem = (si, ci) => {
    const updated = [...form.steps];
    updated[si].checklist = updated[si].checklist.filter((_, i) => i !== ci);
    setForm(p => ({ ...p, steps: updated }));
  };
  const addStepFieldColumn = (si, fi) => {
    const updated = [...form.steps];
    updated[si].fields[fi].columns = [...(updated[si].fields[fi].columns||[]), { id: 'col_'+Date.now(), label: 'Nouvelle colonne', type: 'text', required: false }];
    setForm(p => ({ ...p, steps: updated }));
  };
  const updateStepFieldColumn = (si, fi, ci, key, val) => {
    const updated = [...form.steps];
    updated[si].fields[fi].columns[ci] = { ...updated[si].fields[fi].columns[ci], [key]: val };
    setForm(p => ({ ...p, steps: updated }));
  };
  const removeStepFieldColumn = (si, fi, ci) => {
    const updated = [...form.steps];
    updated[si].fields[fi].columns = updated[si].fields[fi].columns.filter((_, i) => i !== ci);
    setForm(p => ({ ...p, steps: updated }));
  };

  // ── Step card ──────────────────────────────────────────────────────────
  const renderStep = (step, si) => {
    const isEmploye = step.role === 'employe';
    const stepColor = isEmploye ? EMPLOYE_STEP_CONFIG.color : TYPE_CONFIG[form.type]?.validationSteps?.[si-1]?.color || B;
    const stepBg    = isEmploye ? EMPLOYE_STEP_CONFIG.bg    : TYPE_CONFIG[form.type]?.validationSteps?.[si-1]?.bg    || '#EFF6FF';

    return (
      <div key={si} style={{ marginBottom:'16px', borderRadius:'14px', overflow:'hidden', border:`1.5px solid ${stepColor}25`, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Step header */}
        <div style={{ background:stepBg, padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px', background:stepColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'14px', flexShrink:0 }}>
            {si + 1}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontWeight:800, fontSize:'14px', color:'#0F172A' }}>{step.name}</p>
            <p style={{ margin:0, fontSize:'11px', color:stepColor, fontWeight:600 }}>
              {isEmploye ? 'Accessible à tous les employés — remplit la demande initiale' : "Assigné à un poste lors de l'utilisation du template"}
            </p>
          </div>
          {isEmploye ? (
            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:stepColor, color:'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700 }}>
              <IconLock/> Fixe
            </span>
          ) : (
            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fff', color:stepColor, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${stepColor}30` }}>
              Poste assigné au démarrage
            </span>
          )}
          <span style={{ background:'#fff', color:'#64748B', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:600, border:'1px solid #E2E8F0' }}>
            {(step.fields||[]).length} champ{(step.fields||[]).length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Step body */}
        <div style={{ padding:'20px', background:'#fff' }}>
          {!isEmploye && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'16px' }}>
              <div>
                <Lbl>Instructions pour le responsable</Lbl>
                <SInput value={step.description||''} onChange={e => updateStep(si, 'description', e.target.value)} placeholder="Ex: Vérifier le budget disponible"/>
              </div>
              <div>
                <Lbl>Délai (optionnel)</Lbl>
                <div style={{ display:'flex', gap:'7px' }}>
                  <SInput type="number" min="0"
                    value={(() => {
                      const unit = step._delaiUnit||'heures', mins = step.delai||0;
                      if (!mins) return '';
                      if (unit==='minutes') return mins;
                      if (unit==='heures')  return Math.round(mins/60);
                      return Math.round(mins/1440);
                    })()}
                    onChange={e => {
                      const val=parseInt(e.target.value)||0, unit=step._delaiUnit||'heures';
                      updateStep(si, 'delai', unit==='minutes'?val:unit==='heures'?val*60:val*1440);
                    }}
                    placeholder="0"/>
                  <SSelect value={step._delaiUnit||'heures'} width="110px"
                    onChange={e => {
                      const newUnit=e.target.value, oldUnit=step._delaiUnit||'heures', mins=step.delai||0;
                      const valAct=oldUnit==='minutes'?mins:oldUnit==='heures'?Math.round(mins/60):Math.round(mins/1440);
                      const newMins=newUnit==='minutes'?valAct:newUnit==='heures'?valAct*60:valAct*1440;
                      const u=[...form.steps]; u[si]={...u[si],_delaiUnit:newUnit,delai:newMins};
                      setForm(p=>({...p,steps:u}));
                    }}>
                    <option value="minutes">min</option>
                    <option value="heures">heures</option>
                    <option value="jours">jours</option>
                  </SSelect>
                </div>
              </div>
            </div>
          )}

          {/* Fields */}
          <StepSection title={isEmploye ? "Champs remplis par l'employé" : `Champs remplis lors de la validation`}>
            <p style={{ margin:'0 0 10px', fontSize:'12px', color:'#94A3B8' }}>
              {isEmploye ? 'Ces champs apparaissent dans le formulaire de soumission' : 'Ces champs apparaissent lors de la validation par le responsable'}
            </p>

            {/* Field type palette */}
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'12px', padding:'10px', background:'#F8FAFC', borderRadius:'10px', border:'1.5px dashed #E2E8F0' }}>
              <span style={{ fontSize:'11px', color:'#94A3B8', fontWeight:700, display:'flex', alignItems:'center', marginRight:'4px' }}>+ Ajouter :</span>
              {FIELD_TYPES.filter(ft => isEmploye ? true : ft.type !== 'auto_number').map(ft => (
                <button key={ft.type} onClick={() => addStepField(si, ft.type)}
                  style={{ padding:'5px 10px', borderRadius:'7px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontSize:'11px', fontWeight:700, color:'#475569', fontFamily:'monospace', transition:'all 0.1s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=B;e.currentTarget.style.color=B;e.currentTarget.style.background='#EFF6FF';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#E2E8F0';e.currentTarget.style.color='#475569';e.currentTarget.style.background='#fff';}}>
                  {ft.icon} {ft.label}
                </button>
              ))}
            </div>

            {/* ── Drag & drop field list ── */}
            {(step.fields||[]).length > 1 && (
              <p style={{ margin:'0 0 8px', fontSize:'11px', color:'#94A3B8', display:'flex', alignItems:'center', gap:'5px' }}>
                <IconGrip /> Glissez les champs pour les réordonner
              </p>
            )}
            <SortableFieldsList
              si={si}
              fields={step.fields || []}
              form={form}
              updateStepField={updateStepField}
              removeStepField={removeStepField}
              addStepFieldColumn={addStepFieldColumn}
              updateStepFieldColumn={updateStepFieldColumn}
              removeStepFieldColumn={removeStepFieldColumn}
              onReorder={reorderStepFields}
            />
          </StepSection>

          {/* Checklist */}
          {!isEmploye && (
            <StepSection title="Checklist (optionnel)">
              {(step.checklist||[]).map((item, ci) => (
                <div key={item.id||ci} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'7px' }}>
                  <input value={item.label} onChange={e => updateChecklistItem(si, ci, 'label', e.target.value)}
                    placeholder="Tâche à cocher" style={getInp(false)}/>
                  <label style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:'#64748B', fontWeight:500, whiteSpace:'nowrap', cursor:'pointer' }}>
                    <input type="checkbox" checked={item.required||false} onChange={e => updateChecklistItem(si, ci, 'required', e.target.checked)}/> Requis
                  </label>
                  <button onClick={() => removeChecklistItem(si, ci)}
                    style={{ width:'28px', height:'28px', background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', borderRadius:'7px', cursor:'pointer', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={() => addChecklistItem(si)}
                style={{ width:'100%', padding:'8px', borderRadius:'9px', border:'2px dashed #BFDBFE', background:'#F8FAFC', color:B, cursor:'pointer', fontWeight:700, fontSize:'13px', fontFamily:"'Inter',sans-serif", marginTop:'4px' }}>
                + Ajouter une tâche
              </button>
            </StepSection>
          )}
        </div>
      </div>
    );
  };

  const isSuccess = msg.startsWith('SUCCESS');
  const msgText   = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .tmpl-card { transition: all 0.2s ease; }
        .tmpl-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }
        input:focus, select:focus, textarea:focus { border-color: ${B} !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
      `}</style>

      <div style={{ padding:'32px', maxWidth:'1000px', margin:'0 auto', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* ── Toast ── */}
        {msg && (
          <div style={{ position:'fixed', top:'24px', right:'24px', zIndex:9999, padding:'13px 18px', borderRadius:'12px', fontWeight:600, fontSize:'14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', animation:'slideIn 0.25s ease', display:'flex', alignItems:'center', gap:'9px', ...(isSuccess ? {background:'#F0FDF4',border:'1.5px solid #BBF7D0',color:'#16A34A'} : {background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#DC2626'}) }}>
            {isSuccess ? <IconCheck/> : <IconAlert/>} {msgText}
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px', flexWrap:'wrap', gap:'16px' }}>
          <div>
            <h1 style={{ margin:'0 0 4px', fontSize:'26px', fontWeight:900, color:'#0F172A', letterSpacing:'-0.5px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${B}15`, border:`1.5px solid ${B}25`, display:'inline-flex', alignItems:'center', justifyContent:'center', color:B }}><IconLayout/></span>
              Templates de workflow
            </h1>
            <p style={{ margin:0, color:'#64748B', fontSize:'14px' }}>
              <strong style={{color:'#0F172A'}}>{templates.length}</strong> template(s) — modèles réutilisables
            </p>
          </div>
          {!showForm && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              {templates.length > 0 && (
                <div style={{ position:'relative', width:'240px' }}>
                  <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none', display:'flex' }}>
                    <IconSearch/>
                  </span>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
                    style={{ width:'100%', boxSizing:'border-box', padding:'9px 32px 9px 36px', borderRadius:'9px', border:'1.5px solid #E2E8F0', fontSize:'13px', color:'#0F172A', outline:'none', background:'#F8FAFC', fontFamily:"'Inter',sans-serif", transition:'all 0.15s' }}
                    onFocus={e=>{e.target.style.borderColor=B;e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)';e.target.style.background='#fff';}}
                    onBlur={e=>{e.target.style.borderColor='#E2E8F0';e.target.style.boxShadow='none';e.target.style.background='#F8FAFC';}}/>
                  {search && (
                    <button onClick={()=>setSearch('')} style={{ position:'absolute', right:'9px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94A3B8', cursor:'pointer', padding:'2px', display:'flex' }}>
                      <IconX/>
                    </button>
                  )}
                </div>
              )}
              <button onClick={handleNewTemplate}
                style={{ display:'flex', alignItems:'center', gap:'8px', background:B, color:'#fff', padding:'10px 18px', borderRadius:'10px', border:'none', fontWeight:700, cursor:'pointer', fontSize:'14px', boxShadow:`0 4px 14px ${B}55`, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>
                <IconPlus/> Nouveau template
              </button>
            </div>
          )}
        </div>

        {/* ── FORM ── */}
        {showForm && (
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', boxShadow:'0 2px 16px rgba(0,0,0,0.08)', border:'1.5px solid #E2E8F0', marginBottom:'32px', animation:'fadeUp 0.2s ease' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px', paddingBottom:'16px', borderBottom:'1.5px solid #F1F5F9' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background: editId ? '#FFF7ED' : '#EFF6FF', border: editId ? '1px solid #FED7AA' : `1px solid #BFDBFE`, display:'flex', alignItems:'center', justifyContent:'center', color: editId ? '#EA580C' : B }}>
                {editId ? <IconEdit/> : <IconPlus/>}
              </div>
              <h2 style={{ margin:0, fontSize:'16px', fontWeight:800, color:'#0F172A' }}>
                {editId ? 'Modifier le template' : 'Créer un template'}
              </h2>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'16px', marginBottom:'20px' }}>
              <div>
                <Lbl>Nom du template *</Lbl>
                <SInput value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ex : Demande d'achat standard"/>
              </div>
              <div>
                <Lbl>Description</Lbl>
                <SInput value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Description optionnelle"/>
              </div>
            </div>

            <div style={{ marginBottom:'28px' }}>
              <Lbl>Type de workflow *</Lbl>
              <p style={{ margin:'0 0 12px', fontSize:'12px', color:'#64748B' }}>
                Le type détermine le circuit d'approbation. L'étape Employé est toujours présente.
              </p>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleTypeChange(key)}
                    style={{ padding:'14px 18px', borderRadius:'12px', cursor:'pointer', fontFamily:"'Inter',sans-serif", textAlign:'left', border: form.type===key ? `2px solid ${cfg.color}` : '1.5px solid #E2E8F0', background: form.type===key ? cfg.bg : '#F8FAFC', color: form.type===key ? cfg.color : '#64748B', minWidth:'190px', transition:'all 0.15s', boxShadow: form.type===key ? `0 4px 14px ${cfg.color}25` : 'none' }}>
                    <div style={{ fontSize:'13px', fontWeight:800, marginBottom:'6px' }}>{cfg.label}</div>
                    <div style={{ fontSize:'11px', fontWeight:400, color: form.type===key ? cfg.color : '#94A3B8', lineHeight:1.5 }}>
                      {key==='validation_confirmation' ? '👤 Employé → ✓ Validateur → ✓ Confirmateur'
                        : key==='confirmation_only' ? '👤 Employé → ✓ Confirmateur'
                        : '👤 Employé → ⚡ Approuvé automatiquement'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop:'1.5px solid #F1F5F9', paddingTop:'24px', marginBottom:'24px' }}>
              <h3 style={{ margin:'0 0 6px', fontSize:'15px', fontWeight:800, color:'#0F172A' }}>Étapes du workflow</h3>
              <p style={{ margin:'0 0 20px', fontSize:'13px', color:'#64748B' }}>
                Configurez les champs de chaque étape. Les postes seront assignés lors de l'utilisation du template.
              </p>
              {form.steps.map((step, si) => renderStep(step, si))}
              {form.type === 'automatic' && form.steps.length === 1 && (
                <div style={{ background:'#FFFBEB', borderRadius:'10px', padding:'14px 18px', border:'1.5px solid #FDE68A', marginTop:'12px' }}>
                  <p style={{ margin:0, fontWeight:700, color:'#92400E', fontSize:'13px' }}>
                    ⚡ Les demandes seront approuvées automatiquement après soumission par l'employé.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={handleSubmit} disabled={saving}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', borderRadius:'10px', background:saving?'#E2E8F0':B, color:saving?'#94A3B8':'#fff', border:'none', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:'15px', fontFamily:"'Inter',sans-serif", boxShadow:saving?'none':`0 4px 14px ${B}55` }}>
                {saving ? <><IconLoader/> Sauvegarde…</> : <><IconSave/> {editId ? 'Sauvegarder' : 'Créer le template'}</>}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); }}
                style={{ padding:'12px 24px', borderRadius:'10px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', fontSize:'15px', fontFamily:"'Inter',sans-serif" }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ── LIST ── */}
        {!showForm && (
          <>
            {loading ? (
              <div style={{ textAlign:'center', padding:'60px', color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', fontSize:'15px' }}>
                <IconLoader/> Chargement…
              </div>
            ) : templates.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:'16px', padding:'64px', textAlign:'center', border:'1.5px solid #E2E8F0' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'#EFF6FF', border:`1.5px solid #BFDBFE`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', color:B }}><IconLayout/></div>
                <h3 style={{ margin:'0 0 8px', color:'#0F172A', fontWeight:800 }}>Aucun template</h3>
                <p style={{ color:'#64748B', margin:'0 0 24px' }}>Créez votre premier template de workflow réutilisable</p>
                <button onClick={handleNewTemplate} style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:B, color:'#fff', padding:'11px 22px', borderRadius:'10px', border:'none', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                  <IconPlus/> Créer un template
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:'14px', padding:'48px', textAlign:'center', border:'1.5px solid #E2E8F0' }}>
                <p style={{ margin:'0 0 8px', fontWeight:700, color:'#0F172A', fontSize:'15px' }}>Aucun résultat pour « {search} »</p>
                <p style={{ margin:'0 0 16px', color:'#94A3B8', fontSize:'13px' }}>Essayez un autre nom ou type.</p>
                <button onClick={()=>setSearch('')} style={{ padding:'7px 18px', borderRadius:'8px', border:`1.5px solid ${B}`, color:B, background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'13px', fontFamily:"'Inter',sans-serif" }}>
                  Effacer la recherche
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:'18px' }}>
                  {filtered.map(tmpl => {
                    const cfg = TYPE_CONFIG[tmpl.type] || TYPE_CONFIG.confirmation_only;
                    return (
                      <div key={tmpl._id} className="tmpl-card"
                        style={{ background:'#fff', borderRadius:'16px', border:'1.5px solid #F1F5F9', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column' }}>
                        <div style={{ height:'3px', background:`linear-gradient(90deg,${cfg.color},${cfg.color}99)` }}/>
                        <div style={{ padding:'22px', flex:1, display:'flex', flexDirection:'column' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', minWidth:0 }}>
                              <div style={{ width:'42px', height:'42px', borderRadius:'11px', background:cfg.bg, border:`1.5px solid ${cfg.color}25`, display:'flex', alignItems:'center', justifyContent:'center', color:cfg.color, flexShrink:0 }}>
                                <IconLayout/>
                              </div>
                              <div style={{ minWidth:0 }}>
                                <h3 style={{ margin:'0 0 4px', fontSize:'15px', fontWeight:800, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tmpl.name}</h3>
                                <span style={{ display:'inline-block', background:cfg.bg, color:cfg.color, padding:'2px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${cfg.color}25` }}>{cfg.label}</span>
                              </div>
                            </div>
                            <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                              <button onClick={() => handleEdit(tmpl)}
                                style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#EFF6FF', color:B, border:`1.5px solid #BFDBFE`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <IconEdit/>
                              </button>
                              <button onClick={() => setDeleteModal(tmpl)}
                              style={{ width:'30px', height:'30px', borderRadius:'8px', background:'#FFF7ED', color:'#F59E0B', border:'1.5px solid #FED7AA', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>                                <IconTrash/>
                              </button>
                            </div>
                          </div>
                          {tmpl.description && <p style={{ color:'#64748B', fontSize:'13px', margin:'0 0 14px', lineHeight:1.5 }}>{tmpl.description}</p>}
                          <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginBottom:'18px', flex:1 }}>
                            {(tmpl.steps||[]).map((step, i) => {
                              const fieldCount = step.form?.fields?.length || step.fields?.length || 0;
                              const isEmp = step.role === 'employe';
                              const sColor = isEmp ? EMPLOYE_STEP_CONFIG.color : cfg.color;
                              const sBg    = isEmp ? EMPLOYE_STEP_CONFIG.bg    : cfg.bg;
                              return (
                                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 11px', background:`${sBg}80`, borderRadius:'8px', border:`1px solid ${sColor}20` }}>
                                  <div style={{ width:'20px', height:'20px', borderRadius:'6px', background:sColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:800, flexShrink:0 }}>{i+1}</div>
                                  <span style={{ fontWeight:700, fontSize:'12px', color:sColor, flex:1 }}>{step.name}</span>
                                  {fieldCount > 0 && (
                                    <span style={{ background:'#fff', color:sColor, padding:'1px 7px', borderRadius:'10px', fontSize:'10px', fontWeight:700, border:`1px solid ${sColor}25` }}>
                                      {fieldCount} champ{fieldCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  <span style={{ fontSize:'10px', color:'#94A3B8' }}>{isEmp ? 'Tous les employés' : 'Poste à assigner'}</span>
                                </div>
                              );
                            })}
                          </div>
                          <button onClick={() => navigate('/dashboard/company/workflows/new?template=' + tmpl._id)}
                            style={{ width:'100%', padding:'10px', borderRadius:'9px', background:cfg.color, color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', fontFamily:"'Inter',sans-serif", boxShadow:`0 3px 10px ${cfg.color}40` }}>
                            Utiliser ce template <IconArrowR/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {search && (
                  <p style={{ textAlign:'right', marginTop:'12px', fontSize:'12px', color:'#94A3B8' }}>
                    <strong style={{color:'#0F172A'}}>{filtered.length}</strong> / {templates.length} template(s)
                  </p>
                )}
              </>
            )}
          </>
        )}

        {/* ── Delete Modal ── */}
      {deleteModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
            <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', maxWidth:'420px', width:'90%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)', textAlign:'center', fontFamily:"'Inter',sans-serif" }}>
              <div style={{ width:'52px', height:'52px', borderRadius:'13px', background:'#FFF7ED', border:'1.5px solid #FED7AA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', color:'#F59E0B' }}><IconTrash/></div>
              <h3 style={{ margin:'0 0 8px', fontSize:'17px', fontWeight:800, color:'#0F172A' }}>Archiver ce template ?</h3>
              <p style={{ color:'#64748B', margin:'0 0 24px', lineHeight:1.6, fontSize:'14px' }}>
                Le template <strong style={{color:'#0F172A'}}>"{deleteModal.name}"</strong> sera archivé. Il n'apparaîtra plus dans la liste mais pourra être restauré.
              </p>
              <div style={{ display:'flex', gap:'12px' }}>
                <button onClick={handleArchive} style={{ flex:1, padding:'11px', borderRadius:'9px', background:'#F59E0B', color:'#fff', border:'none', fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Archiver</button>
                <button onClick={() => setDeleteModal(null)} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', fontWeight:600, color:'#475569', fontFamily:"'Inter',sans-serif" }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TemplatesList;