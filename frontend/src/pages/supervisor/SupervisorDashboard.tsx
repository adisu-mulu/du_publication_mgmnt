import { useState, useEffect } from 'react';
import api from '../../api';
import { Download, Search, Filter } from 'lucide-react';

export const SupervisorDashboard = () => {
    const [publications, setPublications] = useState<any[]>([]);
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCollege, setSelectedCollege] = useState('');
    const [colleges, setColleges] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pubRes, overviewRes, collegesRes] = await Promise.all([
                api.get('/supervisor/publications', {
                    params: {
                        search: search || undefined,
                        collegeId: selectedCollege || undefined
                    }
                }),
                api.get('/supervisor/overview'),
                api.get('/colleges')
            ]);
            setPublications(pubRes.data.data);
            setOverview(overviewRes.data);
            setColleges(collegesRes.data);
        } catch (err) {
            console.error('Failed to load supervisor data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, selectedCollege]);

    const handleExportCsv = () => {
        const url = `http://localhost:5000/api/supervisor/export${selectedCollege ? `?collegeId=${selectedCollege}` : ''}`;
        window.open(url, '_blank');
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div className="page-header-text">
                    <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                        University Research Overview & Supervision
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        Institution-wide read-only visibility into verified and approved research outputs across all colleges.
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-secondary" onClick={handleExportCsv}>
                        <Download size={14} /> Export CSV Report
                    </button>
                </div>
            </div>

            {/* University Stats */}
            <div className="grid-responsive-3">
                <div className="stat-card">
                    <div className="stat-label">Total Verified Publications</div>
                    <div className="stat-value">{overview?.summary?.total_approved || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Published Researchers</div>
                    <div className="stat-value">{overview?.summary?.total_researchers || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Contributing Colleges</div>
                    <div className="stat-value">{overview?.summary?.colleges_with_pubs || 0}</div>
                </div>
            </div>

            {/* College breakdown summary table */}
            <div className="card table-container" style={{ padding: 0, marginBottom: '24px' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '13px' }}>
                    Output by College
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>College Name</th>
                            <th>Approved Publications</th>
                            <th>Active Researchers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {overview?.byCollege?.map((c: any) => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 500 }}>{c.name}</td>
                                <td>{c.approved_count}</td>
                                <td>{c.active_researchers}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Filters */}
            <div className="card filter-toolbar">
                <div className="search-input-wrapper">
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search publications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                    />
                </div>

                <div className="filter-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <Filter size={14} color="var(--text-muted)" />
                        <label style={{ fontSize: '13px', fontWeight: 500 }}>College:</label>
                    </div>
                    <select
                        value={selectedCollege}
                        onChange={(e) => setSelectedCollege(e.target.value)}
                        style={{ width: '280px' }}
                    >
                        <option value="">All Colleges</option>
                        {colleges.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Publications Table */}
            <div className="card table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Article Title</th>
                            <th>Author Information</th>
                            <th>College</th>
                            <th>Type & Theme</th>
                            <th>Journal & Indexing</th>
                            <th>Funder</th>
                            <th>Date Published</th>
                            <th>Submitted By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading university publications...
                                </td>
                            </tr>
                        ) : publications.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    No verified publications found.
                                </td>
                            </tr>
                        ) : (
                            publications.map((pub) => (
                                <tr key={pub.id}>
                                    <td style={{ maxWidth: '280px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pub.title}</div>
                                        {pub.doi && <div style={{ fontSize: '11px', color: 'var(--primary)' }}>DOI: {pub.doi}</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{pub.author_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pub.gender}</div>
                                    </td>
                                    <td>{pub.college_name}</td>
                                    <td>
                                        <div>{pub.type}</div>
                                        {pub.theme && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pub.theme}</div>}
                                    </td>
                                    <td>
                                        <div>{pub.journal_name || '-'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pub.indexing || 'Unindexed'} {pub.quartile ? `• ${pub.quartile}` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            fontWeight: 500,
                                            fontSize: '12px',
                                            color: pub.funder === 'Dilla University' ? 'var(--primary)' : 'var(--text-main)'
                                        }}>
                                            {pub.funder || '-'}
                                        </span>
                                    </td>
                                    <td>{pub.date_published ? new Date(pub.date_published).toLocaleDateString() : '-'}</td>
                                    <td>{pub.submitter_name}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
