import { useState, useEffect, type FormEvent } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Search, Edit2, Trash2, X } from 'lucide-react';

export const ManageResearchers = () => {
    const { user } = useAuth();
    const [researchers, setResearchers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        department: ''
    });
    const [createError, setCreateError] = useState('');
    const [creating, setCreating] = useState(false);

    // Edit Modal
    const [editTarget, setEditTarget] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        department: '',
        password: ''
    });
    const [editError, setEditError] = useState('');
    const [editing, setEditing] = useState(false);

    const fetchResearchers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/vice-dean/researchers', { params: { search: search || undefined } });
            setResearchers(res.data.data);
        } catch (err) {
            console.error('Failed to load researchers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResearchers();
    }, [search]);

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        setCreateError('');
        setCreating(true);

        try {
            await api.post('/vice-dean/researchers', createForm);
            setIsCreateOpen(false);
            setCreateForm({ full_name: '', email: '', password: '', phone: '', department: '' });
            fetchResearchers();
        } catch (err: any) {
            setCreateError(err.response?.data?.message || 'Failed to create researcher account');
        } finally {
            setCreating(false);
        }
    };

    const handleOpenEdit = (r: any) => {
        setEditTarget(r);
        setEditForm({
            full_name: r.full_name || '',
            email: r.email || '',
            phone: r.phone || '',
            department: r.department || '',
            password: ''
        });
        setEditError('');
    };

    const handleUpdate = async (e: FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;
        setEditError('');
        setEditing(true);

        try {
            await api.put(`/vice-dean/researchers/${editTarget.user_id}`, editForm);
            setEditTarget(null);
            fetchResearchers();
        } catch (err: any) {
            setEditError(err.response?.data?.message || 'Failed to update researcher details');
        } finally {
            setEditing(false);
        }
    };

    const handleDelete = async (r: any) => {
        const confirmMsg = `Are you sure you want to permanently delete the researcher account for "${r.full_name}" (${r.email})? This action cannot be undone.`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await api.delete(`/vice-dean/researchers/${r.user_id}`);
            fetchResearchers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete researcher account');
        }
    };

    const handleToggleStatus = async (researcher: any) => {
        const nextStatus = !researcher.is_active;
        const confirmMsg = nextStatus
            ? `Activate account for ${researcher.full_name}?`
            : `Deactivate account for ${researcher.full_name}?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.patch(`/vice-dean/researchers/${researcher.user_id}/status`, { is_active: nextStatus });
            fetchResearchers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update account status');
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div className="page-header-text">
                    <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                        Manage College Researchers
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        Faculty and researchers belonging to {user?.collegeName || 'your college'}.
                    </p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
                        <UserPlus size={16} /> Add Researcher
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="card filter-toolbar" style={{ marginBottom: '20px' }}>
                <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or department..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                    />
                </div>
            </div>

            {/* Researchers Table */}
            <div className="card table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th>Researcher Name</th>
                            <th>Email Address</th>
                            <th>Department</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                                    Loading researchers...
                                </td>
                            </tr>
                        ) : researchers.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                                    No researcher accounts found in your college.
                                </td>
                            </tr>
                        ) : (
                            researchers.map((r) => (
                                <tr key={r.user_id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.full_name}</td>
                                    <td>{r.email}</td>
                                    <td>{r.department || '-'}</td>
                                    <td>{r.phone || '-'}</td>
                                    <td>
                                        <button
                                            onClick={() => handleToggleStatus(r)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: 0,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            title="Click to toggle status"
                                        >
                                            <span className={`badge ${r.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                                                {r.is_active ? 'Active' : 'Deactivated'}
                                            </span>
                                        </button>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleOpenEdit(r)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px' }}
                                                title="Edit researcher details"
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleDelete(r)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    padding: '4px 8px',
                                                    color: '#ef4444',
                                                    borderColor: '#fca5a5'
                                                }}
                                                title="Delete researcher account"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Researcher Modal */}
            {isCreateOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Add Researcher Account</h3>
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {createError && (
                                    <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '12px' }}>
                                        {createError}
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.full_name}
                                        onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                                        placeholder="Dr. Abebe Bikila"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Institutional Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        placeholder="abebe@du.edu.et"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Initial Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        placeholder="Minimum 6 characters"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.department}
                                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                                        placeholder="e.g. Public Health"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        placeholder="+251 91 123 4567"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Researcher Modal */}
            {editTarget && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Edit Researcher Details</h3>
                            <button
                                onClick={() => setEditTarget(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {editError && (
                                    <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '12px' }}>
                                        {editError}
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Institutional Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.department}
                                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                        placeholder="e.g. Public Health"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="+251 91 123 4567"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                                        Change Password (leave empty to keep current password)
                                    </label>
                                    <input
                                        type="password"
                                        minLength={6}
                                        value={editForm.password}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        placeholder="New password (optional)"
                                        style={{ width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={editing}>
                                    {editing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
