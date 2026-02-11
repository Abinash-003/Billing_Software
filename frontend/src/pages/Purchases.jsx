import React, { useState, useEffect } from 'react';
import { supplierService, productService, receiveStockService } from '../services';
import { getData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Truck, Plus, Package, FileText, Hash, Calendar, Wallet } from 'lucide-react';

const Purchases = () => {
    const { success: toastSuccess, error: toastError } = useToast();
    const [distributors, setDistributors] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedDistributor, setSelectedDistributor] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [receiveDate, setReceiveDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [paidAmount, setPaidAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [cart, setCart] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [dResp, pResp] = await Promise.all([supplierService.getAll(), productService.getAll()]);
                setDistributors(getData(dResp) || []);
                setProducts(getData(pResp) || []);
            } catch (err) {
                console.error(err);
                toastError('Failed to load distributors or products');
            }
        })();
    }, [toastError]);

    const addToCart = (product, qty = 1) => {
        const existing = cart.find(i => i.id === product.id);
        const cost = product.cost_price ?? product.price;
        if (existing) {
            setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i));
        } else {
            setCart([...cart, { ...product, quantity: qty, costPrice: cost != null ? Number(cost) : '' }]);
        }
    };

    const updateCartQty = (id, delta) => {
        setCart(cart.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
    };

    const updateCartCostPrice = (id, value) => {
        const num = value === '' ? '' : Math.max(0, parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0);
        setCart(cart.map(i => i.id === id ? { ...i, costPrice: num } : i));
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

    const lineTotal = (item) => {
        const price = typeof item.costPrice === 'number' ? item.costPrice : parseFloat(item.costPrice);
        return (Number.isFinite(price) ? price : 0) * (item.quantity || 0);
    };
    const subtotal = cart.reduce((sum, i) => sum + lineTotal(i), 0);

    const handleSave = async () => {
        if (!selectedDistributor) {
            toastError('Select a distributor');
            return;
        }
        if (cart.length === 0) {
            toastError('Add at least one product');
            return;
        }
        const items = cart
            .map(i => ({ productId: i.id, quantity: i.quantity, unitPrice: Number(i.costPrice) || 0 }))
            .filter(i => i.quantity > 0);
        if (items.length === 0) {
            toastError('Add quantity and cost for items');
            return;
        }

        setSaving(true);
        try {
            await receiveStockService.receive({
                supplierId: selectedDistributor,
                invoiceNumber: invoiceNumber.trim() || undefined,
                orderDate: receiveDate || undefined,
                deliveredDate: receiveDate || undefined,
                paidAmount: paidAmount === '' ? 0 : parseFloat(paidAmount) || 0,
                notes: notes.trim() || undefined,
                items
            });
            toastSuccess('Stock received. Product stock and distributor balance updated.');
            window.dispatchEvent(new Event('dashboardRefresh'));
            setCart([]);
            setInvoiceNumber('');
            setReceiveDate(new Date().toISOString().slice(0, 10));
            setPaidAmount('');
            setNotes('');
        } catch (err) {
            toastError(err?.message || 'Failed to save. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Receive Stock</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Record stock received from a distributor. Stock increases automatically when you save.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
                <div className="card" style={{ padding: '0' }}>
                    {/* Step 1: Select Distributor */}
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '13px' }}>
                            <Truck size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 1) Select distributor
                        </label>
                        <select
                            value={selectedDistributor}
                            onChange={(e) => setSelectedDistributor(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)' }}
                        >
                            <option value="">— Choose distributor —</option>
                            {distributors.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Step 2: Invoice details */}
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>2) Invoice details</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Invoice number</label>
                                <input
                                    placeholder="e.g. INV-001"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Date received</label>
                                <input
                                    type="date"
                                    value={receiveDate}
                                    onChange={(e) => setReceiveDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Amount paid (₹) — optional</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)' }}
                            />
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Notes — optional</label>
                            <input
                                placeholder="Reference, remarks"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)' }}
                            />
                        </div>
                    </div>

                    {/* Step 3: Add products */}
                    <div style={{ padding: '24px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>3) Add products + quantity + cost</p>
                        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                            {products.slice(0, 80).map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '700', margin: 0 }}>{p.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{p.category || '—'} · Stock: {p.stocks ?? 0}</p>
                                        </div>
                                    </div>
                                    <button type="button" className="btn btn-outline" style={{ padding: '8px 14px' }} onClick={() => addToCart(p)}>
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '24px', background: 'var(--primary-gradient)', color: 'white' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Items received</h3>
                        <p style={{ fontSize: '13px', opacity: 0.9 }}>{cart.length} item(s)</p>
                    </div>
                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                        {cart.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '14px' }}>No items. Add products from the list.</p>
                        ) : (
                            cart.map(i => (
                                <div key={i.id} style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <p style={{ fontWeight: '700', margin: 0 }}>{i.name}</p>
                                        <button type="button" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} onClick={() => removeFromCart(i.id)} title="Remove">×</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ minWidth: '100px' }}>
                                            <label style={{ display: 'block', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Cost (₹/unit)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={i.costPrice === '' || i.costPrice == null ? '' : i.costPrice}
                                                onChange={(e) => updateCartCostPrice(i.id, e.target.value)}
                                                style={{ width: '100%', padding: '8px 10px', fontSize: '14px', background: 'var(--input-bg)' }}
                                            />
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>×</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <button type="button" style={{ width: '28px', height: '28px', border: 'none', background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '700' }} onClick={() => updateCartQty(i.id, -1)}>−</button>
                                            <span style={{ fontWeight: '700', minWidth: '28px', textAlign: 'center', color: 'var(--text-main)' }}>{i.quantity}</span>
                                            <button type="button" style={{ width: '28px', height: '28px', border: 'none', background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-main)', fontWeight: '700' }} onClick={() => updateCartQty(i.id, 1)}>+</button>
                                        </div>
                                        <span style={{ marginLeft: 'auto', fontWeight: '700', color: 'var(--text-main)' }}>= ₹{lineTotal(i).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {cart.length > 0 && (
                        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '20px', marginBottom: '16px' }}>
                                <span>Total</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <FileText size={18} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                                Saving will: record this receipt, increase product stock, and update distributor balance.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Purchases;
