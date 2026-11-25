const pool = require('../../config/db');
const { listPublications } = require('../shared/publicationService');

async function listPendingAndAll(query) {
    return listPublications({
        ...query,
        visibleOnlyApproved: false
    });
}

async function getPublicationDetails(pubId) {
    const [rows] = await pool.execute(
        `SELECT p.*, c.name as college_name, u.full_name as submitter_name, a.email as submitter_email,
                r.full_name as reviewer_name
         FROM publications p
         LEFT JOIN colleges c ON p.college_id = c.id
         LEFT JOIN users u ON p.submitted_by = u.id
         LEFT JOIN accounts a ON u.account_id = a.id
         LEFT JOIN users r ON p.reviewed_by = r.id
         WHERE p.id = ?`,
        [pubId]
    );

    if (rows.length === 0) {
        const err = new Error('Publication not found.');
        err.status = 404;
        throw err;
    }

    return rows[0];
}

async function reviewPublication(reviewerUserId, pubId, reviewData) {
    const pub = await getPublicationDetails(pubId);

    const { action, remark, reviewer_comment, modified_fields } = reviewData;
    const finalRemark = remark !== undefined ? remark : reviewer_comment;

    if (!['approve', 'approve_with_modification', 'reject'].includes(action)) {
        const err = new Error("Invalid review action. Allowed: 'approve', 'approve_with_modification', 'reject'.");
        err.status = 400;
        throw err;
    }

    if (action === 'reject' && (!finalRemark || !finalRemark.trim())) {
        const err = new Error('A remark is mandatory when rejecting a publication.');
        err.status = 400;
        throw err;
    }

    let finalStatus = action === 'reject' ? 'rejected' : 'approved';

    if (action === 'approve_with_modification' && modified_fields) {
        const {
            author_name,
            gender,
            author_phone,
            author_email,
            title,
            theme,
            type,
            date_published,
            journal_name,
            doi,
            indexing,
            quartile,
            funder
        } = modified_fields;

        await pool.execute(
            `UPDATE publications 
             SET author_name = ?, gender = ?, author_phone = ?, author_email = ?,
                 title = ?, theme = ?, type = ?, date_published = ?,
                 journal_name = ?, doi = ?, indexing = ?, quartile = ?, funder = ?,
                 status = ?, remark = ?, reviewed_by = ?
             WHERE id = ?`,
            [
                author_name !== undefined ? author_name.trim() : pub.author_name,
                gender !== undefined ? gender : pub.gender,
                author_phone !== undefined ? author_phone : pub.author_phone,
                author_email !== undefined ? author_email : pub.author_email,
                title !== undefined ? title.trim() : pub.title,
                theme !== undefined ? theme : pub.theme,
                type !== undefined ? type : pub.type,
                date_published !== undefined ? date_published : pub.date_published,
                journal_name !== undefined ? journal_name : pub.journal_name,
                doi !== undefined ? doi : pub.doi,
                indexing !== undefined ? indexing : pub.indexing,
                quartile !== undefined ? quartile : pub.quartile,
                funder !== undefined ? funder : pub.funder,
                finalStatus,
                finalRemark ? finalRemark.trim() : pub.remark,
                reviewerUserId,
                pubId
            ]
        );
    } else {
        await pool.execute(
            `UPDATE publications 
             SET status = ?, remark = ?, reviewed_by = ?
             WHERE id = ?`,
            [
                finalStatus,
                finalRemark ? finalRemark.trim() : null,
                reviewerUserId,
                pubId
            ]
        );
    }

    return {
        message: action === 'reject'
            ? 'Publication rejected with remarks.'
            : (action === 'approve_with_modification' ? 'Publication updated and approved.' : 'Publication verified and approved successfully.'),
        status: finalStatus
    };
}

