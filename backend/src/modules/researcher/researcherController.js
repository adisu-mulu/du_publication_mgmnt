const researcherService = require('./researcherService');

async function create(req, res, next) {
    try {
        const userId = req.user.userId;
        const collegeId = req.user.collegeId;
        const result = await researcherService.createPublication(userId, collegeId, req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

async function listMyPublications(req, res, next) {
    try {
        const userId = req.user.userId;
        const result = await researcherService.getMyPublications(userId, req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const userId = req.user.userId;
        const pubId = req.params.id;
        const result = await researcherService.getMyPublicationById(userId, pubId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const userId = req.user.userId;
        const pubId = req.params.id;
        const result = await researcherService.updatePublication(userId, pubId, req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const userId = req.user.userId;
        const pubId = req.params.id;
        const result = await researcherService.deletePublication(userId, pubId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    create,
    listMyPublications,
    getById,
    update,
    remove
};
