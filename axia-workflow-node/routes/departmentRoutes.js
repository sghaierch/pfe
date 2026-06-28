const express    = require('express');
const router     = express.Router();
const { protectorMW } = require('../controllers/authController'); // ✅ ton middleware
const {
  getDepartments, createDepartment,
  updateDepartment, archiveDepartment,
  getPostsByDepartment, createPost,
  updatePost, archivePost,
} = require('../controllers/departmentController');

router.use(protectorMW); // ✅ correct

// Départements
router.get('/',         getDepartments);
router.post('/',        createDepartment);
router.patch('/:id',    updateDepartment);
router.patch('/:id/archive', archiveDepartment);

// Postes par département
router.get('/:deptId/posts',    getPostsByDepartment);
router.post('/:deptId/posts',   createPost);
router.patch('/posts/:id',      updatePost);
router.patch('/posts/:id/archive', archivePost);

module.exports = router;