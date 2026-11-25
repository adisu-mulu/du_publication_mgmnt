import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { Search, Download, Filter, RotateCcw, ExternalLink } from 'lucide-react';

export const ViewPublications = () => {
    const { user, activeRole } = useAuth();
    const isViceDean = activeRole === 'vice_dean';
    const viceDeanCollegeId = isViceDean && user?.collegeId ? String(user.collegeId) : '';

    const [publications, setPublications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    // Filter options from API
    const [filterOptions, setFilterOptions] = useState<{
        years: number[];
        colleges: { id: number; name: string }[];
        types: string[];
        indexings: string[];
        themes: string[];
    }>({
        years: [],
        colleges: [],
        types: [],
        indexings: [],
        themes: []
    });

    // Active filters state (draft / inputs)
    const [search, setSearch] = useState('');
    const [year, setYear] = useState('');
    const [collegeId, setCollegeId] = useState(viceDeanCollegeId);
    const [type, setType] = useState('');
    const [indexing, setIndexing] = useState('');
    const [quartile, setQuartile] = useState('');
    const [theme, setTheme] = useState('');
    const [gender, setGender] = useState('');

    // Applied filters (the ones sent to the query)
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        year: '',
        collegeId: viceDeanCollegeId,
        type: '',
        indexing: '',
        quartile: '',
        theme: '',
        gender: ''
    });

    useEffect(() => {
        if (viceDeanCollegeId) {
            setCollegeId(viceDeanCollegeId);
            setAppliedFilters(prev => ({ ...prev, collegeId: viceDeanCollegeId }));
        }
    }, [viceDeanCollegeId]);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Load filter options on mount
    useEffect(() => {
        api.get('/colleges/filters')
            .then((res) => {
                setFilterOptions(res.data);
            })
            .catch((err) => {
                console.error('Failed to load filter options', err);
            });
    }, []);

    // Fetch publications when appliedFilters or page change
    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit: 15,
                search: appliedFilters.search || undefined,
                year: appliedFilters.year || undefined,
                collegeId: appliedFilters.collegeId || undefined,
                type: appliedFilters.type || undefined,
                indexing: appliedFilters.indexing || undefined,
                quartile: appliedFilters.quartile || undefined,
                theme: appliedFilters.theme || undefined,
                gender: appliedFilters.gender || undefined
            };

            const res = await api.get('/supervisor/publications', { params });
            setPublications(res.data.data || []);
            setTotalCount(res.data.pagination?.total ?? 0);
            setTotalPages(res.data.pagination?.totalPages ?? 1);
        } catch (err) {
            console.error('Failed to load publications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [appliedFilters, page]);

    const handleApplyFilters = () => {
        setPage(1);
        setAppliedFilters({
            search,
            year,
            collegeId,
            type,
            indexing,
            quartile,
            theme,
            gender
        });
    };

    const handleResetFilters = () => {
        setSearch('');
        setYear('');
        setCollegeId(viceDeanCollegeId);
        setType('');
        setIndexing('');
        setQuartile('');
        setTheme('');
        setGender('');
        setPage(1);
        setAppliedFilters({
            search: '',
            year: '',
            collegeId: viceDeanCollegeId,
            type: '',
            indexing: '',
            quartile: '',
            theme: '',
            gender: ''
        });
    };

    const handleExportData = () => {
        const params = new URLSearchParams();
        if (appliedFilters.search) params.append('search', appliedFilters.search);
        if (appliedFilters.year) params.append('year', appliedFilters.year);
        if (appliedFilters.collegeId) params.append('collegeId', appliedFilters.collegeId);
        if (appliedFilters.type) params.append('type', appliedFilters.type);
        if (appliedFilters.indexing) params.append('indexing', appliedFilters.indexing);
        if (appliedFilters.quartile) params.append('quartile', appliedFilters.quartile);
        if (appliedFilters.theme) params.append('theme', appliedFilters.theme);
        if (appliedFilters.gender) params.append('gender', appliedFilters.gender);

        const url = `http://localhost:5000/api/supervisor/export?${params.toString()}`;
        window.open(url, '_blank');
    };

    const selectStyle: React.CSSProperties = {
        padding: '7px 10px',
        fontSize: '12px',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        backgroundColor: '#ffffff',
        minWidth: '130px',
        flex: '1 1 130px'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: '4px',
        display: 'block'
    };

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                    View Publications
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Browse, filter, and export verified and approved university research publications.
                </p>
            </div>

            {/* Filter Section Container */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                {/* Row 1: Search Bar on the left, Count label & Export Data button on the right */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border)'
                }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '520px' }}>
                        <Search
                            size={15}
                            style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-muted)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search by title, author, journal, DOI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                            style={{
                                width: '100%',
                                paddingLeft: '34px',
                                paddingRight: '12px',
                                height: '36px',
                                fontSize: '13px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)'
                            }}
                        />
                    </div>

                    {/* Right end of search bar: Count Label / Button + Export Data Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--primary-light)',
                                color: 'var(--primary)',
                                fontWeight: 600,
                                fontSize: '13px',
                                border: '1px solid rgba(30, 58, 138, 0.15)',
                                height: '36px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <span>Total Count:</span>
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>
                                {loading ? '...' : totalCount.toLocaleString()}
                            </span>
                        </div>

                        <button
                            onClick={handleExportData}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                height: '36px',
                                fontSize: '13px',
                                fontWeight: 600,
                                padding: '0 16px'
                            }}
                        >
                            <Download size={14} /> Export Data
                        </button>
                    </div>
                </div>

                {/* Row 2: Right under the search bar: 7 Filter Selectors + Apply Filter & Reset */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '16px'
                }}>
                    {/* 1. Year */}
                    <div>
                        <label style={labelStyle}>Publication Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">All Years</option>
                            {filterOptions.years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. College */}
                    <div>
                        <label style={labelStyle}>
                            College {isViceDean && '(Assigned College)'}
                        </label>
                        <select
                            value={collegeId}
                            onChange={(e) => setCollegeId(e.target.value)}
                            disabled={isViceDean}
                            style={{
                                ...selectStyle,
                                minWidth: '180px',
                                flex: '1 1 180px',
                                backgroundColor: isViceDean ? '#f1f5f9' : '#ffffff',
                                cursor: isViceDean ? 'not-allowed' : 'default',
                                color: isViceDean ? 'var(--primary)' : 'inherit',
                                fontWeight: isViceDean ? 600 : 'normal'
                            }}
                        >
                            {isViceDean ? (
                                <option value={collegeId}>
                                    {user?.collegeName || filterOptions.colleges.find(c => String(c.id) === String(collegeId))?.name || 'My College'}
                                </option>
                            ) : (
                                <>
                                    <option value="">All Colleges</option>
                                    {filterOptions.colleges.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>

                    {/* 3. Publication Type */}
                    <div>
                        <label style={labelStyle}>Publication Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">All Types</option>
                            {filterOptions.types.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* 4. Indexing */}
                    <div>
                        <label style={labelStyle}>Indexing</label>
                        <select
                            value={indexing}
                            onChange={(e) => setIndexing(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">All Indexing</option>
                            {filterOptions.indexings.map((idx) => (
                                <option key={idx} value={idx}>{idx}</option>
                            ))}
                        </select>
                    </div>

                    {/* 5. Quartile */}
                    <div>
                        <label style={labelStyle}>Quartile</label>
                        <select
                            value={quartile}
                            onChange={(e) => setQuartile(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="">All Quartiles</option>
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                            <option value="Unranked">Unranked</option>
                        </select>
                    </div>

                    {/* 6. Theme */}
                    <div>
                        <label style={labelStyle}>Research Theme</label>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            style={{ ...selectStyle, minWidth: '160px', flex: '1 1 160px' }}
                        >
                            <option value="">All Themes</option>
                            {filterOptions.themes.map((th) => (
                                <option key={th} value={th}>{th}</option>
                            ))}
                        </select>
                    </div>

                    {/* 7. Gender */}
                    <div>
                        <label style={labelStyle}>Author Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            style={{ ...selectStyle, minWidth: '110px', flex: '1 1 110px' }}
                        >
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>

                    {/* Action Buttons: Apply Filter & Reset */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', paddingTop: '4px' }}>
                        <button
                            onClick={handleResetFilters}
                            className="btn btn-secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                height: '34px',
                                fontSize: '12px',
                                padding: '0 12px'
                            }}
                            title="Reset filters to default"
                        >
                            <RotateCcw size={13} /> Reset
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                height: '34px',
                                fontSize: '12px',
                                fontWeight: 600,
                                padding: '0 16px'
                            }}
                        >
                            <Filter size={13} /> Apply Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Article Details</th>
                            <th>Author Information</th>
                            <th>College</th>
                            <th>Journal & Indexing</th>
                            <th>Quartile</th>
                            <th>Date Published</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading publications...
                                </td>
                            </tr>
                        ) : publications.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    No publications found matching your filter criteria.
                                </td>
                            </tr>
                        ) : (
                            publications.map((pub, idx) => (
                                <tr key={pub.id}>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', width: '35px' }}>
                                        {(page - 1) * 15 + idx + 1}
                                    </td>
                                    <td style={{ maxWidth: '280px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', lineHeight: 1.4 }}>
                                            {pub.title}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pub.type} {pub.theme ? `• ${pub.theme}` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{pub.author_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pub.gender || '-'}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '12px', fontWeight: 500 }}>
                                        {pub.college_name || '-'}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '12px' }}>{pub.journal_name || '-'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pub.indexing || 'Unindexed'}
                                        </div>
                                        {pub.doi && (
                                            <a
                                                href={`https://doi.org/${pub.doi}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{
                                                    fontSize: '11px',
                                                    color: 'var(--primary)',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                    marginTop: '2px',
                                                    textDecoration: 'none'
                                                }}
                                            >
                                                DOI <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </td>
                                    <td>
                                        {pub.quartile ? (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 7px',
                                                borderRadius: '4px',
                                                backgroundColor: pub.quartile === 'Q1' ? '#fef3c7' : pub.quartile === 'Q2' ? '#ede9fe' : '#f1f5f9',
                                                color: pub.quartile === 'Q1' ? '#92400e' : pub.quartile === 'Q2' ? '#5b21b6' : 'var(--text-main)'
                                            }}>
                                                {pub.quartile}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '12px' }}>
                                        {pub.date_published ? new Date(pub.date_published).toLocaleDateString() : '-'}
                                    </td>
                                    <td>
                                        <span className="badge badge-approved">
                                            {pub.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border)',
                        backgroundColor: '#fafbfc'
                    }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Showing page {page} of {totalPages} ({totalCount.toLocaleString()} total publications)
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1 || loading}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '12px', padding: '4px 12px' }}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '12px', padding: '4px 12px' }}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
