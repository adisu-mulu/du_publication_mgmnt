const pool = require('../../config/db');
const { listPublications } = require('../shared/publicationService');

async function listUniversityPublications(query) {
    return listPublications({
        ...query,
        visibleOnlyApproved: true
    });
}

async function getUniversityOverview() {
    const [totals] = await pool.execute(`
        SELECT 
            COUNT(*) as total_approved,
            COUNT(DISTINCT submitted_by) as total_researchers,
            COUNT(DISTINCT college_id) as colleges_with_pubs
        FROM publications
        WHERE status = 'approved'
    `);

    const [byCollege] = await pool.execute(`
        SELECT c.id, c.name,
               COUNT(p.id) as approved_count,
               COUNT(DISTINCT p.submitted_by) as active_researchers
        FROM colleges c
        LEFT JOIN publications p ON p.college_id = c.id AND p.status = 'approved'
        GROUP BY c.id, c.name
        ORDER BY approved_count DESC
    `);

    const [byType] = await pool.execute(`
        SELECT type, COUNT(*) as count
        FROM publications
        WHERE status = 'approved'
        GROUP BY type
        ORDER BY count DESC
    `);

    const [byYear] = await pool.execute(`
        SELECT YEAR(date_published) as year, COUNT(*) as count
        FROM publications
        WHERE status = 'approved' AND date_published IS NOT NULL
        GROUP BY YEAR(date_published)
        ORDER BY year DESC
    `);

    return {
        summary: totals[0],
        byCollege,
        byType,
        byYear
    };
}

async function getExportData(filters = {}) {
    const result = await listPublications({
        ...filters,
        limit: 10000,
        visibleOnlyApproved: true
    });

    const rows = result.data;
    const headers = [
        'ID',
        'Author Name',
        'Gender',
        'Phone',
        'Email',
        'Title',
        'Theme',
        'Type',
        'Date Published',
        'Journal Name',
        'DOI',
        'Indexing',
        'Quartile',
        'Funder',
        'College',
        'Submitted By'
    ];

    const escapeCsv = (str) => {
        if (!str) return '""';
        return `"${String(str).replace(/"/g, '""')}"`;
    };

    const csvLines = [headers.join(',')];
    for (const r of rows) {
        csvLines.push([
            r.id,
            escapeCsv(r.author_name),
            escapeCsv(r.gender),
            escapeCsv(r.author_phone),
            escapeCsv(r.author_email),
            escapeCsv(r.title),
            escapeCsv(r.theme),
            escapeCsv(r.type),
            r.date_published ? new Date(r.date_published).toISOString().split('T')[0] : '',
            escapeCsv(r.journal_name),
            escapeCsv(r.doi),
            escapeCsv(r.indexing),
            escapeCsv(r.quartile),
            escapeCsv(r.funder),
            escapeCsv(r.college_name),
            escapeCsv(r.submitter_name)
        ].join(','));
    }

    return csvLines.join('\n');
}

module.exports = {
    listUniversityPublications,
    getUniversityOverview,
    getExportData
};
