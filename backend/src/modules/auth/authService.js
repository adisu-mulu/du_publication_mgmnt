const pool = require('../../config/db');
const jwt = require('jsonwebtoken');
const { verifyPassword } = require('../../utils/password');

function generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}

async function login(email, password) {
    if (!email || !password) {
        const err = new Error('Email and password are required.');
        err.status = 400;
        throw err;
    }

    // 1. Fetch account
    const [accRows] = await pool.execute(
        'SELECT id, email, password_hash, is_active FROM accounts WHERE email = ?',
        [email.trim().toLowerCase()]
    );

    if (accRows.length === 0) {
        const err = new Error('Invalid email or password.');
        err.status = 400;
        throw err;
    }

    const account = accRows[0];
    if (!account.is_active) {
        const err = new Error('Account has been deactivated. Please contact your college vice dean.');
        err.status = 403;
        throw err;
    }

    // 2. Verify password
    const isMatch = verifyPassword(password, account.password_hash);
    if (!isMatch) {
        const err = new Error('Invalid email or password.');
        err.status = 400;
        throw err;
    }

    // 3. Fetch user profile
    const [userRows] = await pool.execute(
        `SELECT u.id, u.full_name, u.phone, u.college_id, u.department, c.name as college_name 
         FROM users u
         JOIN colleges c ON u.college_id = c.id
         WHERE u.account_id = ?`,
        [account.id]
    );

    if (userRows.length === 0) {
        const err = new Error('User profile record not found.');
        err.status = 500;
        throw err;
    }
    const userProfile = userRows[0];

    // 4. Fetch roles
    const [roleRows] = await pool.execute(
        `SELECT r.name 
         FROM account_roles ar 
         JOIN roles r ON ar.role_id = r.id 
         WHERE ar.account_id = ?`,
        [account.id]
    );

    const roles = roleRows.map(r => r.name);
    // Ensure researcher is included as default
    if (!roles.includes('researcher')) {
        roles.unshift('researcher');
    }

    // Default active role on login is always 'researcher'
    const activeRole = 'researcher';

    const tokenPayload = {
        accountId: account.id,
        userId: userProfile.id,
        email: account.email,
        fullName: userProfile.full_name,
        collegeId: userProfile.college_id,
        collegeName: userProfile.college_name,
        roles,
        activeRole
    };

    const token = generateToken(tokenPayload);

    return {
        token,
        user: {
            id: userProfile.id,
            accountId: account.id,
            fullName: userProfile.full_name,
            email: account.email,
            phone: userProfile.phone,
            collegeId: userProfile.college_id,
            collegeName: userProfile.college_name,
            department: userProfile.department
        },
        roles,
        activeRole
    };
}

async function switchRole(accountId, requestedRole) {
    if (!requestedRole) {
        const err = new Error('Role is required.');
        err.status = 400;
        throw err;
    }

    // Verify requested role exists for this account in account_roles
    const [roleRows] = await pool.execute(
        `SELECT r.name 
         FROM account_roles ar 
         JOIN roles r ON ar.role_id = r.id 
         WHERE ar.account_id = ?`,
        [accountId]
    );

    const validRoles = roleRows.map(r => r.name);
    if (!validRoles.includes('researcher')) {
        validRoles.push('researcher');
    }

    if (!validRoles.includes(requestedRole)) {
        const err = new Error(`Account does not possess the '${requestedRole}' role.`);
        err.status = 403;
        throw err;
    }

    // Fetch user profile to recreate complete token payload
    const [userRows] = await pool.execute(
        `SELECT u.id, u.full_name, u.phone, u.college_id, u.department, c.name as college_name, a.email
         FROM users u
         JOIN accounts a ON u.account_id = a.id
         JOIN colleges c ON u.college_id = c.id
         WHERE a.id = ?`,
        [accountId]
    );

    if (userRows.length === 0) {
        const err = new Error('User record not found.');
        err.status = 500;
        throw err;
    }
    const userProfile = userRows[0];

    const tokenPayload = {
        accountId,
        userId: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name,
        collegeId: userProfile.college_id,
        collegeName: userProfile.college_name,
        roles: validRoles,
        activeRole: requestedRole
    };

    const token = generateToken(tokenPayload);

    return {
        token,
        roles: validRoles,
        activeRole: requestedRole
    };
}

async function getMe(accountId, activeRole) {
    const [userRows] = await pool.execute(
        `SELECT u.id, u.full_name, u.phone, u.college_id, u.department, c.name as college_name, a.email, a.is_active
         FROM users u
         JOIN accounts a ON u.account_id = a.id
         JOIN colleges c ON u.college_id = c.id
         WHERE a.id = ?`,
        [accountId]
    );

    if (userRows.length === 0) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
    }

    const [roleRows] = await pool.execute(
        `SELECT r.name 
         FROM account_roles ar 
         JOIN roles r ON ar.role_id = r.id 
         WHERE ar.account_id = ?`,
        [accountId]
    );

    const roles = roleRows.map(r => r.name);
    if (!roles.includes('researcher')) roles.unshift('researcher');

    const u = userRows[0];
    return {
        user: {
            id: u.id,
            accountId,
            fullName: u.full_name,
            email: u.email,
            phone: u.phone,
            collegeId: u.college_id,
            collegeName: u.college_name,
            department: u.department,
            isActive: Boolean(u.is_active)
        },
        roles,
        activeRole: roles.includes(activeRole) ? activeRole : 'researcher'
    };
}

module.exports = {
    login,
    switchRole,
    getMe
};
