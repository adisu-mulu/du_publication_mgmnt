const supervisorService = require('./supervisorService');

async function list(req, res, next) {
    try {
        const query = { ...req.query };
        if (req.user && req.user.activeRole === 'vice_dean' && req.user.collegeId) {
            query.collegeId = req.user.collegeId;
        }
        const result = await supervisorService.listUniversityPublications(query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getOverview(req, res, next) {
    try {
        const result = await supervisorService.getUniversityOverview();
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function exportCsv(req, res, next) {
    try {
        const filters = { ...req.query };
        if (req.user && req.user.activeRole === 'vice_dean' && req.user.collegeId) {
            filters.collegeId = req.user.collegeId;
        }
        const csv = await supervisorService.getExportData(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="du_approved_publications.csv"');
        res.send(csv);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list,
    getOverview,
    exportCsv
};
