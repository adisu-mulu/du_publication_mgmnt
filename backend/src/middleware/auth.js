const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { accountId, userId, email, fullName, collegeId, roles, activeRole }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.activeRole) {
            return res.status(403).json({ message: 'Forbidden: No active role established.' });
        }

        if (!allowedRoles.includes(req.user.activeRole)) {
            return res.status(403).json({
                message: `Forbidden: Active role '${req.user.activeRole}' is not authorized for this resource.`
            });
        }

        next();
    };
}

function errorHandler(err, req, res, next) {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
}

module.exports = {
    authenticate,
    requireRole,
    errorHandler
};
