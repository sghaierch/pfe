import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import templateService from '../../../services/templateService';

// ── Config des types de workflow ──────────────────────────────────────────────
// Chaque type définit les étapes FIXES (après l'étape Employé qui est toujours là)
const TYPE_CONFIG = {
  validation_confirmation: {
    label:       'Validation + Confirmation',
    color:       '#4f46e5',
    bg:          '#ede9fe',
    icon:        '✓✓',
    // Étapes de validation après l'étape Employé
    validationSteps: [
      { name: 'Validation',    role: 'validateur',   color: '#4f46e5', bg: '#ede9fe', icon: '✅' },
      { name: 'Confirmation',  role: 'confirmateur', color: '#059669', bg: '#dcfce7', icon: '☑️' },
    ],
  },
  confirmation_only: {
    label:       'Juste Confirmation',
    color:       '#059669',
    bg:          '#dcfce7',
    icon:        '✓',
    validationSteps: [
      { name: 'Confirmation', role: 'confirmateur', color: '#059669', bg: '#dcfce7', icon: '☑️' },
    ],
  },
  automatic: {
    label:       'Automatique',
    color:       '#f59e0b',
    bg:          '#fef3c7',
    icon:        '⚡',
    validationSteps: [], // Pas d'étapes de validation
  },
};

// Étape Employé — toujours fixe, toujours en premier
const EMPLOYE_STEP_CONFIG = {
  name:  'Demande Employé',
  role:  'employe',
  color: '#0891b2',
  bg:    '#e0f2fe',
  icon:  '👤',
  fixed: true, // non modifiable
};

const FIELD_TYPES = [
  { type: 'text',        label: 'Texte',       icon: 'T'  },
  { type: 'number',      label: 'Nombre',      icon: '123'},
  { type: 'date',        label: 'Date',        icon: 'D'  },
  { type: 'select',      label: 'Liste',       icon: 'L'  },
  { type: 'textarea',    label: 'Zone texte',  icon: 'TT' },
  { type: 'checkbox',    label: 'Case',        icon: 'CB' },
  { type: 'signature',   label: 'Signature',   icon: 'SG' },
  { type: 'table',       label: 'Tableau',     icon: '📦' },
  { type: 'auto_number', label: 'N° Auto',     icon: '🔢' },
  { type: 'auto_user',   label: 'Demandeur',   icon: '👤' },
  { type: 'auto_status', label: 'Statut Auto', icon: '⚙️' },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none', background: '#fff',
};
const lbl = {
  display: 'block', fontWeight: 600, fontSize: '12px',
  color: '#374151', marginBottom: '5px',
};

// ── Créer un champ vide ───────────────────────────────────────────────────────
const makeField = (type) => ({
  id:       'f_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  label:    type === 'auto_number' ? 'Numéro document'
          : type === 'auto_user'   ? 'Demandeur'
          : type === 'auto_status' ? 'Statut'
          : 'Nouveau champ',
  type,
  required:   false,
  readOnly:   ['auto_number', 'auto_user', 'auto_status'].includes(type),
  autoSource: '',
  options:    type === 'select' ? ['Option 1'] : [],
  columns:    type === 'table'
    ? [
        { id: 'col_article',  label: 'Article',  type: 'text',   required: true },
        { id: 'col_quantite', label: 'Quantité', type: 'number', required: true },
      ]
    : [],
});

// ── Construire les étapes selon le type choisi ────────────────────────────────
// Résultat : [étape_employé, ...étapes_validation]
const buildStepsForType = (type, existingSteps = []) => {
  const cfg = TYPE_CONFIG[type];
  const allStepDefs = [EMPLOYE_STEP_CONFIG, ...(cfg?.validationSteps || [])];

  return allStepDefs.map((def, i) => {
    // Récupérer les champs existants si on change de type en cours d'édition
    const existing = existingSteps[i];
    return {
      name:        def.name,
      role:        def.role,
      fixed:       def.fixed || false,
      order:       i,
      postSlot:    i === 0 ? '' : `Poste ${String.fromCharCode(64 + i)}`, // A, B, C...
      description: existing?.description || '',
      delai:       existing?.delai       || 0,
      _delaiUnit:  existing?._delaiUnit  || 'heures',
      checklist:   existing?.checklist   || [],
      fields:      existing?.fields      || [],
      claims:      existing?.claims      || { canValidate: true, canReject: true, canModify: false, canView: true },
    };
  });
};

