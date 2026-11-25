import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
    Check, X, Edit3, Search, Filter, User, Users, Phone, Mail,
    Bookmark, FileText, Award, Calendar, Globe, Hash, Activity
} from 'lucide-react';

export const PendingPublications = () => {
    const { activeRole } = useAuth();

    if (activeRole !== 'publication_officer') {
        return <Navigate to="/dashboard" replace />;
    }

    const [publications, setPublications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [search, setSearch] = useState('');

    // Modal state for verification
    const [selectedPub, setSelectedPub] = useState<any | null>(null);
    const [reviewAction, setReviewAction] = useState<'approve' | 'approve_with_modification' | 'reject'>('approve');
    const [remark, setRemark] = useState('');
    const [modifiedFields, setModifiedFields] = useState<any>({});
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await api.get('/publication-officer/publications', {
                params: {
                    status: statusFilter || undefined,
                    search: search || undefined
                }
            });
            setPublications(res.data.data);
        } catch (err) {
            console.error('Failed to load officer queue', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, [statusFilter, search]);

    const handleOpenReview = (pub: any) => {
        setSelectedPub(pub);
        setReviewAction('approve');
        setRemark(pub.remark || pub.reviewer_comment || '');
        setModifiedFields({
            // Section 1: Author Details
            author_name: pub.author_name || '',
            gender: pub.gender || 'Male',
            author_phone: pub.author_phone || '',
            author_email: pub.author_email || '',
            theme: pub.theme || '',

            // Section 2: Article Details
            title: pub.title || '',
            type: pub.type || '',
            date_published: pub.date_published ? pub.date_published.split('T')[0] : '',

            // Section 3: Journal & Indexing
            journal_name: pub.journal_name || '',
            doi: pub.doi || '',
            indexing: pub.indexing || '',
            quartile: pub.quartile || '',
            funder: pub.funder || 'Dilla University'
        });
        setReviewError('');
    };

    const handleReviewSubmit = async () => {
        if (!selectedPub) return;
        if (reviewAction === 'reject' && !remark.trim()) {
            setReviewError('A remark is mandatory when rejecting a publication.');
            return;
        }

        setSubmittingReview(true);
        setReviewError('');

        try {
            await api.post(`/publication-officer/publications/${selectedPub.id}/review`, {
                action: reviewAction,
                remark: remark,
                modified_fields: reviewAction === 'approve_with_modification' ? modifiedFields : undefined
            });
            setSelectedPub(null);
            fetchQueue();
        } catch (err: any) {
            setReviewError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                    Publication Verification Queue
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Verify authenticity of submitted publications across all colleges. Approve directly, modify and approve, or reject with mandatory remarks.
                </p>
            </div>

            {/* Filter bar */}
            <div className="card filter-toolbar">
                <div className="search-input-wrapper">
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search title, author, or journal..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                    />
                </div>

                <div className="filter-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <Filter size={14} color="var(--text-muted)" />
                        <label style={{ fontSize: '13px', fontWeight: 500 }}>Status:</label>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '160px' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending Verification</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
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
                            <th>College</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Remarks</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading verification queue...
                                </td>
                            </tr>
                        ) : publications.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    No publications found matching your filter criteria.
                                </td>
                            </tr>
                        ) : (
                            publications.map((pub) => (
                                <tr key={pub.id}>
                                    <td style={{ maxWidth: '280px' }}>
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
                                    <td>{pub.college_name}</td>
                                    <td>{pub.date_published ? new Date(pub.date_published).toLocaleDateString() : '-'}</td>
                                    <td>
                                        <span className={`badge badge-${pub.status}`}>
                                            {pub.status}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '180px', fontSize: '12px' }}>
                                        {pub.remark || pub.reviewer_comment || <span style={{ color: 'var(--text-light)' }}>-</span>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleOpenReview(pub)}
                                        >
                                            Review / Action
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal with 3 distinct verification actions */}
            {selectedPub && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '820px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Review Publication</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Submitted by {selectedPub.submitter_name} ({selectedPub.college_name})
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPub(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {reviewError && (
                                <div style={{
                                    backgroundColor: 'var(--badge-rejected-bg)',
                                    color: 'var(--badge-rejected-text)',
                                    padding: '10px 14px',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    marginBottom: '16px'
                                }}>
                                    {reviewError}
                                </div>
                            )}

                            {/* 3 Explicit Actions: Approve, Approve with Modification, Reject */}
                            <div style={{ marginBottom: '20px' }}>
                                <label className="input-label">Select Action <span className="required">*</span></label>
                                <div className="grid-responsive-3" style={{ marginBottom: 0 }}>
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('approve')}
                                        className={`btn ${reviewAction === 'approve' ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ justifyContent: 'center' }}
                                    >
                                        <Check size={14} /> Approve Directly
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('approve_with_modification')}
                                        className={`btn ${reviewAction === 'approve_with_modification' ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ justifyContent: 'center' }}
                                    >
                                        <Edit3 size={14} /> Approve with Modification
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReviewAction('reject')}
                                        className={`btn ${reviewAction === 'reject' ? 'btn-danger' : 'btn-secondary'}`}
                                        style={{ justifyContent: 'center' }}
                                    >
                                        <X size={14} /> Reject
                                    </button>
                                </div>
                            </div>

                            {/* Read-only detail view for Approve Directly */}
                            {reviewAction === 'approve' && (
                                <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px', color: 'var(--primary)' }}>
                                        Publication Details (Read-Only Review):
                                    </div>

                                    {/* Section 1: Author Information */}
                                    <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            1. Author Information
                                        </div>
                                        <div className="grid-responsive-3" style={{ marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Name of the Author</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.author_name || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Gender</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.gender || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Phone Number</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.author_phone || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                        </div>
                                        <div className="grid-responsive-2">
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Email Address</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.author_email || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Theme</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.theme || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Article Details */}
                                    <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            2. Article Details
                                        </div>
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Title of the Published Article</div>
                                            <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.title || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                        </div>
                                        <div className="grid-responsive-2">
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Type of Article</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.type || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Date of Publication</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                                                    {selectedPub.date_published
                                                        ? new Date(selectedPub.date_published).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                                                        : <span style={{ color: 'var(--text-light)' }}>—</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Journal & Ranking Details */}
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            3. Journal &amp; Ranking Details
                                        </div>
                                        <div className="grid-responsive-2" style={{ marginBottom: '10px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Name of Published Journal</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.journal_name || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>DOI</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.doi || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                        </div>
                                        <div className="grid-responsive-3">
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Journal Indexed In</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.indexing || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Quartile</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500 }}>{selectedPub.quartile || <span style={{ color: 'var(--text-light)' }}>—</span>}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Funder</div>
                                                <div style={{ fontSize: '14px', fontWeight: 500, color: selectedPub.funder === 'Dilla University' ? 'var(--primary)' : 'var(--text-main)' }}>
                                                    {selectedPub.funder || <span style={{ color: 'var(--text-light)' }}>—</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* All fields grouped in the exact 3 chunking sections of the submission portal */}
                            {reviewAction === 'approve_with_modification' && (
                                <div style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '20px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px', color: 'var(--primary)' }}>
                                        Modify Record Details (All 3 Sections):
                                    </div>

                                    {/* Chunk 1: Author Information */}
                                    <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            1. Author Information
                                        </div>
                                        <div className="grid-responsive-3" style={{ marginBottom: '10px' }}>
                                            <div>
                                                <label className="input-label"><User size={12} style={{ display: 'inline' }} /> Name of the Author</label>
                                                <input
                                                    type="text"
                                                    value={modifiedFields.author_name}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, author_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label"><Users size={12} style={{ display: 'inline' }} /> Gender</label>
                                                <select
                                                    value={modifiedFields.gender}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, gender: e.target.value })}
                                                >
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="input-label"><Phone size={12} style={{ display: 'inline' }} /> Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={modifiedFields.author_phone}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, author_phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid-responsive-2">
                                            <div>
                                                <label className="input-label"><Mail size={12} style={{ display: 'inline' }} /> Email Address</label>
                                                <input
                                                    type="email"
                                                    value={modifiedFields.author_email}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, author_email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label"><Bookmark size={12} style={{ display: 'inline' }} /> Theme</label>
                                                <select
                                                    value={modifiedFields.theme}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, theme: e.target.value })}
                                                >
                                                    <option value="">Select Theme</option>
                                                    <option value="Theme 1">Theme 1</option>
                                                    <option value="Theme 2">Theme 2</option>
                                                    <option value="Theme 3">Theme 3</option>
                                                    <option value="Theme 4">Theme 4</option>
                                                    <option value="Theme 5">Theme 5</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chunk 2: Article Details */}
                                    <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            2. Article Details
                                        </div>
                                        <div style={{ marginBottom: '10px' }}>
                                            <label className="input-label"><FileText size={12} style={{ display: 'inline' }} /> Title of the Published Article</label>
                                            <input
                                                type="text"
                                                value={modifiedFields.title}
                                                onChange={(e) => setModifiedFields({ ...modifiedFields, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid-responsive-2">
                                            <div>
                                                <label className="input-label"><Award size={12} style={{ display: 'inline' }} /> Type of Article</label>
                                                <select
                                                    value={modifiedFields.type}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, type: e.target.value })}
                                                >
                                                    <option value="Full Length Article">Full Length Article</option>
                                                    <option value="Review Article">Review Article</option>
                                                    <option value="Short Communication">Short Communication</option>
                                                    <option value="Case Study">Case Study</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="input-label"><Calendar size={12} style={{ display: 'inline' }} /> Date of Publication</label>
                                                <input
                                                    type="date"
                                                    value={modifiedFields.date_published}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, date_published: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chunk 3: Journal & Ranking Details */}
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            3. Journal & Ranking Details
                                        </div>
                                        <div className="grid-responsive-2" style={{ marginBottom: '10px' }}>
                                            <div>
                                                <label className="input-label"><Globe size={12} style={{ display: 'inline' }} /> Name of Published Journal</label>
                                                <input
                                                    type="text"
                                                    value={modifiedFields.journal_name}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, journal_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label"><Hash size={12} style={{ display: 'inline' }} /> DOI</label>
                                                <input
                                                    type="text"
                                                    value={modifiedFields.doi}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, doi: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid-responsive-2" style={{ marginBottom: '10px' }}>
                                            <div>
                                                <label className="input-label"><Search size={12} style={{ display: 'inline' }} /> Journal is Indexed in</label>
                                                <select
                                                    value={modifiedFields.indexing}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, indexing: e.target.value })}
                                                >
                                                    <option value="">Select Indexing</option>
                                                    <option value="Scopus">Scopus</option>
                                                    <option value="Web of Science">Web of Science</option>
                                                    <option value="PubMed">PubMed</option>
                                                    <option value="Ajole">Ajole</option>
                                                    <option value="MoE">MoE</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="input-label"><Activity size={12} style={{ display: 'inline' }} /> Quartile</label>
                                                <select
                                                    value={modifiedFields.quartile}
                                                    onChange={(e) => setModifiedFields({ ...modifiedFields, quartile: e.target.value })}
                                                >
                                                    <option value="">Select Quartile</option>
                                                    <option value="Q1">Q1</option>
                                                    <option value="Q2">Q2</option>
                                                    <option value="Q3">Q3</option>
                                                    <option value="Q4">Q4</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="input-label"><Bookmark size={12} style={{ display: 'inline' }} /> Funder</label>
                                            <select
                                                value={modifiedFields.funder}
                                                onChange={(e) => setModifiedFields({ ...modifiedFields, funder: e.target.value })}
                                            >
                                                <option value="Dilla University">Dilla University</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Remarks */}
                            <div>
                                <label className="input-label">
                                    Remark
                                    {reviewAction === 'reject' ? <span className="required"> * (Mandatory for rejection)</span> : (reviewAction === 'approve_with_modification' ? ' (Note modifications made)' : ' (Optional note)')}
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder={reviewAction === 'reject' ? 'Explain why this publication is being rejected...' : 'Remark or notes regarding verification...'}
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setSelectedPub(null)}
                                disabled={submittingReview}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`btn ${reviewAction === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={handleReviewSubmit}
                                disabled={submittingReview}
                            >
                                {submittingReview ? 'Processing...' : 'Confirm Decision'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
