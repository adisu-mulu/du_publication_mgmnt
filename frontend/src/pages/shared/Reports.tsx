import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import {
    FileText, BookOpen, Building2, Star, User, Lightbulb, DollarSign,
    AlertTriangle, Download, Printer, ArrowLeft, RefreshCw, ChevronLeft,
    ChevronRight, ExternalLink, CheckCircle, XCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportDef {
    title: string;
    category: string;
    description: string;
}

interface FilterOptions {
    years: number[];
    colleges: { id: number; name: string }[];
    types: string[];
    indexing: string[];
    quartiles: string[];
    themes: string[];
    funders: string[];
    researchers: { id: number; full_name: string }[];
}

interface ReportConfig {
    type: string;
    year: string;
    dateFrom: string;
    dateTo: string;
    collegeId: string;
    type_filter: string;
    indexing: string;
    quartile: string;
    theme: string;
    funder: string;
    researcherId: string;
    qualityIssue: string;
    sortBy: string;
    sortDir: string;
    search: string;
}

interface ReportData {
    metadata: {
        reportType: string;
        reportTitle: string;
        category: string;
        universityName: string;
        generatedAt: string;
        reportingPeriod: string;
        selectedFilters: Record<string, string>;
        totalRecords: number;
    };
    summary: Record<string, string | number>;
    tables: { title: string; columns: string[]; rows: (string | number)[][] }[];
    issues: { key: string; label: string; count: number; completeness: string }[] | null;
    records: Record<string, string | number>[];
    pagination: { total: number; page: number; limit: number; pages: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
    inventory: <BookOpen size={22} />,
    annual_output: <Star size={22} />,
    college: <Building2 size={22} />,
    journal_quality: <FileText size={22} />,
    researcher: <User size={22} />,
    theme: <Lightbulb size={22} />,
    funding: <DollarSign size={22} />,
    data_quality: <AlertTriangle size={22} />,
};

const CATEGORY_COLORS: Record<string, string> = {
    'Inventory & Records': '#2563eb',
    'Executive & Management': '#7c3aed',
    'Institutional Performance': '#059669',
    'Scholarly Visibility': '#d97706',
    'Faculty & Researchers': '#db2777',
    'Thematic Focus': '#0891b2',
    'Funding & Grants': '#65a30d',
    'Data Governance': '#dc2626',
};

const DEFAULT_CONFIG: ReportConfig = {
    type: '',
    year: '',
    dateFrom: '',
    dateTo: '',
    collegeId: '',
    type_filter: '',
    indexing: '',
    quartile: '',
    theme: '',
    funder: '',
    researcherId: '',
    qualityIssue: '',
    sortBy: 'date_published',
    sortDir: 'DESC',
    search: '',
};

const QUALITY_ISSUES = [
    { value: 'missing_doi', label: 'Missing DOI' },
    { value: 'missing_journal', label: 'Missing Journal Name' },
    { value: 'missing_date', label: 'Missing Publication Date' },
    { value: 'missing_indexing', label: 'Missing Indexing Info' },
    { value: 'missing_quartile', label: 'Missing Quartile Info' },
    { value: 'incomplete_author', label: 'Incomplete Author Info' },
    { value: 'potential_duplicate', label: 'Potential Duplicates' },
];

// ─── Helper: format summary key ───────────────────────────────────────────────

function fmtKey(k: string) {
    return k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Select({ label, value, onChange, children, wide }: {
    label: string; value: string; onChange: (v: string) => void;
    children: React.ReactNode; wide?: boolean;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: wide ? '1 1 220px' : '1 1 160px' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} style={{ fontSize: 13 }}>
                {children}
            </select>
        </div>
    );
}

function TextInput({ label, value, onChange, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ fontSize: 13 }}
            />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Reports = () => {
    const [definitions, setDefinitions] = useState<Record<string, ReportDef>>({});
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [defsLoading, setDefsLoading] = useState(true);

    // Load definitions + filter options on mount
    useEffect(() => {
        setDefsLoading(true);
        Promise.all([
            api.get('/publication-officer/reports/definitions'),
            api.get('/publication-officer/analytics')
        ]).then(([defsRes, analyticsRes]) => {
            setDefinitions(defsRes.data);
            const fo = analyticsRes.data?.filterOptions;
            if (fo) setFilterOptions(fo);
        }).catch(err => {
            console.error('Failed to load report definitions', err);
            setError('Failed to load report definitions. Please reload the page.');
        }).finally(() => setDefsLoading(false));
    }, []);

    const cfg = useCallback((k: keyof ReportConfig) => (v: string) => {
        setConfig(prev => ({ ...prev, [k]: v }));
    }, []);

    const handleSelectReport = (type: string) => {
        setSelectedType(type);
        setConfig({ ...DEFAULT_CONFIG, type });
        setReportData(null);
        setError(null);
        setPage(1);
    };

    const handleGenerate = async (pg = 1) => {
        if (!selectedType) return;
        setLoading(true);
        setError(null);
        setPage(pg);
        try {
            const params: Record<string, string> = {
                type: selectedType,
                page: String(pg),
                limit: '50',
                sortBy: config.sortBy,
                sortDir: config.sortDir,
            };
            if (config.year) params.year = config.year;
            if (config.dateFrom) params.dateFrom = config.dateFrom;
            if (config.dateTo) params.dateTo = config.dateTo;
            if (config.collegeId) params.collegeId = config.collegeId;
            if (config.type_filter) params.type = config.type_filter;
            if (config.indexing) params.indexing = config.indexing;
            if (config.quartile) params.quartile = config.quartile;
            if (config.theme) params.theme = config.theme;
            if (config.funder) params.funder = config.funder;
            if (config.researcherId) params.researcherId = config.researcherId;
            if (config.qualityIssue) params.qualityIssue = config.qualityIssue;
            if (config.search) params.search = config.search;

            const res = await api.get('/publication-officer/reports/generate', { params });
            setReportData(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to generate report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const buildExportUrl = (format: 'csv' | 'excel') => {
        if (!selectedType) return '#';
        const base = '/api/publication-officer/reports/export';
        const params = new URLSearchParams({ type: selectedType, format });
        if (config.year) params.set('year', config.year);
        if (config.dateFrom) params.set('dateFrom', config.dateFrom);
        if (config.dateTo) params.set('dateTo', config.dateTo);
        if (config.collegeId) params.set('collegeId', config.collegeId);
        if (config.type_filter) params.set('type', config.type_filter);
        if (config.indexing) params.set('indexing', config.indexing);
        if (config.quartile) params.set('quartile', config.quartile);
        if (config.theme) params.set('theme', config.theme);
        if (config.funder) params.set('funder', config.funder);
        if (config.researcherId) params.set('researcherId', config.researcherId);
        if (config.qualityIssue) params.set('qualityIssue', config.qualityIssue);
        if (config.search) params.set('search', config.search);
        return `http://localhost:5000${base}?${params.toString()}`;
    };

    // ── STEP 1: Report Selector ──────────────────────────────────────────────
    if (!selectedType) {
        const grouped: Record<string, [string, ReportDef][]> = {};
        Object.entries(definitions).forEach(([k, def]) => {
            if (!grouped[def.category]) grouped[def.category] = [];
            grouped[def.category].push([k, def]);
        });

        return (
            <div>
                <div className="page-header" style={{ marginBottom: 24 }}>
                    <div className="page-header-text">
                        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                            Publication Reports
                        </h1>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            Generate formal, downloadable publication reports for institutional use.
                        </p>
                    </div>
                </div>

                {defsLoading ? (
                    <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading available reports…
                    </div>
                ) : error ? (
                    <div className="card" style={{ padding: 24, color: 'var(--danger)' }}>{error}</div>
                ) : (
                    Object.entries(grouped).map(([category, entries]) => (
                        <div key={category} style={{ marginBottom: 28 }}>
                            <h2 style={{
                                fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
                                letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '0 0 12px'
                            }}>
                                {category}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                                {entries.map(([key, def]) => {
                                    const color = CATEGORY_COLORS[def.category] || '#4b5563';
                                    return (
                                        <div
                                            key={key}
                                            className="card"
                                            style={{ padding: 18, cursor: 'pointer', border: '1px solid var(--border)' }}
                                            onClick={() => handleSelectReport(key)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 10,
                                                    background: `${color}18`, color,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {ICONS[key] || <FileText size={22} />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{def.title}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{def.description}</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 14, textAlign: 'right' }}>
                                                <span style={{
                                                    display: 'inline-block', background: color, color: '#fff',
                                                    fontSize: 11, fontWeight: 600, borderRadius: 6,
                                                    padding: '4px 10px', letterSpacing: '0.03em'
                                                }}>
                                                    Configure & Generate →
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    const def = definitions[selectedType];

    // ── STEP 2: Configuration + Preview ──────────────────────────────────────
    return (
        <div>
            {/* Page header */}
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div className="page-header-text" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => { setSelectedType(null); setReportData(null); setError(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <ArrowLeft size={14} /> All Reports
                    </button>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px' }}>
                            {def?.title || 'Generate Report'}
                        </h1>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                            {def?.category}
                        </p>
                    </div>
                </div>
                {reportData && (
                    <div className="page-header-actions" style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => window.print()}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <Printer size={14} /> Print
                        </button>
                        <a
                            href={buildExportUrl('csv')}
                            className="btn btn-secondary"
                            download
                            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                        >
                            <Download size={14} /> CSV
                        </a>
                        <a
                            href={buildExportUrl('excel')}
                            className="btn btn-primary"
                            download
                            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                        >
                            <Download size={14} /> Excel
                        </a>
                    </div>
                )}
            </div>

            {/* Configuration panel */}
            <div className="card no-print" style={{ padding: 18, marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={14} /> Report Configuration
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {/* Year */}
                    <Select label="Publication Year" value={config.year} onChange={cfg('year')}>
                        <option value="">All Years</option>
                        {filterOptions?.years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </Select>

                    {/* Date range */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Date From</label>
                        <input type="date" value={config.dateFrom} onChange={e => cfg('dateFrom')(e.target.value)} style={{ fontSize: 13 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
                        <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Date To</label>
                        <input type="date" value={config.dateTo} onChange={e => cfg('dateTo')(e.target.value)} style={{ fontSize: 13 }} />
                    </div>

                    {/* College */}
                    <Select label="College" value={config.collegeId} onChange={cfg('collegeId')} wide>
                        <option value="">All Colleges</option>
                        {filterOptions?.colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </Select>

                    {/* Publication type */}
                    <Select label="Publication Type" value={config.type_filter} onChange={cfg('type_filter')}>
                        <option value="">All Types</option>
                        {filterOptions?.types.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </Select>

                    {/* Indexing */}
                    <Select label="Indexing Database" value={config.indexing} onChange={cfg('indexing')}>
                        <option value="">All Databases</option>
                        {filterOptions?.indexing.map(i => (
                            <option key={i} value={i}>{i}</option>
                        ))}
                    </Select>

                    {/* Quartile */}
                    <Select label="Quartile" value={config.quartile} onChange={cfg('quartile')}>
                        <option value="">All Quartiles</option>
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                            <option key={q} value={q}>{q}</option>
                        ))}
                    </Select>

                    {/* Theme */}
                    <Select label="Research Theme" value={config.theme} onChange={cfg('theme')} wide>
                        <option value="">All Themes</option>
                        {filterOptions?.themes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </Select>

                    {/* Funder – only for funding report */}
                    {selectedType === 'funding' && (
                        <Select label="Funder / Sponsor" value={config.funder} onChange={cfg('funder')} wide>
                            <option value="">All Funders</option>
                            {filterOptions?.funders.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </Select>
                    )}

                    {/* Researcher – only for researcher report */}
                    {selectedType === 'researcher' && (
                        <Select label="Researcher" value={config.researcherId} onChange={cfg('researcherId')} wide>
                            <option value="">All Researchers</option>
                            {filterOptions?.researchers?.map(r => (
                                <option key={r.id} value={r.id}>{r.full_name}</option>
                            ))}
                        </Select>
                    )}

                    {/* Quality issue – only for data_quality report */}
                    {selectedType === 'data_quality' && (
                        <Select label="Data Issue" value={config.qualityIssue} onChange={cfg('qualityIssue')} wide>
                            <option value="">All Issues</option>
                            {QUALITY_ISSUES.map(qi => (
                                <option key={qi.value} value={qi.value}>{qi.label}</option>
                            ))}
                        </Select>
                    )}

                    {/* Search */}
                    <TextInput
                        label="Search Keywords"
                        value={config.search}
                        onChange={cfg('search')}
                        placeholder="Title, author, DOI…"
                    />

                    {/* Sort */}
                    <Select label="Sort By" value={config.sortBy} onChange={cfg('sortBy')}>
                        <option value="date_published">Publication Date</option>
                        <option value="created_at">Submission Date</option>
                        <option value="title">Title</option>
                        <option value="college_id">College</option>
                    </Select>
                    <Select label="Order" value={config.sortDir} onChange={cfg('sortDir')}>
                        <option value="DESC">Newest First</option>
                        <option value="ASC">Oldest First</option>
                    </Select>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setConfig({ ...DEFAULT_CONFIG, type: selectedType })}
                    >
                        Reset
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerate(1)}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {loading ? (
                            <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                        ) : (
                            <><FileText size={13} /> Generate Report</>
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                    {error}
                </div>
            )}

            {/* Loading placeholder */}
            {loading && !reportData && (
                <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 10 }} />
                    <div style={{ fontSize: 14 }}>Generating report, please wait…</div>
                </div>
            )}

            {/* Report Preview */}
            {reportData && (
                <div className="print-area">
                    {/* Formal report header */}
                    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                        <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: 16, marginBottom: 16 }}>
                            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e3a8a', fontWeight: 600, marginBottom: 4 }}>
                                {reportData.metadata.universityName}
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                                {reportData.metadata.reportTitle}
                            </h2>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                <span>Reporting period: <strong>{reportData.metadata.reportingPeriod}</strong></span>
                                <span>Generated: <strong>{new Date(reportData.metadata.generatedAt).toLocaleString()}</strong></span>
                                <span>Total records: <strong>{reportData.metadata.totalRecords.toLocaleString()}</strong></span>
                            </div>
                        </div>

                        {/* Active filters */}
                        {Object.entries(reportData.metadata.selectedFilters).some(([, v]) => v) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Filters:</span>
                                {Object.entries(reportData.metadata.selectedFilters)
                                    .filter(([, v]) => v)
                                    .map(([k, v]) => (
                                        <span key={k} style={{
                                            background: '#eff6ff', color: '#2563eb', fontSize: 11,
                                            border: '1px solid #bfdbfe', borderRadius: 4, padding: '2px 8px'
                                        }}>
                                            {fmtKey(k)}: {v}
                                        </span>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Summary stats */}
                    {Object.keys(reportData.summary).length > 0 && (
                        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: '#1e3a8a' }}>
                                Summary Statistics
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                {Object.entries(reportData.summary).map(([k, v]) => (
                                    <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{fmtKey(k)}</div>
                                        <div style={{ fontSize: 20, fontWeight: 700, color: '#1e3a8a' }}>{v ?? '—'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data quality issues */}
                    {reportData.issues && (
                        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: '#1e3a8a' }}>
                                Data Quality Issues
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {reportData.issues.map(issue => {
                                    const pct = parseFloat(issue.completeness);
                                    const isOk = !isNaN(pct) && pct >= 90;
                                    return (
                                        <div key={issue.key} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 14px', background: 'var(--bg)', borderRadius: 8
                                        }}>
                                            {!isNaN(pct)
                                                ? (isOk
                                                    ? <CheckCircle size={16} color="#059669" />
                                                    : <XCircle size={16} color="#dc2626" />)
                                                : <AlertTriangle size={16} color="#d97706" />}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{issue.label}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    {issue.count} record{issue.count !== 1 ? 's' : ''} affected
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: 13, fontWeight: 600,
                                                color: !isNaN(pct) ? (isOk ? '#059669' : '#dc2626') : '#d97706'
                                            }}>
                                                {issue.completeness}
                                            </div>
                                            {!isNaN(pct) && (
                                                <div style={{ width: 100, background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${pct}%`, height: '100%', borderRadius: 4,
                                                        background: isOk ? '#059669' : pct >= 70 ? '#d97706' : '#dc2626'
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Analytical tables */}
                    {reportData.tables.map((tbl, ti) => tbl.rows.length > 0 && (
                        <div key={ti} className="card table-container" style={{ padding: 0, marginBottom: 16 }}>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
                                {tbl.title}
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table>
                                    <thead>
                                        <tr>
                                            {tbl.columns.map((c, ci) => <th key={ci}>{c}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tbl.rows.map((row, ri) => (
                                            <tr key={ri}>
                                                {row.map((cell, ci) => (
                                                    <td key={ci}>{cell ?? '—'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {/* Detailed records */}
                    <div className="card table-container" style={{ padding: 0, marginBottom: 16 }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>
                                Detailed Publication Records ({reportData.pagination.total.toLocaleString()} total)
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Page {reportData.pagination.page} of {reportData.pagination.pages}
                            </span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Publication Title</th>
                                        <th>Author(s)</th>
                                        <th>College</th>
                                        <th>Type</th>
                                        <th>Journal</th>
                                        <th>Year</th>
                                        <th>DOI</th>
                                        <th>Indexing</th>
                                        <th>Quartile</th>
                                        <th>Theme</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.records.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                                                No records match the selected filters.
                                            </td>
                                        </tr>
                                    ) : reportData.records.map((r, ri) => (
                                        <tr key={ri}>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{r.id}</td>
                                            <td style={{ maxWidth: 280 }}>
                                                <div style={{ fontWeight: 500, fontSize: 12, lineHeight: 1.4 }}>{r.title || '—'}</div>
                                            </td>
                                            <td style={{ fontSize: 12 }}>{r.author_name || '—'}</td>
                                            <td style={{ fontSize: 12 }}>{r.college_name || '—'}</td>
                                            <td style={{ fontSize: 11 }}>{r.type || '—'}</td>
                                            <td style={{ fontSize: 11, maxWidth: 160 }}>{r.journal_name || '—'}</td>
                                            <td style={{ fontSize: 12 }}>{r.publication_year || '—'}</td>
                                            <td style={{ fontSize: 11 }}>
                                                {r.doi ? (
                                                    <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noopener noreferrer"
                                                        style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <ExternalLink size={10} /> DOI
                                                    </a>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 500, borderRadius: 4, padding: '2px 6px',
                                                    background: r.indexing && r.indexing !== 'Unindexed' ? '#ecfdf5' : '#f3f4f6',
                                                    color: r.indexing && r.indexing !== 'Unindexed' ? '#059669' : '#6b7280'
                                                }}>
                                                    {r.indexing || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                {r.quartile && r.quartile !== 'Unranked' ? (
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                                        background: r.quartile === 'Q1' ? '#fef3c7' : r.quartile === 'Q2' ? '#ede9fe' : '#f3f4f6',
                                                        color: r.quartile === 'Q1' ? '#92400e' : r.quartile === 'Q2' ? '#5b21b6' : '#6b7280'
                                                    }}>{r.quartile}</span>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>}
                                            </td>
                                            <td style={{ fontSize: 11, maxWidth: 120 }}>{r.theme || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {reportData.pagination.pages > 1 && (
                            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <button
                                    className="btn btn-secondary"
                                    disabled={page <= 1 || loading}
                                    onClick={() => handleGenerate(page - 1)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    <ChevronLeft size={14} /> Previous
                                </button>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Page {reportData.pagination.page} of {reportData.pagination.pages}
                                </span>
                                <button
                                    className="btn btn-secondary"
                                    disabled={page >= reportData.pagination.pages || loading}
                                    onClick={() => handleGenerate(page + 1)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Export actions (bottom) */}
                    <div className="card no-print" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Export all {reportData.pagination.total.toLocaleString()} records (not just this page)
                        </span>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Printer size={13} /> Print / Save as PDF
                            </button>
                            <a href={buildExportUrl('csv')} download className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                <Download size={13} /> Download CSV
                            </a>
                            <a href={buildExportUrl('excel')} download className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                <Download size={13} /> Download Excel
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
