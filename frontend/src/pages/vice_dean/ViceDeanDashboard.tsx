import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Search } from 'lucide-react';

export const ViceDeanDashboard = () => {
    const { user } = useAuth();
    const [publications, setPublications] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchCollegeData = async () => {
        setLoading(true);
        try {
            const [pubRes, statsRes] = await Promise.all([
                api.get('/vice-dean/publications', { params: { search: search || undefined } }),
                api.get('/vice-dean/stats')
            ]);
            setPublications(pubRes.data.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to load vice dean data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollegeData();
    }, [search]);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                    {user?.collegeName} — Research Overview
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Overview of verified, approved publications and active research contributions within your college.
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid-responsive-3">
                <div className="stat-card">
                    <div className="stat-label">Verified Publications</div>
                    <div className="stat-value">{stats?.overview?.total_approved || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Publishing Faculty Members</div>
                    <div className="stat-value">{stats?.overview?.active_researchers || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">College</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '6px' }}>
                        {user?.collegeName}
                    </div>
                </div>
            </div>

            {/* Filter toolbar */}
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
            </div>

            {/* Publications Table with original fields */}
            <div className="card table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Article Title</th>
                            <th>Author Information</th>
                            <th>Type & Theme</th>
                            <th>Journal & Indexing</th>
                            <th>Funder</th>
                            <th>Date Published</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading college publications...
                                </td>
                            </tr>
                        ) : publications.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    No verified publications currently on record for this college.
                                </td>
                            </tr>
                        ) : (
                            publications.map((pub) => (
                                <tr key={pub.id}>
                                    <td style={{ maxWidth: '320px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pub.title}</div>
                                        {pub.doi && <div style={{ fontSize: '11px', color: 'var(--primary)' }}>DOI: {pub.doi}</div>}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{pub.author_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pub.gender}</div>
                                    </td>
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
                                    <td>
                                        <span className="badge badge-approved">Approved</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
