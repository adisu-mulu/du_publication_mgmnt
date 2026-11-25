interface VisibilityAndQualityProps {
    byIndexing: { indexing_name: string; count: number }[];
    quartileDist: { quartile: string; count: number }[];
    topJournals: { journal_name: string; count: number }[];
    q1Q2ByCollege: { college_name: string; q1_count: number; q2_count: number }[];
}

export const VisibilityAndQuality = ({
    byIndexing,
    quartileDist,
    topJournals,
    q1Q2ByCollege
}: VisibilityAndQualityProps) => {
    const maxIdx = Math.max(...byIndexing.map(b => b.count), 1);
    const totalQuartilePubs = quartileDist.reduce((acc, q) => acc + q.count, 0) || 1;

    return (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>
                    Scholarly Visibility & Journal Quality Analytics
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Indexing verification, journal quartile distribution (Q1–Q4), and top publishing venues.
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Indexing Distribution */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
                        Publications by Indexing Database
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {byIndexing.map((idx, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                                    <span style={{ fontWeight: 500 }}>{idx.indexing_name}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{idx.count}</span>
                                </div>
                                <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.round((idx.count / maxIdx) * 100)}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--primary)',
                                        borderRadius: '4px'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quartile Breakdown */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
                        Journal Quartile Distribution
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {quartileDist.map((q, idx) => {
                            const pct = ((q.count / totalQuartilePubs) * 100).toFixed(1);
                            const badgeColor = q.quartile === 'Q1' ? '#10b981' : (q.quartile === 'Q2' ? '#3b82f6' : (q.quartile === 'Q3' ? '#f59e0b' : '#64748b'));
                            return (
                                <div key={idx} style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    backgroundColor: '#f8fafc'
                                }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: badgeColor }}>
                                        {q.quartile}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                                        {q.count}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {pct}% of repository
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Published Journals */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
                        Top Publishing Venues & Journals
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {topJournals.slice(0, 6).map((j, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                                padding: '6px 8px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '4px'
                            }}>
                                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '210px' }} title={j.journal_name}>
                                    {j.journal_name}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--primary)', minWidth: '30px', textAlign: 'right' }}>
                                    {j.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Q1/Q2 by College */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>
                        Q1 & Q2 Output by College
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {q1Q2ByCollege.slice(0, 6).map((c, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                padding: '6px 8px',
                                borderBottom: '1px solid var(--border)'
                            }}>
                                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={c.college_name}>
                                    {c.college_name}
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '3px', fontWeight: 600 }}>
                                        Q1: {c.q1_count}
                                    </span>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '3px', fontWeight: 600 }}>
                                        Q2: {c.q2_count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
