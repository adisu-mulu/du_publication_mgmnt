import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
    year: string;
    collegeId: string;
    type: string;
    indexing: string;
    quartile: string;
    theme: string;
}

interface DashboardFiltersProps {
    filters: FilterState;
    filterOptions: {
        years: number[];
        colleges: { id: number; name: string }[];
        types: string[];
        indexings: string[];
        themes: string[];
    };
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onResetFilters: () => void;
    lockCollege?: boolean;
    lockedCollegeName?: string;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
    filters,
    filterOptions,
    onFilterChange,
    onResetFilters,
    lockCollege = false,
    lockedCollegeName
}) => {
    return (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
                    <Filter size={15} color="var(--primary)" />
                    <span>Global Repository Filters</span>
                </div>
                <button
                    onClick={onResetFilters}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <RotateCcw size={12} /> Reset Filters
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '12px'
            }}>
                {/* Publication Year */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        PUBLICATION YEAR
                    </label>
                    <select
                        value={filters.year}
                        onChange={(e) => onFilterChange('year', e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                    >
                        <option value="">All Years</option>
                        {filterOptions.years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* College */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        COLLEGE {lockCollege && '(Assigned College)'}
                    </label>
                    <select
                        value={filters.collegeId}
                        onChange={(e) => onFilterChange('collegeId', e.target.value)}
                        disabled={lockCollege}
                        style={{
                            fontSize: '12px',
                            padding: '6px 10px',
                            width: '100%',
                            backgroundColor: lockCollege ? '#f1f5f9' : '#ffffff',
                            cursor: lockCollege ? 'not-allowed' : 'default',
                            color: lockCollege ? 'var(--primary)' : 'inherit',
                            fontWeight: lockCollege ? 600 : 'normal'
                        }}
                    >
                        {lockCollege ? (
                            <option value={filters.collegeId}>
                                {lockedCollegeName || filterOptions.colleges.find(c => String(c.id) === String(filters.collegeId))?.name || 'My College'}
                            </option>
                        ) : (
                            <>
                                <option value="">All Colleges</option>
                                {filterOptions.colleges.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </>
                        )}
                    </select>
                </div>

                {/* Publication Type */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        PUBLICATION TYPE
                    </label>
                    <select
                        value={filters.type}
                        onChange={(e) => onFilterChange('type', e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                    >
                        <option value="">All Types</option>
                        {filterOptions.types.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Indexing Database */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        INDEXING
                    </label>
                    <select
                        value={filters.indexing}
                        onChange={(e) => onFilterChange('indexing', e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                    >
                        <option value="">All Indexing</option>
                        {filterOptions.indexings.map((idx) => (
                            <option key={idx} value={idx}>{idx}</option>
                        ))}
                    </select>
                </div>

                {/* Quartile */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        JOURNAL QUARTILE
                    </label>
                    <select
                        value={filters.quartile}
                        onChange={(e) => onFilterChange('quartile', e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                    >
                        <option value="">All Quartiles</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                    </select>
                </div>

                {/* Research Theme */}
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        RESEARCH THEME
                    </label>
                    <select
                        value={filters.theme}
                        onChange={(e) => onFilterChange('theme', e.target.value)}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                    >
                        <option value="">All Themes</option>
                        {filterOptions.themes.map((th) => (
                            <option key={th} value={th}>{th}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
