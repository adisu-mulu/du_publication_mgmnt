const express = require('express');
const router = express.Router();
const officerController = require('./officerController');
const reportController = require('./reportController');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate);

// Officer review workflows (strictly publication_officer)
router.get('/publications', requireRole('publication_officer'), officerController.list);
router.get('/publications/:id', requireRole('publication_officer'), officerController.getDetails);
router.post('/publications/:id/review', requireRole('publication_officer'), officerController.review);
// Analytics (available to publication_officer, supervisor, and vice_dean)
router.get('/stats', requireRole('publication_officer', 'supervisor', 'vice_dean'), officerController.getStats);
router.get('/analytics', requireRole('publication_officer', 'supervisor', 'vice_dean'), officerController.getAnalytics);

// Reports (available to publication_officer, supervisor, and vice_dean)
router.get('/reports/definitions', requireRole('publication_officer', 'supervisor', 'vice_dean'), reportController.getDefinitions);
router.get('/reports/generate', requireRole('publication_officer', 'supervisor', 'vice_dean'), reportController.generateReport);
router.get('/reports/export', requireRole('publication_officer', 'supervisor', 'vice_dean'), reportController.exportReport);

module.exports = router;
