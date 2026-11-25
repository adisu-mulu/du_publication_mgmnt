const express = require('express');
const router = express.Router();
const researcherController = require('./researcherController');
const { authenticate, requireRole } = require('../../middleware/auth');

// Endpoints allow 'researcher' or 'publication_officer' (who also submits publications)
router.use(authenticate, requireRole('researcher', 'publication_officer'));

router.post('/publications', researcherController.create);
router.get('/publications', researcherController.listMyPublications);
router.get('/publications/:id', researcherController.getById);
router.put('/publications/:id', researcherController.update);
router.delete('/publications/:id', researcherController.remove);

module.exports = router;
