import React from 'react';

export default function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
    return (
        <div className="empty-state">
            {Icon && <div className="empty-state-icon"><Icon size={48} strokeWidth={1.2} /></div>}
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', maxWidth: '320px' }}>{message}</p>
            {actionLabel && onAction && (
                <button type="button" className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
            )}
        </div>
    );
}
