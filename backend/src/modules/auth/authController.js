const authService = require('./authService');

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function switchRole(req, res, next) {
    try {
        const { role } = req.body;
        const accountId = req.user.accountId;
        const result = await authService.switchRole(accountId, role);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getMe(req, res, next) {
    try {
        const accountId = req.user.accountId;
        const activeRole = req.user.activeRole;
        const result = await authService.getMe(accountId, activeRole);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function logout(req, res) {
    // Stateless JWT logout
    res.json({ message: 'Logged out successfully.' });
}

module.exports = {
    login,
    switchRole,
    getMe,
    logout
};
