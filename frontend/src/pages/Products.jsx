import React, { useState, useEffect, useCallback } from 'react';
import { productService, supplierService } from '../services';
import { getData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Package, Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [formData, setFormData] = useState({
        name: '', category: '', barcode: '', price: '', cost_price: '', quantity: '', stocks: '', min_stock_level: '10', unit: 'pcs', gst_percent: '0', distributor_id: ''
    });
    const { isAdmin } = useAuth();
    const { success: toastSuccess, error: toastError } = useToast();

    const fetchSuppliers = useCallback(async () => {
        try {
            const resp = await supplierService.getAll();
            setSuppliers(Array.isArray(getData(resp)) ? getData(resp) : []);
        } catch (_) {}
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await productService.getAll();
            setProducts(getData(resp) || []);
        } catch (err) {
            toastError(err?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
    }, [fetchProducts, fetchSuppliers]);

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category || '',
                barcode: product.barcode || '',
                price: product.price,
                cost_price: product.cost_price ?? '',
                quantity: product.quantity ?? '',
                stocks: product.stocks,
                min_stock_level: product.min_stock_level ?? '10',
                unit: product.unit || 'pcs',
                gst_percent: product.gst_percent ?? '0',
                distributor_id: product.distributor_id ?? ''
            });
        } else {
            setEditingProduct(null);
            setFormData({ name: '', category: '', barcode: '', price: '', cost_price: '', quantity: '', stocks: '0', min_stock_level: '10', unit: 'pcs', gst_percent: '0', distributor_id: '' });
        }
        setFormErrors({});
        setIsModalOpen(true);
    };

    const validateForm = () => {
        const err = {};
        if (!formData.name?.trim()) err.name = 'Product name is required';
        if (!formData.category?.trim()) err.category = 'Category is required';
        if (formData.price === '' || formData.price == null) err.price = 'Selling price is required';
        if (parseFloat(formData.price) < 0) err.price = 'Price cannot be negative';
        setFormErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        const payload = {
            name: formData.name.trim(),
            category: formData.category.trim(),
            price: formData.price,
            quantity: formData.quantity || 0,
            stocks: editingProduct ? formData.stocks : (formData.stocks || 0),
            unit: formData.unit,
            gst_percent: formData.gst_percent || 0
        };
        try {
            if (editingProduct) {
                await productService.update(editingProduct.id, payload);
                toastSuccess('Product updated successfully');
            } else {
                await productService.create(payload);
                toastSuccess('Product added successfully');
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) {
            toastError(err?.message || 'Failed to save product');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirmId) return;
        try {
            await productService.delete(deleteConfirmId);
            toastSuccess('Product deleted');
            fetchProducts();
            setDeleteConfirmId(null);
        } catch (err) {
            toastError(err?.message || 'Failed to delete product');
            setDeleteConfirmId(null);
        }
    };

    const filteredProducts = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Products</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage product catalog, barcode, price, and stock.</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} /> Add New Entry
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            style={{ paddingLeft: '48px', background: 'var(--input-bg)', border: '1px solid var(--border)' }}
                            placeholder="Search by name or category..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <TableSkeleton rows={8} cols={isAdmin ? 6 : 5} />
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '32px' }}>Product Details</th>
                                    <th>Category</th>
                                    <th>Unit Price</th>
                                    <th>Quantity</th>
                                    <th>Stocks</th>
                                    {isAdmin && <th style={{ textAlign: 'right', paddingRight: '32px' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProducts.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ paddingLeft: '32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                    <Package size={20} />
                                                </div>
                                                <span style={{ fontWeight: '700', fontSize: '15px' }}>{p.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ padding: '4px 12px', background: 'var(--hover-bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                                                {p.category || '—'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>₹{parseFloat(p.price).toFixed(2)}</td>
                                        <td>
                                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{p.quantity || 0} {p.unit}</span>
                                        </td>
                                        <td>
                                            <span className={`badge ${(p.stocks ?? 0) === 0 ? 'badge-danger' : (p.stocks ?? 0) < 10 ? 'badge-warning' : 'badge-success'}`} style={{ padding: '6px 14px' }}>
                                                {(p.stocks ?? 0) === 0 ? 'Out of Stock' : (p.stocks ?? 0) < 10 ? 'Low Stock' : 'In Stock'}
                                            </span>
                                            <span style={{ marginLeft: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>({(p.stocks ?? 0)})</span>
                                        </td>
                                        {isAdmin && (
                                            <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button type="button" onClick={() => handleOpenModal(p)} className="btn btn-outline" style={{ padding: '8px', border: 'none', background: 'transparent' }}><Edit2 size={16} color="var(--primary)" /></button>
                                                    <button type="button" onClick={() => setDeleteConfirmId(p.id)} className="btn btn-outline" style={{ padding: '8px', border: 'none', background: 'transparent' }}><Trash2 size={16} color="var(--danger)" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && filteredProducts.length === 0 && (
                        <div style={{ padding: '48px 24px' }}>
                            <EmptyState icon={Package} title="No products found" message={searchTerm ? 'Try a different search term.' : 'Add your first product to get started.'} actionLabel={isAdmin ? 'Add Product' : undefined} onAction={isAdmin ? () => handleOpenModal() : undefined} />
                        </div>
                    )}
                </div>
                {!loading && filteredProducts.length > 0 && (
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredProducts.length} pageSize={PAGE_SIZE} />
                )}
            </div>

            <ConfirmModal open={!!deleteConfirmId} title="Delete product" message="Are you sure you want to delete this product? This cannot be undone." confirmLabel="Delete" onConfirm={handleDeleteConfirm} onCancel={() => setDeleteConfirmId(null)} variant="danger" />

            {/* Premium Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card animate-fade" style={{ width: '500px', backgroundColor: 'white', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{editingProduct ? 'Update Product' : 'Register New Product'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                            <div className="form-group">
                                <label>Product Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Organic Milk 1L" style={{ borderColor: formErrors.name ? 'var(--danger)' : undefined }} />
                                {formErrors.name && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{formErrors.name}</p>}
                            </div>
                            <div className="form-group">
                                <label>Barcode (optional)</label>
                                <input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan or enter barcode" />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Dairy" style={{ borderColor: formErrors.category ? 'var(--danger)' : undefined }} />
                                {formErrors.category && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{formErrors.category}</p>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Cost Price (₹)</label>
                                    <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Selling Price (₹)</label>
                                    <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" style={{ borderColor: formErrors.price ? 'var(--danger)' : undefined }} />
                                    {formErrors.price && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>{formErrors.price}</p>}
                                </div>
                                <div className="form-group">
                                    <label>Stocks</label>
                                    <input type="text" readOnly value={editingProduct ? (formData.stocks ?? '') : '0'} style={{ background: 'var(--hover-bg)', cursor: 'not-allowed', color: 'var(--text-muted)' }} />
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Updated automatically when you Receive Stock or make a sale.</p>
                                </div>
                                <div className="form-group">
                                    <label>Min. stock level</label>
                                    <input type="number" value={formData.min_stock_level} onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })} placeholder="10" />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Quantity per Unit</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="Content (e.g. 500)" style={{ flex: 1 }} />
                                        <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} style={{ width: '120px', cursor: 'pointer' }}>
                                            <option value="kg">kg</option>
                                            <option value="ltr">ltr</option>
                                            <option value="ml">ml</option>
                                            <option value="packet">packet</option>
                                            <option value="pcs">pcs</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Assign distributor</label>
                                    <select value={formData.distributor_id} onChange={e => setFormData({ ...formData, distributor_id: e.target.value })} style={{ cursor: 'pointer' }}>
                                        <option value="">— None —</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>GST %</label>
                                <input type="number" step="0.01" value={formData.gst_percent} onChange={e => setFormData({ ...formData, gst_percent: e.target.value })} placeholder="0" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '14px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px', justifyContent: 'center' }}>
                                    {editingProduct ? 'Apply Changes' : 'Add to Inventory'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
