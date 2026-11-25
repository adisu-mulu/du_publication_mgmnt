import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f1f5f9',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                padding: '36px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '18px',
                        borderRadius: '6px',
                        marginBottom: '12px'
                    }}>
                        DU
                    </div>
                    <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                        Dilla University
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        Publication Management System
                    </p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'var(--badge-rejected-bg)',
                        color: 'var(--badge-rejected-text)',
                        padding: '10px 14px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        marginBottom: '20px',
                        border: '1px solid #fca5a5'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="input-label">University Email <span className="required">*</span></label>
                        <input
                            type="email"
                            required
                            placeholder="username@du.edu.et"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="input-label">Password <span className="required">*</span></label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px' }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-light)', textAlign: 'center' }}>
                    Institutional portal for faculty and research administration.
                </div>
            </div>
        </div>
    );
};

export default Login;
