import api from './api';

const departmentService = {
  getDepartments:       ()             => api.get('/departments'),
  createDepartment:     (data)         => api.post('/departments', data),
  updateDepartment:     (id, data)     => api.patch('/departments/' + id, data),
  deleteDepartment:     (id)           => api.delete('/departments/' + id),

  getPostsByDepartment: (deptId)       => api.get('/departments/' + deptId + '/posts'),
  createPost:           (deptId, data) => api.post('/departments/' + deptId + '/posts', data),
  updatePost:           (id, data)     => api.patch('/departments/posts/' + id, data),
  deletePost:           (id)           => api.delete('/departments/posts/' + id),
  archiveDepartment: async (id) => api.patch(`/departments/${id}/archive`).then(r => r.data),
  archivePost:       async (id) => api.patch(`/departments/posts/${id}/archive`).then(r => r.data),
// ✅ CORRIGÉ — depuis /departments pas /tenant-users/posts
getAllPosts: async () => {
  const res = await api.get('/departments');
  const departments = res.data?.data?.departments || [];
  const posts = [];
  
  await Promise.all(departments.map(async (dept) => {
    const postsRes = await api.get('/departments/' + dept._id + '/posts');
    const deptPosts = postsRes.data?.data?.posts || [];
    deptPosts.forEach(p => posts.push({
      _id:            p._id,
      name:           p.name,
      description:    p.description || '',
      departmentName: dept.name,
      departmentId:   dept._id,
    }));
  }));
  
  return posts;
},

};

export default departmentService;