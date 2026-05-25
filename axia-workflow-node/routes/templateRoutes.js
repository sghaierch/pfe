const express = require('express');
const router  = express.Router();
const { protectorMW ,permitMW} = require('../controllers/authController');
const {
  getTemplates, getTemplate,
  createTemplate, updateTemplate, deleteTemplate,
} = require('../controllers/templateController');

router.use(protectorMW);

router.get('/',   getTemplates);
router.get('/:id',   getTemplate);
router.post('/',     createTemplate);
router.patch('/:id', updateTemplate);
router.delete('/:id',deleteTemplate);

module.exports = router;