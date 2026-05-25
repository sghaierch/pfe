import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import workflowService from '../../../services/workflowService';
import departmentService from '../../../services/departmentService';

const EXEMPLES = [
  "Workflow de demande de congé : l'employé soumet, le RH valide, le directeur financier confirme",
  "Workflow d'achat matériel : le responsable IT vérifie, le directeur financier approuve le budget",
  "Workflow de recrutement : RH filtre les CVs, manager technique valide, directeur général approuve",
  "Workflow de note de frais : l'employé soumet les justificatifs, le comptable vérifie, le DG approuve",
];

const FIELD_TYPE_ICONS = {
  text: 'T', number: '123', date: 'D', select: 'L',
  textarea: 'TT', file: 'F', checkbox: 'CB', signature: 'SG',
  table: '⊞', auto_number: '#', auto_user: '👤', auto_status: '●',
};

// Labels lisibles pour les types de champs
const FIELD_TYPE_LABELS = {
  text: 'Texte', number: 'Nombre', date: 'Date', select: 'Liste',
  textarea: 'Zone texte', file: 'Fichier', checkbox: 'Case à cocher',
  signature: 'Signature', table: 'Tableau', auto_number: 'N° Auto',
  auto_user: 'Demandeur', auto_status: 'Statut Auto',
};

