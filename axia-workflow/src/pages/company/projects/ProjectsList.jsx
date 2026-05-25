import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import projectService from '../../../services/projectService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  active:    { label: 'Actif',    bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  archived:  { label: 'Archivé', bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' },
  completed: { label: 'Terminé', bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
};

const COLORS = ['#4f46e5','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#db2777','#ea580c'];

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.active;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
};

// ── Modal réutilisable ────────────────────────────────────────────────────────
const Modal = ({ open, onClose, children, width = '480px' }) => {
  if (!open) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px',
        padding: '36px', width, maxWidth: '95vw',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'fadeUp 0.18s ease',
      }}>
        {children}
      </div>
    </div>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────
const ProjectsList = () => {
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showArchive,setShowArchive]= useState(false);
  const [selected,   setSelected]   = useState(null); // projet en cours d'action

  // Formulaires
  const EMPTY = { name: '', description: '', color: '#4f46e5' };
  const [form,   setForm]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data?.projects || []);
    } catch (err) {
      showMsg('❌ ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(''), 3500);
  };

  // ── CREATE ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await projectService.create(form);
      showMsg('✅ Projet créé avec succès');
      setShowCreate(false);
      setForm(EMPTY);
      fetchProjects();
    } catch (err) {
      showMsg('❌ ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // ── EDIT ──────────────────────────────────────────────────────────────────
  const openEdit = (p) => {
    setSelected(p);
    setForm({ name: p.name, description: p.description || '', color: p.color || '#4f46e5' });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await projectService.update(selected._id, form);
      showMsg('✅ Projet modifié');
      setShowEdit(false);
      fetchProjects();
    } catch (err) {
      showMsg('❌ ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // ── ARCHIVE ───────────────────────────────────────────────────────────────
  const openArchive = (p) => { setSelected(p); setShowArchive(true); };

  const handleArchive = async () => {
    setSaving(true);
    try {
      await projectService.update(selected._id, { status: 'archived' });
      showMsg('📦 Projet archivé');
      setShowArchive(false);
      fetchProjects();
    } catch (err) {
      showMsg('❌ ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────
  const openDelete = (p) => { setSelected(p); setShowDelete(true); };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await projectService.delete(selected._id);
      showMsg('🗑️ Projet supprimé');
      setShowDelete(false);
      fetchProjects();
    } catch (err) {
      showMsg('❌ ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  // ── Formulaire partagé CREATE / EDIT ──────────────────────────────────────
  const ProjectForm = () => (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Nom du projet *</label>
        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Construction Tour A"
          autoFocus
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '18px' }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Description du projet..."
          rows="3"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Couleur</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {COLORS.map(color => (
            <div
              key={color}
              onClick={() => setForm({ ...form, color })}
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: color, cursor: 'pointer',
                border: form.color === color ? '3px solid #0f172a' : '3px solid transparent',
                boxShadow: form.color === color ? '0 0 0 2px #fff, 0 0 0 4px ' + color : 'none',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Styles partagés ───────────────────────────────────────────────────────
  const labelStyle = {
    display: 'block', fontWeight: 600, fontSize: '13px',
    color: '#374151', marginBottom: '7px', letterSpacing: '0.02em',
  };
  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };
  const btnPrimary = (color = '#4f46e5') => ({
    padding: '11px 24px', borderRadius: '10px',
    background: color, color: '#fff', border: 'none',
    cursor: 'pointer', fontWeight: 700, fontSize: '14px',
    opacity: saving ? 0.7 : 1,
    transition: 'opacity 0.15s, transform 0.1s',
  });
  const btnSecondary = {
    padding: '11px 20px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', background: '#fff',
    cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#64748b',
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f8fafc' }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .project-card {
          animation: fadeUp 0.22s ease both;
        }
        .project-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }
        .action-btn:hover { opacity: 0.8; transform: scale(1.08); }
        input:focus, textarea:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
      `}</style>

      {/* ── Toast message ── */}
      {msg && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '14px 20px', borderRadius: '12px', fontWeight: 600,
          fontSize: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          background: msg.type === 'error' ? '#fee2e2' : '#dcfce7',
          color:      msg.type === 'error' ? '#991b1b' : '#166534',
          animation: 'fadeUp 0.2s ease',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            📁 Mes Projets
          </h1>
          <p style={{ color: '#94a3b8', margin: '5px 0 0', fontSize: '14px' }}>
            {projects.length} projet(s) au total
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY); setShowCreate(true); }}
          style={{
            ...btnPrimary(),
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Nouveau projet
        </button>
      </div>

      {/* ── Contenu ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          Chargement...
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 40px',
          background: '#fff', borderRadius: '20px',
          border: '2px dashed #e2e8f0',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📁</div>
          <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>Aucun projet</h3>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>Créez votre premier projet pour commencer</p>
          <button onClick={() => { setForm(EMPTY); setShowCreate(true); }} style={btnPrimary()}>
            + Créer un projet
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {projects.map((project, i) => (
            <div
              key={project._id}
              className="project-card"
              style={{
                background: '#fff', borderRadius: '16px',
                border: '1px solid #f1f5f9',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.22s ease',
                animationDelay: `${i * 0.05}s`,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Barre couleur en haut */}
              <div style={{
                height: '5px',
                background: `linear-gradient(90deg, ${project.color || '#4f46e5'}, ${project.color || '#4f46e5'}99)`,
              }} />

              <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Top : icône + statut */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '12px',
                    background: (project.color || '#4f46e5') + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                  }}>
                    📁
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {/* Nom + description */}
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  {project.name}
                </h3>
                <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, flex: 1 }}>
                  {project.description || 'Aucune description'}
                </p>

                {/* Date */}
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '18px' }}>
                  Créé le {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                </div>

                {/* ── Actions ── */}
                <div style={{
                  display: 'flex', gap: '8px',
                  borderTop: '1px solid #f1f5f9', paddingTop: '16px',
                }}>

                  {/* Voir */}
                  <button
                    className="action-btn"
                    onClick={() => navigate(`/dashboard/company/projects/${project._id}`)}
                    title="Voir le projet"
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: '9px',
                      background: (project.color || '#4f46e5') + '15',
                      color: project.color || '#4f46e5',
                      border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '12px',
                      transition: 'all 0.15s',
                    }}
                  >
                    👁 Voir
                  </button>

                  {/* Modifier */}
                  <button
                    className="action-btn"
                    onClick={() => openEdit(project)}
                    title="Modifier"
                    style={{
                      width: '38px', height: '38px', borderRadius: '9px',
                      background: '#f1f5f9', color: '#374151',
                      border: 'none', cursor: 'pointer', fontSize: '15px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    ✏️
                  </button>

                  {/* Archiver */}
                  {project.status !== 'archived' && (
                    <button
                      className="action-btn"
                      onClick={() => openArchive(project)}
                      title="Archiver"
                      style={{
                        width: '38px', height: '38px', borderRadius: '9px',
                        background: '#fef9c3', color: '#854d0e',
                        border: 'none', cursor: 'pointer', fontSize: '15px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      📦
                    </button>
                  )}

                  {/* Supprimer */}
                  <button
                    className="action-btn"
                    onClick={() => openDelete(project)}
                    title="Supprimer"
                    style={{
                      width: '38px', height: '38px', borderRadius: '9px',
                      background: '#fee2e2', color: '#dc2626',
                      border: 'none', cursor: 'pointer', fontSize: '15px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL — Créer un projet
      ══════════════════════════════════════════════════════ */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <h2 style={{ margin: '0 0 24px', color: '#0f172a', fontWeight: 800, fontSize: '20px' }}>
          📁 Nouveau projet
        </h2>
        <ProjectForm />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowCreate(false)} style={btnSecondary}>Annuler</button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.name.trim()}
            style={{ ...btnPrimary(), boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}
          >
            {saving ? '⏳ Création...' : '✅ Créer le projet'}
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          MODAL — Modifier un projet
      ══════════════════════════════════════════════════════ */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)}>
        <h2 style={{ margin: '0 0 24px', color: '#0f172a', fontWeight: 800, fontSize: '20px' }}>
          ✏️ Modifier le projet
        </h2>
        <ProjectForm />
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowEdit(false)} style={btnSecondary}>Annuler</button>
          <button
            onClick={handleEdit}
            disabled={saving || !form.name.trim()}
            style={{ ...btnPrimary('#059669'), boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}
          >
            {saving ? '⏳ Enregistrement...' : '✅ Enregistrer'}
          </button>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          MODAL — Confirmation Archiver
      ══════════════════════════════════════════════════════ */}
      <Modal open={showArchive} onClose={() => setShowArchive(false)} width="420px">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h2 style={{ margin: '0 0 10px', color: '#0f172a', fontWeight: 800 }}>Archiver ce projet ?</h2>
          <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
            Le projet <strong>"{selected?.name}"</strong> sera archivé.<br />
            Il ne sera plus visible dans la liste principale.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowArchive(false)} style={btnSecondary}>Annuler</button>
            <button
              onClick={handleArchive}
              disabled={saving}
              style={{ ...btnPrimary('#d97706'), boxShadow: '0 4px 12px rgba(217,119,6,0.25)' }}
            >
              {saving ? '⏳...' : '📦 Archiver'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          MODAL — Confirmation Supprimer
      ══════════════════════════════════════════════════════ */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} width="420px">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 10px', color: '#991b1b', fontWeight: 800 }}>Supprimer ce projet ?</h2>
          <p style={{ color: '#64748b', marginBottom: '28px', lineHeight: 1.6 }}>
            Le projet <strong>"{selected?.name}"</strong> sera définitivement supprimé.<br />
            Cette action est <strong>irréversible</strong>.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowDelete(false)} style={btnSecondary}>Annuler</button>
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{ ...btnPrimary('#dc2626'), boxShadow: '0 4px 12px rgba(220,38,38,0.25)' }}
            >
              {saving ? '⏳...' : '🗑️ Supprimer définitivement'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ProjectsList;
