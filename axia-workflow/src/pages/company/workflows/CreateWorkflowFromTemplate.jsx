import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import templateService   from '../../../services/templateService';
import workflowService   from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';
import projectService    from '../../../services/projectService';

const TYPE_LABELS = {
  validation_confirmation: { label: 'Validation + Confirmation', color: '#4f46e5', bg: '#ede9fe' },
  confirmation_only:       { label: 'Juste Confirmation',        color: '#059669', bg: '#dcfce7' },
  automatic:               { label: 'Automatique',               color: '#f59e0b', bg: '#fef3c7' },
};

const ROLE_CONFIG = {
  employe:      { icon: '👤', color: '#0891b2', bg: '#e0f2fe', label: 'Employé'      },
  validateur:   { icon: '✅', color: '#4f46e5', bg: '#ede9fe', label: 'Validateur'   },
  confirmateur: { icon: '☑️', color: '#059669', bg: '#dcfce7', label: 'Confirmateur' },
  manager:      { icon: '👔', color: '#7c3aed', bg: '#f5f3ff', label: 'Manager'      },
  finance:      { icon: '💰', color: '#d97706', bg: '#fef3c7', label: 'Finance'      },
  responsable:  { icon: '🏢', color: '#dc2626', bg: '#fee2e2', label: 'Responsable'  },
  rh:           { icon: '🧑‍💼', color: '#0f766e', bg: '#ccfbf1', label: 'RH'           },
  direction:    { icon: '⭐', color: '#92400e', bg: '#fef9c3', label: 'Direction'    },
};

const inp = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', background: '#fff',
};
const lbl = {
  display: 'block', fontWeight: 600, fontSize: '13px',
  color: '#374151', marginBottom: '6px',
};

