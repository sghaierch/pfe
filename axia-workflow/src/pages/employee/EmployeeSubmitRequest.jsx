import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import workflowService from '../../services/workflowService';
import projectService  from '../../services/projectService';
import API from '../../services/api';
// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#F1F5F9', fontFamily: "'Inter',-apple-system,sans-serif" },
  wrap: { maxWidth: '720px', margin: '0 auto', padding: '32px 24px 60px' },
  card: { background: '#ffffff', borderRadius: '16px', border: '1.5px solid #E2E8F0', overflow: 'hidden', marginBottom: '16px' },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', fontSize: '14px', color: '#0F172A', background: '#fff', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s', fontFamily: 'inherit' },
  inputRO: { width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #f3f4f6', fontSize: '14px', color: '#94A3B8', background: '#f9fafb', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', cursor: 'not-allowed' },
  fieldWrap: { marginBottom: '18px' },
  badge: (bg, color) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: bg, color: color }),
  submitBtn: (disabled) => ({
    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
    background: disabled ? '#E2E8F0' : '#2563EB',
    color: disabled ? '#9ca3af' : '#fff', fontSize: '15px', fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '0.02em',
    boxShadow: disabled ? 'none' : '0 4px 16px rgba(37,99,235,0.4)', transition: 'all 0.2s', marginTop: '8px',
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
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }, []);
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  };
  const start = (e) => { e.preventDefault(); isDrawing.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw  = (e) => { e.preventDefault(); if (!isDrawing.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setIsEmpty(false); };
  const stop  = (e) => { e.preventDefault(); if (!isDrawing.current) return; isDrawing.current = false; onChange(canvasRef.current.toDataURL()); };
  const clear = () => { const c = canvasRef.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); setIsEmpty(true); onChange(''); };
  return (
    <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
      <canvas ref={canvasRef} width={600} height={130}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}
        style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #f0f2f7', background: '#fff' }}>
        <span style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isEmpty ? 'Signez dans la zone ci-dessus' : <><i className="ri-check-line" style={{ color: '#059669' }}></i> Signature enregistrée</>}
        </span>
        <button type="button" onClick={clear} style={{ padding: '4px 12px', borderRadius: '6px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Effacer</button>
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
      cols.forEach(c => { empty[c.id] = ''; });
      onChange([empty]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const addRow    = () => { const empty = { _key: uuidv4() }; cols.forEach(c => { empty[c.id] = ''; }); onChange([...rows, empty]); };
  const updateCell = (key, colId, val) => onChange(rows.map(r => r._key === key ? { ...r, [colId]: val } : r));
  const removeRow  = (key) => { if (rows.length <= 1) return; onChange(rows.filter(r => r._key !== key)); };
  if (cols.length === 0) return (
    <div style={{ padding: '12px 14px', background: '#fffbeb', borderRadius: '8px', color: '#92400e', fontSize: '13px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <i className="ri-error-warning-line"></i> Aucune colonne configurée pour ce tableau.
    </div>
  );
  const gridCols = cols.map(c => c.type === 'number' ? '100px' : '1fr').join(' ') + ' 36px';
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px', padding: '8px 12px', background: '#f9fafb', borderRadius: '8px 8px 0 0', border: '1.5px solid #E2E8F0', borderBottom: 'none' }}>
        {cols.map(col => <span key={col.id} style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}{col.required ? ' *' : ''}</span>)}
        <span />
      </div>
      {rows.map((row, ri) => (
        <div key={row._key} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '8px', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderTop: ri === 0 ? '1px solid #e5e7eb' : 'none', background: ri % 2 === 0 ? '#fff' : '#fafafa', borderRadius: ri === rows.length - 1 ? '0 0 8px 8px' : '0', alignItems: 'center' }}>
          {cols.map(col => (
            <input key={col.id} type={col.type === 'number' ? 'number' : 'text'} min={col.type === 'number' ? '0' : undefined}
              value={row[col.id] ?? ''}
              onChange={e => updateCell(row._key, col.id, col.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
              placeholder={col.label} style={{ ...S.input, padding: '8px 10px' }} />
          ))}
          <button type="button" onClick={() => removeRow(row._key)} disabled={rows.length === 1}
            style={{ width: '32px', height: '34px', borderRadius: '6px', border: 'none', background: rows.length === 1 ? '#f3f4f6' : '#fee2e2', color: rows.length === 1 ? '#d1d5db' : '#ef4444', cursor: rows.length === 1 ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-close-line"></i>
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} style={{ marginTop: '8px', width: '100%', padding: '9px', border: '1.5px dashed #bfdbfe', borderRadius: '8px', background: '#fff', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <i className="ri-add-line"></i> Ajouter une ligne
      </button>
    </div>
  );
};

// ─── FieldRenderer ────────────────────────────────────────────────────────────
const FieldRenderer = ({ field, value, onChange, user }) => {
  const isAuto = ['auto_number', 'auto_user', 'auto_status'].includes(field.type) || field.readOnly;
  if (isAuto) {
    let display = value || '';
    if (field.type === 'auto_number') display = '(Généré automatiquement)';
    else if (field.type === 'auto_user') display = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || display;
    else if (field.type === 'auto_status') display = 'En cours';
    return (
      <div style={S.fieldWrap}>
        <label style={S.label}>{field.label}<span style={{ ...S.badge('#e0f2fe', '#0369a1'), marginLeft: '6px', fontSize: '10px' }}>AUTO</span></label>
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
      <label style={S.label}>{field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>
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
      <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} placeholder={field.label}
        style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }} />
    </div>
  );
  if (field.type === 'checkbox') return (
    <div style={S.fieldWrap}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }} />
        <span style={{ fontSize: '14px', fontWeight: '500', color: '#0F172A' }}>
          {field.label}{field.required && <span style={{ color: '#ef4444' }}> *</span>}
        </span>
      </label>
    </div>
  );
  return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}</label>
      <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
        min={field.type === 'number' ? '0' : undefined}
        value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.label} style={S.input} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : trouve l'index de l'étape employé dans les steps du template
// ─────────────────────────────────────────────────────────────────────────────
const findEmployeeStepIndex = (steps = []) => {
  const idx = steps.findIndex(s => s.isEmployeeStep === true);
  return idx !== -1 ? idx : 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeSubmitRequest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const { user } = useAuth();

  const [workflow,    setWorkflow]    = useState(null);
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [success,     setSuccess]     = useState(false);
  const [,            setProjectId]   = useState('');
  const [dueDate]                     = useState('');
  const [fieldValues, setFieldValues] = useState({});

  // ── États upload ──────────────────────────────────────────────────────────
  const [attachments, setAttachments] = useState([]);
  const [uploading,   setUploading]   = useState(false);
  const fileInputRef = useRef(null);
  const [docType, setDocType] = useState(null);
 // ── Chargement du template ────────────────────────────────────────────────
useEffect(() => {
  if (!templateId) {
    setMsg('Aucun identifiant de template fourni.');
    setLoading(false);
    return;
  }

  const load = async () => {
    try {
      // === NOUVELLE LOGIQUE ===
      const docTypeRes = await API.get(`/document-types/${templateId}`);
      const docType = docTypeRes.data?.data?.documentType || docTypeRes.data?.documentType;
      setDocType(docType);  // ← déjà déclaré dans ton state mais commenté
      if (!docType) throw new Error('Type de document introuvable');

      const workflowId = docType.defaultWorkflow;

      if (!workflowId) throw new Error('Aucun workflow par défaut configuré pour ce type de document');

      // Chargement du workflow réel
      const [wfRes, projRes] = await Promise.all([
        workflowService.getById(workflowId),           // ← On passe workflowId au lieu de templateId
        projectService?.getAll
          ? projectService.getAll()
          : Promise.resolve({ data: { projects: [] } }),
      ]);

      const wf = wfRes?.data?.workflow || wfRes?.workflow || null;
      if (!wf) throw new Error('Workflow introuvable');

      if (!wf.isTemplate) throw new Error("Ce workflow n'est pas un template disponible");
      if (wf.status !== 'active') throw new Error("Ce type de demande n'est plus disponible");

      setWorkflow(wf);

      const projs = projRes?.data?.projects || projRes?.data?.data?.projects || [];
      setProjects(projs);
      if (projs.length === 1) setProjectId(projs[0]._id);

      const empIdx = findEmployeeStepIndex(wf.steps);
      const sourceFields = wf.steps?.[empIdx]?.form?.fields || [];

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
        } else if (f.type === 'date') {
          init[f.id] = new Date().toISOString().split('T')[0];
        } else {
          init[f.id] = '';
        }
      });

      setFieldValues(init);

      // Optionnel : garder le docType pour usage ultérieur
       setDocType(docType);

    } catch (err) {
      console.error(err);
      setMsg('Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  load();
}, [templateId, user]);

  // ── Champs du formulaire employé ─────────────────────────────────────────
  const empStepIndex = useMemo(() => {
    if (!workflow) return 0;
    return findEmployeeStepIndex(workflow.steps);
  }, [workflow]);

  const formFields = useMemo(() => {
    if (!workflow) return [];
    return workflow.steps?.[empStepIndex]?.form?.fields || [];
  }, [workflow, empStepIndex]);

  const hasFields = formFields.length > 0;

  // ── Validation des champs requis ──────────────────────────────────────────
  const validateFields = () => {
    for (const field of formFields) {
      const isAuto = ['auto_number', 'auto_user', 'auto_status'].includes(field.type) || field.readOnly;
      if (field.required && !isAuto) {
        const val = fieldValues[field.id];
        if (field.type === 'table') {
          const rows = val || [];
          const hasEmpty = rows.some(row =>
            (field.columns || []).some(col => col.required && (row[col.id] === '' || row[col.id] === undefined))
          );
          if (hasEmpty) return 'Tableau incomplet : ' + field.label;
        } else if (field.type === 'checkbox') {
          if (!val) return 'Champ requis : ' + field.label;
        } else {
          if (!val || String(val).trim() === '') return 'Champ requis : ' + field.label;
        }
      }
    }
    return null;
  };

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (saving) return;
    if (!workflow) { setMsg('Workflow introuvable'); return; }

    const validationError = validateFields();
    if (validationError) { setMsg(validationError); return; }
    setSaving(true);
    setMsg('');

    try {
      const stepsPayload = (workflow.steps || []).map((step, si) => {
        const isEmpStep = si === empStepIndex;
        const stepsFields = (step.form?.fields || []).map(f => {
          if (!isEmpStep) return { ...f, data: null };
          let data = fieldValues[f.id] ?? null;
          if (f.type === 'auto_user')   data = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
          if (f.type === 'auto_status') data = 'En cours';
          if (f.type === 'table')       data = (fieldValues[f.id] || []).map(({ _key, ...rest }) => rest);
          return { ...f, data };
        });
        return {
          name:             step.name,
          description:      step.description || '',
          order:            si,
          isEmployeeStep:   isEmpStep,
          assignedTo:       isEmpStep ? (user?._id || null) : null,
          assignedToName:   isEmpStep ? [user?.firstName, user?.lastName].filter(Boolean).join(' ') : '',
          assignedPost:     isEmpStep ? '' : (step.assignedPost || ''),
          assignedPostName: isEmpStep ? '' : (step.assignedPostName || step.assignedPost || ''),
          assignedRole:     step.assignedRole || '',
          delai:            step.delai || '',
          claims:           step.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
          checklist:        (step.checklist || []).map(c => ({ ...c, checked: false })),
          form:             { fields: stepsFields },
        };
      });

      // ✅ CORRECTION — on se base sur le DocumentType réellement sélectionné par
      // l'employé (docType), et non sur workflow.docType qui n'est jamais rempli
      // dans ce parcours (le lien se fait via DocumentType.defaultWorkflow).
      let lignesPayload = [];
      if (docType) {
        formFields.filter(f => f.type === 'table').forEach(f => {
          const rows = (fieldValues[f.id] || []).map(({ _key, ...rest }) => rest);
          lignesPayload.push(...rows);
        });
      }
      const demandeurField = formFields.find(f => f.type === 'auto_user');
      const demandeurValue = demandeurField
        ? [user?.firstName, user?.lastName].filter(Boolean).join(' ')
        : '';

      const resolvedProjectId =
        (typeof workflow.project === 'object' ? workflow.project?._id : workflow.project)
        || (projects.length === 1 ? projects[0]._id : null);

      const payload = {
        name:        workflow.name + ' — ' + new Date().toLocaleDateString('fr-FR'),
        docTypeId: templateId,
        description: workflow.description || '',
        ...(resolvedProjectId ? { project: resolvedProjectId } : {}),
        dueDate:     dueDate || null,
        templateRef: templateId,
        steps:       stepsPayload,
        isTemplate:  false,
        visibility:  'global',
      };

      // ✅ CORRECTION — payload.docType utilise désormais le préfixe du
      // DocumentType sélectionné par l'employé (ex: "DA"), garantissant que
      // documentData est toujours créé côté backend quand un type est choisi.
      if (docType) {
        const depotField = formFields.find(f =>
          (f.label || '').toLowerCase().includes('dép') ||
          (f.label || '').toLowerCase().includes('depot')
        );
        payload.docType      = docType.prefix;
        payload.documentData = {
          demandeur:   demandeurValue,
          depot:       depotField ? (fieldValues[depotField.id] || '') : '',
          priorite:    'normale',
          commentaire: '',
          lignes:      lignesPayload,
        };
      }

      // ── Étape 1 : créer l'instance ────────────────────────────────────────
      const createRes  = await workflowService.create(payload);
      const createdWorkflowId =
        createRes?.data?.workflow?._id ||
        createRes?.data?._id           ||
        createRes?.workflow?._id;
      if (!createdWorkflowId) throw new Error('Workflow créé mais ID introuvable dans la réponse');

      // ── Étape 2 : démarrer l'instance ─────────────────────────────────────
      await workflowService.startInstance(workflowId);

      // ── Étape 3 : compléter l'étape employé ──────────────────────────────
      const empFields          = stepsPayload[empStepIndex]?.form?.fields || [];
      const formDataForEmpStep = {};
      empFields.forEach(f => {
        if (f.data !== null && f.data !== undefined) formDataForEmpStep[f.id] = f.data;
      });
      await workflowService.completeStep(createdWorkflowId, {
        comment:  "Demande soumise par l'employé",
        formData: formDataForEmpStep,
      });

      // ── Étape 4 : upload des pièces jointes ──────────────────────────────
      if (attachments.length > 0) {
        setUploading(true);
        await Promise.all(attachments.map(file => {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('workflowId', createdWorkflowId);
          fd.append('stepIndex', String(empStepIndex));
          return workflowService.uploadDocument(fd).catch(() => null); // non bloquant
        }));
        setUploading(false);
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard/employee'), 2000);

    } catch (err) {
      setMsg('Erreur : ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const setField = (id, val) => setFieldValues(prev => ({ ...prev, [id]: val }));

  // ── Écrans d'état ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#475569', fontWeight: '500', fontSize: '14px' }}>Chargement du formulaire...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F1F5F9' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '52px 44px', textAlign: 'center', maxWidth: '420px', border: '1.5px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 24px', color: '#059669' }}>
          <i className="ri-check-line"></i>
        </div>
        <h2 style={{ margin: '0 0 8px', color: '#0F172A', fontSize: '20px', fontWeight: '700' }}>Demande soumise !</h2>
  {docType && (
    <div style={{ background: '#dbeafe', padding: '10px 20px', borderRadius: '10px', margin: '12px 0' }}>
      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#475569' }}>Numéro de document</p>
      <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: '#2563eb' }}>
        {docType.prefix}{new Date().getFullYear().toString().slice(-2)}-{String((docType.counter || 0) + 1).padStart(docType.digits || 3, '0')}
      </p>
    </div>
  )}
  <p style={{ color: '#475569', margin: '0 0 6px', fontSize: '14px' }}>Transmise aux responsables concernés.</p>
  <p style={{ color: '#94A3B8', margin: 0, fontSize: '12px' }}>Redirection en cours...</p>
      </div>
    </div>
  );

  if (!workflow) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <i className="ri-error-warning-line"></i> {msg || 'Workflow introuvable'}
    </div>
  );

  const approvalSteps = workflow.steps.filter((_, i) => i !== empStepIndex);

  return (
    <div style={S.page}>
      <div style={S.wrap}>

        <button onClick={() => navigate('/dashboard/employee/new-request')}
          style={{ background: '#fff', border: '1.5px solid #E2E8F0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569', fontSize: '13px', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <i className="ri-arrow-left-line"></i> Retour
        </button>

        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>{workflow.name}</h1>
              {workflow.description && <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>{workflow.description}</p>}
            </div>
            {docType && (
              <span style={{ background: '#dbeafe', color: '#2563eb', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="ri-file-text-line"></i> {docType.name}
              </span>
            )}
          </div>
        </div>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '14px', border: '1.5px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ri-error-warning-line"></i> {msg}
          </div>
        )}

        {/* ── CIRCUIT D'APPROBATION ── */}
        {approvalSteps.length > 0 && (
          <div style={S.card}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Circuit d'approbation</span>
              <span style={{ ...S.badge('#dbeafe', '#2563eb') }}>{approvalSteps.length} étape{approvalSteps.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap', overflowX: 'auto' }}>
              {approvalSteps.map((step, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '90px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: '12px', color: '#0F172A', fontWeight: '600', textAlign: 'center', lineHeight: '1.3', maxWidth: '80px' }}>{step.name}</span>
                    {(step.assignedPostName || step.assignedPost) && (
                      <span style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', maxWidth: '80px', lineHeight: '1.2' }}>
                        {step.assignedPostName || step.assignedPost}
                      </span>
                    )}
                  </div>
                  {i < approvalSteps.length - 1 && (
                    <div style={{ width: '28px', height: '2px', background: '#e5e7eb', marginBottom: '30px', flexShrink: 0 }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {workflow.project && (() => {
          const proj = projects.find(p => p._id === (workflow.project?._id || workflow.project));
          const projName = proj?.name || workflow.project?.name || 'Projet assigné';
          return (
            <div style={S.card}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="ri-folder-line" style={{ fontSize: '16px', color: '#475569' }}></i>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projet</span>
                  <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{projName}</p>
                </div>
                <span style={{ marginLeft: 'auto', ...S.badge('#dcfce7', '#166534'), fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ri-check-line"></i> Assigné
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── FORMULAIRE EMPLOYÉ ── */}
        {hasFields && Object.keys(fieldValues).length > 0 ? (
          <div style={S.card}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formulaire de demande</span>
              {(() => {
                const reqCount = formFields.filter(f => f.required && !['auto_number','auto_user','auto_status'].includes(f.type) && !f.readOnly).length;
                return reqCount > 0
                  ? <span style={{ ...S.badge('#fef3c7', '#92400e') }}>{reqCount} champ{reqCount > 1 ? 's' : ''} requis</span>
                  : <span style={{ ...S.badge('#f0fdf4', '#15803d') }}>Tous optionnels</span>;
              })()}
            </div>
            <div style={{ padding: '24px' }}>
              {(() => {
                const autoFields = formFields.filter(f => ['auto_user','auto_status'].includes(f.type) || f.readOnly);              
                const normalFields = formFields.filter(f => !['auto_number','auto_user','auto_status'].includes(f.type) && !f.readOnly && f.type !== 'auto_number');                const tableFields  = normalFields.filter(f => f.type === 'table');
                const inlineFields = normalFields.filter(f => f.type !== 'table');
                return (
                  <>
                    {inlineFields.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0 24px' }}>
                        {inlineFields.map(f => <FieldRenderer key={f.id} field={f} value={fieldValues[f.id]} onChange={v => setField(f.id, v)} user={user} />)}
                      </div>
                    )}
                    {tableFields.map(f => <FieldRenderer key={f.id} field={f} value={fieldValues[f.id]} onChange={v => setField(f.id, v)} user={user} />)}
                    {autoFields.length > 0 && (
                      <div style={{ borderTop: inlineFields.length > 0 || tableFields.length > 0 ? '1px solid #f3f4f6' : 'none', paddingTop: '16px', marginTop: '8px' }}>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Informations automatiques</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                          {autoFields.map(f => <FieldRenderer key={f.id} field={f} value={fieldValues[f.id]} onChange={v => setField(f.id, v)} user={user} />)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#94A3B8' }}>
              <i className="ri-clipboard-line" style={{ fontSize: '32px', marginBottom: '6px', display: 'block' }}></i>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Aucun champ configuré par l'administrateur pour ce workflow.</p>
            </div>
          </div>
        )}

        {/* ── RÉSUMÉ ── */}
        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', border: '1.5px solid #E2E8F0', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Workflow</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{workflow.name}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Étapes de validation</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>{approvalSteps.length}</p>
          </div>
          {docType && (
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Document généré</p>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>{docType?.prefix}{new Date().getFullYear().toString().slice(-2)}-{String((docType?.counter || 0) + 1).padStart(docType?.digits || 3, '0')}</p>            
            </div>
          )}
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Demandeur</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{[user?.firstName, user?.lastName].filter(Boolean).join(' ')}</p>
          </div>
        </div>

        {/* ── PIÈCES JOINTES ── */}
<div style={{ marginBottom: '20px' }}>
  <input
    type="file"
    ref={fileInputRef}
    style={{ display: 'none' }}
    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
    multiple
    onChange={e => {
      const files = Array.from(e.target.files || []);
      console.log('[DEBUG] fichiers sélectionnés:', files.map(f => f.name));
      if (files.length > 0) {
        setAttachments(prev => [...prev, ...files]);
      }
      e.target.value = '';
    }}
  />

  <div
    onClick={() => {
      console.log('[DEBUG] click zone upload, ref:', fileInputRef.current);
      fileInputRef.current?.click();
    }}
    style={{
      border: '2px dashed #bfdbfe', borderRadius: '12px', padding: '20px',
      textAlign: 'center', cursor: 'pointer', background: '#fafbff',
      transition: 'all .15s', marginBottom: attachments.length > 0 ? '12px' : 0,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.background = '#fafbff'; }}
  >
    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <i className="ri-attachment-2"></i> Joindre des documents
    </p>
    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>
      PDF, images, Word, Excel — 50 MB max par fichier
    </p>
    {attachments.length > 0 && (
      <p style={{ margin: '8px 0 0', fontSize: '12px', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
        <i className="ri-checkbox-circle-fill"></i> {attachments.length} fichier{attachments.length > 1 ? 's' : ''} sélectionné{attachments.length > 1 ? 's' : ''}
      </p>
    )}
  </div>

  {attachments.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {attachments.map((file, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 14px', borderRadius: '8px',
          background: '#f0fdf4', border: '1px solid #86efac',
        }}>
          <span style={{ fontSize: '13px', flex: 1, color: '#0F172A', fontWeight: '500',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ri-file-text-line"></i> {file.name}
          </span>
          <span style={{ fontSize: '11px', color: '#475569', flexShrink: 0 }}>
            {file.size < 1024 * 1024
              ? (file.size / 1024).toFixed(0) + ' KB'
              : (file.size / (1024 * 1024)).toFixed(1) + ' MB'}
          </span>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setAttachments(prev => prev.filter((_, j) => j !== i));
            }}
            style={{
              background: '#fee2e2', border: 'none', color: '#dc2626',
              width: '22px', height: '22px', borderRadius: '50%',
              cursor: 'pointer', fontWeight: '700', fontSize: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          ><i className="ri-close-line"></i></button>
        </div>
      ))}
    </div>
  )}
</div>

        {/* ── BOUTON SOUMETTRE ── */}
        <button type="button" onClick={handleSubmit} disabled={saving} style={{ ...S.submitBtn(saving), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {saving
            ? (uploading ? <><i className="ri-attachment-2"></i> Upload en cours...</> : <><i className="ri-time-line"></i> Envoi en cours...</>)
            : <><i className="ri-rocket-2-line"></i> Soumettre la demande</>}
        </button>
        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', marginTop: '10px' }}>
          Votre demande sera transmise aux responsables pour validation.
        </p>

      </div>
    </div>
  );
};

export default EmployeeSubmitRequest;