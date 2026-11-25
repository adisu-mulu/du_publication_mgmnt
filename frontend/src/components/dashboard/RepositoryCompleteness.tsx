import { CheckCircle, AlertTriangle } from 'lucide-react';

interface RepositoryCompletenessProps {
    completeness: {
        total_records: number;
        missing_doi: number;
        missing_journal: number;
        missing_date: number;
        missing_indexing: number;
        missing_quartile: number;
        incomplete_author: number;
        doi_pct: string;
        journal_pct: string;
        date_pct: string;
        indexing_pct: string;
        quartile_pct: string;
        author_pct: string;
    };
    onFilterByQualityIssue: (issueType: string) => void;
}

export const RepositoryCompleteness = ({
    completeness,
    onFilterByQualityIssue
}: RepositoryCompletenessProps) => {
    const indicators = [
        { label: 'DOI Completeness', pct: completeness.doi_pct, missing: completeness.missing_doi, type: 'missing_doi' },
        { label: 'Journal Name Specified', pct: completeness.journal_pct, missing: completeness.missing_journal, type: 'missing_journal' },
        { label: 'Publication Date Specified', pct: completeness.date_pct, missing: completeness.missing_date, type: 'missing_date' },
        { label: 'Indexing Database Verified', pct: completeness.indexing_pct, missing: completeness.missing_indexing, type: 'missing_indexing' },
        { label: 'Quartile Ranking Assigned', pct: completeness.quartile_pct, missing: completeness.missing_quartile, type: 'missing_quartile' },
        { label: 'Author Identity Complete', pct: completeness.author_pct, missing: completeness.incomplete_author, type: 'incomplete_author' }
    ];

    return (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>
                    Repository Data Quality & Completeness
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Metadata validation across all {completeness.total_records} repository records. Click any indicator to inspect affected publications.
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {indicators.map((ind, i) => {
                    const numPct = parseFloat(ind.pct) || 0;
                    const isGood = numPct >= 80;
                    const isWarning = numPct < 80 && numPct >= 50;
                    const statusColor = isGood ? '#10b981' : (isWarning ? '#f59e0b' : '#ef4444');

                    return (
                        <div
                            key={i}
                            onClick={() => onFilterByQualityIssue(ind.type)}
                            style={{
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '12px 14px',
                                backgroundColor: '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className="hover:border-blue-400"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                                    {ind.label}
                                </span>
                                {isGood ? (
                                    <CheckCircle size={14} color="#10b981" />
                                ) : (
                                    <AlertTriangle size={14} color={statusColor} />
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: statusColor }}>
                                    {ind.pct}%
                                </span>
                                <span style={{ fontSize: '11px', color: ind.missing > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                                    {ind.missing} records missing
                                </span>
                            </div>

                            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${numPct}%`,
                                    height: '100%',
                                    backgroundColor: statusColor,
                                    borderRadius: '3px'
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
