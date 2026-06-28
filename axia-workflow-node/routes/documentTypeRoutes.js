const express = require('express');
const router  = express.Router();
const { protectorMW } = require('../controllers/authController');
const {
  getDocumentTypes,
  getDocumentTypeById,
  createDocumentType,
  updateDocumentType,
  archiveDocumentType,
  generateNumber
} = require('../controllers/documentTypeController');

router.use(protectorMW);

router.get('/',     getDocumentTypes);
router.post('/',    createDocumentType);
router.get('/:id',  getDocumentTypeById);
router.patch('/:id', updateDocumentType);
router.patch('/:id/archive', archiveDocumentType);
router.post('/:id/generate-number', generateNumber);
module.exports = router;