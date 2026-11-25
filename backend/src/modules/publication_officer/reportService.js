const pool = require('../../config/db');
const { listPublications } = require('../shared/publicationService');
const { getPublicationAnalytics } = require('./officerService');

const REPORT_DEFINITIONS = {
    inventory: {
        title: 'Publication Inventory Report',
        category: 'Inventory & Records',
        description: 'Complete or filtered listing of repository publications with full bibliographic metadata.'
    },
    annual_output: {
        title: 'Annual Research Output Report',
        category: 'Executive & Management',
        description: 'Official annual publication performance report comparing output across years, colleges, and quartiles.'
    },
    college: {
        title: 'College Publication Report',
        category: 'Institutional Performance',
        description: 'Detailed publication output, indexing, top journals, and themes for a specific college or all colleges.'
    },
    journal_quality: {
        title: 'Journal Quality and Indexing Report',
        category: 'Scholarly Visibility',
        description: 'Analysis of indexing databases, Q1–Q4 quartile distributions, and top publishing journals.'
    },
    researcher: {
        title: 'Researcher Publication Report',
        category: 'Faculty & Researchers',
        description: 'Individual or grouped researcher publication output, yearly trends, and high-impact contributions.'
    },
    theme: {
        title: 'Research Theme Report',
        category: 'Thematic Focus',
        description: 'Publication counts, college alignment, and historical trends across university research themes.'
    },
    funding: {
        title: 'Research Funding Report',
        category: 'Funding & Grants',
        description: 'Analysis of funded versus unspecified research output across colleges and research themes.'
    },
    data_quality: {
        title: 'Repository Data Quality Report',
        category: 'Data Governance',
        description: 'Audit of missing DOIs, missing journal names, unranked quartiles, incomplete authors, and potential duplicates.'
    }
};

function sanitizeRecord(r) {
    // Privacy rule: exclude author_phone and author_email from reports
    return {
        id: r.id,
        title: r.title,
        author_name: r.author_name,
        college_id: r.college_id,
        college_name: r.college_name || 'Unassigned',
        type: r.type || '-',
        journal_name: r.journal_name || '',
        date_published: r.date_published ? new Date(r.date_published).toISOString().split('T')[0] : '',
        publication_year: r.date_published ? new Date(r.date_published).getFullYear() : null,
        doi: r.doi || '',
        indexing: r.indexing || 'Unindexed',
        quartile: r.quartile || 'Unranked',
        theme: r.theme || 'Unspecified',
        funder: r.funder && r.funder.trim() ? r.funder.trim() : 'Not Specified',
        submitted_by: r.submitted_by,
        submitter_name: r.submitter_name || r.author_name
    };
}

