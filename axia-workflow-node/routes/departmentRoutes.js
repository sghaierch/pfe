const express    = require('express');
const router     = express.Router();
const { protectorMW } = require('../controllers/authController'); // ✅ ton middleware
const {
  getDepartments, createDepartment,
  updateDepartment, deleteDepartment,
  getPostsByDepartment, createPost,
  updatePost, deletePost,
} = require('../controllers/departmentController');

router.use(protectorMW); // ✅ correct

// Départements
router.get('/',         getDepartments);
router.post('/',        createDepartment);
router.patch('/:id',    updateDepartment);
router.delete('/:id',   deleteDepartment);

// Postes par département
router.get('/:deptId/posts',    getPostsByDepartment);
router.post('/:deptId/posts',   createPost);
router.patch('/posts/:id',      updatePost);
router.delete('/posts/:id',     deletePost);

module.exports = router;