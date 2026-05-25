import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userService from '../../../services/userService';
import departmentService from '../../../services/departmentService';

const CompanyUserEdit = () => {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const [departments, setDepartments] = useState([]);
  const [posts,       setPosts]       = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true); // ✅ true au départ
  const [msg,         setMsg]         = useState('');
  const [form,        setForm]        = useState({
    firstName: '', lastName: '', email: '',
    roleId: '', department: '', jobTitle: '',
    phoneNumber: '', isActive: true,
  });

  // ✅ FIX — useEffect qui charge l'utilisateur + rôles + départements
  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, rolesRes, deptsRes] = await Promise.all([
          userService.getById(id),
          userService.getRoles(),
          departmentService.getDepartments(),
        ]);

        const u    = userRes.data?.user || userRes.user;
        const deps = deptsRes.data?.data?.departments || [];

        setRoles(rolesRes.data?.roles || []);
        setDepartments(deps);

        if (u) {
          // Trouver le département actuel pour charger ses postes
          const deptId = typeof u.department === 'object' ? u.department?._id : u.department;
          if (deptId) {
            try {
              const postsRes = await departmentService.getPostsByDepartment(deptId);
              setPosts(postsRes.data?.data?.posts || []);
            } catch (err) {
              console.error(err);
            }
          }

          setForm({
            firstName:   u.firstName   || '',
            lastName:    u.lastName    || '',
            email:       u.email       || '',
            roleId:      u.role?._id   || u.role || '',
            department:  deptId        || '',
            jobTitle:    u.jobTitle    || '',
            phoneNumber: u.phoneNumber || '',
            isActive:    u.isActive !== false,
          });
        }
      } catch (err) {
        setMsg('Erreur chargement : ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false); // ✅ toujours appelé
      }
    };
    load();
  }, [id]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

const handleDeptChange = async (deptId) => {
  set('department', deptId);
  set('jobTitle', '');

  try {
    const res = await departmentService.getPostsByDepartment(deptId);
    setPosts(res.data?.data?.posts || []);
  } catch (err) {
    console.error(err);
    setPosts([]);
  }
};

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.roleId) {
      setMsg('Tous les champs * sont obligatoires'); return;
    }
    setSaving(true);
    try {
      await userService.update(id, {
        firstName:   form.firstName,
        lastName:    form.lastName,
        email:       form.email,
        roleId:      form.roleId,
        department:  form.department || undefined,
        jobTitle:    form.jobTitle   || undefined,
        phoneNumber: form.phoneNumber|| undefined,
        isActive:    form.isActive,
      });
      navigate('/dashboard/company/users', {
        state: { success: 'Utilisateur modifié avec succès !' }
      });
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '6px' };

  // ✅ Afficher le chargement correctement
  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
      Chargement...
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
          Retour
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
          Modifier utilisateur
        </h1>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>
          {msg}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Prénom *</label>
            <input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Nom *</label>
            <input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Email *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inp} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Rôle *</label>
          <select value={form.roleId} onChange={e => set('roleId', e.target.value)} style={inp}>
            <option value="">-- Choisir un rôle --</option>
            {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Département</label>
            <select value={form.department} onChange={e => handleDeptChange(e.target.value)} style={inp}>
              <option value="">-- Choisir --</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Poste</label>
            <select value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} style={inp} disabled={!form.department}>
              <option value="">-- Choisir un poste --</option>
              {posts.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
            </select>
            {!form.department && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Choisissez d'abord un département</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Téléphone</label>
          <input value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} style={inp} />
        </div>

        <div style={{ marginBottom: '24px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
              Compte actif
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              (décocher pour désactiver l'accès)
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  );
};

export default CompanyUserEdit;