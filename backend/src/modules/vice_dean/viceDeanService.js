const pool = require('../../config/db');
const { hashPassword } = require('../../utils/password');
const { listPublications } = require('../shared/publicationService');

async function listCollegePublications(collegeId, query) {
    return listPublications({
        ...query,
        collegeId,
        visibleOnlyApproved: true
    });
}

async function getCollegeStats(collegeId) {
    const [counts] = await pool.execute(`
        SELECT 
            COUNT(*) as total_approved,
            COUNT(DISTINCT submitted_by) as active_researchers
        FROM publications
        WHERE college_id = ? AND status = 'approved'
    `, [collegeId]);

    const [typeStats] = await pool.execute(`
        SELECT type, COUNT(*) as count
        FROM publications
        WHERE college_id = ? AND status = 'approved'
        GROUP BY type
    `, [collegeId]);

    const [yearStats] = await pool.execute(`
        SELECT YEAR(date_published) as year, COUNT(*) as count
        FROM publications
        WHERE college_id = ? AND status = 'approved' AND date_published IS NOT NULL
        GROUP BY YEAR(date_published)
        ORDER BY year DESC
    `, [collegeId]);

    return {
        overview: counts[0],
        byType: typeStats,
        byYear: yearStats
    };
}

async function listResearchers(collegeId, { search = '', page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['u.college_id = ?'];
    const params = [collegeId];

    if (search && search.trim()) {
        conditions.push('(u.full_name LIKE ? OR a.email LIKE ? OR u.department LIKE ?)');
        const s = `%${search.trim()}%`;
        params.push(s, s, s);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM users u
         JOIN accounts a ON u.account_id = a.id
         ${whereClause}`,
        params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
        `SELECT u.id as user_id, u.full_name, u.phone, u.department, u.created_at,
                a.id as account_id, a.email, a.is_active,
                (SELECT COUNT(*) FROM publications p WHERE p.submitted_by = u.id AND p.status = 'approved') as approved_publications_count
         FROM users u
         JOIN accounts a ON u.account_id = a.id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ${limitNum} OFFSET ${offset}`,
        params
    );

    return {
        data: rows.map(r => ({ ...r, is_active: Boolean(r.is_active) })),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
}

async function createResearcherAccount(collegeId, { full_name, email, password, phone, department }) {
    if (!full_name || !email || !password) {
        const err = new Error('Full name, email, and initial password are required.');
        err.status = 400;
        throw err;
    }

    const cleanEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute('SELECT id FROM accounts WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
        const err = new Error('An account with this email address already exists.');
        err.status = 400;
        throw err;
    }

    const passwordHash = hashPassword(password);

    const [accRes] = await pool.execute(
        'INSERT INTO accounts (email, password_hash, is_active) VALUES (?, ?, 1)',
        [cleanEmail, passwordHash]
    );
    const accountId = accRes.insertId;

    const [userRes] = await pool.execute(
        'INSERT INTO users (account_id, full_name, phone, college_id, department) VALUES (?, ?, ?, ?, ?)',
        [accountId, full_name.trim(), phone ? phone.trim() : null, collegeId, department ? department.trim() : null]
    );
    const userId = userRes.insertId;

    const [roleRow] = await pool.execute("SELECT id FROM roles WHERE name = 'researcher'");
    if (roleRow.length > 0) {
        await pool.execute(
            'INSERT INTO account_roles (account_id, role_id) VALUES (?, ?)',
            [accountId, roleRow[0].id]
        );
    }

    return {
        message: 'Researcher account created successfully.',
        accountId,
        userId
    };
}

async function updateResearcherAccount(collegeId, targetUserId, { full_name, email, phone, department, password }) {
    const [rows] = await pool.execute('SELECT id, account_id FROM users WHERE id = ? AND college_id = ?', [targetUserId, collegeId]);
    if (rows.length === 0) {
        const err = new Error('Researcher account not found in your college.');
        err.status = 404;
        throw err;
    }

    const accountId = rows[0].account_id;

    if (email && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        const [existing] = await pool.execute('SELECT id FROM accounts WHERE email = ? AND id != ?', [cleanEmail, accountId]);
        if (existing.length > 0) {
            const err = new Error('An account with this email address already exists.');
            err.status = 400;
            throw err;
        }
        await pool.execute('UPDATE accounts SET email = ? WHERE id = ?', [cleanEmail, accountId]);
    }

    if (password && password.trim()) {
        if (password.trim().length < 6) {
            const err = new Error('Password must be at least 6 characters.');
            err.status = 400;
            throw err;
        }
        const passwordHash = hashPassword(password.trim());
        await pool.execute('UPDATE accounts SET password_hash = ? WHERE id = ?', [passwordHash, accountId]);
    }

    await pool.execute(
        'UPDATE users SET full_name = ?, phone = ?, department = ? WHERE id = ? AND college_id = ?',
        [full_name ? full_name.trim() : '', phone ? phone.trim() : null, department ? department.trim() : null, targetUserId, collegeId]
    );

    return { message: 'Researcher details updated successfully.' };
}

async function deleteResearcherAccount(collegeId, targetUserId) {
    const [rows] = await pool.execute('SELECT id, account_id FROM users WHERE id = ? AND college_id = ?', [targetUserId, collegeId]);
    if (rows.length === 0) {
        const err = new Error('Researcher account not found in your college.');
        err.status = 404;
        throw err;
    }

    const accountId = rows[0].account_id;

    // Check if the researcher has submitted publications
    const [pubs] = await pool.execute('SELECT COUNT(*) as count FROM publications WHERE submitted_by = ?', [targetUserId]);
    if (pubs[0].count > 0) {
        const err = new Error(`Cannot delete researcher: they have ${pubs[0].count} submitted publication record(s). Deactivate their account instead.`);
        err.status = 400;
        throw err;
    }

    // Deleting the account cascades to account_roles and users due to FOREIGN KEY ON DELETE CASCADE
    await pool.execute('DELETE FROM accounts WHERE id = ?', [accountId]);

    return { message: 'Researcher account deleted successfully.' };
}

async function setAccountStatus(collegeId, targetUserId, isActive) {
    const [rows] = await pool.execute('SELECT account_id FROM users WHERE id = ? AND college_id = ?', [targetUserId, collegeId]);
    if (rows.length === 0) {
        const err = new Error('Researcher account not found in your college.');
        err.status = 404;
        throw err;
    }

    const accountId = rows[0].account_id;
    await pool.execute('UPDATE accounts SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, accountId]);

    return { message: `Account has been ${isActive ? 'activated' : 'deactivated'} successfully.` };
}

async function resetPassword(collegeId, targetUserId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
        const err = new Error('Password must be at least 6 characters.');
        err.status = 400;
        throw err;
    }

    const [rows] = await pool.execute('SELECT account_id FROM users WHERE id = ? AND college_id = ?', [targetUserId, collegeId]);
    if (rows.length === 0) {
        const err = new Error('Researcher account not found in your college.');
        err.status = 404;
        throw err;
    }

    const accountId = rows[0].account_id;
    const passwordHash = hashPassword(newPassword);
    await pool.execute('UPDATE accounts SET password_hash = ? WHERE id = ?', [passwordHash, accountId]);

    return { message: 'Password has been reset successfully.' };
}

module.exports = {
    listCollegePublications,
    getCollegeStats,
    listResearchers,
    createResearcherAccount,
    updateResearcherAccount,
    deleteResearcherAccount,
    setAccountStatus,
    resetPassword
};
