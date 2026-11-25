import { useState } from 'react';
import { ArrowUpDown, ExternalLink } from 'lucide-react';

interface CollegePerformanceProps {
    colleges: {
        college_id: number;
        college_name: string;
        total_publications: number;
        current_year_pubs: number;
        indexed_publications: number;
        q1_publications: number;
        q1_q2_publications: number;
        growth_percentage: string;
    }[];
    onSelectCollege: (collegeId: number) => void;
}

export const CollegePerformance = ({
    colleges,
    onSelectCollege
}: CollegePerformanceProps) => {
    const [sortField, setSortField] = useState<string>('total_publications');
    const [sortAsc, setSortAsc] = useState<boolean>(false);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    const sortedColleges = [...colleges].sort((a: any, b: any) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'growth_percentage') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    // Top colleges for the vertical bar chart (up to 8)
    const chartColleges = [...colleges]
        .sort((a, b) => b.total_publications - a.total_publications)
        .slice(0, 8);

    const maxChartValue = Math.max(
        ...chartColleges.map(c => Math.max(c.total_publications, c.indexed_publications, c.q1_q2_publications)),
        1
    );

    return (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px 0' }}>
                        College Research Performance & Ranking
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Comparative output, indexed visibility, and high-impact publications across academic colleges. Click a bar or table row to filter.
                    </div>
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '6px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#1e3a8a', display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Total Output</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#059669', display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Indexed</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#d97706', display: 'inline-block' }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Q1 / Q2 Impact</span>
                    </div>
                </div>
            </div>

            {/* Vertical Bar Chart */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                    position: 'relative',
                    height: '240px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '16px',
                    padding: '20px 8px 30px 8px',
                    backgroundColor: '#fafbfc',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    overflowX: 'auto'
                }}>
                    {/* Background grid lines */}
                    <div style={{ position: 'absolute', inset: '20px 8px 30px 8px', pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
                        <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
                        <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
                        <div style={{ borderTop: '1px solid #cbd5e1', width: '100%' }} />
                    </div>

                    {chartColleges.map((c) => {
                        const totalHeightPct = Math.round((c.total_publications / maxChartValue) * 100);
                        const indexedHeightPct = Math.round((c.indexed_publications / maxChartValue) * 100);
                        const q1q2HeightPct = Math.round((c.q1_q2_publications / maxChartValue) * 100);

                        return (
                            <div
                                key={c.college_id}
                                onClick={() => onSelectCollege(c.college_id)}
                                style={{
                                    flex: '1 1 0',
                                    minWidth: '85px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                                title={`${c.college_name}\nTotal: ${c.total_publications}\nIndexed: ${c.indexed_publications}\nQ1/Q2: ${c.q1_q2_publications}\nGrowth: ${c.growth_percentage}%`}
                            >
                                {/* Clustered Bars Container */}
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    gap: '4px'
                                }}>
                                    {/* Bar 1: Total */}
                                    <div style={{
                                        width: '18px',
                                        height: `${Math.max(totalHeightPct, 4)}%`,
                                        backgroundColor: '#1e3a8a',
                                        borderRadius: '3px 3px 0 0',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                            marginTop: '2px',
                                            display: totalHeightPct > 15 ? 'block' : 'none'
                                        }}>
                                            {c.total_publications}
                                        </span>
                                    </div>

                                    {/* Bar 2: Indexed */}
                                    <div style={{
                                        width: '18px',
                                        height: `${Math.max(indexedHeightPct, 4)}%`,
                                        backgroundColor: '#059669',
                                        borderRadius: '3px 3px 0 0',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                            marginTop: '2px',
                                            display: indexedHeightPct > 15 ? 'block' : 'none'
                                        }}>
                                            {c.indexed_publications}
                                        </span>
                                    </div>

                                    {/* Bar 3: Q1/Q2 */}
                                    <div style={{
                                        width: '18px',
                                        height: `${Math.max(q1q2HeightPct, 4)}%`,
                                        backgroundColor: '#d97706',
                                        borderRadius: '3px 3px 0 0',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}>
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            color: '#ffffff',
                                            marginTop: '2px',
                                            display: q1q2HeightPct > 15 ? 'block' : 'none'
                                        }}>
                                            {c.q1_q2_publications}
                                        </span>
                                    </div>
                                </div>

                                {/* College Label beneath */}
                                <div style={{
                                    width: '100%',
                                    marginTop: '8px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    textAlign: 'center',
                                    color: 'var(--text-main)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2
                                }} title={c.college_name}>
                                    {c.college_name.replace('College of ', '').replace('Institute of ', 'Inst. ')}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sortable Performance Table */}
            <div className="table-container" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('college_name')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    College Name <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th onClick={() => handleSort('total_publications')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Total Pubs <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th onClick={() => handleSort('current_year_pubs')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    This Year <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th onClick={() => handleSort('indexed_publications')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Indexed <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th onClick={() => handleSort('q1_publications')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Q1 <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th onClick={() => handleSort('q1_q2_publications')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Q1/Q2 <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th onClick={() => handleSort('growth_percentage')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Growth % <ArrowUpDown size={12} />
                                </div>
                            </th>
                            <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedColleges.map((c) => (
                            <tr key={c.college_id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
                                    {c.college_name}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
                                    {c.total_publications}
                                </td>
                                <td style={{ textAlign: 'right' }}>{c.current_year_pubs}</td>
                                <td style={{ textAlign: 'right' }}>{c.indexed_publications}</td>
                                <td style={{ textAlign: 'right' }}>{c.q1_publications}</td>
                                <td style={{ textAlign: 'right', fontWeight: 500 }}>{c.q1_q2_publications}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: Number(c.growth_percentage) >= 0 ? '#10b981' : '#ef4444' }}>
                                    {Number(c.growth_percentage) >= 0 ? `+${c.growth_percentage}%` : `${c.growth_percentage}%`}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => onSelectCollege(c.college_id)}
                                        className="btn btn-secondary btn-sm"
                                        style={{ fontSize: '11px', padding: '3px 8px' }}
                                        title={`View publications from ${c.college_name}`}
                                    >
                                        Filter <ExternalLink size={10} style={{ display: 'inline', marginLeft: '4px' }} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
