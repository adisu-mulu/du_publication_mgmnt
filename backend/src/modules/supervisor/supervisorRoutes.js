const express = require('express');
const router = express.Router();
const supervisorController = require('./supervisorController');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate, requireRole('supervisor', 'publication_officer', 'vice_dean', 'researcher'));

router.get('/publications', supervisorController.list);
router.get('/overview', supervisorController.getOverview);
router.get('/export', supervisorController.exportCsv);

module.exports = router;