const CreateWorkflowFromTemplate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const [template, setTemplate] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  const [form, setForm] = useState({
    name:        '',
    description: '',
    projectId:   '',
    dueDate:     '',
    docType:     '',
    // ✅ FIX BUG 2 : postMapping stocke l'_id du poste (pas le nom)
    postMapping: {},
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [tmplRes, postsData, projRes] = await Promise.all([
          templateService.getById(templateId),
          departmentService.getAllPosts(),
          projectService.getAll
            ? projectService.getAll()
            : { data: { projects: [] } },
        ]);

        const tmpl  = tmplRes.data?.template;
        const projs = projRes?.data?.projects || projRes?.data?.data?.projects || [];

        setTemplate(tmpl);
        setAllPosts(postsData || []);
        setProjects(projs);

        if (tmpl) {
          const mapping = {};
          (tmpl.steps || []).forEach((step, i) => {
            if (i !== 0) {
              mapping[i] = '';
            }
          });
          setForm(p => ({
            ...p,
            name:        tmpl.name,
            docType:     tmpl.docType || '',
            postMapping: mapping,
          }));
        }
      } catch (err) {
        setMsg('ERREUR ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    if (templateId) load();
  }, [templateId]);

  // ── Soumission ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) { setMsg('ERREUR Nom du workflow requis'); return; }
    if (!form.projectId)   { setMsg('ERREUR Projet requis');          return; }

    let steps = [];

    if (template.type === 'automatic') {
      const employeStep = template.steps?.[0];
      steps = [
        {
          name:             employeStep?.name || 'Demande Employé',
          description:      employeStep?.description || '',
          order:            0,
          role:             'employe',
          assignedPost:     '',
          assignedPostName: 'Tous les employés',
          assignedTo:       null,
          assignedToName:   '',
          assignedRole:     'employe',
          form:             employeStep?.form || { fields: [] },
          checklist:        [],
          status:           'pending',
          claims:           { canValidate: false, canReject: false, canModify: true, canView: true },
        },
        {
          name:             'Approbation automatique',
          description:      'Approuvé automatiquement par le système',
          order:            1,
          role:             'system',
          assignedPost:     'AUTO',
          assignedPostName: 'Automatique',
          assignedTo:       null,
          assignedToName:   '',
          assignedRole:     '',
          form:             { fields: [] },
          checklist:        [],
          status:           'pending',
          claims:           { canValidate: true, canReject: true, canModify: false, canView: true },
        },
      ];
    } else {
      const emptySlots = Object.entries(form.postMapping).filter(([_, v]) => !v);
      if (emptySlots.length > 0) {
        setMsg('ERREUR Assignez un poste à chaque étape de validation');
        return;
      }

      steps = (template.steps || []).map((step, i) => {
        const isEmploye = i === 0;

        // ✅ FIX BUG 2 : récupérer l'objet poste complet via l'_id stocké dans postMapping
        const rawPostId  = isEmploye ? '' : (form.postMapping[i] || '');
        const postObj    = allPosts.find(p => p._id === rawPostId);
        const postName   = postObj?.name || rawPostId; // fallback sur l'id si objet introuvable

        // ✅ BUG 2 FIX : normaliser le nom du poste (lowercase + trim) pour que la
        // comparaison avec req.user.jobTitle dans completeStep/getMyTasks soit fiable
        const normalizedPostName = postName.toLowerCase().trim();

        return {
          name:             step.name,
          description:      step.description   || '',
          order:            i,
          role:             step.role           || (isEmploye ? 'employe' : 'validateur'),
          assignedPost:     isEmploye ? '' : normalizedPostName,
          assignedPostName: isEmploye ? 'Tous les employés' : postName,
          assignedTo:       null,
          assignedToName:   '',
          assignedRole:     step.role           || '',
          delai:            step.delai          || 0,
          claims:           isEmploye
            ? { canValidate: false, canReject: false, canModify: true, canView: true }
            : (step.claims || { canValidate: true, canReject: true, canModify: false, canView: true }),
          form:             step.form           || { fields: [] },
          checklist:        (step.checklist || []).map(c => ({ ...c, checked: false })),
          status:           'pending',
        };
      });
    }

    setSaving(true);
    try {
      await workflowService.create({
        name:        form.name,
        description: form.description,
        project:     form.projectId,
        dueDate:     form.dueDate || null,
        docType:     form.docType || '',
        templateId,
        // ✅ FIX BUG 1 : marquer ce workflow comme template pour qu'il
        //   ne soit pas dupliqué quand un employé soumet une demande
        isTemplate:  true,
        steps,
        nodes: [],
        edges: [],
      });
      navigate('/dashboard/company/projects/' + form.projectId);
    } catch (err) {
      setMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
      Chargement...
    </div>
  );
  if (!template) return <div style={{ padding: '40px' }}>Template non trouvé</div>;

  const typeInfo = TYPE_LABELS[template.type] || TYPE_LABELS.confirmation_only;

  const validationSteps = (template.steps || [])
    .map((step, i) => ({ ...step, _globalIndex: i }))
    .filter(step => step._globalIndex !== 0 && step.role !== 'employe');

  const employeStep = template.steps?.[0];

  return (
    <div style={{ padding: '40px', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)}
          style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
          ← Retour
        </button>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            Nouveau workflow
          </h1>
          <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
            {template.name} — {typeInfo.label}
          </span>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: msg.startsWith('ERREUR') ? '#fee2e2' : '#dcfce7', color: msg.startsWith('ERREUR') ? '#991b1b' : '#166534' }}>
          {msg.startsWith('ERREUR') ? '⚠️' : '✅'} {msg.replace(/^(ERREUR|SUCCESS)\s?/, '')}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>

        {/* ── SECTION 1 — Infos générales ── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>1</div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Informations générales</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Nom du workflow *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="Ex: Demande achat Q1 2026" />
            </div>
            <div>
              <label style={lbl}>Projet *</label>
              <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} style={inp}>
                <option value="">-- Choisir un projet --</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={inp} placeholder="Optionnel" />
            </div>
            <div>
              <label style={lbl}>Échéance</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={inp} />
            </div>
          </div>
        </div>

        {/* ── SECTION 2 — Circuit d'approbation (aperçu) ── */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>2</div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Circuit d'approbation</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {(template.steps || []).map((step, i) => {
              const roleCfg = ROLE_CONFIG[step.role] || ROLE_CONFIG.validateur;
              return (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: roleCfg.bg, borderRadius: '10px', border: `1px solid ${roleCfg.color}30` }}>
                    <span style={{ fontSize: '16px' }}>{roleCfg.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '12px', color: roleCfg.color }}>{step.name}</p>
                      <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>
                        {step.role === 'employe' ? 'Tous les employés' : 'Poste à assigner'}
                      </p>
                    </div>
                  </div>
                  {i < template.steps.length - 1 && (
                    <span style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: 300 }}>→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 3 — Assignation des postes ── */}
        {template.type !== 'automatic' && validationSteps.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>3</div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Assignation des postes</h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 38px' }}>
              Choisissez quel poste sera responsable de chaque étape de validation.
              L'étape Employé est accessible à tous les employés automatiquement.
            </p>

            {/* Étape Employé — lecture seule */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', background: '#e0f2fe', borderRadius: '12px', border: '1px solid #0891b230', marginBottom: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0891b2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                👤
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                  {employeStep?.name || 'Demande Employé'}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#0891b2', fontWeight: 600 }}>
                  Accessible à tous les employés — aucun poste à assigner
                </p>
              </div>
              <span style={{ background: '#0891b2', color: '#fff', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                🔒 Fixe
              </span>
            </div>

            {/* Étapes de validation — sélecteur de poste */}
            {validationSteps.map((step) => {
              const roleCfg  = ROLE_CONFIG[step.role] || ROLE_CONFIG.validateur;
              const idx      = step._globalIndex;
              // ✅ FIX BUG 2 : selected = _id du poste
              const selected = form.postMapping[idx] || '';
              // Pour affichage du nom du poste sélectionné
              const selectedPost = allPosts.find(p => p._id === selected);

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: `1px solid ${selected ? roleCfg.color + '40' : '#e2e8f0'}`, marginBottom: '10px', transition: 'border-color 0.15s' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: roleCfg.bg, border: `2px solid ${roleCfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                    {roleCfg.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      {step.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: roleCfg.bg, color: roleCfg.color, padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                        {roleCfg.label}
                      </span>
                      {step.description && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{step.description}</span>
                      )}
                      {step.delai > 0 && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          ⏱ {step.delai >= 1440 ? Math.round(step.delai / 1440) + 'j' : step.delai >= 60 ? Math.round(step.delai / 60) + 'h' : step.delai + 'min'}
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{ color: '#cbd5e1', fontSize: '18px', flexShrink: 0 }}>→</span>

                  {/* ✅ FIX BUG 2 : value = p._id, pas p.name */}
                  <div style={{ minWidth: '260px' }}>
                    <select
                      value={selected}
                      onChange={e => setForm(p => ({
                        ...p,
                        postMapping: { ...p.postMapping, [idx]: e.target.value },
                      }))}
                      style={{ ...inp, borderColor: selected ? roleCfg.color : '#e2e8f0', fontWeight: selected ? 600 : 400, color: selected ? '#0f172a' : '#94a3b8' }}
                    >
                      <option value="">-- Choisir un poste --</option>
                      {allPosts.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name}{p.departmentName ? ' (' + p.departmentName + ')' : ''}
                        </option>
                      ))}
                    </select>
                    {selected && selectedPost && (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                        ✓ {selectedPost.name}
                      </p>
                    )}
                    {!selected && (
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                        ⚠️ Poste requis pour cette étape
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Workflow automatique */}
        {template.type === 'automatic' && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '28px', marginBottom: '32px' }}>
            <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '16px 20px', border: '1px solid #fde68a' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: '14px' }}>
                ⚡ Workflow automatique — les demandes seront approuvées sans intervention humaine.
              </p>
            </div>
          </div>
        )}

        {/* Bouton créer */}
        <button onClick={handleSubmit} disabled={saving}
          style={{ width: '100%', padding: '14px', borderRadius: '10px', background: saving ? '#e2e8f0' : '#4f46e5', color: saving ? '#94a3b8' : '#fff', border: 'none', fontWeight: 700, fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}>
          {saving ? 'Création en cours...' : '✓ Créer le workflow'}
        </button>
      </div>
    </div>
  );
};

export default CreateWorkflowFromTemplate;
