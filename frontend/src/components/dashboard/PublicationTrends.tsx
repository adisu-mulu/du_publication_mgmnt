import { useState } from 'react';
import { BarChart3, LineChart } from 'lucide-react';

interface PublicationTrendsProps {
    annual: { year: number; count: number }[];
    monthly: { month: string; month_label: string; count: number }[];
    byType: { type: string; count: number }[];
}

export const PublicationTrends = ({ annual, monthly, byType }: PublicationTrendsProps) => {
    const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');

    const trendData = viewMode === 'annual'
        ? annual.map(a => ({ label: String(a.year), count: a.count }))
        : monthly.map(m => ({ label: m.month_label, count: m.count }));

    const maxCount = Math.max(...trendData.map(d => d.count), 1);
    const maxTypeCount = Math.max(...byType.map(t => t.count), 1);

    return (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>
                        Publication Output Trends
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Historical research output tracked by verified publication date
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={() => setViewMode('annual')}
                        className={`btn btn-sm ${viewMode === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '11px' }}
                    >
                        <BarChart3 size={13} /> Annual View
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`btn btn-sm ${viewMode === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '11px' }}
                    >
                        <LineChart size={13} /> Monthly View
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Trend Bar/Line Visualization */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '14px', color: 'var(--text-main)' }}>
                        {viewMode === 'annual' ? 'Annual Publication Output' : 'Monthly Output (Recent Periods)'}
                    </div>

                    {trendData.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No publication trend data available for current filters.
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: viewMode === 'annual' ? '16px' : '8px',
                            height: '180px',
                            paddingTop: '20px',
                            borderBottom: '1px solid var(--border)',
                            overflowX: 'auto'
                        }}>
                            {trendData.map((d, idx) => {
                                const heightPct = Math.round((d.count / maxCount) * 100);
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            flex: '1',
                                            minWidth: viewMode === 'annual' ? '50px' : '45px'
                                        }}
                                        title={`${d.label}: ${d.count} publications`}
                                    >
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
                                            {d.count}
                                        </div>
                                        <div style={{
                                            width: '100%',
                                            maxWidth: '36px',
                                            height: `${Math.max(heightPct, 8)}%`,
                                            backgroundColor: 'var(--primary)',
                                            borderRadius: '3px 3px 0 0',
                                            transition: 'height 0.3s ease'
                                        }} />
                                        <div style={{
                                            fontSize: '10px',
                                            color: 'var(--text-muted)',
                                            marginTop: '6px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%',
                                            textAlign: 'center'
                                        }}>
                                            {d.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Output by Article Type */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '14px', color: 'var(--text-main)' }}>
                        Output by Publication Type
                    </div>

                    {byType.length === 0 ? (
                        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                            No article types recorded.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {byType.map((t, idx) => {
                                const pct = Math.round((t.count / maxTypeCount) * 100);
                                return (
                                    <div key={idx}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{t.type}</span>
                                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.count}</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                backgroundColor: 'var(--primary)',
                                                borderRadius: '4px',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
