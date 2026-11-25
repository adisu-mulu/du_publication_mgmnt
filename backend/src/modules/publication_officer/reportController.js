const reportService = require('./reportService');

/** GET /api/publication-officer/reports/definitions */
async function getDefinitions(req, res, next) {
    try {
        res.json(reportService.REPORT_DEFINITIONS);
    } catch (err) {
        next(err);
    }
}

/** GET /api/publication-officer/reports/generate */
async function generateReport(req, res, next) {
    try {
        const { type, page, limit, ...filters } = req.query;
        if (!type) {
            return res.status(400).json({ error: 'Report type is required' });
        }
        if (req.user && req.user.activeRole === 'vice_dean' && req.user.collegeId) {
            filters.collegeId = req.user.collegeId;
        }
        const result = await reportService.generateReport(type, filters, { page, limit });
        res.json(result);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        next(err);
    }
}

/** GET /api/publication-officer/reports/export */
async function exportReport(req, res, next) {
    try {
        const { type, format = 'csv', ...filters } = req.query;
        if (!type) {
            return res.status(400).json({ error: 'Report type is required' });
        }
        if (!['csv', 'excel'].includes(format)) {
            return res.status(400).json({ error: 'Format must be csv or excel' });
        }
        if (req.user && req.user.activeRole === 'vice_dean' && req.user.collegeId) {
            filters.collegeId = req.user.collegeId;
        }
        const result = await reportService.exportReport(type, format, filters);
        res.setHeader('Content-Type', result.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.send(result.body);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        next(err);
    }
}

module.exports = { getDefinitions, generateReport, exportReport };
