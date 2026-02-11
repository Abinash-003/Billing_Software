import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billService } from '../services';
import { getData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ReceiptText, Search } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const Orders = () => {
    const navigate = useNavigate();
    const { error: toastError } = useToast();
    const [bills, setBills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await billService.getRecent();
            setBills(Array.isArray(getData(resp)) ? getData(resp) : []);
        } catch (err) {
            toastError(err?.message || 'Failed to load orders');
            setBills([]);
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    const filteredBills = bills.filter(b =>
        (b.bill_number && b.bill_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.customer_phone && b.customer_phone.includes(searchTerm))
    );
    const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
    const paginatedBills = filteredBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Orders</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>View and track all sales transactions.</p>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/billing')}>
                    <ReceiptText size={20} /> New Sale
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ position: 'relative', maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            style={{ paddingLeft: '48px', background: 'var(--input-bg)' }}
                            placeholder="Search by invoice, customer or phone..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <TableSkeleton rows={6} cols={5} />
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '32px' }}>Invoice</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th style={{ textAlign: 'right', paddingRight: '32px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBills.map((bill) => (
                                <tr key={bill.id}>
                                    <td style={{ paddingLeft: '32px', fontWeight: '700', color: 'var(--primary)' }}>#{bill.bill_number}</td>
                                    <td>
                                        <p style={{ fontWeight: '600', fontSize: '14px' }}>{bill.customer_name || 'Walk-in'}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bill.customer_phone || '—'}</p>
                                    </td>
                                    <td style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                        {new Date(bill.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ fontWeight: '700' }}>₹{parseFloat(bill.grand_total || 0).toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                        <span className="badge badge-success">Completed</span>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredBills.length === 0 && (
                        <div style={{ padding: '48px 24px' }}>
                            <EmptyState icon={ReceiptText} title="No orders found" message={searchTerm ? 'Try a different search.' : 'Create a sale from POS Billing.'} actionLabel="New Sale" onAction={() => navigate('/billing')} />
                        </div>
                    )}
                </div>
                {!loading && filteredBills.length > 0 && (
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredBills.length} pageSize={PAGE_SIZE} />
                )}
            </div>
        </div>
    );
};

export default Orders;
