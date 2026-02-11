import React from 'react';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) {
    if (!open) return null;
    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal card animate-fade" onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '15px' }}>{message}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={onCancel}>{cancelLabel}</button>
                    <button type="button" className={variant === 'danger' ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}
