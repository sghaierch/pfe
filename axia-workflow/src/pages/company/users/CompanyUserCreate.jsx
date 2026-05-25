import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../../../services/userService';
import departmentService from '../../../services/departmentService';

const CompanyUserCreate = () => {
  const navigate      = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [posts,       setPosts]       = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [form,        setForm]        = useState({
    firstName: '', lastName: '', email: '',
    password: '', roleId: '', department: '',
    jobTitle: '', phoneNumber: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [rolesRes, deptsRes] = await Promise.all([
          userService.getRoles(),
          departmentService.getDepartments(),
        ]);
        setRoles(rolesRes.data?.data?.roles || rolesRes.data?.roles || []);
        setDepartments(deptsRes.data?.data?.departments || []);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleDeptChange = async (deptId) => {
    set('department', deptId);
    set('jobTitle', '');
    if (!deptId) { setPosts([]); return; }
    try {
      const res = await departmentService.getPostsByDepartment(deptId);
      setPosts(res.data?.data?.posts || []);
    } catch (err) {
      console.error(err);
      setPosts([]);
    }
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.roleId) {
      setMsg('Tous les champs * sont obligatoires'); return;
    }
    if (form.password.length < 8) {
      setMsg('Mot de passe : minimum 8 caractères'); return;
    }
    setSaving(true);
    try {
      await userService.create(form);
      navigate('/dashboard/company/users', { state: { success: 'Utilisateur créé avec succès !' } });
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    } finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontWeight: 600, fontSize: '13px', color: '#374151', marginBottom: '6px' };

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}>
          ← Retour
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>Nouvel utilisateur</h1>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>
          {msg}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

        {/* Prénom + Nom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Prénom *</label>
            <input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} style={inp} placeholder="Ahmed" />
          </div>
          <div>
            <label style={lbl}>Nom *</label>
            <input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} style={inp} placeholder="Ben Ali" />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Email *</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={inp} placeholder="ahmed@société.com" />
        </div>

        {/* Mot de passe */}
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Mot de passe *</label>
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} style={inp} placeholder="Minimum 8 caractères" />
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Donnez ce mot de passe à l'employé pour qu'il se connecte
          </p>
        </div>

        {/* Rôle */}
        <div style={{ marginBottom: '16px' }}>
          <label style={lbl}>Rôle *</label>
          <select value={form.roleId} onChange={(e) => set('roleId', e.target.value)} style={inp}>
            <option value="">-- Choisir un rôle --</option>
            {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>

        {/* Département + Poste */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={lbl}>Département</label>
            <select value={form.department} onChange={(e) => handleDeptChange(e.target.value)} style={inp}>
              <option value="">-- Choisir --</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Poste</label>
            <select
              value={form.jobTitle}
              onChange={(e) => set('jobTitle', e.target.value)}
              style={{ ...inp, opacity: !form.department ? 0.6 : 1 }}
              disabled={!form.department}
            >
              <option value="">-- Choisir un poste --</option>
              {posts.map((p) => (
                <option key={p._id} value={p.name}>{p.name}</option>
              ))}
            </select>
            {!form.department && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Choisissez d'abord un département</p>
            )}
          </div>
        </div>

        {/* Téléphone */}
        <div style={{ marginBottom: '24px' }}>
          <label style={lbl}>Téléphone</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => set('phoneNumber', e.target.value)}
            style={inp}
            placeholder="+216 XX XXX XXX"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', padding: '14px', borderRadius: '10px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Création en cours...' : "Créer l'utilisateur"}
        </button>
      </div>
    </div>
  );
};

export default CompanyUserCreate;