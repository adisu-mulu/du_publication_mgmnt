import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface DashboardKpiCardProps {
    label: string;
    value: number | string;
    subtitle: string;
    icon: LucideIcon;
    color?: string;
    growthPct?: string | null;
    onClick?: () => void;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
    label,
    value,
    subtitle,
    icon: Icon,
    color = 'var(--primary)',
    growthPct,
    onClick
}) => {
    return (
        <div
            className="stat-card"
            onClick={onClick}
            style={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="stat-label" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {label}
                </span>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={16} color={color} />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div className="stat-value" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {value}
                </div>
                {growthPct !== undefined && growthPct !== null && (
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: Number(growthPct) >= 0 ? '#10b981' : '#ef4444'
                    }}>
                        {Number(growthPct) >= 0 ? `+${growthPct}%` : `${growthPct}%`} YoY
                    </span>
                )}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {subtitle}
            </div>
        </div>
    );
};
