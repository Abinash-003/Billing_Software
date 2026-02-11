import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
    if (totalPages <= 1 && !totalItems) return null;
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);

    return (
        <div className="pagination">
            <span className="pagination-info" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {totalItems > 0 ? `Showing ${start}-${end} of ${totalItems}` : 'No items'}
            </span>
            <div className="pagination-buttons">
                <button type="button" className="btn btn-outline pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft size={18} />
                </button>
                <span style={{ padding: '0 12px', fontWeight: '600', fontSize: '14px' }}>{page} / {Math.max(1, totalPages)}</span>
                <button type="button" className="btn btn-outline pagination-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
