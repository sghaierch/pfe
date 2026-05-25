const express = require('express');
const router  = express.Router();
const { protectorMW } = require('../controllers/authController');
const { generateWorkflow, analyzeWorkflow, chatAssistant } = require('../controllers/aiController');

router.use(protectorMW);
router.post('/generate-workflow', generateWorkflow);
router.post('/analyze-workflow',  analyzeWorkflow);
router.post('/chat-assistant',    chatAssistant);

module.exports = router;