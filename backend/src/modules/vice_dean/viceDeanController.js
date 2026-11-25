const viceDeanService = require('./viceDeanService');

async function getPublications(req, res, next) {
    try {
        // Enforce server-side collegeId scoping from authenticated token
        const collegeId = req.user.collegeId;
        const result = await viceDeanService.listCollegePublications(collegeId, req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getStats(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const result = await viceDeanService.getCollegeStats(collegeId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function listResearchers(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const result = await viceDeanService.listResearchers(collegeId, req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function createResearcher(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const result = await viceDeanService.createResearcherAccount(collegeId, req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

async function updateResearcher(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const userId = req.params.id;
        const result = await viceDeanService.updateResearcherAccount(collegeId, userId, req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function toggleActive(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const userId = req.params.id;
        const { is_active } = req.body;
        const result = await viceDeanService.setAccountStatus(collegeId, userId, is_active);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const userId = req.params.id;
        const { password } = req.body;
        const result = await viceDeanService.resetPassword(collegeId, userId, password);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function deleteResearcher(req, res, next) {
    try {
        const collegeId = req.user.collegeId;
        const userId = req.params.id;
        const result = await viceDeanService.deleteResearcherAccount(collegeId, userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getPublications,
    getStats,
    listResearchers,
    createResearcher,
    updateResearcher,
    deleteResearcher,
    toggleActive,
    resetPassword
};
