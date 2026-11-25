import { useState, type FormEvent } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Globe, Calendar, Hash, Bookmark, Award,
    Save, Loader2, User, Phone, Mail, Users, Search, Activity,
    ArrowLeft, ArrowRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SubmitPublication = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // All fields start empty without any default values
    const [formData, setFormData] = useState({
        // Section 1: Author Info
        author_name: '',
        gender: '',
        author_phone: '',
        author_email: '',
        theme: '',

        // Section 2: Article Info
        title: '',
        type: '',
        date_published: '',

        // Section 3: Journal & Indexing
        journal_name: '',
        doi: '',
        indexing: '',
        quartile: '',
        funder: ''
    });

    const validateStep = (step: number): boolean => {
        setError('');
        if (step === 1) {
            if (!formData.author_name.trim()) {
                setError('Name of the author is required.');
                return false;
            }
            if (!formData.gender) {
                setError('Gender is required.');
                return false;
            }
            if (!formData.author_phone.trim()) {
                setError("Author's phone number is required.");
                return false;
            }
            if (!formData.author_email.trim()) {
                setError("Author's email address is required.");
                return false;
            }
            if (!formData.theme) {
                setError('Theme of the author is required.');
                return false;
            }
        } else if (step === 2) {
            if (!formData.title.trim()) {
                setError('Title of the published article is required.');
                return false;
            }
            if (!formData.type) {
                setError('Type of article is required.');
                return false;
            }
            if (!formData.date_published) {
                setError('Date of publication is required.');
                return false;
            }
        } else if (step === 3) {
            if (!formData.journal_name.trim()) {
                setError('Name of the published journal is required.');
                return false;
            }
            if (!formData.doi.trim()) {
                setError('DOI (Digital Object Identifier) is required.');
                return false;
            }
            if (!formData.indexing) {
                setError('Journal indexing is required.');
                return false;
            }
            if (!formData.quartile) {
                setError('Quartile ranking is required.');
                return false;
            }
            if (!formData.funder) {
                setError('Funder selection is required.');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3);
        }
    };

    const handleBack = () => {
        setError('');
        setCurrentStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

        setError('');
        setLoading(true);

        try {
            await api.post('/researcher/publications', formData);
            alert('Publication registered successfully and submitted for officer verification.');
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit publication.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Author Information' },
        { num: 2, title: 'Article Details' },
        { num: 3, title: 'Journal & Indexing' }
    ];

    return (
        <div style={{ width: '100%' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-secondary btn-sm"
                    style={{ marginBottom: '12px' }}
                >
                    <ArrowLeft size={14} /> Back to My Publications
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                    Register Publication — {user?.collegeName || 'Dilla University'}
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Step {currentStep} of 3: All fields are required.
                </p>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {steps.map((s) => {
                        const isDone = currentStep > s.num;
                        const isCurrent = currentStep === s.num;
                        return (
                            <div
                                key={s.num}
                                onClick={() => {
                                    if (s.num < currentStep) setCurrentStep(s.num as 1 | 2 | 3);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flex: 1,
                                    cursor: s.num < currentStep ? 'pointer' : 'default',
                                    opacity: isCurrent || isDone ? 1 : 0.6
                                }}
                            >
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: isDone ? '#10b981' : (isCurrent ? 'var(--primary)' : '#e2e8f0'),
                                    color: isDone || isCurrent ? '#ffffff' : 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    flexShrink: 0
                                }}>
                                    {isDone ? <CheckCircle2 size={16} /> : s.num}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--primary)' : 'var(--text-main)' }}>
                                    {s.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div style={{
                    backgroundColor: 'var(--badge-rejected-bg)',
                    color: 'var(--badge-rejected-text)',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    marginBottom: '20px',
                    border: '1px solid #fca5a5'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card" style={{ padding: '28px' }}>
                {/* SECTION 1: Author Information */}
                {currentStep === 1 && (
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            1. Author Information (All fields required)
                        </div>

                        <div className="grid-responsive-3" style={{ marginBottom: '20px' }}>
                            <div>
                                <label className="input-label"><User size={13} style={{ display: 'inline', marginRight: '4px' }} /> Name of the Author <span className="required">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Full name"
                                    value={formData.author_name}
                                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="input-label"><Users size={13} style={{ display: 'inline', marginRight: '4px' }} /> Gender <span className="required">*</span></label>
                                <select
                                    required
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label"><Phone size={13} style={{ display: 'inline', marginRight: '4px' }} /> Author's Phone Number <span className="required">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="+251 ..."
                                    value={formData.author_phone}
                                    onChange={(e) => setFormData({ ...formData, author_phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid-responsive-2" style={{ marginBottom: '24px' }}>
                            <div>
                                <label className="input-label"><Mail size={13} style={{ display: 'inline', marginRight: '4px' }} /> Author's Email Address <span className="required">*</span></label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@example.com"
                                    value={formData.author_email}
                                    onChange={(e) => setFormData({ ...formData, author_email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="input-label"><Bookmark size={13} style={{ display: 'inline', marginRight: '4px' }} /> Theme of the Author <span className="required">*</span></label>
                                <select
                                    required
                                    value={formData.theme}
                                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
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
                )}

                {/* SECTION 2: Article Details */}
                {currentStep === 2 && (
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            2. Article Details (All fields required)
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label className="input-label"><FileText size={13} style={{ display: 'inline', marginRight: '4px' }} /> Title of the Published Article <span className="required">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="Enter the full title of your article"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid-responsive-2" style={{ marginBottom: '24px' }}>
                            <div>
                                <label className="input-label"><Award size={13} style={{ display: 'inline', marginRight: '4px' }} /> Types of Article <span className="required">*</span></label>
                                <select
                                    required
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="">Select Article Type</option>
                                    <option value="Full Length Article">Full Length Article</option>
                                    <option value="Review Article">Review Article</option>
                                    <option value="Short Communication">Short Communication</option>
                                    <option value="Case Study">Case Study</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label"><Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} /> Date of Publication <span className="required">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date_published}
                                    onChange={(e) => setFormData({ ...formData, date_published: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* SECTION 3: Journal & Indexing Details */}
                {currentStep === 3 && (
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            3. Journal & Ranking Details (All fields required)
                        </div>

                        <div className="grid-responsive-2" style={{ marginBottom: '20px' }}>
                            <div>
                                <label className="input-label"><Globe size={13} style={{ display: 'inline', marginRight: '4px' }} /> Name of the Published Journal <span className="required">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Full journal name"
                                    value={formData.journal_name}
                                    onChange={(e) => setFormData({ ...formData, journal_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="input-label"><Hash size={13} style={{ display: 'inline', marginRight: '4px' }} /> DOI (Digital Object Identifier) <span className="required">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="https://doi.org/..."
                                    value={formData.doi}
                                    onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid-responsive-2" style={{ marginBottom: '20px' }}>
                            <div>
                                <label className="input-label"><Search size={13} style={{ display: 'inline', marginRight: '4px' }} /> Journal is Indexed in <span className="required">*</span></label>
                                <select
                                    required
                                    value={formData.indexing}
                                    onChange={(e) => setFormData({ ...formData, indexing: e.target.value })}
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
                                <label className="input-label"><Activity size={13} style={{ display: 'inline', marginRight: '4px' }} /> Quartile <span className="required">*</span></label>
                                <select
                                    required
                                    value={formData.quartile}
                                    onChange={(e) => setFormData({ ...formData, quartile: e.target.value })}
                                >
                                    <option value="">Select Quartile</option>
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label className="input-label"><Bookmark size={13} style={{ display: 'inline', marginRight: '4px' }} /> Funder <span className="required">*</span></label>
                            <select
                                required
                                value={formData.funder}
                                onChange={(e) => setFormData({ ...formData, funder: e.target.value })}
                            >
                                <option value="">Select Funder</option>
                                <option value="Dilla University">Dilla University</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Bottom Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '20px',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div>
                        {currentStep > 1 && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                <ArrowLeft size={14} /> Back
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {currentStep < 3 ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                            >
                                Next Section <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ minWidth: '180px' }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                {loading ? 'Submitting...' : 'Submit Publication'}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
