import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectService  from '../../../services/projectService';
import workflowService from '../../../services/workflowService';
import WorkflowEditor  from '../workflows/WorkflowEditor';

const StatusBadge = ({ status }) => {
  const map = {
    draft:     { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon' },
    active:    { bg: '#dbeafe', color: '#1d4ed8', label: 'Actif' },
    completed: { bg: '#dcfce7', color: '#166534', label: 'Termine' },
    rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Rejete' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
};

// ── Composant Dialog de confirmation ─────────────────────────────────────────
const ConfirmDialog = ({ dialog, onConfirm, onCancel }) => {
  if (!dialog) return null;
  const isDelete     = dialog.type === 'delete';
  const isDeactivate = dialog.type === 'deactivate';
  const isStart      = dialog.type === 'start';

  const config = {
    delete:     { icon: '🗑️', title: 'Supprimer le workflow',   btnColor: '#dc2626', btnLabel: 'Supprimer',   desc: <>Supprimer <strong>{dialog.wf.name}</strong> ? Cette action est <strong>irréversible</strong>.</> },
    deactivate: { icon: '⏸',  title: 'Désactiver le workflow',  btnColor: '#f59e0b', btnLabel: 'Désactiver',  desc: <>Désactiver <strong>{dialog.wf.name}</strong> ? Les employés ne pourront plus soumettre de demandes via ce workflow. Vous pourrez le réactiver à tout moment.</> },
    start:      { icon: '🚀', title: 'Démarrer le workflow',    btnColor: '#059669', btnLabel: 'Démarrer',    desc: <>Démarrer <strong>{dialog.wf.name}</strong> ? Il sera visible par tous les employés pour soumettre des demandes.</> },
  }[dialog.type];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '36px 32px', width: '420px', maxWidth: '95vw', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{config.icon}</div>
        <h2 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{config.title}</h2>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{config.desc}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: config.btnColor, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
            {config.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project,    setProject]    = useState(null);
  const [workflows,  setWorkflows]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [wfName,     setWfName]     = useState('');
  const [wfDesc,     setWfDesc]     = useState('');
  const [wfDue,      setWfDue]      = useState('');
  const [step1,      setStep1]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [msg,        setMsg]        = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, wf }

  useEffect(() => { fetchData(); }, [id]); // eslint-disable-line

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await projectService.getById(id);
      setProject(res.data ? res.data.project : null);
      setWorkflows(res.data ? res.data.workflows || [] : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };

  const handleStart = (wf) => {
    setConfirmDialog({ type: 'start', wf });
  };

  const confirmStart = async () => {
    const wf = confirmDialog.wf;
    setConfirmDialog(null);
    try {
      await workflowService.start(wf._id);
      showMsg('SUCCESS Workflow démarré avec succès !');
      fetchData();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

const confirmDeactivate = async () => {
  const wf = confirmDialog.wf;
  setConfirmDialog(null);
  try {
    await workflowService.deactivate(wf._id);
    showMsg('SUCCESS Workflow désactivé — retiré des demandes employés.');
    fetchData();
  } catch (err) {
    showMsg('ERREUR ' + (err.response?.data?.message || err.message));
  }
};

  const handleDelete = (wf) => {
    if (wf.status !== 'draft') {
      showMsg('ERREUR Seuls les brouillons peuvent être supprimés.');
      return;
    }
    setConfirmDialog({ type: 'delete', wf });
  };

  const confirmDelete = async () => {
    const wf = confirmDialog.wf;
    setConfirmDialog(null);
    setDeleting(wf._id);
    try {
      await workflowService.delete(wf._id);
      showMsg('SUCCESS Workflow supprimé avec succès.');
      fetchData();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setDeleting(null); }
  };

  const handleEdit = (wf) => {
    navigate('/dashboard/company/workflows/' + wf._id + '/edit-info');
  };

  // Sauvegarder depuis l'éditeur visuel
// Remplacer handleEditorSave par :
const handleEditorSave = async ({ steps, visibility = 'global', allowedRoles = [], allowedPosts = [] }) => {
  if (!wfName.trim()) { alert('Donnez un nom au workflow'); return; }
  setSaving(true);
  try {
    await workflowService.create({
      name:        wfName,
      description: wfDesc,
      dueDate:     wfDue,
      projectId:   id,
      steps,
      visibility,
      allowedRoles,
      allowedPosts,
    });
    showMsg('SUCCESS Workflow cree !');
    setShowEditor(false);
    setStep1(false);
    setWfName(''); setWfDesc(''); setWfDue('');
    fetchData();
  } catch (err) {
    showMsg('ERREUR ' + err.message);
  } finally { setSaving(false); }
};

  if (loading) return <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>;
  if (!project) return <div style={{ padding: '40px' }}>Projet non trouve</div>;

  // Plein écran éditeur
  if (showEditor) {
    return (
      <WorkflowEditor
        projectId={id}
        workflowName={wfName}
        onSave={handleEditorSave}
        onCancel={() => { setShowEditor(false); setStep1(false); }}
      />
    );
  }

  const msgBg    = msg.startsWith('SUCCESS') ? '#dcfce7' : '#fee2e2';
  const msgColor = msg.startsWith('SUCCESS') ? '#166534' : '#991b1b';
  const msgText  = msg.replace(/^(SUCCESS|ERREUR)\s?/, '');

  return (
    <>
    <ConfirmDialog
  dialog={confirmDialog}
  onConfirm={
    confirmDialog?.type === 'delete'     ? confirmDelete :
    confirmDialog?.type === 'deactivate' ? confirmDeactivate :
    confirmStart
  }
  onCancel={() => setConfirmDialog(null)}
/>
    <div style={{ padding: '32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/dashboard/company/projects')}
          style={{
            background: '#f1f5f9', border: 'none', padding: '8px 16px',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b',
          }}
        >
          Retour
        </button>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: project.color || '#4f46e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '20px',
        }}>
          P
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{project.name}</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{project.description || ''}</p>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          fontWeight: 600, background: msgBg, color: msgColor,
        }}>
          {msgText}
        </div>
      )}

      {/* Step 1 — nom avant d'ouvrir l'éditeur */}
      {step1 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            width: '480px', maxWidth: '95vw',
          }}>
            <h2 style={{ margin: '0 0 20px', color: '#0f172a' }}>Nouveau workflow</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
                Nom du workflow *
              </label>
              <input
                value={wfName}
                onChange={(e) => setWfName(e.target.value)}
                placeholder="Ex: Validation des plans"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
                Description
              </label>
              <input
                value={wfDesc}
                onChange={(e) => setWfDesc(e.target.value)}
                placeholder="Description..."
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#374151', marginBottom: '6px' }}>
                Date echeance
              </label>
              <input
                type="date"
                value={wfDue}
                onChange={(e) => setWfDue(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setStep1(false); setWfName(''); setWfDesc(''); setWfDue(''); }}
                style={{
                  padding: '10px 20px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => { if (!wfName.trim()) return; setStep1(false); setShowEditor(true); }}
                style={{
                  padding: '10px 24px', borderRadius: '8px',
                  background: '#4f46e5', color: '#fff', border: 'none',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                Ouvrir l'editeur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste workflows */}

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
    {'Workflows (' + workflows.length + ')'}
  </h2>
  <div style={{ display: 'flex', gap: '10px' }}>

    {/* 🤖 Assistant IA */}
    <button
      onClick={() => navigate('/dashboard/company/workflows/assistant?projectId=' + id)}
      style={{
        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        color: '#fff', border: 'none',
        padding: '10px 20px', borderRadius: '8px',
        fontWeight: 700, cursor: 'pointer', fontSize: '13px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}
    >
      🤖 Assistant IA
    </button>

    {/* ✦ Générer avec l'IA */}
    <button
      onClick={() => navigate('/dashboard/company/projects/' + id + '/generate-ai')}
      style={{
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        color: '#fff', border: 'none',
        padding: '10px 20px', borderRadius: '8px',
        fontWeight: 700, cursor: 'pointer', fontSize: '13px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}
    >
      ✦ Générer avec l'IA
    </button>

    {/* Bouton existant */}
    <button
      onClick={() => setStep1(true)}
      style={{
        background: '#4f46e5', color: '#fff', border: 'none',
        padding: '10px 20px', borderRadius: '8px',
        fontWeight: 600, cursor: 'pointer',
      }}
    >
      + Nouveau workflow
    </button>
  </div>
</div>

      {workflows.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0',
        }}>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>Aucun workflow dans ce projet</p>
          <button
            onClick={() => setStep1(true)}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Creer le premier workflow
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {workflows.map((wf) => (
            <div key={wf._id} style={{
              background: '#fff', borderRadius: '12px',
              border: '1px solid #e2e8f0', padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{wf.name}</h3>
                    <StatusBadge status={wf.status} />
                  </div>

                  {/* Progression */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {wf.steps && wf.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700,
                          background:
                            step.status === 'completed'   ? '#059669' :
                            step.status === 'in_progress' ? '#4f46e5' :
                            step.status === 'rejected'    ? '#dc2626' : '#e2e8f0',
                          color: step.status === 'pending' ? '#94a3b8' : '#fff',
                        }}>
                          {step.status === 'completed' ? 'OK' : step.status === 'rejected' ? 'X' : String(i + 1)}
                        </div>
                        <span style={{
                          fontSize: '11px', color: '#64748b', maxWidth: '70px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {step.name}
                        </span>
                        {i < wf.steps.length - 1 && (
                          <div style={{ width: '16px', height: '2px', background: '#e2e8f0' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    {'Etape ' + ((wf.currentStep || 0) + 1) + ' / ' + (wf.steps ? wf.steps.length : 0)}
                    {wf.dueDate ? ' — Echeance: ' + new Date(wf.dueDate).toLocaleDateString('fr-FR') : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                {/* Démarrer — draft uniquement */}
                {wf.status === 'draft' && (
                  <button
                    onClick={() => handleStart(wf)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
                  >
                    ▶ Démarrer
                  </button>
                )}

                {/* Désactiver — actif uniquement */}
                {wf.status === 'active' && (
                  <button
                    onClick={() => setConfirmDialog({ type: 'deactivate', wf })}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#f59e0b', border: '1.5px solid #fcd34d', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                  >
                    ⏸ Désactiver
                  </button>
                )}

                {/* Modifier — draft uniquement */}
                {wf.status === 'draft' && (
                  <button
                    onClick={() => handleEdit(wf)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#4f46e5', border: '1.5px solid #4f46e5', padding: '9px 18px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                  >
                    ✏️ Modifier
                  </button>
                )}

                {/* Voir — toujours */}
                <button
                  onClick={() => navigate('/dashboard/company/workflows/' + wf._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', color: '#374151', border: '1.5px solid #e2e8f0', padding: '9px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                >
                  👁 Voir
                </button>

                {/* Supprimer — draft et completed et rejected uniquement (pas active) */}
                {['draft', 'completed', 'rejected'].includes(wf.status) && (
                  <button
                    onClick={() => handleDelete(wf)}
                    disabled={deleting === wf._id}
                    title="Supprimer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#dc2626', border: '1.5px solid #fecaca', padding: '9px 12px', borderRadius: '10px', fontWeight: 700, cursor: deleting === wf._id ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: deleting === wf._id ? 0.5 : 1 }}
                  >
                    {deleting === wf._id ? '⏳' : '🗑️'}
                  </button>
                )}

              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
};

export default ProjectDetail;