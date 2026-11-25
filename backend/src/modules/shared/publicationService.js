const pool = require('../../config/db');

let cachedRemarkCol = null;

async function getRemarkColName() {
    if (cachedRemarkCol) return cachedRemarkCol;
    try {
        const [cols] = await pool.execute('SHOW COLUMNS FROM publications');
        const colNames = cols.map(c => c.Field);
        if (colNames.includes('remark')) {
            cachedRemarkCol = 'p.remark as remark';
        } else if (colNames.includes('reviewer_comment')) {
            cachedRemarkCol = 'p.reviewer_comment as remark';
        } else {
            cachedRemarkCol = 'NULL as remark';
        }
    } catch (e) {
        cachedRemarkCol = 'p.remark as remark';
    }
    return cachedRemarkCol;
}

/**
 * Shared publication listing with pagination, search, and filtering.
 * Enforces role-based data isolation and returns all original university fields.
 */
async function listPublications({
    page = 1,
    limit = 10,
    search = '',
    collegeId = null,
    status = null,
    type = null,
    year = null,
    dateFrom = null,
    dateTo = null,
    indexing = null,
    quartile = null,
    theme = null,
    funder = null,
    gender = null,
    qualityIssue = null,
    submittedBy = null,
    sortBy = 'created_at',
    sortDir = 'DESC',
    visibleOnlyApproved = false
}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(5000, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];

    // Isolation: If visibleOnlyApproved is true, only show approved publications
    if (visibleOnlyApproved) {
        conditions.push("p.status = 'approved'");
    } else if (status) {
        conditions.push('p.status = ?');
        params.push(status);
    }

    if (submittedBy) {
        conditions.push('p.submitted_by = ?');
        params.push(submittedBy);
    }

    if (collegeId) {
        conditions.push('p.college_id = ?');
        params.push(collegeId);
    }

    if (type) {
        conditions.push('p.type = ?');
        params.push(type);
    }

    if (year) {
        conditions.push('YEAR(p.date_published) = ?');
        params.push(parseInt(year, 10));
    }

    if (dateFrom) {
        conditions.push('p.date_published >= ?');
        params.push(dateFrom);
    }

    if (dateTo) {
        conditions.push('p.date_published <= ?');
        params.push(dateTo);
    }

    if (indexing) {
        if (indexing === 'Unindexed') {
            conditions.push("(p.indexing IS NULL OR TRIM(p.indexing) = '' OR LOWER(p.indexing) = 'unindexed')");
        } else {
            conditions.push('p.indexing = ?');
            params.push(indexing);
        }
    }

    if (quartile) {
        if (quartile === 'Unranked') {
            conditions.push("(p.quartile IS NULL OR TRIM(p.quartile) = '')");
        } else {
            conditions.push('p.quartile = ?');
            params.push(quartile);
        }
    }

    if (theme) {
        if (theme === 'Unspecified Theme' || theme === 'Unspecified') {
            conditions.push("(p.theme IS NULL OR TRIM(p.theme) = '')");
        } else {
            conditions.push('p.theme = ?');
            params.push(theme);
        }
    }

    if (funder) {
        if (funder === 'Not Specified') {
            conditions.push("(p.funder IS NULL OR TRIM(p.funder) = '')");
        } else {
            conditions.push('p.funder = ?');
            params.push(funder);
        }
    }

    if (gender) {
        conditions.push('p.gender = ?');
        params.push(gender);
    }

    if (qualityIssue) {
        switch (qualityIssue) {
            case 'missing_doi':
                conditions.push("(p.doi IS NULL OR TRIM(p.doi) = '')");
                break;
            case 'missing_journal':
                conditions.push("(p.journal_name IS NULL OR TRIM(p.journal_name) = '')");
                break;
            case 'missing_date':
                conditions.push('p.date_published IS NULL');
                break;
            case 'missing_indexing':
                conditions.push("(p.indexing IS NULL OR TRIM(p.indexing) = '' OR LOWER(p.indexing) = 'unindexed')");
                break;
            case 'missing_quartile':
                conditions.push("(p.quartile IS NULL OR TRIM(p.quartile) = '')");
                break;
            case 'incomplete_author':
                conditions.push("(p.author_name IS NULL OR TRIM(p.author_name) = '')");
                break;
            case 'potential_duplicate':
                conditions.push(`(
                    LOWER(TRIM(p.title)) IN (
                        SELECT t.norm_title FROM (
                            SELECT LOWER(TRIM(title)) as norm_title FROM publications GROUP BY 1 HAVING COUNT(*) > 1
                        ) t
                    )
                    OR (
                        p.doi IS NOT NULL AND TRIM(p.doi) != '' AND LOWER(TRIM(p.doi)) IN (
                            SELECT d.norm_doi FROM (
                                SELECT LOWER(TRIM(doi)) as norm_doi FROM publications WHERE doi IS NOT NULL AND TRIM(doi) != '' GROUP BY 1 HAVING COUNT(*) > 1
                            ) d
                        )
                    )
                )`);
                break;
        }
    }

    if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push('(p.title LIKE ? OR p.journal_name LIKE ? OR p.author_name LIKE ? OR p.doi LIKE ?)');
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortCols = {
        created_at: 'p.created_at',
        date_published: 'p.date_published',
        title: 'p.title',
        author_name: 'p.author_name',
        journal_name: 'p.journal_name',
        quartile: 'p.quartile',
        college_name: 'c.name'
    };
    const safeSortCol = allowedSortCols[sortBy] || 'p.created_at';
    const safeSortDir = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countSql = `
        SELECT COUNT(DISTINCT p.id) as total 
        FROM publications p 
        LEFT JOIN colleges c ON p.college_id = c.id
        ${whereClause}
    `;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    const remarkExpr = await getRemarkColName();

    const dataSql = `
        SELECT 
            p.id, p.author_name, p.gender, p.author_phone, p.author_email,
            p.title, p.theme, p.type, p.date_published, p.journal_name,
            p.doi, p.indexing, p.quartile, p.funder, p.status, ${remarkExpr},
            p.submitted_by, p.college_id, p.reviewed_by, p.created_at, p.updated_at,
            c.name as college_name,
            u.full_name as submitter_name,
            r.full_name as reviewer_name
        FROM publications p
        LEFT JOIN colleges c ON p.college_id = c.id
        LEFT JOIN users u ON p.submitted_by = u.id
        LEFT JOIN users r ON p.reviewed_by = r.id
        ${whereClause}
        ORDER BY ${safeSortCol} ${safeSortDir}
        LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(dataSql, params);

    return {
        data: rows,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    };
}

module.exports = {
    listPublications
};
