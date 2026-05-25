const express = require('express');
const router  = express.Router();
const { protectorMW } = require('../controllers/authController');
const {
  getUsers, getRoles,
  createUser, updateUser, deleteUser, getUser,
  getPosts, createPost, updatePost, deletePost,
  forgetPassword,
  getMe, updateMe, changePassword,
} = require('../controllers/tenantUserController');

// ✅ Route publique — AVANT protectorMW
router.post('/forgetPassword', forgetPassword);

// Routes protégées
router.use(protectorMW);

router.get('/me',              getMe);
router.patch('/me',            updateMe);
router.patch('/change-password', changePassword);

router.get('/roles', getRoles);
router.get('/',      getUsers);
router.get('/:id',   getUser);
router.post('/',     createUser);
router.patch('/:id', updateUser);
router.delete('/:id',deleteUser);

// Postes
router.get('/posts/list',    getPosts);
router.post('/posts',        createPost);
router.patch('/posts/:id',   updatePost);
router.delete('/posts/:id',  deletePost);

module.exports = router;