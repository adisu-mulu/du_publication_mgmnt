const express = require('express');
const router = express.Router();
const viceDeanController = require('./viceDeanController');
const { authenticate, requireRole } = require('../../middleware/auth');

router.use(authenticate, requireRole('vice_dean'));

router.get('/publications', viceDeanController.getPublications);
router.get('/stats', viceDeanController.getStats);
router.get('/researchers', viceDeanController.listResearchers);
router.post('/researchers', viceDeanController.createResearcher);
router.put('/researchers/:id', viceDeanController.updateResearcher);
router.delete('/researchers/:id', viceDeanController.deleteResearcher);
router.patch('/researchers/:id/status', viceDeanController.toggleActive);
router.post('/researchers/:id/reset-password', viceDeanController.resetPassword);

module.exports = router;
