import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../services';
import { getData } from '../services/api';
import { Package, Search, AlertTriangle, ArrowRight, ArrowUpDown } from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const MIN_STOCK = 10;
const SORT_OPTIONS = [
    { value: 'stock_asc', label: 'Stock (Low first)' },
    { value: 'stock_desc', label: 'Stock (High first)' },
    { value: 'category', label: 'Category' },
    { value: 'name', label: 'Name' },
];

const Inventory = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState('stock_asc');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await productService.getAll();
            setProducts(Array.isArray(getData(resp)) ? getData(resp) : []);
        } catch (err) {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filtered = products.filter(p => {
        const match = (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
        if (lowStockOnly) return match && ((p.stocks ?? 0) < MIN_STOCK);
        return match;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'stock_asc') return (a.stocks ?? 0) - (b.stocks ?? 0);
        if (sortBy === 'stock_desc') return (b.stocks ?? 0) - (a.stocks ?? 0);
        if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
        return (a.name || '').localeCompare(b.name || '');
    });

    const lowStockCount = products.filter(p => (p.stocks ?? 0) < MIN_STOCK).length;

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Stock Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>View stock levels and low-stock alerts.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/products')} style={{ padding: '10px 18px', fontSize: '14px' }}>
                    Manage Products <ArrowRight size={18} />
                </button>
            </div>

            {lowStockCount > 0 && (
                <div className="card" style={{ marginBottom: '20px', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--danger-soft)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <AlertTriangle size={26} style={{ color: 'var(--danger)' }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', color: 'var(--danger)', marginBottom: '2px' }}>Low stock alert</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lowStockCount} product(s) below {MIN_STOCK} units.</p>
                    </div>
                    <button type="button" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setLowStockOnly(!lowStockOnly)}>
                        {lowStockOnly ? 'Show all' : 'Low stock only'}
                    </button>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            style={{ paddingLeft: '44px', background: 'var(--input-bg)' }}
                            placeholder="Search by name or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowUpDown size={18} color="var(--text-muted)" />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <TableSkeleton rows={8} cols={5} />
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '24px' }}>Product</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Unit</th>
                                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(p => {
                                    const stock = p.stocks ?? 0;
                                    const isLow = stock < MIN_STOCK;
                                    const isOut = stock === 0;
                                    return (
                                        <tr key={p.id} style={{ background: isOut ? 'var(--danger-soft)' : isLow ? 'var(--warning-soft)' : undefined }}>
                                            <td style={{ paddingLeft: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: isOut ? 'var(--danger-soft)' : 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isOut ? 'var(--danger)' : 'var(--primary)' }}>
                                                        <Package size={20} />
                                                    </div>
                                                    <span style={{ fontWeight: '700', color: isOut ? 'var(--danger)' : 'var(--text-main)' }}>{p.name}</span>
                                                </div>
                                            </td>
                                            <td><span style={{ padding: '4px 10px', background: 'var(--hover-bg)', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{p.category || '—'}</span></td>
                                            <td style={{ fontWeight: '700', color: isLow ? 'var(--danger)' : 'var(--text-main)' }}>{stock}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{p.unit || 'pcs'}</td>
                                            <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                                <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                                                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    {!loading && sorted.length === 0 && (
                        <div style={{ padding: '48px 24px' }}>
                            <EmptyState icon={Package} title="No products found" message={searchTerm || lowStockOnly ? 'Try changing search or filter.' : 'Add products in Products page.'} actionLabel="Manage Products" onAction={() => navigate('/products')} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inventory;
