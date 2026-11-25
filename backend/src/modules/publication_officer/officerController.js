const officerService = require('./officerService');

async function list(req, res, next) {
    try {
        const result = await officerService.listPendingAndAll(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getDetails(req, res, next) {
    try {
        const pubId = req.params.id;
        const result = await officerService.getPublicationDetails(pubId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function review(req, res, next) {
    try {
        const reviewerUserId = req.user.userId;
        const pubId = req.params.id;
        const result = await officerService.reviewPublication(reviewerUserId, pubId, req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getStats(req, res, next) {
    try {
        const result = await officerService.getUniversityStats();
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getAnalytics(req, res, next) {
    try {
        const filters = { ...req.query };
        if (req.user && req.user.activeRole === 'vice_dean' && req.user.collegeId) {
            filters.collegeId = req.user.collegeId;
        }
        const result = await officerService.getPublicationAnalytics(filters);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    list,
    getDetails,
    review,
    getStats,
    getAnalytics
};
