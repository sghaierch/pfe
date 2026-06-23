const express = require('express');
const router  = express.Router();
const { protectorMW, permitMW } = require('../controllers/authController');
const {
  getTemplates, getTemplate,
  createTemplate, updateTemplate, deleteTemplate,
  useTemplate,
} = require('../controllers/templateController');

router.use(protectorMW);

// Lecture : tous les utilisateurs connectés
router.get('/',    getTemplates);
router.get('/:id', getTemplate);

// ✅ FIX : route manquante — appelée par templateService.useTemplate()
router.post('/:id/use', useTemplate);

// Écriture : company_admin uniquement
router.post('/',     permitMW('company_admin'), createTemplate);
router.patch('/:id', permitMW('company_admin'), updateTemplate);
router.delete('/:id',permitMW('company_admin'), deleteTemplate);

module.exports = router;