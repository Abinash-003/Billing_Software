import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billService } from '../services';
import { getData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ReceiptText, Search, Eye, Calendar, X } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 15;

const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const Orders = () => {
    const navigate = useNavigate();
    const { error: toastError } = useToast();
    const [bills, setBills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [detailBill, setDetailBill] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const params = { limit: 200 };
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            if (searchTerm.trim()) params.q = searchTerm.trim();
            const resp = await billService.getHistory(params);
            const data = Array.isArray(getData(resp)) ? getData(resp) : [];
            setBills(data);
            setPage(1);
        } catch (err) {
            toastError(err?.message || 'Failed to load billing history');
            setBills([]);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, searchTerm, toastError]);

    const openBillDetail = useCallback(async (id) => {
        setDetailLoading(true);
        setDetailBill(null);
        try {
            const resp = await billService.getById(id);
            setDetailBill(getData(resp));
        } catch (err) {
            toastError(err?.message || 'Failed to load bill details');
        } finally {
            setDetailLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        const id = setTimeout(fetchBills, searchTerm ? 300 : 0);
        return () => clearTimeout(id);
    }, [fetchBills]);

    const filteredBills = bills;
    const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
    const paginatedBills = filteredBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="animate-fade">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Billing History</h1>
                    <p className="page-subtitle">View sales by date and invoice. Data from sales (created_at).</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/billing')}>
                    <ReceiptText size={20} /> New Sale
                </button>
            </div>

            <div className="card billing-history-card">
                <div className="billing-history-toolbar">
                    <div className="billing-history-filters">
                        <div className="filter-group">
                            <Calendar size={18} aria-hidden />
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" aria-label="From date" />
                        </div>
                        <span className="filter-sep">to</span>
                        <div className="filter-group">
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" aria-label="To date" />
                        </div>
                        <button type="button" className="btn btn-outline" onClick={fetchBills}>Apply</button>
                    </div>
                    <div className="search-wrap">
                        <Search size={18} aria-hidden />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by invoice..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search by invoice"
                        />
                    </div>
                </div>

                <div className="table-wrap">
                    {loading ? (
                        <TableSkeleton rows={8} cols={7} />
                    ) : (
                        <table className="billing-history-table">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Profit</th>
                                    <th style={{ textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="invoice-cell">#{bill.bill_number}</td>
                                        <td>{formatDate(bill.created_at)}</td>
                                        <td>{formatTime(bill.created_at)}</td>
                                        <td className="amount-cell">₹{parseFloat(bill.grand_total || 0).toFixed(2)}</td>
                                        <td>—</td>
                                        <td className="profit-cell">₹{parseFloat(bill.profit || 0).toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button type="button" className="btn btn-outline btn-sm" onClick={() => openBillDetail(bill.id)}>
                                                <Eye size={16} /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredBills.length === 0 && (
                        <div className="billing-history-empty">
                            <EmptyState icon={ReceiptText} title="No bills found" message={searchTerm || dateFrom || dateTo ? 'Try different filters or date range.' : 'Create a sale from Billing Counter.'} actionLabel="New Sale" onAction={() => navigate('/billing')} />
                        </div>
                    )}
                </div>
                {!loading && filteredBills.length > 0 && (
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredBills.length} pageSize={PAGE_SIZE} />
                )}
            </div>

            {detailLoading && (
                <div className="modal-overlay">
                    <div className="card detail-modal"><p>Loading...</p></div>
                </div>
            )}
            {!detailLoading && detailBill && (
                <div className="modal-overlay" onClick={() => setDetailBill(null)}>
                    <div className="card detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-modal-header">
                            <h3>Bill #{detailBill.bill_number}</h3>
                            <button type="button" className="detail-modal-close" onClick={() => setDetailBill(null)} aria-label="Close"><X size={20} /></button>
                        </div>
                        <p className="detail-meta">{formatDate(detailBill.created_at)} · {formatTime(detailBill.created_at)}</p>
                        <p className="detail-customer">{detailBill.customer_name || 'Walk-in'} {detailBill.customer_phone ? ` · ${detailBill.customer_phone}` : ''}</p>
                        <table className="detail-items">
                            <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                            <tbody>
                                {(detailBill.items || []).map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.product_name || row.name}</td>
                                        <td>{row.quantity}</td>
                                        <td>₹{parseFloat(row.subtotal || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="detail-total">Total: ₹{parseFloat(detailBill.grand_total || 0).toFixed(2)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