// ═════════════════════════════════════════════════════════════════════════════
const TemplatesList = () => {
  const navigate = useNavigate();

  const [templates,   setTemplates]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  const emptyForm = () => ({
    name:        '',
    description: '',
    type:        'validation_confirmation',
    docType:     '',
    steps:       buildStepsForType('validation_confirmation'),
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

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  // ── Changer le type → reconstruire les étapes en gardant les champs existants
  const handleTypeChange = (type) => {
    setForm(p => ({
      ...p,
      type,
      steps: buildStepsForType(type, p.steps),
    }));
  };

  const handleNewTemplate = () => {
    setEditId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const handleEdit = async (template) => {
    setEditId(template._id);
    setShowForm(true);
    try {
      const res = await templateService.getById(template._id);
      const t   = res.data?.template || template;
      const stepsWithMeta = (t.steps || []).map(s => ({
        ...s,
        fields:     s.form?.fields || s.fields || [],
        _delaiUnit: !s.delai ? 'heures'
          : s.delai % 1440 === 0 ? 'jours'
          : s.delai % 60   === 0 ? 'heures'
          : 'minutes',
      }));
      setForm({
        name:        t.name,
        description: t.description || '',
        type:        t.type,
        docType:     t.docType || '',
        steps:       stepsWithMeta,
      });
    } catch {
      const stepsWithMeta = (template.steps || []).map(s => ({
        ...s,
        fields:     s.form?.fields || s.fields || [],
        _delaiUnit: 'heures',
      }));
      setForm({
        name:        template.name,
        description: template.description || '',
        type:        template.type,
        docType:     template.docType || '',
        steps:       stepsWithMeta,
      });
    }
  };

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) { showMsg('ERREUR Nom requis'); return; }
    setSaving(true);
    try {
      const payload = {
        name:        form.name,
        description: form.description,
        type:        form.type,
        docType:     form.docType,
        steps: form.steps.map(({ _delaiUnit, fields, fixed, role, ...s }) => ({
          ...s,
          role,       // persister le rôle fixe
          fixed:      fixed || false,
          form: { fields: fields || [] },
        })),
      };
      if (editId) {
        await templateService.update(editId, payload);
        showMsg('SUCCESS Template modifié !');
      } else {
        await templateService.create(payload);
        showMsg('SUCCESS Template créé !');
      }
      setShowForm(false);
      setEditId(null);
      fetchTemplates();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await templateService.delete(deleteModal._id);
      showMsg('SUCCESS Template supprimé');
      setDeleteModal(null);
      fetchTemplates();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Helpers champs par étape ──────────────────────────────────────────────
  const addStepField = (si, type) => {
    const updated = [...form.steps];
    updated[si] = { ...updated[si], fields: [...(updated[si].fields || []), makeField(type)] };
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

  const moveStepField = (si, fi, dir) => {
    const updated = [...form.steps];
    const fields  = [...(updated[si].fields || [])];
    const target  = fi + dir;
    if (target < 0 || target >= fields.length) return;
    [fields[fi], fields[target]] = [fields[target], fields[fi]];
    updated[si].fields = fields;
    setForm(p => ({ ...p, steps: updated }));
  };

  const updateStep = (si, key, value) => {
    const updated = [...form.steps];
    updated[si]   = { ...updated[si], [key]: value };
    setForm(p => ({ ...p, steps: updated }));
  };

  const addChecklistItem = (si) => {
    const updated = [...form.steps];
    updated[si].checklist = [
      ...(updated[si].checklist || []),
      { id: 'c_' + Date.now(), label: 'Nouvelle tâche', required: false, checked: false },
    ];
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
    updated[si].fields[fi].columns = [
      ...(updated[si].fields[fi].columns || []),
      { id: 'col_' + Date.now(), label: 'Nouvelle colonne', type: 'text', required: false },
    ];
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

  // ── Render colonnes tableau ───────────────────────────────────────────────
  const renderColumnEditor = (si, fi, field) => (
    <div style={{ marginTop: '10px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>Colonnes du tableau</p>
      {(field.columns || []).map((col, ci) => (
        <div key={col.id || ci} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input value={col.label} onChange={e => updateStepFieldColumn(si, fi, ci, 'label', e.target.value)} style={inp} placeholder="Nom colonne" />
          <select value={col.type} onChange={e => updateStepFieldColumn(si, fi, ci, 'type', e.target.value)} style={inp}>
            <option value="text">Texte</option>
            <option value="number">Nombre</option>
            <option value="date">Date</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <input type="checkbox" checked={col.required} onChange={e => updateStepFieldColumn(si, fi, ci, 'required', e.target.checked)} />
            Requis
          </label>
          <button onClick={() => removeStepFieldColumn(si, fi, ci)}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '6px 8px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      ))}
      <button onClick={() => addStepFieldColumn(si, fi)}
        style={{ fontSize: '12px', color: '#4f46e5', background: 'none', border: '1px dashed #c7d2fe', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
        + Colonne
      </button>
    </div>
  );

  // ── Render un champ d'étape ───────────────────────────────────────────────
  const renderStepField = (si, field, fi, totalFields) => (
    <div key={field.id} style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '12px 14px', marginBottom: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto auto auto', gap: '8px', alignItems: 'center' }}>
        <input value={field.label} onChange={e => updateStepField(si, fi, 'label', e.target.value)} placeholder="Label du champ" style={inp} />
        <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700 }}>
          {FIELD_TYPES.find(t => t.type === field.type)?.label || field.type}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', whiteSpace: 'nowrap', color: '#374151', fontWeight: 600 }}>
          <input type="checkbox" checked={field.required} onChange={e => updateStepField(si, fi, 'required', e.target.checked)} />
          Requis
        </label>
        <button onClick={() => moveStepField(si, fi, -1)} disabled={fi === 0}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '4px 7px', cursor: fi === 0 ? 'not-allowed' : 'pointer', color: fi === 0 ? '#cbd5e1' : '#64748b' }}>↑</button>
        <button onClick={() => moveStepField(si, fi, +1)} disabled={fi === totalFields - 1}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '4px 7px', cursor: fi === totalFields - 1 ? 'not-allowed' : 'pointer', color: fi === totalFields - 1 ? '#cbd5e1' : '#64748b' }}>↓</button>
        <button onClick={() => removeStepField(si, fi)}
          style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '5px 9px', cursor: 'pointer', fontWeight: 700 }}>✕</button>
      </div>
      {field.type === 'select' && (
        <div style={{ marginTop: '10px' }}>
          <label style={{ ...lbl, fontSize: '11px', color: '#64748b' }}>Options (une par ligne)</label>
          <textarea rows={3} value={(field.options || []).join('\n')}
            onChange={e => updateStepField(si, fi, 'options', e.target.value.split('\n').filter(Boolean))}
            style={{ ...inp, resize: 'vertical', fontSize: '13px' }} placeholder="Option 1&#10;Option 2" />
        </div>
      )}
      {field.type === 'table' && renderColumnEditor(si, fi, field)}
    </div>
  );

  // ── Rendu d'une étape ─────────────────────────────────────────────────────
  const renderStep = (step, si) => {
    const isEmploye = step.role === 'employe';
    const stepColor = isEmploye ? EMPLOYE_STEP_CONFIG.color
      : TYPE_CONFIG[form.type]?.validationSteps?.[si - 1]?.color || '#4f46e5';
    const stepBg    = isEmploye ? EMPLOYE_STEP_CONFIG.bg
      : TYPE_CONFIG[form.type]?.validationSteps?.[si - 1]?.bg    || '#ede9fe';
    const stepIcon  = isEmploye ? EMPLOYE_STEP_CONFIG.icon
      : TYPE_CONFIG[form.type]?.validationSteps?.[si - 1]?.icon  || '✅';

    return (
      <div key={si} style={{ marginBottom: '20px', border: `2px solid ${stepColor}30`, borderRadius: '14px', overflow: 'hidden' }}>

        {/* ── En-tête étape ── */}
        <div style={{ background: stepBg, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: stepColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
            {si + 1}
          </div>
          <span style={{ fontSize: '18px' }}>{stepIcon}</span>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{step.name}</p>
            <p style={{ margin: 0, fontSize: '11px', color: stepColor, fontWeight: 600 }}>
              {isEmploye
                ? 'Accessible à tous les employés — remplit la demande initiale'
                : `Assigné à un poste lors de l'utilisation du template`}
            </p>
          </div>
          {isEmploye && (
            <span style={{ marginLeft: 'auto', background: stepColor, color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
              🔒 Fixe
            </span>
          )}
          {!isEmploye && (
            <span style={{ marginLeft: 'auto', background: '#fff', color: stepColor, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: `1px solid ${stepColor}40` }}>
              📌 Poste assigné au démarrage
            </span>
          )}
          <span style={{ background: '#fff', color: '#64748b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: '1px solid #e2e8f0' }}>
            {(step.fields || []).length} champ{(step.fields || []).length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Corps étape ── */}
        <div style={{ padding: '18px', background: '#fff' }}>

          {/* Description + Délai (seulement pour les étapes de validation) */}
          {!isEmploye && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Instructions pour le responsable</label>
                <input value={step.description || ''} onChange={e => updateStep(si, 'description', e.target.value)}
                  style={inp} placeholder="Ex: Vérifier le budget disponible avant validation" />
              </div>
              <div>
                <label style={lbl}>
                  Délai (optionnel)
                  {step.delai > 0 && <span style={{ fontWeight: 400, color: '#4f46e5', marginLeft: '8px', fontSize: '11px' }}>= {step.delai} min</span>}
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" min="0"
                    value={(() => {
                      const unit = step._delaiUnit || 'heures';
                      const mins = step.delai || 0;
                      if (!mins) return '';
                      if (unit === 'minutes') return mins;
                      if (unit === 'heures')  return Math.round(mins / 60);
                      return Math.round(mins / 1440);
                    })()}
                    onChange={e => {
                      const val  = parseInt(e.target.value) || 0;
                      const unit = step._delaiUnit || 'heures';
                      const mins = unit === 'minutes' ? val : unit === 'heures' ? val * 60 : val * 1440;
                      updateStep(si, 'delai', mins);
                    }}
                    style={{ ...inp, flex: 1 }} placeholder="0" />
                  <select value={step._delaiUnit || 'heures'}
                    onChange={e => {
                      const newUnit = e.target.value;
                      const oldUnit = step._delaiUnit || 'heures';
                      const mins    = step.delai || 0;
                      const valAct  = oldUnit === 'minutes' ? mins : oldUnit === 'heures' ? Math.round(mins / 60) : Math.round(mins / 1440);
                      const newMins = newUnit === 'minutes' ? valAct : newUnit === 'heures' ? valAct * 60 : valAct * 1440;
                      const updated = [...form.steps];
                      updated[si]   = { ...updated[si], _delaiUnit: newUnit, delai: newMins };
                      setForm(p => ({ ...p, steps: updated }));
                    }}
                    style={{ ...inp, width: '110px', flexShrink: 0 }}>
                    <option value="minutes">min</option>
                    <option value="heures">heures</option>
                    <option value="jours">jours</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Champs de l'étape ── */}
          <div style={{ borderTop: isEmploye ? 'none' : '1px dashed #e2e8f0', paddingTop: isEmploye ? 0 : '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                  📝 Champs {isEmploye ? 'remplis par l\'employé' : `remplis par le ${step.name}`}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  {isEmploye
                    ? 'Ces champs apparaissent dans le formulaire de soumission de la demande'
                    : 'Ces champs apparaissent lors de la validation par le responsable assigné'}
                </p>
              </div>
            </div>

            {/* Palette de types */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {FIELD_TYPES.map(ft => (
                <button key={ft.type} onClick={() => addStepField(si, ft.type)}
                  title={'Ajouter ' + ft.label}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ft.icon}</span> {ft.label}
                </button>
              ))}
            </div>

            {(step.fields || []).length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '12px' }}>
                Cliquez sur un type ci-dessus pour ajouter un champ à cette étape
              </div>
            ) : (
              (step.fields || []).map((field, fi) => renderStepField(si, field, fi, step.fields.length))
            )}
          </div>

          {/* Checklist (seulement validation) */}
          {!isEmploye && (
            <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...lbl, margin: 0 }}>✅ Checklist (optionnel)</label>
                <button onClick={() => addChecklistItem(si)}
                  style={{ fontSize: '12px', color: '#4f46e5', background: 'none', border: '1px dashed #c7d2fe', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer' }}>
                  + Ajouter
                </button>
              </div>
              {(step.checklist || []).map((item, ci) => (
                <div key={item.id || ci} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <input value={item.label} onChange={e => updateChecklistItem(si, ci, 'label', e.target.value)} style={{ ...inp, flex: 1 }} placeholder="Tâche à cocher" />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.required} onChange={e => updateChecklistItem(si, ci, 'required', e.target.checked)} />
                    Requis
                  </label>
                  <button onClick={() => removeChecklistItem(si, ci)}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Render principal ──────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Templates de workflow</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Définissez vos modèles réutilisables — chaque étape a ses propres champs</p>
        </div>
        {!showForm && (
          <button onClick={handleNewTemplate}
            style={{ background: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
            + Nouveau template
          </button>
        )}
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: msg.startsWith('SUCCESS') ? '#dcfce7' : '#fee2e2', color: msg.startsWith('SUCCESS') ? '#166534' : '#991b1b' }}>
          {msg.startsWith('SUCCESS') ? '✅' : '⚠️'} {msg.replace(/^(SUCCESS|ERREUR)\s?/, '')}
        </div>
      )}

      {/* ── FORMULAIRE ── */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 24px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
            {editId ? 'Modifier le template' : 'Créer un template'}
          </h2>

          {/* Infos de base */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={lbl}>Nom du template *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Demande d'achat standard" style={inp} />
            </div>
            <div>
              <label style={lbl}>Type de document</label>
              <select value={form.docType} onChange={e => setForm(p => ({ ...p, docType: e.target.value }))} style={inp}>
                <option value="">Aucun</option>
                <option value="DA">DA — Demande d'achat</option>
                <option value="BS">BS — Bon de sortie</option>
                <option value="DF">DF — Facturation</option>
                <option value="BR">BR — Bon de réception</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Description</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optionnel" style={inp} />
          </div>

          {/* ── Type de workflow ── */}
          <div style={{ marginBottom: '28px' }}>
            <label style={lbl}>Type de workflow *</label>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b' }}>
              Le type détermine le circuit d'approbation. L'étape Employé est toujours présente.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => handleTypeChange(key)}
                  style={{
                    padding: '12px 20px', borderRadius: '10px', cursor: 'pointer',
                    fontWeight: 700, fontSize: '13px', textAlign: 'left',
                    border: form.type === key ? `2px solid ${cfg.color}` : '2px solid #e2e8f0',
                    background: form.type === key ? cfg.bg : '#f8fafc',
                    color: form.type === key ? cfg.color : '#64748b',
                    minWidth: '200px',
                  }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{cfg.icon}</div>
                  <div>{cfg.label}</div>
                  <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '4px', color: form.type === key ? cfg.color : '#94a3b8' }}>
                    {key === 'validation_confirmation' ? '👤 Employé → ✅ Validateur → ☑️ Confirmateur'
                      : key === 'confirmation_only'    ? '👤 Employé → ☑️ Confirmateur'
                      : '👤 Employé → ⚡ Approuvé automatiquement'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── ÉTAPES ── */}
          <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              🔁 Étapes du workflow
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#64748b' }}>
              Configurez les champs de chaque étape. Les postes seront assignés au moment de l'utilisation du template.
            </p>

            {form.steps.map((step, si) => renderStep(step, si))}

            {form.type === 'automatic' && form.steps.length === 1 && (
              <div style={{ background: '#fef3c7', borderRadius: '10px', padding: '14px 18px', border: '1px solid #fde68a', marginTop: '12px' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '13px' }}>
                  ⚡ Les demandes seront approuvées automatiquement après soumission par l'employé.
                </p>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex: 1, padding: '12px', borderRadius: '10px', background: saving ? '#e2e8f0' : '#4f46e5', color: saving ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px' }}>
              {saving ? 'Sauvegarde...' : editId ? '✓ Sauvegarder' : '✓ Créer le template'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '15px' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── LISTE DES TEMPLATES ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Chargement...</div>
      ) : templates.length === 0 && !showForm ? (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '48px', margin: '0 0 16px' }}>📋</p>
          <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Aucun template</h3>
          <p style={{ color: '#64748b', margin: '0 0 20px' }}>Créez votre premier template de workflow</p>
          <button onClick={handleNewTemplate} style={{ background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            + Créer un template
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {templates.map(tmpl => {
            const cfg = TYPE_CONFIG[tmpl.type] || TYPE_CONFIG.confirmation_only;
            return (
              <div key={tmpl._id} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      {cfg.icon}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{tmpl.name}</h3>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleEdit(tmpl)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: '14px' }}>✏️</button>
                    <button onClick={() => setDeleteModal(tmpl)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff5f5', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '14px' }}>🗑️</button>
                  </div>
                </div>

                {tmpl.description && <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 12px' }}>{tmpl.description}</p>}

                {/* Résumé étapes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                  {(tmpl.steps || []).map((step, i) => {
                    const fieldCount = step.form?.fields?.length || step.fields?.length || 0;
                    const isEmp = step.role === 'employe';
                    const sColor = isEmp ? EMPLOYE_STEP_CONFIG.color : cfg.color;
                    const sBg    = isEmp ? EMPLOYE_STEP_CONFIG.bg    : cfg.bg;
                    const sIcon  = isEmp ? '👤' : cfg.validationSteps?.[i - 1]?.icon || '✅';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: sBg + '60', borderRadius: '7px', border: `1px solid ${sColor}20` }}>
                        <span style={{ fontSize: '14px' }}>{sIcon}</span>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: sColor }}>{step.name}</span>
                        {fieldCount > 0 && (
                          <span style={{ background: '#fff', color: sColor, padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, border: `1px solid ${sColor}30` }}>
                            {fieldCount} champ{fieldCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {isEmp && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#94a3b8' }}>Tous les employés</span>}
                        {!isEmp && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#94a3b8' }}>Poste à assigner</span>}
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => navigate('/dashboard/company/workflows/new?template=' + tmpl._id)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: cfg.color, color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                  Utiliser ce template →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale suppression */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Supprimer ce template ?</h3>
            <p style={{ color: '#64748b', margin: '0 0 24px' }}>
              Le template <strong>"{deleteModal.name}"</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: '8px', background: '#dc2626', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Supprimer</button>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesList;