const GenerateWithAI = () => {
  const navigate   = useNavigate();
  const { id: projectId } = useParams();

  const [description,  setDescription]  = useState('');
  const [generating,   setGenerating]   = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState('');
  const [posts,        setPosts]        = useState([]);
  const [saving,       setSaving]       = useState(false);
  const [starting,     setStarting]     = useState(false);
  const [savedMsg,     setSavedMsg]     = useState('');
  const [editingStep,  setEditingStep]  = useState(null); // index de l'étape en édition

  useEffect(() => {
    departmentService.getAllPosts()
      .then((p) => setPosts(p || []))
      .catch(() => setPosts([]));
  }, []);

  // ── Générer via IA ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!description.trim()) { setError('Décrivez votre processus métier'); return; }
    if (description.trim().length < 20) { setError('Description trop courte — donnez plus de détails'); return; }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const generated = await workflowService.generateWithAI(description, posts);

      // Ajouter des IDs uniques aux champs
      if (generated.steps) {
        generated.steps = generated.steps.map((step, si) => ({
          ...step,
          form: {
            fields: (step.form?.fields || []).map((f, fi) => ({
              ...f,
              id: 'f_' + si + '_' + fi + '_' + Date.now(),
            })),
          },
          checklist: (step.checklist || []).map((c, ci) => ({
            ...c,
            id: 'c_' + si + '_' + ci + '_' + Date.now(),
          })),
          claims: step.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
        }));
      }

      setResult(generated);
    } catch (err) {
      setError('Erreur lors de la génération : ' + err.message + '. Vérifiez votre connexion.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Sauvegarder le workflow généré ─────────────────────────────────────────
  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const steps = result.steps.map((s, i) => ({
        name:             s.name || 'Étape ' + (i + 1),
        description:      s.description || '',
        order:            i,
        assignedTo:       null,
        assignedToName:   '',
        assignedRole:     '',
        assignedPost:     s.assignedPost || '',
        assignedPostName: s.assignedPost || '',
        delai:            s.delai || '',
        type:             'etape',
        form:             s.form || { fields: [] },
        checklist:        (s.checklist || []).map((c) => ({ ...c, checked: false })),
        status:           'pending',
        claims:           s.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
      }));

      await workflowService.create({
        name:        result.workflowName || 'Workflow généré par IA',
        description: result.description || description,
        projectId,
        isTemplate: true,
        steps,
        visibility:  result.visibility || 'global',
        allowedRoles: [],
        allowedPosts: [],
      });

      setSavedMsg('SUCCESS');
      setTimeout(() => navigate('/dashboard/company/projects/' + projectId), 1500);
    } catch (err) {
      setError('Erreur sauvegarde : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Sauvegarder ET démarrer le workflow ─────────────────────────────────────
  const handleSaveAndStart = async () => {
    if (!result) return;
    setStarting(true);
    try {
      const steps = result.steps.map((s, i) => ({
        name:             s.name || 'Étape ' + (i + 1),
        description:      s.description || '',
        order:            i,
        assignedTo:       null,
        assignedToName:   '',
        assignedRole:     '',
        assignedPost:     s.assignedPost || '',
        assignedPostName: s.assignedPost || '',
        delai:            s.delai || '',
        type:             'etape',
        form:             s.form || { fields: [] },
        checklist:        (s.checklist || []).map((c) => ({ ...c, checked: false })),
        status:           'pending',
        claims:           s.claims || { canValidate: true, canReject: true, canModify: false, canView: true },
      }));

      const createRes = await workflowService.create({
        name:        result.workflowName || 'Workflow généré par IA',
        description: result.description || description,
        projectId,
        isTemplate:  true,
        steps,
        visibility:  result.visibility || 'global',
        allowedRoles: [],
        allowedPosts: [],
      });

      const wfId = createRes?.data?.workflow?._id;
      if (wfId) {
        await workflowService.start(wfId);
        setSavedMsg('SUCCESS');
        setTimeout(() => navigate('/dashboard/company/projects/' + projectId), 1500);
      }
    } catch (err) {
      setError('Erreur : ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  // ── Modifier une étape ──────────────────────────────────────────────────────
  const updateStep = (si, key, value) => {
    setResult((prev) => {
      const steps = [...prev.steps];
      steps[si] = { ...steps[si], [key]: value };
      return { ...prev, steps };
    });
  };

  const updateField = (si, fi, key, val) => {
    setResult((prev) => {
      const steps = [...prev.steps];
      const fields = [...steps[si].form.fields];
      fields[fi] = { ...fields[fi], [key]: val };
      steps[si] = { ...steps[si], form: { fields } };
      return { ...prev, steps };
    });
  };

  const removeField = (si, fi) => {
    setResult((prev) => {
      const steps = [...prev.steps];
      steps[si].form.fields = steps[si].form.fields.filter((_, i) => i !== fi);
      return { ...prev, steps };
    });
  };

  // ── Gérer les colonnes du tableau (type=table) ──────────────────────────────
  const addColumn = (si, fi) => {
    setResult((prev) => {
      const steps = [...prev.steps];
      const fields = [...steps[si].form.fields];
      const cols = [...(fields[fi].columns || [])];
      cols.push({ id: 'col_' + Date.now(), label: 'Colonne ' + (cols.length + 1), type: 'text' });
      fields[fi] = { ...fields[fi], columns: cols };
      steps[si] = { ...steps[si], form: { fields } };
      return { ...prev, steps };
    });
  };

  const updateColumn = (si, fi, ci, key, val) => {
    setResult((prev) => {
      const steps = [...prev.steps];
      const fields = [...steps[si].form.fields];
      const cols = [...(fields[fi].columns || [])];
      cols[ci] = { ...cols[ci], [key]: val };
      fields[fi] = { ...fields[fi], columns: cols };
      steps[si] = { ...steps[si], form: { fields } };
      return { ...prev, steps };
    });
  };

  const removeColumn = (si, fi, ci) => {
    setResult((prev) => {
      const steps = [...prev.steps];
      const fields = [...steps[si].form.fields];
      const cols = (fields[fi].columns || []).filter((_, i) => i !== ci);
      fields[fi] = { ...fields[fi], columns: cols };
      steps[si] = { ...steps[si], form: { fields } };
      return { ...prev, steps };
    });
  };

  const removeStep = (si) => {
    setResult((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== si) }));
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '5px' };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
          Retour
        </button>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '28px' }}>✦</span>
            Générer un workflow avec l'IA
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Décrivez votre processus en français — l'IA crée les étapes, formulaires et checklists automatiquement
          </p>
        </div>
      </div>

      {/* Message succès */}
      {savedMsg === 'SUCCESS' && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '16px 20px', borderRadius: '10px', marginBottom: '24px', fontWeight: 700, fontSize: '15px', textAlign: 'center' }}>
          ✅ Workflow créé avec succès ! Redirection...
        </div>
      )}

      {/* Zone de saisie */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
        <label style={{ ...lbl, fontSize: '15px', color: '#0f172a', marginBottom: '10px' }}>
          Décrivez votre processus métier *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Ex: Je veux un workflow de demande de congé. L'employé soumet une demande avec le nombre de jours et la date. Le directeur RH valide avec un avis. Ensuite le directeur financier confirme le budget."
          style={{ ...inp, resize: 'vertical', fontSize: '15px', lineHeight: '1.6' }}
        />

        {/* Exemples */}
        <div style={{ marginTop: '12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
            Exemples — cliquez pour utiliser :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EXEMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setDescription(ex)}
                style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: 500, textAlign: 'left' }}
              >
                {ex.substring(0, 40) + '...'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !description.trim()}
          style={{
            marginTop: '16px', width: '100%', padding: '14px',
            borderRadius: '10px', border: 'none', cursor: generating || !description.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '16px',
            background: generating || !description.trim()
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: generating || !description.trim() ? '#94a3b8' : '#fff',
            transition: 'all 0.2s',
          }}
        >
          {generating ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              L'IA analyse votre description...
            </span>
          ) : '✦ Générer le workflow avec l\'IA'}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Résultat généré */}
      {result && (
        <div>
          {/* Header résultat */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '16px', padding: '20px 28px', marginBottom: '20px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.8, fontWeight: 600 }}>WORKFLOW GÉNÉRÉ PAR L'IA</p>
                <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>{result.workflowName}</h2>
                {result.description && <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>{result.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleGenerate}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  Régénérer
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || starting}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  {saving ? 'Sauvegarde...' : '💾 Sauvegarder (brouillon)'}
                </button>
                <button
                  onClick={handleSaveAndStart}
                  disabled={saving || starting}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#fff', color: '#4f46e5', cursor: (saving || starting) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', opacity: (saving || starting) ? 0.7 : 1 }}
                >
                  {starting ? 'Démarrage...' : '🚀 Sauvegarder et Démarrer'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {result.steps?.length} étapes
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {result.visibility === 'global' ? '🌍 Global' : '🔒 Restreint'}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                {result.steps?.reduce((acc, s) => acc + (s.form?.fields?.length || 0), 0)} champs au total
              </span>
            </div>
          </div>

          {/* Étapes générées */}
          {result.steps?.map((step, si) => (
            <div key={si} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

              {/* Header étape */}
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                  {si + 1}
                </div>
                <div style={{ flex: 1 }}>
                  {editingStep === si ? (
                    <input
                      value={step.name}
                      onChange={(e) => updateStep(si, 'name', e.target.value)}
                      style={{ ...inp, fontWeight: 700, fontSize: '15px', padding: '4px 8px' }}
                      autoFocus
                      onBlur={() => setEditingStep(null)}
                    />
                  ) : (
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }} onClick={() => setEditingStep(si)}>
                      {step.name} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>— cliquez pour renommer</span>
                    </h3>
                  )}
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>{step.description}</p>
                </div>
                <button onClick={() => removeStep(si)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                  Supprimer
                </button>
              </div>

              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Colonne gauche — Config */}
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Poste responsable</label>
                    {si === 0 ? (
                      <div style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f0fdf4', color: '#059669', fontSize: '14px', fontWeight: 600 }}>
                        👥 Tous les employés (étape de soumission)
                      </div>
                    ) : (
                      <select
                        value={step.assignedPost || ''}
                        onChange={(e) => updateStep(si, 'assignedPost', e.target.value)}
                        style={inp}
                      >
                        <option value="">-- Choisir un poste --</option>
                        {posts.map((p) => (
                          <option key={p._id} value={p.name}>
                            {p.name} {p.departmentName ? '(' + p.departmentName + ')' : ''}
                          </option>
                        ))}
                        {step.assignedPost && !posts.find(p => p.name === step.assignedPost) && (
                          <option value={step.assignedPost}>{step.assignedPost} (suggéré par l'IA)</option>
                        )}
                      </select>
                    )}
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={lbl}>Délai</label>
                    <select value={step.delai || ''} onChange={(e) => updateStep(si, 'delai', e.target.value)} style={inp}>
                      <option value="">Sans délai</option>
                      <option value="1j">1 jour</option>
                      <option value="2j">2 jours</option>
                      <option value="3j">3 jours</option>
                      <option value="1s">1 semaine</option>
                      <option value="2s">2 semaines</option>
                    </select>
                  </div>

                  {/* Claims */}
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '12px', color: '#374151' }}>Permissions</p>
                    {si === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                        <div>☐ <span style={{ color: '#94a3b8' }}>Peut valider</span> <span style={{ color: '#94a3b8', fontSize: '10px' }}>(désactivé — étape employé)</span></div>
                        <div>☐ <span style={{ color: '#94a3b8' }}>Peut rejeter</span> <span style={{ color: '#94a3b8', fontSize: '10px' }}>(désactivé — étape employé)</span></div>
                        <div>☑ <span style={{ color: '#4f46e5', fontWeight: 600 }}>Peut voir</span></div>
                      </div>
                    ) : (
                      [
                        { key: 'canValidate', label: 'Peut valider',  color: '#059669' },
                        { key: 'canReject',   label: 'Peut rejeter',  color: '#dc2626' },
                        { key: 'canView',     label: 'Peut voir',     color: '#4f46e5' },
                      ].map((claim) => (
                        <label key={claim.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={step.claims?.[claim.key] !== false}
                            onChange={(e) => updateStep(si, 'claims', { ...(step.claims || {}), [claim.key]: e.target.checked })}
                          />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: claim.color }}>{claim.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Colonne droite — Formulaire */}
                <div>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '13px', color: '#374151' }}>
                    Formulaire — {step.form?.fields?.length || 0} champ(s)
                  </p>
                  {(step.form?.fields || []).map((field, fi) => (
                    <div key={field.id} style={{ marginBottom: '8px' }}>
                      {/* Ligne principale du champ */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 10px', background: field.type === 'table' ? '#f0f9ff' : field.readOnly ? '#f8f5ff' : '#f8fafc', borderRadius: '6px', border: '1px solid ' + (field.type === 'table' ? '#bae6fd' : field.readOnly ? '#ddd6fe' : '#e2e8f0') }}>
                        <span style={{ background: field.type === 'table' ? '#e0f2fe' : field.readOnly ? '#ede9fe' : '#e0e7ff', color: field.type === 'table' ? '#0284c7' : field.readOnly ? '#7c3aed' : '#4f46e5', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }} title={FIELD_TYPE_LABELS[field.type] || field.type}>
                          {FIELD_TYPE_ICONS[field.type] || field.type}
                        </span>
                        <input
                          value={field.label}
                          onChange={(e) => updateField(si, fi, 'label', e.target.value)}
                          disabled={field.readOnly}
                          style={{ flex: 1, padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', background: field.readOnly ? '#f1f5f9' : '#fff' }}
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateField(si, fi, 'type', e.target.value)}
                          disabled={field.readOnly}
                          style={{ padding: '3px 4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', background: '#fff' }}
                        >
                          {Object.keys(FIELD_TYPE_LABELS).map(t => (
                            <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                        {!field.readOnly && (
                          <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
                            <input type="checkbox" checked={field.required || false} onChange={(e) => updateField(si, fi, 'required', e.target.checked)} />
                            Req.
                          </label>
                        )}
                        {field.readOnly && <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 600, flexShrink: 0 }}>AUTO</span>}
                        <button onClick={() => removeField(si, fi)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '18px', height: '18px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>X</button>
                      </div>
                      {/* Éditeur d'options pour type=select */}
                      {field.type === 'select' && !field.readOnly && (
                        <div style={{ marginTop: '4px', marginLeft: '16px', padding: '8px', background: '#fafafa', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <p style={{ margin: '0 0 5px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Options (séparées par virgule)</p>
                          <input
                            value={(field.options || []).join(', ')}
                            onChange={(e) => updateField(si, fi, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="Ex: Approuvé, Refusé, En attente"
                            style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {(field.options || []).map((opt, oi) => (
                              <span key={oi} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>{opt}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Éditeur de colonnes pour type=table */}
                      {field.type === 'table' && (
                        <div style={{ marginTop: '6px', marginLeft: '16px', padding: '10px', background: '#e0f2fe', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>
                            Colonnes du tableau ({(field.columns || []).length})
                          </p>
                          {(field.columns || []).map((col, ci) => (
                            <div key={col.id} style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '4px' }}>
                              <input
                                value={col.label}
                                onChange={(e) => updateColumn(si, fi, ci, 'label', e.target.value)}
                                placeholder="Nom colonne"
                                style={{ flex: 1, padding: '3px 6px', borderRadius: '4px', border: '1px solid #93c5fd', fontSize: '11px' }}
                              />
                              <select
                                value={col.type || 'text'}
                                onChange={(e) => updateColumn(si, fi, ci, 'type', e.target.value)}
                                style={{ padding: '3px 4px', borderRadius: '4px', border: '1px solid #93c5fd', fontSize: '11px' }}
                              >
                                <option value="text">Texte</option>
                                <option value="number">Nombre</option>
                                <option value="date">Date</option>
                              </select>
                              <button onClick={() => removeColumn(si, fi, ci)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', width: '18px', height: '18px', borderRadius: '3px', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>X</button>
                            </div>
                          ))}
                          <button onClick={() => addColumn(si, fi)} style={{ marginTop: '4px', padding: '3px 10px', borderRadius: '4px', border: '1px dashed #0284c7', background: 'transparent', color: '#0284c7', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                            + Ajouter une colonne
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Checklist */}
                  {(step.checklist || []).length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '12px', color: '#7c3aed' }}>
                        Checklist — {step.checklist.length} item(s)
                      </p>
                      {step.checklist.map((item, ci) => (
                        <div key={item.id} style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '5px 8px', background: '#f5f3ff', borderRadius: '5px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px' }}>☐</span>
                          <span style={{ flex: 1, fontSize: '12px', color: '#374151' }}>{item.label}</span>
                          {item.required && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>REQUIS</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Bouton final sauvegarder */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => { setResult(null); setDescription(''); }}
              style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '15px' }}
            >
              Recommencer
            </button>
            <button
              onClick={handleSave}
              disabled={saving || starting}
              style={{ padding: '12px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#4f46e5', fontSize: '14px' }}
            >
              {saving ? 'Sauvegarde...' : '💾 Sauvegarder (brouillon)'}
            </button>
            <button
              onClick={handleSaveAndStart}
              disabled={saving || starting}
              style={{ padding: '12px 32px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', cursor: (saving || starting) ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px', opacity: (saving || starting) ? 0.7 : 1 }}
            >
              {starting ? 'Démarrage en cours...' : '🚀 Créer et Démarrer maintenant'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateWithAI;