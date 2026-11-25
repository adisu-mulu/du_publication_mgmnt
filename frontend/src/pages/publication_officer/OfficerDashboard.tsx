import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
    DashboardFilters,
    type FilterState
} from '../../components/dashboard/DashboardFilters';
import { DashboardKpiCard } from '../../components/dashboard/DashboardKpiCard';
import { PublicationTrends } from '../../components/dashboard/PublicationTrends';
import { CollegePerformance } from '../../components/dashboard/CollegePerformance';
import { VisibilityAndQuality } from '../../components/dashboard/VisibilityAndQuality';
import { ThemesAndResearchers } from '../../components/dashboard/ThemesAndResearchers';
// import { RepositoryCompleteness } from '../../components/dashboard/RepositoryCompleteness';
// import { RecentPublicationsTable } from '../../components/dashboard/RecentPublicationsTable';
import {
    BookOpen,
    Calendar,
    Globe,
    Award,
    Sparkles,
    Users,
    Building2,
    Hash,
    X
} from 'lucide-react';

export const OfficerDashboard = () => {
    const { user, activeRole } = useAuth();
    const isViceDean = activeRole === 'vice_dean';
    const viceDeanCollegeId = isViceDean && user?.collegeId ? String(user.collegeId) : '';

    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [selectedDetailPub, setSelectedDetailPub] = useState<any | null>(null);

    // Global Filters State
    const [filters, setFilters] = useState<FilterState>({
        year: '',
        collegeId: viceDeanCollegeId,
        type: '',
        indexing: '',
        quartile: '',
        theme: ''
    });

    useEffect(() => {
        if (viceDeanCollegeId && filters.collegeId !== viceDeanCollegeId) {
            setFilters(prev => ({ ...prev, collegeId: viceDeanCollegeId }));
        }
    }, [viceDeanCollegeId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/publication-officer/analytics', {
                params: {
                    year: filters.year || undefined,
                    collegeId: filters.collegeId || undefined,
                    type: filters.type || undefined,
                    indexing: filters.indexing || undefined,
                    quartile: filters.quartile || undefined,
                    theme: filters.theme || undefined
                }
            });
            setAnalytics(res.data);
        } catch (err: any) {
            console.error('Failed to load publication analytics', err);
            setError(err.response?.data?.message || 'Failed to load research publication analytics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            year: '',
            collegeId: viceDeanCollegeId,
            type: '',
            indexing: '',
            quartile: '',
            theme: ''
        });
    };

    const handleSelectCollege = (collegeId: number) => {
        if (!isViceDean) {
            setFilters(prev => ({ ...prev, collegeId: String(collegeId) }));
        }
    };

    // const handleFilterByQualityIssue = (issueType: string) => {
    //     if (issueType === 'missing_quartile') {
    //         setFilters(prev => ({ ...prev, quartile: 'Unranked' }));
    //     } else if (issueType === 'missing_indexing') {
    //         setFilters(prev => ({ ...prev, indexing: 'Unindexed' }));
    //     }
    // };

    const kpis = analytics?.kpis || {};
    const trends = analytics?.trends || { annual: [], monthly: [], byType: [] };
    const collegeStats = analytics?.collegeStats || [];
    const visibility = analytics?.visibility || { byIndexing: [], quartileDist: [], topJournals: [], q1Q2ByCollege: [] };
    const themes = analytics?.themes || { topThemes: [], themeByCollege: [] };
    const researchers = analytics?.researchers || { totalResearchers: 0, avgPubsPerResearcher: '0', topResearchers: [], genderDistribution: [] };
    const funding = analytics?.funding || { distribution: [], fundingByCollege: [] };
    // const completeness = analytics?.completeness || {
    //     total_records: 0, missing_doi: 0, missing_journal: 0, missing_date: 0,
    //     missing_indexing: 0, missing_quartile: 0, incomplete_author: 0,
    //     doi_pct: '100', journal_pct: '100', date_pct: '100',
    //     indexing_pct: '100', quartile_pct: '100', author_pct: '100'
    // };
    const filterOptions = analytics?.filterOptions || { years: [], colleges: [], types: [], indexings: [], themes: [] };

    return (
        <div>
            {/* A. Dashboard Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
                            Research Publications Dashboard
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                            University-wide research output and repository analytics • Dilla University
                        </p>
                    </div>

                    <div style={{
                        padding: '6px 14px',
                        backgroundColor: '#e0e7ff',
                        color: 'var(--primary)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <Calendar size={14} />
                        <span>Academic / Reporting Year: {filters.year || analytics?.targetYear || new Date().getFullYear()}</span>
                    </div>
                </div>
            </div>

            {/* Global Filters */}
            <DashboardFilters
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                lockCollege={isViceDean}
                lockedCollegeName={user?.collegeName}
            />

            {error && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '20px'
                }}>
                    {error}
                </div>
            )}

            {loading && !analytics ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading university repository analytics...
                </div>
            ) : (
                <>
                    {/* B. KPI Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '14px',
                        marginBottom: '24px'
                    }}>
                        <DashboardKpiCard
                            label="TOTAL PUBLICATIONS"
                            value={kpis.total_publications || 0}
                            subtitle="Total verified records in repository"
                            icon={BookOpen}
                            color="#1e3a8a"
                        />
                        <DashboardKpiCard
                            label={`PUBLICATIONS (${filters.year || analytics?.targetYear || new Date().getFullYear()})`}
                            value={kpis.publications_this_year || 0}
                            subtitle="Published in selected target year"
                            icon={Calendar}
                            color="#2563eb"
                            growthPct={kpis.growth_pct}
                        />
                        <DashboardKpiCard
                            label="INDEXED PUBLICATIONS"
                            value={kpis.indexed_publications || 0}
                            subtitle="Scopus, WoS, PubMed, Ajole, MoE"
                            icon={Globe}
                            color="#059669"
                        />
                        <DashboardKpiCard
                            label="Q1 PUBLICATIONS"
                            value={kpis.q1_publications || 0}
                            subtitle="Top 25% quartile ranking journals"
                            icon={Award}
                            color="#10b981"
                        />
                        <DashboardKpiCard
                            label="Q1 + Q2 COMBINED"
                            value={kpis.q1_q2_publications || 0}
                            subtitle="High impact scholarly output"
                            icon={Sparkles}
                            color="#7c3aed"
                        />
                        <DashboardKpiCard
                            label="UNIQUE RESEARCHERS"
                            value={kpis.unique_researchers || 0}
                            subtitle="Contributing faculty & researchers"
                            icon={Users}
                            color="#d97706"
                        />
                        <DashboardKpiCard
                            label="COLLEGES REPRESENTED"
                            value={kpis.colleges_represented || 0}
                            subtitle="Active contributing academic colleges"
                            icon={Building2}
                            color="#475569"
                        />
                        <DashboardKpiCard
                            label="PUBLICATIONS WITH DOI"
                            value={kpis.with_doi_count || 0}
                            subtitle={`${kpis.doi_pct}% identifier completeness`}
                            icon={Hash}
                            color="#0891b2"
                        />
                    </div>

                    {/* C. Publication Output Trends */}
                    <PublicationTrends
                        annual={trends.annual}
                        monthly={trends.monthly}
                        byType={trends.byType}
                    />

                    {/* D. College Research Performance */}
                    <CollegePerformance
                        colleges={collegeStats}
                        onSelectCollege={handleSelectCollege}
                    />

                    {/* E. Scholarly Visibility & Journal Quality */}
                    <VisibilityAndQuality
                        byIndexing={visibility.byIndexing}
                        quartileDist={visibility.quartileDist}
                        topJournals={visibility.topJournals}
                        q1Q2ByCollege={visibility.q1Q2ByCollege}
                    />

                    {/* F, G, H. Themes, Researchers, and Funding */}
                    <ThemesAndResearchers
                        themes={themes}
                        researchers={researchers}
                        funding={funding}
                    />

                    {/* I. Repository Data Quality & Completeness */}
                    {/* <RepositoryCompleteness
                        completeness={completeness}
                        onFilterByQualityIssue={handleFilterByQualityIssue}
                    /> */}

                    {/* J. Recent Publications Table */}
                    {/* <RecentPublicationsTable
                        globalFilters={filters}
                        onViewPublication={(pub) => setSelectedDetailPub(pub)}
                    /> */}
                </>
            )}

            {/* Publication Detail View Modal */}
            {selectedDetailPub && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '750px' }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Publication Record Details</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {selectedDetailPub.college_name || 'Dilla University'}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDetailPub(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Article Title</div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                                    {selectedDetailPub.title}
                                </div>
                            </div>

                            <div className="grid-responsive-3" style={{ marginBottom: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Primary Author</div>
                                    <div style={{ fontWeight: 500 }}>{selectedDetailPub.author_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Article Type</div>
                                    <div>{selectedDetailPub.type || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Publication Date</div>
                                    <div>{selectedDetailPub.date_published ? new Date(selectedDetailPub.date_published).toLocaleDateString() : '-'}</div>
                                </div>
                            </div>

                            <div className="grid-responsive-3" style={{ marginBottom: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Published Journal</div>
                                    <div>{selectedDetailPub.journal_name || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Indexing Database</div>
                                    <div>{selectedDetailPub.indexing || 'Unindexed'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quartile Ranking</div>
                                    <div>{selectedDetailPub.quartile || 'Unranked'}</div>
                                </div>
                            </div>

                            <div className="grid-responsive-3" style={{ marginBottom: '14px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Research Theme</div>
                                    <div>{selectedDetailPub.theme || '-'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Funder</div>
                                    <div>{selectedDetailPub.funder || 'Not specified'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DOI</div>
                                    <div>
                                        {selectedDetailPub.doi ? (
                                            <a href={`https://doi.org/${selectedDetailPub.doi}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                                                {selectedDetailPub.doi}
                                            </a>
                                        ) : '-'}
                                    </div>
                                </div>
                            </div>

                            {selectedDetailPub.remark && (
                                <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Verification Remark</div>
                                    <div style={{ fontSize: '13px', marginTop: '3px' }}>{selectedDetailPub.remark}</div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedDetailPub(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