async function generateReport(reportType, filters = {}, pagination = {}) {
    if (!REPORT_DEFINITIONS[reportType]) {
        const err = new Error(`Unsupported report type: ${reportType}`);
        err.status = 400;
        throw err;
    }

    const def = REPORT_DEFINITIONS[reportType];
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(5000, Math.max(1, parseInt(pagination.limit, 10) || 50));

    // Fetch shared analytics using the exact same metric definitions as the Dashboard
    const analytics = await getPublicationAnalytics({
        year: filters.year,
        collegeId: filters.collegeId,
        type: filters.type,
        indexing: filters.indexing,
        quartile: filters.quartile,
        theme: filters.theme
    });

    // Fetch detailed records using shared listPublications (strictly approved only)
    const listResult = await listPublications({
        page,
        limit,
        search: filters.search || '',
        collegeId: filters.collegeId || null,
        type: filters.type || null,
        year: filters.year || null,
        dateFrom: filters.dateFrom || null,
        dateTo: filters.dateTo || null,
        indexing: filters.indexing || null,
        quartile: filters.quartile || null,
        theme: filters.theme || null,
        funder: filters.funder || null,
        submittedBy: filters.researcherId || null,
        qualityIssue: filters.qualityIssue || null,
        sortBy: filters.sortBy || 'date_published',
        sortDir: filters.sortDir || 'DESC',
        visibleOnlyApproved: true
    });

    const records = listResult.data.map(sanitizeRecord);

    // Build report-specific summary & sections
    let summary = {};
    let tables = [];
    let issues = null;

    if (reportType === 'inventory') {
        summary = {
            total_records: listResult.pagination.total,
            indexed_count: analytics.kpis.indexed_publications,
            q1_q2_count: analytics.kpis.q1_q2_publications,
            doi_completeness: `${analytics.completeness.doi_pct}%`
        };
    } else if (reportType === 'annual_output') {
        summary = {
            reporting_year: analytics.targetYear,
            publications_in_year: analytics.kpis.publications_this_year,
            previous_year_publications: analytics.kpis.publications_prev_year,
            yoy_growth_pct: analytics.kpis.growth_pct !== null ? `${analytics.kpis.growth_pct}%` : 'N/A',
            total_repository: analytics.kpis.total_publications,
            indexed_publications: analytics.kpis.indexed_publications,
            q1_q2_publications: analytics.kpis.q1_q2_publications,
            unique_researchers: analytics.kpis.unique_researchers
        };
        tables = [
            { title: 'Annual Trend Comparison', columns: ['Year', 'Publications'], rows: analytics.trends.annual.map(a => [a.year, a.count]) },
            { title: 'Output by College', columns: ['College', 'Total', 'Selected Year', 'Indexed', 'Q1/Q2', 'Growth %'], rows: analytics.collegeStats.map(c => [c.college_name, c.total_publications, c.current_year_pubs, c.indexed_publications, c.q1_q2_publications, `${c.growth_percentage}%`]) },
            { title: 'Output by Publication Type', columns: ['Type', 'Count'], rows: analytics.trends.byType.map(t => [t.type, t.count]) },
            { title: 'Top Research Themes', columns: ['Theme', 'Publications'], rows: analytics.themes.topThemes.map(th => [th.theme, th.count]) }
        ];
    } else if (reportType === 'college') {
        summary = {
            total_publications: listResult.pagination.total,
            colleges_included: filters.collegeId ? 1 : analytics.kpis.colleges_represented,
            indexed_publications: analytics.kpis.indexed_publications,
            q1_q2_publications: analytics.kpis.q1_q2_publications
        };
        tables = [
            { title: 'College Performance Comparison', columns: ['College', 'Total', 'Selected Year', 'Indexed', 'Q1', 'Q1/Q2', 'Growth %'], rows: analytics.collegeStats.map(c => [c.college_name, c.total_publications, c.current_year_pubs, c.indexed_publications, c.q1_publications, c.q1_q2_publications, `${c.growth_percentage}%`]) },
            { title: 'Top Publishing Journals', columns: ['Journal Name', 'Publications'], rows: analytics.visibility.topJournals.map(j => [j.journal_name, j.count]) },
            { title: 'Research Themes', columns: ['Theme', 'Publications'], rows: analytics.themes.topThemes.map(th => [th.theme, th.count]) }
        ];
    } else if (reportType === 'journal_quality') {
        summary = {
            total_publications: analytics.kpis.total_publications,
            indexed_publications: analytics.visibility.indexedVsUnindexed.indexed,
            unindexed_publications: analytics.visibility.indexedVsUnindexed.unindexed,
            q1_publications: analytics.kpis.q1_publications,
            q1_q2_publications: analytics.kpis.q1_q2_publications
        };
        tables = [
            { title: 'Indexing Database Distribution', columns: ['Indexing Database', 'Publications'], rows: analytics.visibility.byIndexing.map(i => [i.indexing_name, i.count]) },
            { title: 'Journal Quartile Distribution (Q1–Q4)', columns: ['Quartile', 'Publications'], rows: analytics.visibility.quartileDist.map(q => [q.quartile, q.count]) },
            { title: 'Q1 & Q2 Output by College', columns: ['College', 'Q1 Count', 'Q2 Count'], rows: analytics.visibility.q1Q2ByCollege.map(c => [c.college_name, c.q1_count, c.q2_count]) },
            { title: 'Top Indexed & Published Journals', columns: ['Journal Name', 'Count'], rows: analytics.visibility.topJournals.map(j => [j.journal_name, j.count]) }
        ];
    } else if (reportType === 'researcher') {
        const resId = filters.researcherId ? parseInt(filters.researcherId, 10) : null;
        let researcherInfo = null;
        if (resId) {
            const [uRows] = await pool.execute(
                `SELECT u.id, u.full_name, c.name as college_name FROM users u LEFT JOIN colleges c ON u.college_id = c.id WHERE u.id = ?`,
                [resId]
            );
            researcherInfo = uRows[0] || null;
        }
        const totalPubs = records.length;
        const indexedCount = records.filter(r => r.indexing && r.indexing !== 'Unindexed').length;
        const q1q2Count = records.filter(r => r.quartile === 'Q1' || r.quartile === 'Q2').length;

        const byYearMap = {};
        records.forEach(r => {
            const yr = r.publication_year || 'Unknown';
            byYearMap[yr] = (byYearMap[yr] || 0) + 1;
        });

        summary = {
            researcher_name: researcherInfo ? researcherInfo.full_name : 'All Researchers',
            college: researcherInfo ? researcherInfo.college_name : 'All Colleges',
            total_publications: resId ? listResult.pagination.total : analytics.kpis.total_publications,
            indexed_publications: resId ? indexedCount : analytics.kpis.indexed_publications,
            q1_q2_publications: resId ? q1q2Count : analytics.kpis.q1_q2_publications
        };
        tables = resId
            ? [{ title: 'Publications by Year', columns: ['Year', 'Count'], rows: Object.entries(byYearMap).sort().map(([y, c]) => [y, c]) }]
            : [
                { title: 'Top Publishing Researchers', columns: ['Author Name', 'College', 'Publications'], rows: analytics.researchers.topResearchers.map(r => [r.author_name, r.college_name || '-', r.publication_count]) },
                { title: 'Researcher Output by College', columns: ['College', 'Unique Researchers', 'Publications'], rows: analytics.researchers.byCollege.map(c => [c.college_name, c.researcher_count, c.publication_count]) }
            ];
    } else if (reportType === 'theme') {
        summary = {
            total_publications: analytics.kpis.total_publications,
            distinct_themes: analytics.themes.topThemes.length
        };
        tables = [
            { title: 'Publications by Research Theme', columns: ['Theme', 'Publications'], rows: analytics.themes.topThemes.map(t => [t.theme, t.count]) },
            { title: 'Research Themes by College', columns: ['College', 'Theme', 'Count'], rows: analytics.themes.themeByCollege.map(tc => [tc.college_name, tc.theme, tc.count]) },
            { title: 'Theme Trends Over Time', columns: ['Year', 'Theme', 'Count'], rows: (analytics.themes.themeTrends || []).map(tt => [tt.year, tt.theme, tt.count]) }
        ];
    } else if (reportType === 'funding') {
        summary = {
            total_publications: analytics.kpis.total_publications,
            funded_publications: analytics.funding.withVsWithout.funded,
            not_specified: analytics.funding.withVsWithout.notSpecified
        };
        tables = [
            { title: 'Publications by Funding Organization', columns: ['Funder', 'Publications'], rows: analytics.funding.distribution.map(f => [f.funder_name, f.count]) },
            { title: 'Funded Publications by College', columns: ['College', 'Dilla University', 'Other / External', 'Not Specified'], rows: analytics.funding.fundingByCollege.map(fc => [fc.college_name, fc.du_funded, fc.external_funded, fc.not_specified]) },
            { title: 'Funded Publications by Research Theme', columns: ['Theme', 'Funded', 'Not Specified'], rows: (analytics.funding.fundingByTheme || []).map(ft => [ft.theme, ft.funded_count, ft.unspecified_count]) }
        ];
    } else if (reportType === 'data_quality') {
        const comp = analytics.completeness;
        summary = {
            total_records: comp.total_records,
            missing_doi: comp.missing_doi,
            missing_journal: comp.missing_journal,
            missing_date: comp.missing_date,
            missing_indexing: comp.missing_indexing,
            missing_quartile: comp.missing_quartile,
            incomplete_author: comp.incomplete_author,
            potential_duplicates: comp.potential_duplicates
        };
        issues = [
            { key: 'missing_doi', label: 'Missing DOI', count: comp.missing_doi, completeness: `${comp.doi_pct}%` },
            { key: 'missing_journal', label: 'Missing Journal Name', count: comp.missing_journal, completeness: `${comp.journal_pct}%` },
            { key: 'missing_date', label: 'Missing Publication Date', count: comp.missing_date, completeness: `${comp.date_pct}%` },
            { key: 'missing_indexing', label: 'Missing Indexing Information', count: comp.missing_indexing, completeness: `${comp.indexing_pct}%` },
            { key: 'missing_quartile', label: 'Missing Quartile Information', count: comp.missing_quartile, completeness: `${comp.quartile_pct}%` },
            { key: 'incomplete_author', label: 'Incomplete Author Information', count: comp.incomplete_author, completeness: `${comp.author_pct}%` },
            { key: 'potential_duplicate', label: 'Potential Duplicate Publications', count: comp.potential_duplicates, completeness: 'Audit' }
        ];
    }

    const reportingPeriod = filters.year
        ? `Year ${filters.year}`
        : (filters.dateFrom || filters.dateTo
            ? `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'Present'}`
            : 'All Recorded Years');

    return {
        metadata: {
            reportType,
            reportTitle: def.title,
            category: def.category,
            universityName: 'Dilla University',
            generatedAt: new Date().toISOString(),
            reportingPeriod,
            selectedFilters: filters,
            totalRecords: listResult.pagination.total
        },
        summary,
        tables,
        issues,
        records,
        pagination: listResult.pagination
    };
}

function escapeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
}

function escapeXml(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function exportReport(reportType, format, filters = {}) {
    const report = await generateReport(reportType, filters, { page: 1, limit: 5000 });
    const headers = [
        'ID', 'Publication Title', 'Author(s)', 'College', 'Publication Type',
        'Journal Name', 'Publication Date', 'DOI', 'Indexing', 'Quartile',
        'Research Theme', 'Funder'
    ];

    if (format === 'csv') {
        const lines = [headers.map(escapeCsvCell).join(',')];
        for (const r of report.records) {
            lines.push([
                r.id,
                escapeCsvCell(r.title),
                escapeCsvCell(r.author_name),
                escapeCsvCell(r.college_name),
                escapeCsvCell(r.type),
                escapeCsvCell(r.journal_name),
                escapeCsvCell(r.date_published),
                escapeCsvCell(r.doi),
                escapeCsvCell(r.indexing),
                escapeCsvCell(r.quartile),
                escapeCsvCell(r.theme),
                escapeCsvCell(r.funder)
            ].join(','));
        }
        return {
            contentType: 'text/csv; charset=utf-8',
            filename: `du_${reportType}_report.csv`,
            body: '\uFEFF' + lines.join('\n')
        };
    }

    // Excel SpreadsheetML 2003 XML (.xls) with multi-sheet support, frozen headers, auto-filters, and date formatting
    const summaryRowsXml = Object.entries(report.summary)
        .map(([k, v]) => `
        <Row>
            <Cell ss:StyleID="BoldLabel"><Data ss:Type="String">${escapeXml(k.replace(/_/g, ' ').toUpperCase())}</Data></Cell>
            <Cell><Data ss:Type="${typeof v === 'number' ? 'Number' : 'String'}">${escapeXml(v)}</Data></Cell>
        </Row>`).join('');

    const extraTablesXml = (report.tables || []).map(tbl => `
        <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
        <Row><Cell ss:StyleID="SectionTitle"><Data ss:Type="String">${escapeXml(tbl.title)}</Data></Cell></Row>
        <Row>${tbl.columns.map(c => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('')}</Row>
        ${tbl.rows.map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="${typeof cell === 'number' ? 'Number' : 'String'}">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`).join('')}
    `).join('');

    const detailHeaderXml = `<Row>${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('')}</Row>`;
    const detailRowsXml = report.records.map(r => `
        <Row>
            <Cell><Data ss:Type="Number">${r.id}</Data></Cell>
            <Cell ss:StyleID="WrapText"><Data ss:Type="String">${escapeXml(r.title)}</Data></Cell>
            <Cell ss:StyleID="WrapText"><Data ss:Type="String">${escapeXml(r.author_name)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.college_name)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.type)}</Data></Cell>
            <Cell ss:StyleID="WrapText"><Data ss:Type="String">${escapeXml(r.journal_name)}</Data></Cell>
            <Cell${r.date_published ? ' ss:StyleID="DateCell"' : ''}><Data ss:Type="${r.date_published ? 'DateTime' : 'String'}">${r.date_published ? `${r.date_published}T00:00:00.000` : ''}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.doi)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.indexing)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.quartile)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.theme)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(r.funder)}</Data></Cell>
        </Row>`).join('');

    const totalDetailRows = report.records.length + 1;

    const workbookXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SectionTitle">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#1E3A8A"/>
  </Style>
  <Style ss:ID="BoldLabel">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="WrapText">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
  </Style>
  <Style ss:ID="DateCell">
   <NumberFormat ss:Format="yyyy-mm-dd"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Summary Statistics">
  <Table>
   <Column ss:Width="220"/>
   <Column ss:Width="180"/>
   <Row><Cell ss:StyleID="SectionTitle"><Data ss:Type="String">Dilla University — ${escapeXml(report.metadata.reportTitle)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Reporting Period: ${escapeXml(report.metadata.reportingPeriod)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Generated At: ${escapeXml(report.metadata.generatedAt)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   ${summaryRowsXml}
   ${extraTablesXml}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Detailed Records">
  <Table>
   <Column ss:Width="50"/>
   <Column ss:Width="280"/>
   <Column ss:Width="160"/>
   <Column ss:Width="180"/>
   <Column ss:Width="120"/>
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="75"/>
   <Column ss:Width="130"/>
   <Column ss:Width="120"/>
   ${detailHeaderXml}
   ${detailRowsXml}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
  <AutoFilter x:Range="R1C1:R${totalDetailRows}C12" xmlns="urn:schemas-microsoft-com:office:excel"/>
 </Worksheet>
</Workbook>`;

    return {
        contentType: 'application/vnd.ms-excel; charset=utf-8',
        filename: `du_${reportType}_report.xls`,
        body: workbookXml
    };
}

module.exports = {
    REPORT_DEFINITIONS,
    generateReport,
    exportReport
};