async function getUniversityStats() {
    const [counts] = await pool.execute(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
            SUM(CASE WHEN funder = 'Dilla University' THEN 1 ELSE 0 END) as du_funded_count,
            SUM(CASE WHEN funder = 'Other' THEN 1 ELSE 0 END) as other_funded_count,
            SUM(CASE WHEN quartile IN ('Q1', 'Q2') THEN 1 ELSE 0 END) as high_impact_count,
            SUM(CASE WHEN indexing IS NOT NULL AND indexing != '' THEN 1 ELSE 0 END) as indexed_count
        FROM publications
    `);

    const [byCollege] = await pool.execute(`
        SELECT c.id, c.name, 
               COUNT(p.id) as total,
               SUM(CASE WHEN p.status = 'approved' THEN 1 ELSE 0 END) as approved,
               SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) as pending,
               SUM(CASE WHEN p.status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM colleges c
        LEFT JOIN publications p ON p.college_id = c.id
        GROUP BY c.id, c.name
        ORDER BY pending DESC, approved DESC
    `);

    const [recentPending] = await pool.execute(`
        SELECT p.id, p.title, p.author_name, p.type, p.date_published, p.created_at,
               c.name as college_name
        FROM publications p
        JOIN colleges c ON p.college_id = c.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC
        LIMIT 5
    `);

    return {
        counts: counts[0],
        byCollege,
        recentPending
    };
}

async function getPublicationAnalytics(filters = {}) {
    const {
        year,
        collegeId,
        type,
        indexing,
        quartile,
        theme
    } = filters;

    const conditions = ["p.status = 'approved'"];
    const params = [];

    if (year) {
        conditions.push('YEAR(p.date_published) = ?');
        params.push(parseInt(year, 10));
    }
    if (collegeId) {
        conditions.push('p.college_id = ?');
        params.push(parseInt(collegeId, 10));
    }
    if (type) {
        conditions.push('p.type = ?');
        params.push(type);
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

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Selected year or current year for growth calculation
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const prevYear = targetYear - 1;

    // 1. KPI Aggregates
    const [kpiRows] = await pool.execute(`
        SELECT 
            COUNT(DISTINCT p.id) as total_publications,
            COUNT(DISTINCT CASE WHEN YEAR(p.date_published) = ? THEN p.id END) as publications_this_year,
            COUNT(DISTINCT CASE WHEN YEAR(p.date_published) = ? THEN p.id END) as publications_prev_year,
            COUNT(DISTINCT CASE WHEN p.indexing IS NOT NULL AND TRIM(p.indexing) != '' AND LOWER(p.indexing) != 'unindexed' THEN p.id END) as indexed_publications,
            COUNT(DISTINCT CASE WHEN p.quartile = 'Q1' THEN p.id END) as q1_publications,
            COUNT(DISTINCT CASE WHEN p.quartile IN ('Q1', 'Q2') THEN p.id END) as q1_q2_publications,
            COUNT(DISTINCT p.submitted_by) as unique_researchers,
            COUNT(DISTINCT p.college_id) as colleges_represented,
            COUNT(DISTINCT CASE WHEN p.doi IS NOT NULL AND TRIM(p.doi) != '' THEN p.id END) as with_doi_count
        FROM publications p
        ${whereClause}
    `, [targetYear, prevYear, ...params]);

    const kpis = kpiRows[0];
    const prevCount = kpis.publications_prev_year || 0;
    const thisCount = kpis.publications_this_year || 0;
    const yearOverYearGrowth = prevCount > 0 
        ? (((thisCount - prevCount) / prevCount) * 100).toFixed(1)
        : null;

    // 2. Publication Output Trends (Annual & Monthly)
    const [annualOutput] = await pool.execute(`
        SELECT 
            YEAR(p.date_published) as year,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY YEAR(p.date_published)
        HAVING year IS NOT NULL
        ORDER BY year ASC
    `, params);

    const [monthlyOutput] = await pool.execute(`
        SELECT 
            DATE_FORMAT(p.date_published, '%Y-%m') as month,
            DATE_FORMAT(p.date_published, '%b %Y') as month_label,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY month, month_label
        HAVING month IS NOT NULL
        ORDER BY month ASC
        LIMIT 24
    `, params);

    const [byType] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.type), ''), 'Other') as type,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY type
        ORDER BY count DESC
    `, params);

    // 3. College Research Performance
    const [collegePerformance] = await pool.execute(`
        SELECT 
            c.id as college_id,
            c.name as college_name,
            COUNT(DISTINCT p.id) as total_publications,
            COUNT(DISTINCT CASE WHEN YEAR(p.date_published) = ? THEN p.id END) as current_year_pubs,
            COUNT(DISTINCT CASE WHEN YEAR(p.date_published) = ? THEN p.id END) as prev_year_pubs,
            COUNT(DISTINCT CASE WHEN p.indexing IS NOT NULL AND TRIM(p.indexing) != '' AND LOWER(p.indexing) != 'unindexed' THEN p.id END) as indexed_publications,
            COUNT(DISTINCT CASE WHEN p.quartile = 'Q1' THEN p.id END) as q1_publications,
            COUNT(DISTINCT CASE WHEN p.quartile IN ('Q1', 'Q2') THEN p.id END) as q1_q2_publications
        FROM colleges c
        LEFT JOIN publications p ON p.college_id = c.id ${conditions.length > 0 ? `AND (${conditions.join(' AND ')})` : ''}
        GROUP BY c.id, c.name
        ORDER BY total_publications DESC
    `, [targetYear, prevYear, ...params]);

    const collegeStats = collegePerformance.map(col => {
        const prev = col.prev_year_pubs || 0;
        const curr = col.current_year_pubs || 0;
        const growth = prev > 0 ? (((curr - prev) / prev) * 100).toFixed(1) : (curr > 0 ? '100' : '0');
        return {
            ...col,
            growth_percentage: growth
        };
    });

    // 4. Scholarly Visibility & Journal Quality
    const [byIndexing] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.indexing), ''), 'Unindexed') as indexing_name,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY indexing_name
        ORDER BY count DESC
    `, params);

    const [quartileDist] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.quartile), ''), 'Unranked') as quartile,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY quartile
        ORDER BY 
            CASE 
                WHEN quartile = 'Q1' THEN 1
                WHEN quartile = 'Q2' THEN 2
                WHEN quartile = 'Q3' THEN 3
                WHEN quartile = 'Q4' THEN 4
                ELSE 5
            END
    `, params);

    const [topJournals] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.journal_name), ''), 'Unknown Journal') as journal_name,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY journal_name
        ORDER BY count DESC
        LIMIT 10
    `, params);

    const [q1Q2ByCollege] = await pool.execute(`
        SELECT 
            c.name as college_name,
            COUNT(DISTINCT CASE WHEN p.quartile = 'Q1' THEN p.id END) as q1_count,
            COUNT(DISTINCT CASE WHEN p.quartile = 'Q2' THEN p.id END) as q2_count
        FROM colleges c
        JOIN publications p ON p.college_id = c.id
        ${whereClause ? whereClause + " AND p.quartile IN ('Q1', 'Q2')" : "WHERE p.quartile IN ('Q1', 'Q2')"}
        GROUP BY c.name
        ORDER BY (q1_count + q2_count) DESC
        LIMIT 8
    `, params);

    // 5. Research Themes
    const [themeStats] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.theme), ''), 'Unspecified Theme') as theme,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY theme
        ORDER BY count DESC
        LIMIT 10
    `, params);

    const [themeByCollege] = await pool.execute(`
        SELECT 
            c.name as college_name,
            COALESCE(NULLIF(TRIM(p.theme), ''), 'Unspecified') as theme,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        JOIN colleges c ON p.college_id = c.id
        ${whereClause}
        GROUP BY c.name, theme
        ORDER BY count DESC
        LIMIT 15
    `, params);

    // 6. Researcher Analytics (Privacy-Preserved: aggregate gender, no phone/email exposure)
    const [researcherOverview] = await pool.execute(`
        SELECT 
            COUNT(DISTINCT p.submitted_by) as total_researchers,
            COUNT(DISTINCT p.id) as total_pubs
        FROM publications p
        ${whereClause}
    `, params);

    const totalR = researcherOverview[0].total_researchers || 0;
    const totalP = researcherOverview[0].total_pubs || 0;
    const avgPubsPerResearcher = totalR > 0 ? (totalP / totalR).toFixed(2) : '0';

    const [topResearchers] = await pool.execute(`
        SELECT 
            p.author_name,
            c.name as college_name,
            COUNT(DISTINCT p.id) as publication_count
        FROM publications p
        LEFT JOIN colleges c ON p.college_id = c.id
        ${whereClause}
        GROUP BY p.author_name, c.name
        ORDER BY publication_count DESC
        LIMIT 10
    `, params);

    const [genderDistribution] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.gender), ''), 'Not Disclosed') as gender,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY gender
        ORDER BY count DESC
    `, params);

    // 7. Funding Analytics
    const [fundingDistribution] = await pool.execute(`
        SELECT 
            CASE 
                WHEN p.funder IS NULL OR TRIM(p.funder) = '' THEN 'Not Specified'
                ELSE TRIM(p.funder)
            END as funder_name,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause}
        GROUP BY funder_name
        ORDER BY count DESC
    `, params);

    const [fundingByCollege] = await pool.execute(`
        SELECT 
            c.name as college_name,
            COUNT(DISTINCT CASE WHEN p.funder = 'Dilla University' THEN p.id END) as du_funded,
            COUNT(DISTINCT CASE WHEN p.funder = 'Other' THEN p.id END) as external_funded,
            COUNT(DISTINCT CASE WHEN p.funder IS NULL OR TRIM(p.funder) = '' THEN p.id END) as not_specified
        FROM colleges c
        JOIN publications p ON p.college_id = c.id
        ${whereClause}
        GROUP BY c.name
        ORDER BY (du_funded + external_funded) DESC
        LIMIT 8
    `, params);

    const [fundingByTheme] = await pool.execute(`
        SELECT 
            COALESCE(NULLIF(TRIM(p.theme), ''), 'Unspecified Theme') as theme,
            COUNT(DISTINCT CASE WHEN p.funder IS NOT NULL AND TRIM(p.funder) != '' THEN p.id END) as funded_count,
            COUNT(DISTINCT CASE WHEN p.funder IS NULL OR TRIM(p.funder) = '' THEN p.id END) as unspecified_count
        FROM publications p
        ${whereClause}
        GROUP BY theme
        ORDER BY funded_count DESC
        LIMIT 8
    `, params);

    const [themeTrends] = await pool.execute(`
        SELECT 
            YEAR(p.date_published) as year,
            COALESCE(NULLIF(TRIM(p.theme), ''), 'Unspecified Theme') as theme,
            COUNT(DISTINCT p.id) as count
        FROM publications p
        ${whereClause ? whereClause + ' AND p.date_published IS NOT NULL' : 'WHERE p.date_published IS NOT NULL'}
        GROUP BY year, theme
        ORDER BY year ASC, count DESC
        LIMIT 30
    `, params);

    const [researchersByCollege] = await pool.execute(`
        SELECT 
            c.name as college_name,
            COUNT(DISTINCT p.submitted_by) as researcher_count,
            COUNT(DISTINCT p.id) as publication_count
        FROM colleges c
        JOIN publications p ON p.college_id = c.id
        ${whereClause}
        GROUP BY c.name
        ORDER BY researcher_count DESC
    `, params);

    // 8. Repository Data Quality & Completeness
    const [dataQuality] = await pool.execute(`
        SELECT 
            COUNT(DISTINCT p.id) as total_records,
            COUNT(DISTINCT CASE WHEN p.doi IS NULL OR TRIM(p.doi) = '' THEN p.id END) as missing_doi,
            COUNT(DISTINCT CASE WHEN p.journal_name IS NULL OR TRIM(p.journal_name) = '' THEN p.id END) as missing_journal,
            COUNT(DISTINCT CASE WHEN p.date_published IS NULL THEN p.id END) as missing_date,
            COUNT(DISTINCT CASE WHEN p.indexing IS NULL OR TRIM(p.indexing) = '' OR LOWER(p.indexing) = 'unindexed' THEN p.id END) as missing_indexing,
            COUNT(DISTINCT CASE WHEN p.quartile IS NULL OR TRIM(p.quartile) = '' THEN p.id END) as missing_quartile,
            COUNT(DISTINCT CASE WHEN p.author_name IS NULL OR TRIM(p.author_name) = '' THEN p.id END) as incomplete_author
        FROM publications p
        ${whereClause}
    `, params);

    const [dupRows] = await pool.execute(`
        SELECT COUNT(DISTINCT p.id) as potential_duplicates
        FROM publications p
        ${whereClause ? whereClause + ' AND' : 'WHERE'} (
            LOWER(TRIM(p.title)) IN (
                SELECT t.norm_title FROM (
                    SELECT LOWER(TRIM(title)) as norm_title FROM publications WHERE status = 'approved' GROUP BY 1 HAVING COUNT(*) > 1
                ) t
            )
            OR (
                p.doi IS NOT NULL AND TRIM(p.doi) != '' AND LOWER(TRIM(p.doi)) IN (
                    SELECT d.norm_doi FROM (
                        SELECT LOWER(TRIM(doi)) as norm_doi FROM publications WHERE status = 'approved' AND doi IS NOT NULL AND TRIM(doi) != '' GROUP BY 1 HAVING COUNT(*) > 1
                    ) d
                )
            )
        )
    `, params);

    const dq = dataQuality[0];
    const totalRec = dq.total_records || 1;
    const completeness = {
        doi_pct: (((totalRec - dq.missing_doi) / totalRec) * 100).toFixed(1),
        journal_pct: (((totalRec - dq.missing_journal) / totalRec) * 100).toFixed(1),
        date_pct: (((totalRec - dq.missing_date) / totalRec) * 100).toFixed(1),
        indexing_pct: (((totalRec - dq.missing_indexing) / totalRec) * 100).toFixed(1),
        quartile_pct: (((totalRec - dq.missing_quartile) / totalRec) * 100).toFixed(1),
        author_pct: (((totalRec - dq.incomplete_author) / totalRec) * 100).toFixed(1),
        missing_doi: dq.missing_doi,
        missing_journal: dq.missing_journal,
        missing_date: dq.missing_date,
        missing_indexing: dq.missing_indexing,
        missing_quartile: dq.missing_quartile,
        incomplete_author: dq.incomplete_author,
        potential_duplicates: dupRows[0]?.potential_duplicates || 0,
        total_records: dq.total_records
    };

    // Available filter option values for UI dropdowns (only from approved publications)
    const [availableYears] = await pool.execute(`
        SELECT DISTINCT YEAR(date_published) as year 
        FROM publications 
        WHERE status = 'approved' AND date_published IS NOT NULL 
        ORDER BY year DESC
    `);
    const [availableTypes] = await pool.execute(`
        SELECT DISTINCT type FROM publications WHERE status = 'approved' AND type IS NOT NULL AND TRIM(type) != '' ORDER BY type ASC
    `);
    const [availableIndexings] = await pool.execute(`
        SELECT DISTINCT indexing FROM publications WHERE status = 'approved' AND indexing IS NOT NULL AND TRIM(indexing) != '' ORDER BY indexing ASC
    `);
    const [availableThemes] = await pool.execute(`
        SELECT DISTINCT theme FROM publications WHERE status = 'approved' AND theme IS NOT NULL AND TRIM(theme) != '' ORDER BY theme ASC
    `);
    const [collegesList] = await pool.execute(`
        SELECT id, name FROM colleges ORDER BY name ASC
    `);
    const [researchersList] = await pool.execute(`
        SELECT DISTINCT u.id, u.full_name, c.name as college_name
        FROM users u
        JOIN publications p ON p.submitted_by = u.id AND p.status = 'approved'
        LEFT JOIN colleges c ON u.college_id = c.id
        ORDER BY u.full_name ASC
    `);
    const [fundersList] = await pool.execute(`
        SELECT DISTINCT funder FROM publications WHERE status = 'approved' AND funder IS NOT NULL AND TRIM(funder) != '' ORDER BY funder ASC
    `);

    const totalPubCount = kpis.total_publications || 0;
    const indexedCount = kpis.indexed_publications || 0;
    const unindexedCount = Math.max(0, totalPubCount - indexedCount);

    const fundedCount = fundingDistribution
        .filter(f => f.funder_name !== 'Not Specified')
        .reduce((sum, f) => sum + Number(f.count || 0), 0);
    const notSpecifiedFundingCount = fundingDistribution
        .filter(f => f.funder_name === 'Not Specified')
        .reduce((sum, f) => sum + Number(f.count || 0), 0);

    return {
        targetYear,
        kpis: {
            ...kpis,
            growth_pct: yearOverYearGrowth,
            doi_pct: completeness.doi_pct
        },
        trends: {
            annual: annualOutput,
            monthly: monthlyOutput,
            byType
        },
        collegeStats,
        visibility: {
            byIndexing,
            indexedVsUnindexed: { indexed: indexedCount, unindexed: unindexedCount },
            quartileDist,
            topJournals,
            q1Q2ByCollege
        },
        themes: {
            topThemes: themeStats,
            themeByCollege,
            themeTrends
        },
        researchers: {
            totalResearchers: totalR,
            avgPubsPerResearcher,
            topResearchers,
            byCollege: researchersByCollege,
            genderDistribution
        },
        funding: {
            withVsWithout: { funded: fundedCount, notSpecified: notSpecifiedFundingCount },
            distribution: fundingDistribution,
            fundingByCollege,
            fundingByTheme
        },
        completeness,
        filterOptions: {
            years: availableYears.map(y => y.year),
            types: availableTypes.map(t => t.type),
            indexings: availableIndexings.map(i => i.indexing),
            themes: availableThemes.map(th => th.theme),
            colleges: collegesList,
            researchers: researchersList,
            funders: fundersList.map(f => f.funder)
        }
    };
}

module.exports = {
    listPendingAndAll,
    getPublicationDetails,
    reviewPublication,
    getUniversityStats,
    getPublicationAnalytics
};
