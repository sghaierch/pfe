import React, { useState, useEffect } from 'react';
import userService from '../../../services/userService';
import departmentService from '../../../services/departmentService';
const DEPTS = ['', 'RH', 'Finance', 'Achats', 'Opérations', 'Projets', 'IT', 'Marketing', 'Autre'];

const PostsList = () => {
  const [posts,   setPosts]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const [form,    setForm]    = useState({ name: '', description: '', department: '' });
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    // ✅ Charger postes ET départements depuis l'API
    const load = async () => {
      setLoading(true);
      try {
        const [postsRes, deptsRes] = await Promise.all([
          userService.getPosts(),
          departmentService.getDepartments(), // ✅ AJOUTER
        ]);
        setPosts(postsRes.data?.posts || []);
        setDepartments(deptsRes.data?.data?.departments || []); // ✅ AJOUTER
      } catch (err) {
        showMsg('ERREUR ' + (err.response?.data?.message || err.message));
      } finally { setLoading(false); }
    };
    load();
  }, []);

const fetchDepartments = async () => {
  const res = await departmentService.getDepartments();
  setDepartments(res.data.departments || []);
};

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await userService.getPosts();
      setPosts(res.data?.posts || []);
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { showMsg('ERREUR Nom du poste requis'); return; }
    setSaving(true);
    try {
      if (editing) {
        await userService.updatePost(editing, form);
        showMsg('SUCCESS Poste modifié !');
      } else {
        await userService.createPost(form);
        showMsg('SUCCESS Poste créé !');
      }
      setForm({ name: '', description: '', department: '' });
      setEditing(null);
      fetchPosts();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

const handleEdit = (post) => {
  setEditing(post._id);
  setForm({ 
    name: post.name, 
    description: post.description || '', 
    department: post.department ? post.department.toString() : ''  // ← ObjectId en string
  });
};

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await userService.deletePost(deleteModal._id);
      showMsg('SUCCESS Poste supprimé');
      setDeleteModal(null);
      fetchPosts();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    }
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '5px' };
  const msgBg    = msg.startsWith('SUCCESS') ? '#dcfce7' : '#fee2e2';
  const msgColor = msg.startsWith('SUCCESS') ? '#166534' : '#991b1b';

  return (
    <div style={{ padding: '40px' }}>

      {/* Modal suppression */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ margin: '0 0 12px', color: '#0f172a' }}>Supprimer le poste</h3>
            <p style={{ color: '#64748b', margin: '0 0 24px' }}>
              Supprimer <strong>{deleteModal.name}</strong> ? Les utilisateurs avec ce poste ne seront plus assignés automatiquement.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Postes</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Gérez les postes de votre organisation</p>
      </div>

      {/* Message */}
      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: msgBg, color: msgColor }}>
          {msg.replace(/^(SUCCESS|ERREUR)\s?/, '')}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Formulaire gauche */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            {editing ? 'Modifier le poste' : '+ Nouveau poste'}
          </h2>

          <div style={{ marginBottom: '14px' }}>
            <label style={lbl}>Nom du poste *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              style={inp}
              placeholder="Ex: Directeur RH"
            />
          </div>

       <div style={{ marginBottom: '14px' }}>
  <label style={lbl}>Département</label>
  <select
    value={form.department}
    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
    style={inp}
  >
    <option value="">-- Choisir --</option>
    {departments.map((d) => (
      <option key={d._id} value={d._id}>{d.name}</option>  
    ))}
  </select>
</div>

          <div style={{ marginBottom: '20px' }}>
            <label style={lbl}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              style={{ ...inp, resize: 'vertical' }}
              placeholder="Description optionnelle..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? '...' : editing ? 'Sauvegarder' : 'Créer'}
            </button>
            {editing && (
              <button
                onClick={() => { setEditing(null); setForm({ name: '', description: '', department: '' }); }}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Liste droite */}
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>💼</p>
              <p style={{ margin: 0, fontWeight: 600 }}>Aucun poste — créez le premier</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Poste', 'Département', 'Description', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: '13px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{post.name}</span>
                    </td>
                   <td style={{ padding: '14px 16px' }}>
  {post.departmentName ? (
    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
      {post.departmentName}
    </span>
  ) : '—'}
</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                      {post.description || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEdit(post)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#4f46e5', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: '14px' }}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteModal(post)}
                          style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff5f5', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '14px' }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostsList;