import React, { useState, useEffect } from 'react';
import { Search, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';

interface RecentPublicationsTableProps {
    globalFilters: {
        year: string;
        collegeId: string;
        type: string;
        indexing: string;
        quartile: string;
        theme: string;
    };
    onViewPublication: (pub: any) => void;
}

export const RecentPublicationsTable: React.FC<RecentPublicationsTableProps> = ({
    globalFilters,
    onViewPublication
}) => {
    const [publications, setPublications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchPublications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/publication-officer/publications', {
                params: {
                    page,
                    limit: 10,
                    status: 'approved',
                    search: searchTerm || undefined,
                    year: globalFilters.year || undefined,
                    collegeId: globalFilters.collegeId || undefined,
                    type: globalFilters.type || undefined,
                    indexing: globalFilters.indexing || undefined,
                    quartile: globalFilters.quartile || undefined,
                    theme: globalFilters.theme || undefined
                }
            });
            setPublications(res.data.data);
            setTotalPages(res.data.pagination.totalPages || 1);
            setTotalRecords(res.data.pagination.total || 0);
        } catch (err) {
            console.error('Failed to load recent publications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [globalFilters, searchTerm]);

    useEffect(() => {
        fetchPublications();
    }, [page, globalFilters, searchTerm]);

    const handleExportFiltered = () => {
        const queryParams = new URLSearchParams();
        if (globalFilters.collegeId) queryParams.append('collegeId', globalFilters.collegeId);
        if (globalFilters.year) queryParams.append('year', globalFilters.year);
        if (globalFilters.type) queryParams.append('type', globalFilters.type);
        if (searchTerm) queryParams.append('search', searchTerm);

        const url = `http://localhost:5000/api/supervisor/export?${queryParams.toString()}`;
        window.open(url, '_blank');
    };

    return (
        <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>
                        Research Publications Repository Table
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Showing {publications.length} of {totalRecords} records matching current filter selection.
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="search-input-wrapper" style={{ minWidth: '240px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search title, author, DOI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '32px', fontSize: '12px', padding: '6px 10px 6px 30px' }}
                        />
                    </div>
                    <button
                        onClick={handleExportFiltered}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '12px' }}
                        title="Export matching records to CSV"
                    >
                        <Download size={13} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Compact Table */}
            <div className="table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Publication Title</th>
                            <th>Author</th>
                            <th>College</th>
                            <th>Journal Name</th>
                            <th>Type</th>
                            <th>Year</th>
                            <th>Indexing</th>
                            <th>Quartile</th>
                            <th>DOI</th>
                            <th>Theme</th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading matching publications...
                                </td>
                            </tr>
                        ) : publications.length === 0 ? (
                            <tr>
                                <td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                                    No publications match the current filters or search term.
                                </td>
                            </tr>
                        ) : (
                            publications.map((pub) => {
                                const pubYear = pub.date_published ? new Date(pub.date_published).getFullYear() : '-';
                                return (
                                    <tr key={pub.id}>
                                        <td style={{ maxWidth: '240px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pub.title}>
                                                {pub.title}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '12px', fontWeight: 500 }}>
                                            {pub.author_name}
                                        </td>
                                        <td style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pub.college_name}>
                                            {pub.college_name || '-'}
                                        </td>
                                        <td style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pub.journal_name}>
                                            {pub.journal_name || '-'}
                                        </td>
                                        <td style={{ fontSize: '11px' }}>
                                            <span style={{ padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '3px' }}>
                                                {pub.type || '-'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px' }}>{pubYear}</td>
                                        <td style={{ fontSize: '11px', fontWeight: 500 }}>{pub.indexing || 'Unindexed'}</td>
                                        <td>
                                            {pub.quartile ? (
                                                <span className={`badge ${pub.quartile === 'Q1' ? 'badge-approved' : 'badge-pending'}`} style={{ fontSize: '10px' }}>
                                                    {pub.quartile}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '11px' }}>
                                            {pub.doi ? (
                                                <a
                                                    href={`https://doi.org/${pub.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                >
                                                    DOI <ExternalLink size={10} />
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--text-light)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {pub.theme || '-'}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => onViewPublication(pub)}
                                                className="btn btn-secondary btn-sm"
                                                style={{ fontSize: '11px', padding: '3px 8px' }}
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Page {page} of {totalPages}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="btn btn-secondary btn-sm"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="btn btn-secondary btn-sm"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
