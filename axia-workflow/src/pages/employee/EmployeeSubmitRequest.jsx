import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import workflowService from '../../services/workflowService';
import projectService  from '../../services/projectService';

// ─── Styles partagés ──────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f7',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  wrap: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '32px 24px 60px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e8eaf0',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  cardHead: (color = '#4f46e5') => ({
    padding: '16px 24px',
    borderBottom: '1px solid #f0f2f7',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }),
  cardBody: {
    padding: '24px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    color: '#111827',
    background: '#fff',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  inputRO: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1.5px solid #f3f4f6',
    fontSize: '14px',
    color: '#9ca3af',
    background: '#f9fafb',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'not-allowed',
  },
  fieldWrap: {
    marginBottom: '18px',
  },
  badge: (bg, color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    background: bg,
    color: color,
  }),
  submitBtn: (disabled) => ({
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    background: disabled ? '#e5e7eb' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: disabled ? '#9ca3af' : '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.02em',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(79,70,229,0.35)',
    transition: 'all 0.2s',
    marginTop: '8px',
  }),
};

// ─── SignatureCanvas ──────────────────────────────────────────────────────────
const SignatureCanvas = ({ value, onChange }) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  };

  const start = (e) => { e.preventDefault(); isDrawing.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw  = (e) => { e.preventDefault(); if (!isDrawing.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setIsEmpty(false); };
  const stop  = (e) => { e.preventDefault(); if (!isDrawing.current) return; isDrawing.current = false; onChange(canvasRef.current.toDataURL()); };
  const clear = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setIsEmpty(true); onChange(''); };

  return (
    <div style={{ border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
      <canvas
        ref={canvasRef} width={600} height={130}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
        style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #f0f2f7', background: '#fff' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{isEmpty ? 'Signez dans la zone ci-dessus' : '✓ Signature enregistrée'}</span>
        <button type="button" onClick={clear} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#fff', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Effacer</button>
      </div>
    </div>
  );
};

// ─── TableField ───────────────────────────────────────────────────────────────
const TableField = ({ field, value, onChange }) => {
  const cols = field.columns || [];
  const rows = Array.isArray(value) ? value : [];

  useEffect(() => {
    if (rows.length === 0 && cols.length > 0) {
      const empty = { _key: uuidv4() };
      cols.forEach(c => { empty[c.id] = c.type === 'number' ? '' : ''; });
      onChange([empty]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRow = () => {
    const empty = { _key: uuidv4() };
    cols.forEach(c => { empty[c.id] = ''; });
    onChange([...rows, empty]);
  };

  const updateCell = (key, colId, val) =>
    onChange(rows.map(r => r._key === key ? { ...r, [colId]: val } : r));

  const removeRow = (key) => {
    if (rows.length <= 1) return;
    onChange(rows.filter(r => r._key !== key));
  };

  if (cols.length === 0) return (
    <div style={{ padding: '12px 14px', background: '#fffbeb', borderRadius: '8px', color: '#92400e', fontSize: '13px', border: '1px solid #fde68a' }}>
      ⚠️ Aucune colonne configurée pour ce tableau.
    </div>
  );

  const colWidths = cols.map(c => c.type === 'number' ? '100px' : '1fr').join(' ');
  const gridCols  = colWidths + ' 36px';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px 8px 0 0', border: '1.5px solid #e5e7eb', borderBottom: 'none' }}>
        {cols.map(col => (
          <span key={col.id} style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {col.label}{col.required ? ' *' : ''}
          </span>
        ))}
        <span />
      </div>
      {rows.map((row, ri) => (
        <div key={row._key} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderTop: ri === 0 ? '1px solid #e5e7eb' : 'none', background: ri % 2 === 0 ? '#fff' : '#fafafa', borderRadius: ri === rows.length - 1 ? '0 0 8px 8px' : '0', alignItems: 'center' }}>
          {cols.map(col => (
            <input
              key={col.id}
              type={col.type === 'number' ? 'number' : 'text'}
              min={col.type === 'number' ? '0' : undefined}
              value={row[col.id] ?? ''}
              onChange={e => updateCell(row._key, col.id, col.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
              placeholder={col.label}
              style={{ ...S.input, padding: '8px 10px' }}
            />
          ))}
          <button
            type="button"
            onClick={() => removeRow(row._key)}
            disabled={rows.length === 1}
            style={{ width: '32px', height: '34px', borderRadius: '6px', border: 'none', background: rows.length === 1 ? '#f3f4f6' : '#fee2e2', color: rows.length === 1 ? '#d1d5db' : '#ef4444', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '16px' }}
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        style={{ marginTop: '8px', width: '100%', padding: '9px', border: '1.5px dashed #c7d2fe', borderRadius: '8px', background: '#fff', color: '#4f46e5', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
      >
        + Ajouter une ligne
      </button>
    </div>
  );
};

// ─── Rendu d'un champ générique ───────────────────────────────────────────────
const FieldRenderer = ({ field, value, onChange, user }) => {
  const isAuto = ['auto_number', 'auto_user', 'auto_status'].includes(field.type) || field.readOnly;

  if (isAuto) {
    let display = value || '';
    if (field.type === 'auto_number') display = '(Généré automatiquement)';
    else if (field.type === 'auto_user') display = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || display;
    else if (field.type === 'auto_status') display = 'En cours';
    return (
      <div style={S.fieldWrap}>
        <label style={S.label}>
          {field.label}
          <span style={{ ...S.badge('#e0f2fe', '#0369a1'), marginLeft: '6px', fontSize: '10px' }}>AUTO</span>
        </label>
        <input type="text" value={display} readOnly style={S.inputRO} />
      </div>
    );
  }

  if (field.type === 'signature') return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>
      <SignatureCanvas value={value || ''} onChange={onChange} />
    </div>
  );

  if (field.type === 'table') return (
    <div style={{ ...S.fieldWrap, marginBottom: '24px' }}>
      <label style={S.label}>
        {field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
      </label>
      <TableField field={field} value={value} onChange={onChange} />
    </div>
  );

  if (field.type === 'select') return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)} style={{ ...S.input, appearance: 'auto' }}>
        <option value="">— Choisir —</option>
        {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  if (field.type === 'textarea') return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>
      <textarea
        value={value || ''} onChange={e => onChange(e.target.value)} rows={3}
        placeholder={field.label}
        style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
      />
    </div>
  );

  if (field.type === 'checkbox') return (
    <div style={{ ...S.fieldWrap }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <input
          type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
          {field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}
        </span>
      </label>
    </div>
  );

  return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>
      <input
        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
        min={field.type === 'number' ? '0' : undefined}
        value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={field.label}
        style={S.input}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeSubmitRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ✅ FIX BUG 1 : le paramètre s'appelle "template" dans l'URL
  //   (/submit-request?template=<workflow_id_admin>)
  const templateId = searchParams.get('template');
  const { user } = useAuth();

  const [workflow,  setWorkflow]  = useState(null);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [success,   setSuccess]   = useState(false);

  const [projectId, setProjectId] = useState('');
  const [dueDate,   setDueDate]   = useState('');
  const [fieldValues, setFieldValues] = useState({});

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!templateId) { setMsg('Aucun workflow sélectionné.'); setLoading(false); return; }

    const load = async () => {
      try {
        // ✅ FIX BUG 1 : on charge le workflow TEMPLATE (isTemplate:true) créé par l'admin
        const [wfRes, projRes] = await Promise.all([
          workflowService.getById(templateId),
          projectService.getAll
            ? projectService.getAll()
            : Promise.resolve({ data: { projects: [] } }),
        ]);

        const wf = wfRes?.data?.workflow || wfRes?.workflow || null;
        if (!wf) throw new Error('Workflow introuvable');

        setWorkflow(wf);

        const projs = projRes?.data?.projects || projRes?.data?.data?.projects || [];
        setProjects(projs);
        if (projs.length === 1) setProjectId(projs[0]._id);

        const sourceFields = wf.steps?.[0]?.form?.fields || [];
        const init = {};
        sourceFields.forEach(f => {
          if (f.type === 'table') {
            const emptyRow = { _key: uuidv4() };
            (f.columns || []).forEach(c => { emptyRow[c.id] = ''; });
            init[f.id] = [emptyRow];
          } else if (f.type === 'auto_user') {
            init[f.id] = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
          } else if (f.type === 'auto_status') {
            init[f.id] = 'En cours';
          } else {
            init[f.id] = '';
          }
        });
        setFieldValues(init);

      } catch (err) {
        setMsg('Erreur : ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [templateId, user]);

  const formFields = useMemo(() => {
    if (!workflow) return [];
    return workflow.steps?.[0]?.form?.fields || [];
  }, [workflow]);

  const hasFields = formFields.length > 0;

  // ── Soumission ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (saving) return;
    if (!workflow) { setMsg('Workflow introuvable'); return; }

    for (const field of formFields) {
      const isAuto = ['auto_number', 'auto_user', 'auto_status'].includes(field.type) || field.readOnly;
      if (field.required && !isAuto) {
        const val = fieldValues[field.id];
        if (field.type === 'table') {
          const rows = val || [];
          const hasEmpty = rows.some(row =>
            (field.columns || []).some(col => col.required && (row[col.id] === '' || row[col.id] === undefined))
          );
          if (hasEmpty) { setMsg('Tableau incomplet : ' + field.label); return; }
        } else if (field.type === 'checkbox') {
          if (!val) { setMsg('Champ requis : ' + field.label); return; }
        } else {
          if (!val || String(val).trim() === '') { setMsg('Champ requis : ' + field.label); return; }
        }
      }
    }

    if (projects.length > 1 && !projectId) { setMsg('Veuillez sélectionner un projet'); return; }

    setSaving(true);
    setMsg('');

    try {
      // ✅ FIX BUG 1 : construire les steps en copiant depuis le workflow template
      //   en injectant les données saisies par l'employé dans steps[0]
      const stepsPayload = (workflow.steps || []).map((step, si) => {
        const stepsFields = (step.form?.fields || []).map(f => {
          let data = fieldValues[f.id] ?? null;
          // Pour step 0 uniquement, injecter les valeurs saisies
          if (si === 0) {
            if (f.type === 'auto_user') data = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
            else if (f.type === 'auto_status') data = 'En cours';
            else if (f.type === 'table') {
              data = (fieldValues[f.id] || []).map(({ _key, ...rest }) => rest);
            }
          }
          return { ...f, data };
        });
        return {
          name:             step.name,
          description:      step.description || '',
          order:            si,
          // ✅ Step 0 : assignée à l'employé qui soumet (pour pouvoir la compléter)
          // Steps suivantes : assignées selon le template (validateur, confirmateur...)
          assignedTo:       si === 0 ? user?._id : null,
          assignedToName:   si === 0 ? [user?.firstName, user?.lastName].filter(Boolean).join(' ') : '',
          assignedPost:     si === 0 ? '' : (step.assignedPost || ''),
          assignedPostName: si === 0 ? '' : (step.assignedPostName || step.assignedPost || ''),
          assignedRole:     step.assignedRole || '',
          delai:            step.delai || '',
          claims:           step.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
          checklist:        (step.checklist || []).map(c => ({ ...c, checked: false })),
          form:             { fields: stepsFields },
        };
      });

      let lignesPayload = [];
      if (workflow.docType) {
        formFields.filter(f => f.type === 'table').forEach(f => {
          const rows = (fieldValues[f.id] || []).map(({ _key, ...rest }) => rest);
          lignesPayload.push(...rows);
        });
      }

      const demandeurField = formFields.find(f => f.type === 'auto_user');
      const demandeurValue = demandeurField
        ? [user?.firstName, user?.lastName].filter(Boolean).join(' ')
        : '';

      const resolvedProjectId = projects.length === 1 ? projects[0]._id : projectId;

      // ✅ FIX BUG 1 : créer UN NOUVEAU workflow (instance de la demande employé)
      //   avec isTemplate: false — il sera distinct du workflow template admin
      const payload = {
        name:        workflow.name + ' — ' + new Date().toLocaleDateString('fr-FR'),
        description: workflow.description || '',
        project:     resolvedProjectId || undefined,
        projectId:   resolvedProjectId || undefined,
        dueDate:     dueDate || null,
        // ✅ référence au template pour traçabilité
        templateId,
        steps:       stepsPayload,
        // ✅ EXPLICITEMENT false — c'est une instance de demande, jamais un template
        isTemplate:  false,
        visibility:  'global',
      };

      if (workflow.docType) {
        payload.docType = workflow.docType;
        const depotField = formFields.find(f =>
          (f.label || '').toLowerCase().includes('dép') ||
          (f.label || '').toLowerCase().includes('depot')
        );
        const depotValue = depotField ? (fieldValues[depotField.id] || '') : '';
        payload.documentData = {
          demandeur:   demandeurValue,
          depot:       depotValue,
          priorite:    'normale',
          commentaire: '',
          lignes:      lignesPayload,
        };
      }

      const createRes  = await workflowService.create(payload);
      const workflowId = createRes?.data?.workflow?._id || createRes?.workflow?._id || createRes?.data?._id;
      if (!workflowId) throw new Error('Workflow créé mais ID introuvable');

      // ✅ FIX BUG CRITIQUE : NE PAS appeler workflowService.start() ici
      // start() appelait startWorkflow qui mettait isTemplate:true sur l'instance employé
      // ce qui l'excluait de getMyTasks (filtre isTemplate:{ $ne:true })
      // On utilise maintenant startInstance qui active sans toucher à isTemplate
      await workflowService.startInstance(workflowId);

      // ✅ Complète immédiatement step 0 (étape employé déjà remplie)
      // pour faire avancer le workflow vers le validateur (step 1)
      const step0Fields = (stepsPayload[0]?.form?.fields || []);
      const formDataForStep0 = {};
      step0Fields.forEach(f => {
        if (f.data !== null && f.data !== undefined) formDataForStep0[f.id] = f.data;
      });
      await workflowService.completeStep(workflowId, {
        comment: 'Demande soumise par l\'employé',
        formData: formDataForStep0,
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard/employee'), 2000);

    } catch (err) {
      setMsg('Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const setField = (id, val) =>
    setFieldValues(prev => ({ ...prev, [id]: val }));

  // ── Écrans d'état ───────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f7' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#6b7280', fontWeight: '500', fontSize: '14px' }}>Chargement du formulaire...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f7' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '52px 44px', textAlign: 'center', maxWidth: '420px', border: '1px solid #e8eaf0', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 24px' }}>✓</div>
        <h2 style={{ margin: '0 0 8px', color: '#111827', fontSize: '20px', fontWeight: '700' }}>Demande soumise !</h2>
        <p style={{ color: '#6b7280', margin: '0 0 6px', fontSize: '14px' }}>Transmise aux responsables concernés.</p>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '12px' }}>Redirection en cours...</p>
      </div>
    </div>
  );

  if (!workflow) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444', fontSize: '15px' }}>
      ⚠️ {msg || 'Workflow introuvable'}
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        <button
          onClick={() => navigate('/dashboard/employee/new-request')}
          style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#6b7280', fontSize: '13px', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ← Retour
        </button>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                {workflow.name}
              </h1>
              {workflow.description && (
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{workflow.description}</p>
              )}
            </div>
            {workflow.docType && (
              <span style={{ background: '#ede9fe', color: '#4f46e5', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                📄 {workflow.docType}
              </span>
            )}
          </div>
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', background: '#fef2f2', color: '#dc2626', fontWeight: '600', fontSize: '14px', border: '1px solid #fecaca' }}>
            ⚠️ {msg}
          </div>
        )}

        {/* ── CIRCUIT D'APPROBATION ── */}
        {workflow.steps?.length > 0 && (
          <div style={S.card}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Circuit d'approbation</span>
              <span style={{ ...S.badge('#ede9fe', '#4f46e5') }}>{workflow.steps.length} étape{workflow.steps.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', overflowX: 'auto' }}>
              {workflow.steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '600', textAlign: 'center', lineHeight: '1.3', maxWidth: '80px' }}>{step.name}</span>
                    {(step.assignedPostName || step.assignedPost) && (
                      <span style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', maxWidth: '80px', lineHeight: '1.2' }}>
                        {step.assignedPostName || step.assignedPost}
                      </span>
                    )}
                  </div>
                  {i < workflow.steps.length - 1 && (
                    <div style={{ width: '28px', height: '2px', background: '#e5e7eb', marginBottom: '30px', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ── PROJET ── */}
        {projects.length > 1 && (
          <div style={S.card}>
            <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>📁</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Projet</span>
              <span style={{ ...S.badge('#fee2e2', '#dc2626'), fontSize: '10px' }}>Requis</span>
            </div>
            <div style={{ padding: '12px 20px 20px' }}>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                style={{ ...S.input, appearance: 'auto' }}
              >
                <option value="">— Choisir un projet —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── FORMULAIRE ── */}
        {/* ✅ BUG 5 FIX : n'afficher les champs que si fieldValues est initialisé
            Empêche TableField de monter avec value=undefined et d'écraser les données */}
        {hasFields && Object.keys(fieldValues).length > 0 ? (
          <div style={S.card}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Formulaire de demande
              </span>
              {(() => {
                const reqCount = formFields.filter(f =>
                  f.required &&
                  !['auto_number','auto_user','auto_status'].includes(f.type) &&
                  !f.readOnly
                ).length;
                return reqCount > 0
                  ? <span style={{ ...S.badge('#fef3c7', '#92400e') }}>{reqCount} champ{reqCount > 1 ? 's' : ''} requis</span>
                  : <span style={{ ...S.badge('#f0fdf4', '#15803d') }}>Tous optionnels</span>;
              })()}
            </div>
            <div style={{ padding: '24px' }}>
              {(() => {
                const autoFields   = formFields.filter(f => ['auto_number','auto_user','auto_status'].includes(f.type) || f.readOnly);
                const normalFields = formFields.filter(f => !['auto_number','auto_user','auto_status'].includes(f.type) && !f.readOnly);
                const tableFields  = normalFields.filter(f => f.type === 'table');
                const inlineFields = normalFields.filter(f => f.type !== 'table');
                return (
                  <>
                    {inlineFields.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 24px' }}>
                        {inlineFields.map(f => (
                          <FieldRenderer key={f.id} field={f} value={fieldValues[f.id]} onChange={v => setField(f.id, v)} user={user} />
                        ))}
                      </div>
                    )}
                    {tableFields.map(f => (
                      <FieldRenderer key={f.id} field={f} value={fieldValues[f.id]} onChange={v => setField(f.id, v)} user={user} />
                    ))}
                    {autoFields.length > 0 && (
                      <div style={{ borderTop: inlineFields.length > 0 || tableFields.length > 0 ? '1px solid #f3f4f6' : 'none', paddingTop: inlineFields.length > 0 || tableFields.length > 0 ? '16px' : '0', marginTop: inlineFields.length > 0 || tableFields.length > 0 ? '8px' : '0' }}>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Informations automatiques
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                          {autoFields.map(f => (
                            <FieldRenderer key={f.id} field={f} value={fieldValues[f.id]} onChange={v => setField(f.id, v)} user={user} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <div style={{ ...S.card }}>
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ margin: '0 0 6px', fontSize: '32px' }}>📋</p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                Aucun champ configuré par l'administrateur pour ce workflow.
              </p>
            </div>
          </div>
        )}

        {/* ── RÉSUMÉ ── */}
        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', border: '1px solid #e5e7eb', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>Workflow</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' }}>{workflow.name}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>Étapes</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#4f46e5' }}>{workflow.steps?.length || 0}</p>
          </div>
          {workflow.docType && (
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>Document généré</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#4f46e5' }}>{workflow.docType} → N° auto</p>
            </div>
          )}
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase' }}>Demandeur</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' }}>{[user?.firstName, user?.lastName].filter(Boolean).join(' ')}</p>
          </div>
        </div>

        {/* ── SOUMETTRE ── */}
        <button type="button" onClick={handleSubmit} disabled={saving} style={S.submitBtn(saving)}>
          {saving ? '⏳ Envoi en cours...' : '🚀 Soumettre la demande'}
        </button>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '10px' }}>
          Votre demande sera transmise aux responsables pour validation.
        </p>

      </div>
    </div>
  );
};

export default EmployeeSubmitRequest;
