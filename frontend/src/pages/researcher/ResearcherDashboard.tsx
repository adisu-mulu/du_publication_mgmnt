import { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Search, FileText, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ResearcherDashboard = () => {
    const [publications, setPublications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchMyPublications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/researcher/publications', { params: { search: searchTerm } });
            setPublications(res.data.data);
        } catch (err) {
            console.error('Failed to load researcher publications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyPublications();
    }, [searchTerm]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this publication?')) return;
        try {
            await api.delete(`/researcher/publications/${id}`);
            fetchMyPublications();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete publication');
        }
    };

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-text">
                    <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>My Publication Submissions</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        Track verification status and manage your submitted academic works.
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/publications/submit')}>
                        <Plus size={16} /> Submit New Publication
                    </button>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="card filter-toolbar">
                <div className="search-input-wrapper">
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by title, author, or journal..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Article Details</th>
                            <th>Author Information</th>
                            <th>Journal & Indexing</th>
                            <th>Funder</th>
                            <th>Date Published</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading your publications...
                                </td>
                            </tr>
                        ) : publications.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    <FileText size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                                    <div style={{ fontWeight: 600 }}>No publications found</div>
                                    <div style={{ fontSize: '12px', marginTop: '4px' }}>Submit your academic publications to register them in the university database.</div>
                                </td>
                            </tr>
                        ) : (
                            publications.map((pub) => (
                                <tr key={pub.id}>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                                            {pub.title}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {pub.type} {pub.theme ? `• ${pub.theme}` : ''}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{pub.author_name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pub.gender} {pub.author_phone ? `• ${pub.author_phone}` : ''}
                                        </div>
                                        {pub.author_email && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                                                {pub.author_email}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{pub.journal_name || '-'}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {pub.indexing || 'Unindexed'} {pub.quartile ? `• ${pub.quartile}` : ''}
                                        </div>
                                        {pub.doi && (
                                            <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px' }}>
                                                DOI: {pub.doi}
                                            </div>
                                        )}
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
                                        <span className={`badge badge-${pub.status}`}>
                                            {pub.status}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '200px', fontSize: '12px' }}>
                                        {pub.remark || pub.reviewer_comment ? (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: pub.status === 'rejected' ? '#991b1b' : 'var(--text-main)' }}>
                                                {pub.status === 'rejected' && <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />}
                                                <span>{pub.remark || pub.reviewer_comment}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--text-light)' }}>-</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {pub.status !== 'approved' && (
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDelete(pub.id)}
                                                style={{ color: '#ef4444' }}
                                                title="Delete record"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
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
