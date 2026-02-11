import React, { useState, useMemo } from 'react';
import { X, Download, Search } from 'lucide-react';
import Pagination from './Pagination';

const PAGE_SIZE = 10;

const CsvPreviewModal = ({ onClose, title, headers, rows, filename, onDownload }) => {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filteredRows = useMemo(() => {
        if (!search.trim()) return rows;
        const lower = search.toLowerCase();
        return rows.filter((row) =>
            row.some((cell) => String(cell ?? '').toLowerCase().includes(lower))
        );
    }, [rows, search]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = filteredRows.slice(start, start + PAGE_SIZE);

    const handleDownload = () => {
        if (onDownload) onDownload();
        onClose();
    };

    return (
        <div
            className="confirm-modal-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-modal-title"
        >
            <div
                className="card"
                style={{
                    maxWidth: '90vw',
                    width: '900px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: 0
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}
                >
                    <h2 id="csv-modal-title" style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', maxWidth: '320px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search in preview..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            style={{ paddingLeft: '40px', width: '100%', background: 'var(--input-bg)' }}
                        />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {filteredRows.length} row(s) · Page {page} of {totalPages}
                    </p>
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: '200px' }}>
                    <table>
                        <thead>
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pageRows.length === 0 ? (
                                <tr>
                                    <td colSpan={headers.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        {search ? 'No rows match your search.' : 'No data.'}
                                    </td>
                                </tr>
                            ) : (
                                pageRows.map((row, ri) => (
                                    <tr key={start + ri}>
                                        {row.map((cell, ci) => (
                                            <td key={ci}>{cell != null ? String(cell) : '—'}</td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={filteredRows.length}
                        pageSize={PAGE_SIZE}
                    />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleDownload}>
                            <Download size={18} /> Download {filename || 'CSV'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CsvPreviewModal;
