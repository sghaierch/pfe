import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import workflowService   from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';
import projectService    from '../../../services/projectService';

// ── Types de documents ────────────────────────────────────────────────────────
const DOC_TYPES = [
  { value: '',   label: 'Aucun (workflow simple)'               },
  { value: 'DA', label: 'DA — Demande d\'achat', color: '#4f46e5' },
  { value: 'BS', label: 'BS — Bon de sortie',    color: '#d97706' },
  { value: 'DF', label: 'DF — Facturation',      color: '#7c3aed' },
  { value: 'BR', label: 'BR — Bon de réception', color: '#059669' },
];

const WorkflowEditInfoPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [workflow,  setWorkflow]  = useState(null);
  const [projects,  setProjects]  = useState([]);
  const [allPosts,  setAllPosts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');

  // ── Formulaire ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:        '',
    description: '',
    projectId:   '',
    dueDate:     '',
    docType:     '',
    postMapping: {},  // { postSlot: nomPoste }
  });

  // ── Chargement des données ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [wfRes, postsData, projRes] = await Promise.all([
          workflowService.getById(id),
          departmentService.getAllPosts(),
          projectService.getAll
            ? projectService.getAll()
            : { data: { projects: [] } },
        ]);

        const wf    = wfRes?.data?.workflow;
        const projs = projRes?.data?.projects || projRes?.data?.data?.projects || [];

        if (!wf) { setMsg('ERREUR Workflow introuvable'); setLoading(false); return; }
        if (wf.status !== 'draft') {
          setMsg('ERREUR Ce workflow est déjà démarré. Seuls les brouillons sont modifiables.');
          setLoading(false);
          return;
        }

        setWorkflow(wf);
        setProjects(projs);
        setAllPosts(postsData || []);

        // Construire le mapping poste actuel depuis les étapes du workflow
        const mapping = {};
        (wf.steps || []).forEach(step => {
          // La clé = postSlot du template ou fallback sur l'ordre
          const key = step.postSlot || ('slot_' + step.order);
          mapping[key] = step.assignedPost || '';
        });

        setForm({
          name:        wf.name        || '',
          description: wf.description || '',
          projectId:   wf.project?._id || wf.project || '',
          dueDate:     wf.dueDate ? wf.dueDate.slice(0, 10) : '',
          docType:     wf.docType     || '',
          postMapping: mapping,
        });

      } catch (err) {
        setMsg('ERREUR ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) { setMsg('ERREUR Nom du workflow requis'); return; }

    // Reconstruire les étapes avec les nouveaux postes assignés
    const updatedSteps = (workflow.steps || []).map((step, i) => {
      const key         = step.postSlot || ('slot_' + step.order);
      const newPost     = form.postMapping[key] || step.assignedPost || '';
      return {
        ...step,
        assignedPost:     newPost,
        assignedPostName: newPost,
      };
    });

    setSaving(true);
    setMsg('');
    try {
      await workflowService.update(id, {
        name:        form.name,
        description: form.description,
        project:     form.projectId || undefined,
        dueDate:     form.dueDate   || null,
        docType:     form.docType   || '',
        steps:       updatedSteps,
      });
      setMsg('SUCCESS Workflow mis à jour !');
      const projectId = form.projectId || workflow?.project?._id || workflow?.project;
      setTimeout(() => {
        if (projectId) navigate('/dashboard/company/projects/' + projectId);
        else navigate('/dashboard/company/workflows/' + id);
      }, 1200);
    } catch (err) {
      setMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', background: '#fff',
  };
  const lbl = { display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '6px' };

  // ── Loading / Erreur bloquante ─────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
  );

  if (!workflow) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '460px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚫</div>
        <h2 style={{ color: '#dc2626', margin: '0 0 12px' }}>Modification impossible</h2>
        <p style={{ color: '#64748b', margin: '0 0 20px' }}>{msg.replace('ERREUR ', '')}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 24px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          Retour
        </button>
      </div>
    </div>
  );

  // ── Message inline ─────────────────────────────────────────────────────────
  let msgBg = '#f0fdf4', msgColor = '#166534', msgText = msg;
  if (msg.startsWith('ERREUR')) { msgBg = '#fff5f5'; msgColor = '#dc2626'; msgText = msg.replace('ERREUR ', ''); }
  else if (msg.startsWith('SUCCESS')) { msgText = msg.replace('SUCCESS ', ''); }

  const isAuto = workflow?.templateType === 'automatic';

  return (
    <div style={{ padding: '40px', maxWidth: '860px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
        >
          ← Retour
        </button>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Modifier le workflow
          </h1>
          <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
            ✏️ Brouillon — modifications autorisées
          </span>
        </div>
      </div>

      {/* ── Message ── */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: msgBg, color: msgColor }}>
          {msgText}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>

        {/* ── SECTION 1 — Informations générales ── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>1</div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Informations générales</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Nom du workflow *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={inp}
                placeholder="Ex: Validation achats équipements"
              />
            </div>
            <div>
              <label style={lbl}>Projet</label>
              <select
                value={form.projectId}
                onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}
                style={inp}
              >
                <option value="">-- Choisir un projet --</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={lbl}>Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={inp}
                placeholder="Optionnel"
              />
            </div>
            <div>
              <label style={lbl}>Échéance</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                style={inp}
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2 — Type documentaire ── */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>2</div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Type documentaire</h2>
          </div>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 38px' }}>
            Associez un type de document à ce workflow.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {DOC_TYPES.map(dt => {
              const isSelected = form.docType === dt.value;
              return (
                <button
                  key={dt.value}
                  onClick={() => setForm(p => ({ ...p, docType: dt.value }))}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    border: isSelected ? `2px solid ${dt.color || '#4f46e5'}` : '2px solid #e2e8f0',
                    background: isSelected ? (dt.color ? dt.color + '15' : '#ede9fe') : '#f8fafc',
                    color: isSelected ? (dt.color || '#4f46e5') : '#64748b',
                    fontWeight: isSelected ? 700 : 500, fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  {dt.label}
                </button>
              );
            })}
          </div>

          {form.docType && (
            <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>
                ℹ️ Le document <strong>{form.docType}XXXXX</strong> sera créé automatiquement.
                {form.docType === 'DA' && ' Transformation : DA → DAC → BS → DF → BR'}
                {form.docType === 'BS' && ' Transformation : BS → DF → BR'}
                {form.docType === 'DF' && ' Transformation : DF → BR'}
                {form.docType === 'BR' && ' Document final de la chaîne.'}
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 3 — Postes responsables ── */}
        {!isAuto && (workflow.steps || []).length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>3</div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Postes responsables</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 38px' }}>
              Réassignez les postes responsables de chaque étape.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(workflow.steps || []).map((step, i) => {
                const key = step.postSlot || ('slot_' + step.order);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {/* Numéro */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    {/* Infos étape */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        {step.name}
                      </p>
                      {step.description && (
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{step.description}</p>
                      )}
                      {step.delai && (
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#7c3aed' }}>⏱ Délai : {step.delai}</p>
                      )}
                    </div>
                    {/* Flèche */}
                    <span style={{ color: '#cbd5e1', fontSize: '18px', flexShrink: 0 }}>→</span>
                    {/* Sélecteur poste */}
                    <div style={{ minWidth: '240px' }}>
                      <select
                        value={form.postMapping[key] || ''}
                        onChange={e => setForm(p => ({
                          ...p,
                          postMapping: { ...p.postMapping, [key]: e.target.value }
                        }))}
                        style={{
                          ...inp,
                          borderColor: form.postMapping[key] ? '#4f46e5' : '#e2e8f0',
                          fontWeight:  form.postMapping[key] ? 600 : 400,
                        }}
                      >
                        <option value="">-- Choisir un poste --</option>
                        {allPosts.map(p => (
                          <option key={p._id} value={p.name}>
                            {p.name}{p.departmentName ? ' (' + p.departmentName + ')' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Boutons actions ── */}
        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1, padding: '13px', borderRadius: '10px',
              background: saving ? '#e2e8f0' : '#4f46e5',
              color: saving ? '#94a3b8' : '#fff',
              border: 'none', fontWeight: 700, fontSize: '15px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Sauvegarde...' : '✓ Sauvegarder les modifications'}
          </button>
          <button
            onClick={() => navigate(-1)}
            disabled={saving}
            style={{ padding: '13px 28px', borderRadius: '10px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            Annuler
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkflowEditInfoPage;
