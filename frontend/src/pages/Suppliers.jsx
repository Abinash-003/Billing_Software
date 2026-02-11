import React, { useState, useEffect } from 'react';
import { supplierService } from '../services';
import { getData } from '../services/api';
import {
    Truck, Plus, Trash2, Edit2, Phone, MapPin, Search, X,
    FileText, Eye, Download, Receipt, Calendar, Hash
} from 'lucide-react';

const DELIVERY_STATUSES = ['Pending', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Paid', 'Partial', 'Unpaid'];

const defaultOrderForm = () => ({
    ordered_date: '',
    delivered_date: '',
    delivery_status: 'Pending',
    invoice_number: '',
    total_amount: '',
    paid_amount: '0',
    balance_amount: '',
    payment_status: 'Unpaid',
    notes: '',
    bill_file_url: ''
});

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '', contact_person: '', phone: '', product_categories: '', address: '', gst_number: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const [profileSupplier, setProfileSupplier] = useState(null);
    const [profileOrders, setProfileOrders] = useState([]);
    const [profileSummary, setProfileSummary] = useState({ total_paid: 0, total_pending: 0, order_count: 0 });
    const [profileLoading, setProfileLoading] = useState(false);

    const [orderModalOpen, setOrderModalOpen] = useState(false);
    const [orderSupplier, setOrderSupplier] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);
    const [orderForm, setOrderForm] = useState(defaultOrderForm());
    const [orderSaving, setOrderSaving] = useState(false);
    const [billFile, setBillFile] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setError(null);
            const resp = await supplierService.getAll();
            setSuppliers(getData(resp) || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load suppliers. Please RESTART the BACKEND SERVER.');
        }
    };

    const openProfile = async (supplier) => {
        setProfileSupplier(supplier);
        setProfileLoading(true);
        setProfileOrders([]);
        setProfileSummary({ total_paid: 0, total_pending: 0, order_count: 0 });
        try {
            const [ordersResp, summaryResp] = await Promise.all([
                supplierService.getOrders(supplier.id),
                supplierService.getOrderSummary(supplier.id)
            ]);
            setProfileOrders(getData(ordersResp) || []);
            setProfileSummary(getData(summaryResp) || {});
        } catch (e) {
            console.error(e);
        } finally {
            setProfileLoading(false);
        }
    };

    const closeProfile = () => {
        setProfileSupplier(null);
        setProfileOrders([]);
        setProfileSummary({});
    };

    const openOrderModal = (supplier, order = null) => {
        setOrderSupplier(supplier);
        setEditingOrder(order || null);
        if (order) {
            setOrderForm({
                ordered_date: order.ordered_date ? order.ordered_date.slice(0, 10) : '',
                delivered_date: order.delivered_date ? order.delivered_date.slice(0, 10) : '',
                delivery_status: order.delivery_status || 'Pending',
                invoice_number: order.invoice_number || '',
                total_amount: order.total_amount ?? '',
                paid_amount: order.paid_amount ?? '0',
                balance_amount: order.balance_amount ?? '',
                payment_status: order.payment_status || 'Unpaid',
                notes: order.notes || '',
                bill_file_url: order.bill_file_url || ''
            });
        } else {
            setOrderForm(defaultOrderForm());
        }
        setBillFile(null);
        setOrderModalOpen(true);
    };

    const saveOrder = async (e) => {
        e.preventDefault();
        if (!orderSupplier) return;
        setOrderSaving(true);
        try {
            let billUrl = orderForm.bill_file_url;
            if (billFile) {
                const uploadResp = await supplierService.uploadBill(billFile);
                const ur = getData(uploadResp);
                billUrl = ur?.url || billUrl;
            }
            const total = parseFloat(orderForm.total_amount) || 0;
            const paid = parseFloat(orderForm.paid_amount) || 0;
            const balance = orderForm.balance_amount !== '' ? parseFloat(orderForm.balance_amount) : Math.max(0, total - paid);
            const payload = {
                ordered_date: orderForm.ordered_date || null,
                delivered_date: orderForm.delivered_date || null,
                delivery_status: orderForm.delivery_status,
                invoice_number: orderForm.invoice_number || null,
                total_amount: total,
                paid_amount: paid,
                balance_amount: balance,
                payment_status: orderForm.payment_status,
                notes: orderForm.notes || null,
                bill_file_url: billUrl || null
            };
            if (editingOrder) {
                await supplierService.updateOrder(orderSupplier.id, editingOrder.id, payload);
            } else {
                await supplierService.createOrder(orderSupplier.id, payload);
            }
            setOrderModalOpen(false);
            setOrderSupplier(null);
            setEditingOrder(null);
            if (profileSupplier) openProfile(profileSupplier);
        } catch (err) {
            alert(err?.message || 'Failed to save order');
        } finally {
            setOrderSaving(false);
        }
    };

    const deleteOrder = async (supplier, orderId) => {
        if (!window.confirm('Delete this order record?')) return;
        try {
            await supplierService.deleteOrder(supplier.id, orderId);
            openProfile(supplier);
        } catch (e) {
            alert(e?.message || 'Delete failed');
        }
    };

    const billUrl = (path) => path ? supplierService.getBillUrl(path) : null;

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name || '',
                contact_person: supplier.contact_person || '',
                phone: supplier.phone || '',
                product_categories: supplier.product_categories || '',
                address: supplier.address || '',
                gst_number: supplier.gst_number || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({ name: '', contact_person: '', phone: '', product_categories: '', address: '', gst_number: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await supplierService.update(editingSupplier.id, formData);
            } else {
                await supplierService.create(formData);
            }
            setIsModalOpen(false);
            setEditingSupplier(null);
            setFormData({ name: '', contact_person: '', phone: '', product_categories: '', address: '', gst_number: '' });
            fetchSuppliers();
        } catch (err) {
            console.error('Full Error Object:', err);
            let errorMessage = 'Unknown error';

            if (err.response) {
                // Server responded with a status code outside 2xx
                errorMessage = `Server Error (${err.response.status}): ${JSON.stringify(err.response.data)}`;
            } else if (err.request) {
                // Request was made but no response received
                errorMessage = 'Network Error: No response received from server.';
            } else {
                // Something else happened
                errorMessage = `Client Error: ${err.message}`;
            }

            alert(`Debug Error Info:\n${errorMessage}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this supplier?')) {
            try {
                await supplierService.delete(id);
                fetchSuppliers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Distributors</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage distributors and suppliers for purchases.</p>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Manage your product distributors and agencies.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} /> Add New Distributor
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            style={{ paddingLeft: '48px', width: '100%', background: 'var(--input-bg)' }}
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', padding: '24px' }}>
                    {error && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
                            <p style={{ fontWeight: '700', fontSize: '18px' }}>⚠️ Connection Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {!error && filteredSuppliers.map((s) => (
                        <div key={s.id} className="card" style={{ padding: '24px', border: '1px solid var(--border)', boxShadow: 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <Truck size={20} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => openProfile(s)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }} title="View profile & orders">Profile</button>
                                    <button onClick={() => handleOpenModal(s)} style={{ color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Edit"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Delete"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{s.name}</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>GST: {s.gst_number || 'N/A'}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                {s.contact_person && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-dim)' }} /> {s.contact_person}</div>}
                                {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} color="var(--text-muted)" /> {s.phone}</div>}
                                {s.product_categories && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} /> Products: {s.product_categories}</div>}
                                {s.address && <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><MapPin size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} /> {s.address}</div>}
                            </div>
                        </div>
                    ))}
                    {filteredSuppliers.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <p>No suppliers found. Add one to get started.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Supplier Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card animate-fade" style={{ width: '500px', maxWidth: '95vw', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{editingSupplier ? 'Edit Distributor' : 'Add New Distributor'}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingSupplier(null); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Agency / Supplier Name *</label>
                                <input required style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Contact Person</label>
                                    <input style={{ width: '100%' }} value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>GST Number</label>
                                    <input style={{ width: '100%' }} value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Phone</label>
                                    <input style={{ width: '100%' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Products Supplied</label>
                                    <input style={{ width: '100%' }} placeholder="e.g. Dairy, Snacks" value={formData.product_categories} onChange={e => setFormData({ ...formData, product_categories: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Address</label>
                                <textarea style={{ width: '100%', minHeight: '80px', padding: '12px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setIsModalOpen(false); setEditingSupplier(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingSupplier ? 'Update' : 'Save'} Distributor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Distributor Profile Modal */}
            {profileSupplier && !orderModalOpen && (
                <div className="confirm-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeProfile()}>
                    <div className="card animate-fade" style={{ maxWidth: '95vw', width: '720px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <Truck size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{profileSupplier.name}</h2>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{profileSupplier.contact_person} · {profileSupplier.gst_number || 'N/A'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button type="button" className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={() => openOrderModal(profileSupplier)}>
                                    <Receipt size={18} /> Add Order
                                </button>
                                <button type="button" className="btn btn-outline" style={{ padding: '8px' }} onClick={closeProfile} aria-label="Close"><X size={20} /></button>
                            </div>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                            <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Paid</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>₹{parseFloat(profileSummary.total_paid || 0).toFixed(2)}</p>
                            </div>
                            <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Pending</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>₹{parseFloat(profileSummary.total_pending || 0).toFixed(2)}</p>
                            </div>
                            <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--border)' }}>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Orders</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{profileSummary.order_count || 0}</p>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Purchase history</h4>
                            {profileLoading ? (
                                <p style={{ color: 'var(--text-muted)', padding: '24px' }}>Loading...</p>
                            ) : profileOrders.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', padding: '24px' }}>No orders yet. Click Add Order to record a purchase.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th><Hash size={14} /> Invoice</th>
                                                <th><Calendar size={14} /> Ordered</th>
                                                <th>Delivered</th>
                                                <th>Status</th>
                                                <th>Total</th>
                                                <th>Paid</th>
                                                <th>Balance</th>
                                                <th>Payment</th>
                                                <th style={{ width: '100px' }}>Bill</th>
                                                <th style={{ width: '80px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profileOrders.map((o) => (
                                                <tr key={o.id}>
                                                    <td style={{ fontWeight: '600' }}>{o.invoice_number || '—'}</td>
                                                    <td>{o.ordered_date ? new Date(o.ordered_date).toLocaleDateString() : '—'}</td>
                                                    <td>{o.delivered_date ? new Date(o.delivered_date).toLocaleDateString() : '—'}</td>
                                                    <td><span className={`badge ${o.delivery_status === 'Delivered' ? 'badge-success' : o.delivery_status === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>{o.delivery_status}</span></td>
                                                    <td>₹{parseFloat(o.total_amount || 0).toFixed(2)}</td>
                                                    <td>₹{parseFloat(o.paid_amount || 0).toFixed(2)}</td>
                                                    <td>₹{parseFloat(o.balance_amount || 0).toFixed(2)}</td>
                                                    <td><span className={`badge ${o.payment_status === 'Paid' ? 'badge-success' : o.payment_status === 'Unpaid' ? 'badge-danger' : 'badge-warning'}`}>{o.payment_status}</span></td>
                                                    <td>
                                                        {o.bill_file_url ? (
                                                            <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                <a href={billUrl(o.bill_file_url)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '12px' }}><Eye size={14} /> View</a>
                                                                <a href={billUrl(o.bill_file_url)} download style={{ color: 'var(--primary)', fontSize: '12px' }}><Download size={14} /> Download</a>
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td>
                                                        <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openOrderModal(profileSupplier, o)}>Edit</button>
                                                        <button type="button" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }} onClick={() => deleteOrder(profileSupplier, o.id)} title="Delete">×</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Order Modal */}
            {orderModalOpen && orderSupplier && (
                <div className="confirm-modal-overlay" onClick={(e) => e.target === e.currentTarget && (setOrderModalOpen(false), setOrderSupplier(null))}>
                    <div className="card animate-fade" style={{ maxWidth: '95vw', width: '560px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{editingOrder ? 'Edit order' : 'Add order'} · {orderSupplier.name}</h2>
                            <button type="button" onClick={() => { setOrderModalOpen(false); setOrderSupplier(null); setEditingOrder(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={saveOrder} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Ordered date</label>
                                    <input type="date" value={orderForm.ordered_date} onChange={e => setOrderForm({ ...orderForm, ordered_date: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Delivered date</label>
                                    <input type="date" value={orderForm.delivered_date} onChange={e => setOrderForm({ ...orderForm, delivered_date: e.target.value })} style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Delivery status</label>
                                    <select value={orderForm.delivery_status} onChange={e => setOrderForm({ ...orderForm, delivery_status: e.target.value })} style={{ width: '100%' }}>
                                        {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Invoice number</label>
                                    <input value={orderForm.invoice_number} onChange={e => setOrderForm({ ...orderForm, invoice_number: e.target.value })} placeholder="e.g. INV-001" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Total amount (₹)</label>
                                    <input type="number" step="0.01" min="0" value={orderForm.total_amount} onChange={e => setOrderForm({ ...orderForm, total_amount: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Paid amount (₹)</label>
                                    <input type="number" step="0.01" min="0" value={orderForm.paid_amount} onChange={e => setOrderForm({ ...orderForm, paid_amount: e.target.value })} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Balance (₹)</label>
                                    <input type="number" step="0.01" min="0" value={orderForm.balance_amount} onChange={e => setOrderForm({ ...orderForm, balance_amount: e.target.value })} placeholder="Auto" style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Payment status</label>
                                <select value={orderForm.payment_status} onChange={e => setOrderForm({ ...orderForm, payment_status: e.target.value })} style={{ width: '100%' }}>
                                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Notes</label>
                                <textarea value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })} placeholder="Optional" style={{ width: '100%', minHeight: '60px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Bill upload (PDF / Image)</label>
                                <input type="file" accept=".pdf,image/*" onChange={e => setBillFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px' }} />
                                {orderForm.bill_file_url && !billFile && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Current file attached. Choose a new file to replace.</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setOrderModalOpen(false); setOrderSupplier(null); setEditingOrder(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={orderSaving}>{orderSaving ? 'Saving...' : (editingOrder ? 'Update' : 'Save')} order</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
