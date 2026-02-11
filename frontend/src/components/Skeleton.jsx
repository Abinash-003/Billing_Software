import React from 'react';

export function TableSkeleton({ rows = 5, cols = 5 }) {
    return (
        <div className="skeleton-table">
            <div className="skeleton-row skeleton-header">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="skeleton-cell" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="skeleton-row">
                    {Array.from({ length: cols }).map((_, c) => (
                        <div key={c} className="skeleton-cell" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton({ count = 4 }) {
    return (
        <div className="stats-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stat-card skeleton-stat">
                    <div className="skeleton-circle" />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton-line" style={{ width: '60%', marginBottom: '8px' }} />
                        <div className="skeleton-line" style={{ width: '40%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ListSkeleton({ items = 6 }) {
    return (
        <div className="skeleton-list">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="skeleton-list-item">
                    <div className="skeleton-circle" style={{ width: '40px', height: '40px' }} />
                    <div style={{ flex: 1 }}>
                        <div className="skeleton-line" style={{ width: '70%', marginBottom: '6px' }} />
                        <div className="skeleton-line" style={{ width: '40%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
