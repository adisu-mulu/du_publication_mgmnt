import { Award, Users } from 'lucide-react';

interface ThemesAndResearchersProps {
    themes: {
        topThemes: { theme: string; count: number }[];
        themeByCollege: { college_name: string; theme: string; count: number }[];
    };
    researchers: {
        totalResearchers: number;
        avgPubsPerResearcher: string;
        topResearchers: { author_name: string; college_name: string; publication_count: number }[];
        genderDistribution: { gender: string; count: number }[];
    };
    funding: {
        distribution: { funder_name: string; count: number }[];
        fundingByCollege: { college_name: string; du_funded: number; external_funded: number; not_specified: number }[];
    };
}

export const ThemesAndResearchers = ({
    themes,
    researchers,
    funding
}: ThemesAndResearchersProps) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Research Themes */}
            <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Award size={16} color="var(--primary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                        Top Research Themes
                    </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {themes.topThemes.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No theme data recorded.
                        </div>
                    ) : (
                        themes.topThemes.map((th, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{th.theme}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{th.count}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Researcher Analytics (Aggregated, privacy-preserved) */}
            <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Users size={16} color="var(--primary)" />
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                        Researcher Analytics & Productivity
                    </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unique Researchers</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                            {researchers.totalResearchers}
                        </div>
                    </div>
                    <div style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Pubs / Researcher</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                            {researchers.avgPubsPerResearcher}
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                    Top Publishing Authors
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    {researchers.topResearchers.slice(0, 5).map((r, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{r.author_name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>({r.college_name})</span>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.publication_count}</span>
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                    Gender Representation (Aggregated)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {researchers.genderDistribution.map((g, i) => (
                        <div key={i} style={{
                            flex: 1,
                            padding: '6px 8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{g.gender}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{g.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Research Funding Analytics */}
            <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>
                        Research Funding Analytics
                    </h3>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                    Publications by Funding Source
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {funding.distribution.map((f, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>
                            <span style={{ fontWeight: 500 }}>{f.funder_name}</span>
                            <span style={{ fontWeight: 700, color: f.funder_name === 'Dilla University' ? 'var(--primary)' : 'var(--text-main)' }}>
                                {f.count}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>
                    Funded Publications by College
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {funding.fundingByCollege.slice(0, 5).map((fc, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }} title={fc.college_name}>
                                {fc.college_name}
                            </span>
                            <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>DU: {fc.du_funded}</span>
                                <span style={{ color: 'var(--text-muted)' }}>Other: {fc.external_funded}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
