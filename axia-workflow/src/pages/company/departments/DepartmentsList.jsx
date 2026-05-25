import React, { useEffect, useState } from 'react';
import departmentService from '../../../services/departmentService';

const DepartmentsList = () => {
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState('');
  const [expandedDept, setExpandedDept] = useState(null);

  const [deptPosts,    setDeptPosts]    = useState({});
  const [loadingPosts, setLoadingPosts] = useState({});

  const [deptForm,    setDeptForm]    = useState({ name: '' });
  const [editingDept, setEditingDept] = useState(null);
  const [savingDept,  setSavingDept]  = useState(false);

  const [postForm,       setPostForm]       = useState({ name: '', description: '' });
  const [editingPost,    setEditingPost]    = useState(null);
  const [savingPost,     setSavingPost]     = useState(false);
  const [activePostDept, setActivePostDept] = useState(null);

  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.data?.data?.departments || []);
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const fetchPostsForDept = async (deptId) => {
    setLoadingPosts(p => ({ ...p, [deptId]: true }));
    try {
      const res = await departmentService.getPostsByDepartment(deptId);
      setDeptPosts(p => ({ ...p, [deptId]: res.data?.data?.posts || [] }));
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingPosts(p => ({ ...p, [deptId]: false }));
    }
  };

  const handleExpandDept = (deptId) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptId);
      fetchPostsForDept(deptId);
    }
  };

  const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleDeptSubmit = async () => {
    if (!deptForm.name.trim()) { showMsg('ERREUR Nom requis'); return; }
    setSavingDept(true);
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept, deptForm);
        showMsg('SUCCESS Département modifié !');
      } else {
        await departmentService.createDepartment(deptForm);
        showMsg('SUCCESS Département créé !');
      }
      setDeptForm({ name: '' });
      setEditingDept(null);
      fetchDepartments();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSavingDept(false); }
  };

  const handleDeptEdit = (dept) => {
    setEditingDept(dept._id);
    setDeptForm({ name: dept.name });
  };

  const handlePostSubmit = async (deptId) => {
    if (!postForm.name.trim()) { showMsg('ERREUR Nom du poste requis'); return; }
    setSavingPost(true);
    try {
      if (editingPost) {
        await departmentService.updatePost(editingPost, postForm);
        showMsg('SUCCESS Poste modifié !');
      } else {
        await departmentService.createPost(deptId, postForm);
        showMsg('SUCCESS Poste créé !');
      }
      setPostForm({ name: '', description: '' });
      setEditingPost(null);
      setActivePostDept(null);
      fetchPostsForDept(deptId);
      fetchDepartments();
    } catch (err) {
      showMsg('ERREUR ' + (err.response?.data?.message || err.message));
    } finally { setSavingPost(false); }
  };

  const handlePostEdit = (post, deptId) => {
    setEditingPost(post._id);
    setPostForm({ name: post.name, description: post.description || '' });
    setActivePostDept(deptId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === 'dept') {
        await departmentService.deleteDepartment(deleteModal.item._id);
        showMsg('SUCCESS Département supprimé');
        fetchDepartments();
      } else {
        await departmentService.deletePost(deleteModal.item._id);
        showMsg('SUCCESS Poste supprimé');
        fetchPostsForDept(deleteModal.deptId);
        fetchDepartments();
      }
      setDeleteModal(null);
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

      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>🗑️</p>
              <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>
                Supprimer {deleteModal.type === 'dept' ? 'le département' : 'le poste'}
              </h3>
              <p style={{ color: '#64748b', margin: 0 }}>
                Supprimer <strong>{deleteModal.item.name}</strong> ?
                {deleteModal.type === 'dept' && ' Tous les postes associés seront désassociés.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={handleDeleteConfirm} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Départements & Postes</h1>
        <p style={{ color: '#64748b', margin: 0 }}>Gérez la structure de votre organisation</p>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: msgBg, color: msgColor }}>
          {msg.replace(/^(SUCCESS|ERREUR)\s?/, '')}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>

        <div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
              {editingDept ? 'Modifier département' : '+ Nouveau département'}
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <label style={lbl}>Nom *</label>
              <input value={deptForm.name} onChange={(e) => setDeptForm({ name: e.target.value })} style={inp} placeholder="Ex: Ressources Humaines" />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleDeptSubmit} disabled={savingDept} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: savingDept ? 0.7 : 1 }}>
                {savingDept ? '...' : editingDept ? 'Sauvegarder' : 'Créer'}
              </button>
              {editingDept && (
                <button onClick={() => { setEditingDept(null); setDeptForm({ name: '' }); }} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chargement...</div>
          ) : departments.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>🏢</p>
              <p style={{ margin: 0, fontWeight: 600 }}>Aucun département — créez le premier</p>
            </div>
          ) : (
            departments.map((dept) => {
              const posts      = deptPosts[dept._id] || [];
              const isExpanded = expandedDept === dept._id;
              return (
                <div key={dept._id} style={{ background: '#fff', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>

                  <div
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: isExpanded ? '1px solid #f1f5f9' : 'none', cursor: 'pointer', background: isExpanded ? '#fafbff' : '#fff' }}
                    onClick={() => handleExpandDept(dept._id)}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{dept.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{dept.postCount ?? 0} poste(s)</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleDeptEdit(dept); }} style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ type: 'dept', item: dept }); }} style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#fff5f5', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                      <span style={{ color: '#94a3b8', fontSize: '18px', marginLeft: '4px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '16px 20px' }}>
                      {loadingPosts[dept._id] ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px' }}>Chargement des postes...</p>
                      ) : posts.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px' }}>Aucun poste dans ce département</p>
                      ) : (
                        <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {posts.map((post) => (
                            <div key={post._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '16px' }}>💼</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{post.name}</p>
                                {post.description && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{post.description}</p>}
                              </div>
                              <button onClick={() => handlePostEdit(post, dept._id)} style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                              <button onClick={() => setDeleteModal({ type: 'post', item: post, deptId: dept._id })} style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fff5f5', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '12px' }}>🗑️</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {(activePostDept === dept._id || editingPost) ? (
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                            {editingPost ? 'Modifier le poste' : '+ Nouveau poste'}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                            <div>
                              <label style={lbl}>Nom *</label>
                              <input value={postForm.name} onChange={(e) => setPostForm((p) => ({ ...p, name: e.target.value }))} style={inp} placeholder="Ex: Développeur Senior" />
                            </div>
                            <div>
                              <label style={lbl}>Description</label>
                              <input value={postForm.description} onChange={(e) => setPostForm((p) => ({ ...p, description: e.target.value }))} style={inp} placeholder="Optionnel" />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handlePostSubmit(dept._id)} disabled={savingPost} style={{ flex: 1, padding: '8px', borderRadius: '7px', background: '#059669', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
                              {savingPost ? '...' : editingPost ? 'Sauvegarder' : 'Ajouter'}
                            </button>
                            <button onClick={() => { setActivePostDept(null); setEditingPost(null); setPostForm({ name: '', description: '' }); }} style={{ padding: '8px 14px', borderRadius: '7px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b', fontSize: '13px' }}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setActivePostDept(dept._id)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '2px dashed #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                          + Ajouter un poste
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentsList;