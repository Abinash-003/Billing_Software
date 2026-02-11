import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productService, billService } from '../services';
import { getData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Plus, Search, ShoppingCart, Printer, ShoppingBag, X, Minus, TrendingUp, ScanBarcode } from 'lucide-react';

const SCAN_LOCK_MS = 350;

const Billing = () => {
    const searchInputRef = useRef(null);
    const barcodeInputRef = useRef(null);
    const scanLockRef = useRef(0);
    const { success: toastSuccess, error: toastError } = useToast();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastBill, setLastBill] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [cartHighlight, setCartHighlight] = useState(false);
    const [barcodeValue, setBarcodeValue] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.gst_percent || 0) / 100), 0);
    const afterDiscount = Math.max(0, subtotal + gstTotal - (Number(discount) || 0));
    const grandTotal = afterDiscount;
    const runningProfit = cart.reduce((s, i) => s + ((parseFloat(i.price) - (parseFloat(i.cost_price) || 0)) * i.quantity), 0);

    const fetchProducts = useCallback(async () => {
        try {
            const resp = searchTerm ? await productService.search(searchTerm) : await productService.getAll();
            setProducts(getData(resp) || []);
        } catch (err) {
            toastError(err?.message || 'Failed to load products');
        }
    }, [searchTerm, toastError]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'Escape') {
                e.preventDefault();
                if (cart.length > 0) setCart([]);
            }
            if (e.key === 'F2') {
                e.preventDefault();
                if (cart.length > 0) document.querySelector('[data-pos-checkout]')?.click();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length]);

    const addToCart = (product) => {
        const existing = cart.find(i => i.id === product.id);
        const available = product.stocks ?? 0;
        if (existing) {
            if (existing.quantity >= available) {
                toastError(`Insufficient stock. Only ${available} ${product.unit} available.`);
                return;
            }
            setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
            toastSuccess(`Added: ${product.name} (${existing.quantity + 1} in cart)`);
            setCartHighlight(true);
            setTimeout(() => setCartHighlight(false), 800);
        } else {
            if (available <= 0) {
                toastError('This product is out of stock.');
                return;
            }
            setCart([...cart, { ...product, quantity: 1 }]);
            toastSuccess(`Added: ${product.name}`);
            setCartHighlight(true);
            setTimeout(() => setCartHighlight(false), 800);
        }
    };

    const processBarcode = async (code) => {
        const trimmed = String(code).trim();
        if (!trimmed) return;
        if (isScanning) return;
        if (Date.now() - scanLockRef.current < SCAN_LOCK_MS) return;
        scanLockRef.current = Date.now();
        setIsScanning(true);
        setBarcodeValue('');
        try {
            const res = await productService.getByBarcode(trimmed);
            const product = getData(res);
            if (!product) {
                toastError('Product not found');
                return;
            }
            const available = product.stocks ?? 0;
            if (available <= 0) {
                toastError('Out of stock');
                return;
            }
            addToCart(product);
            setProducts(prev => prev.some(p => p.id === product.id) ? prev : [...prev, product]);
            toastSuccess(`Added: ${product.name}`);
            setCartHighlight(true);
            setTimeout(() => setCartHighlight(false), 800);
        } catch (err) {
            toastError('Product not found');
        } finally {
            setIsScanning(false);
            requestAnimationFrame(() => barcodeInputRef.current?.focus());
        }
    };

    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (isScanning) return;
            processBarcode(barcodeValue);
        }
    };

    const handleProductKeyDown = (e, product) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addToCart(product);
            barcodeInputRef.current?.focus();
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(i => {
            if (i.id !== id) return i;
            const newQty = i.quantity + delta;
            const originalProduct = products.find(p => p.id === id);
            const availableStock = originalProduct?.stocks ?? i.stocks ?? 0;
            if (newQty <= 0) return null;
            if (newQty > availableStock) {
                toastError(`Cannot exceed available stock (${availableStock} ${i.unit}).`);
                return i;
            }
            return { ...i, quantity: newQty };
        }).filter(Boolean));
    };

    const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

    const canCheckout = () => {
        if (cart.length === 0) return false;
        for (const item of cart) {
            const p = products.find(x => x.id === item.id) || item;
            const available = p.stocks ?? 0;
            if (item.quantity > available) return false;
        }
        return true;
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toastError('Cart is empty');
            return;
        }
        if (!canCheckout()) {
            toastError('Some items exceed available stock. Please adjust quantities.');
            return;
        }
        setIsProcessing(true);
        const billData = {
            customerName: customer.name || 'Walk-in Customer',
            customerPhone: customer.phone || 'N/A',
            items: cart.map(i => ({
                productId: i.id,
                quantity: i.quantity,
                unitPrice: i.price,
                gstPercent: i.gst_percent || 0,
                name: i.name,
                unit: i.unit
            })),
            totalAmount: subtotal,
            taxAmount: gstTotal,
            discountAmount: Number(discount) || 0,
            grandTotal: grandTotal,
            paymentMethod: paymentMethod || 'cash'
        };
        try {
            const res = await billService.create(billData);
            const data = getData(res) || res;
            const billNumber = data?.billNumber || data?.bill_number;
            setLastBill({ ...billData, billNumber, date: new Date().toLocaleString() });
            setShowReceipt(true);
            toastSuccess('Sale saved! Stock updated. You can print the bill now.');
            setCart([]);
            setCustomer({ name: '', phone: '' });
            setDiscount(0);
            setPaymentMethod('cash');
            fetchProducts();
            window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        } catch (err) {
            toastError(err?.message || 'Checkout failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Billing Counter</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Scan barcode or search, add items to cart, then Print & Complete.</p>
                </div>
                {lastBill && (
                    <button type="button" onClick={() => setShowReceipt(true)} className="btn btn-outline" style={{ padding: '10px 18px', fontSize: '13px' }}>
                        <Printer size={18} /> Last bill
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 420px)', gap: '24px' }} className="pos-grid">
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Scan barcode</label>
                        <div style={{ position: 'relative', marginBottom: '14px' }}>
                            <ScanBarcode size={24} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }} />
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                autoComplete="off"
                                value={barcodeValue}
                                onChange={(e) => setBarcodeValue(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                placeholder="Scan or type barcode, then press Enter"
                                style={{
                                    width: '100%',
                                    padding: '18px 20px 18px 56px',
                                    fontSize: '20px',
                                    fontWeight: '600',
                                    background: 'var(--input-bg)',
                                    border: '2px solid var(--border)',
                                    borderRadius: 'var(--radius)',
                                    color: 'var(--text-main)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                aria-label="Barcode scan"
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                ref={searchInputRef}
                                style={{ paddingLeft: '48px', background: 'var(--input-bg)' }}
                                placeholder="Search product — press Enter to add"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '16px 24px', flex: 1, maxHeight: '560px', overflowY: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th style={{ textAlign: 'right' }}>Add</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id} tabIndex={0} onKeyDown={(e) => handleProductKeyDown(e, p)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>{p.name}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>₹{parseFloat(p.price).toFixed(2)}</td>
                                        <td>
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: (p.stocks ?? 0) < 10 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                {(p.stocks ?? 0)} left
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button type="button" onClick={() => { addToCart(p); searchInputRef.current?.focus(); }} className="btn btn-primary" disabled={(p.stocks ?? 0) <= 0} style={{ padding: '8px 12px', minWidth: 'auto', fontSize: '13px' }}>
                                                <Plus size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={`card cart-panel ${cartHighlight ? 'cart-panel--highlight' : ''}`} style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 14px var(--primary-glow)' }}>
                        <ShoppingCart size={24} />
                        <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Your cart</h3>
                        <span style={{ marginLeft: 'auto', padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', fontSize: '12px', fontWeight: '700' }}>
                            {cart.length} items
                        </span>
                    </div>
                    {cart.length > 0 && runningProfit > 0 && (
                        <div style={{ padding: '8px 24px', background: 'var(--success-soft)', color: 'var(--success)', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={16} /> Profit: ₹{runningProfit.toFixed(2)}
                        </div>
                    )}

                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Customer (optional)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input
                                placeholder="Walk-in Customer"
                                value={customer.name}
                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                style={{ padding: '10px 14px', fontSize: '14px' }}
                            />
                            <input
                                placeholder="Phone (optional)"
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                style={{ padding: '10px 14px', fontSize: '14px' }}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', minHeight: '220px' }}>
                        {cart.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px 0' }}>
                                <ShoppingBag size={48} className="empty-state-icon" style={{ marginBottom: '12px' }} />
                                <p style={{ fontWeight: '600', color: 'var(--text-muted)' }}>Cart is empty</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>Search and add products to start</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {cart.map(item => (
                                    <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</p>
                                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{parseFloat(item.price).toFixed(2)} × {item.unit}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                <button type="button" onClick={() => updateQuantity(item.id, -1)} style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Minus size={14} /></button>
                                                <span style={{ width: '36px', textAlign: 'center', fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.id, 1)} style={{ border: 'none', background: 'transparent', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Plus size={14} /></button>
                                            </div>
                                            <button type="button" onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }} aria-label="Remove"><X size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--card-bg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '14px' }}>
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '14px' }}>
                                <span>GST</span>
                                <span>₹{gstTotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '14px' }}>
                                <span>Discount (₹)</span>
                                <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} style={{ width: '100px', padding: '8px 12px', textAlign: 'right', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-main)' }} />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Payment</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['cash', 'upi', 'card'].map(m => (
                                        <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${paymentMethod === m ? 'var(--primary)' : 'var(--border)'}`, background: paymentMethod === m ? 'var(--primary-glow)' : 'transparent', color: paymentMethod === m ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: '600', textTransform: 'capitalize', cursor: 'pointer', fontSize: '13px' }}>{m}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '22px', marginTop: '16px', color: 'var(--text-main)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--primary-light)' }}>₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <button
                                data-pos-checkout
                                type="button"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '20px', padding: '16px', justifyContent: 'center', fontSize: '16px' }}
                                onClick={handleCheckout}
                                disabled={isProcessing || !canCheckout()}
                            >
                                {isProcessing ? 'Saving...' : <><Printer size={20} /> Print & Complete (F2)</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastBill && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
                    <div className="card animate-fade" id="printable-bill" style={{ backgroundColor: 'white', padding: '40px', width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-xl)' }}>
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                #printable-bill, #printable-bill * { visibility: visible; }
                                #printable-bill { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; box-shadow: none; border-radius: 0; }
                                .no-print { display: none !important; }
                            }
                        `}</style>
                        <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px dashed var(--border)', paddingBottom: '32px' }}>
                            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'black' }}>MNB MINI MART</h2>
                            <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>123 Zoho High Street, Chennai</p>
                            <p style={{ fontSize: '14px', marginTop: '16px', fontWeight: '600' }}>INV: {lastBill.billNumber}</p>
                            <p style={{ fontSize: '13px', color: '#666' }}>{lastBill.date}</p>
                        </div>

                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</p>
                                <p style={{ fontWeight: '700' }}>{lastBill.customerName}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</p>
                                <p style={{ fontWeight: '700' }}>{lastBill.customerPhone}</p>
                            </div>
                        </div>

                        <table style={{ width: '100%', marginBottom: '24px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid black' }}>
                                    <th style={{ textAlign: 'left', padding: '8px 0', color: 'black' }}>Item</th>
                                    <th style={{ textAlign: 'center', padding: '8px 0', color: 'black' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '8px 0', color: 'black' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastBill.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '8px 0', fontWeight: '600' }}>{item.name}</td>
                                        <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.quantity} {item.unit}</td>
                                        <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: '700' }}>₹{(item.unitPrice * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ borderTop: '2px solid black', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span>Subtotal:</span>
                                <span>₹{lastBill.totalAmount.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: '800', marginTop: '12px', color: 'black' }}>
                                <span>Total Paid:</span>
                                <span>₹{lastBill.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                            <button type="button" className="btn btn-primary" style={{ flex: 1, padding: '14px' }} onClick={() => { handlePrint(); }}>
                                <Printer size={20} /> Print
                            </button>
                            <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '14px' }} onClick={() => { setShowReceipt(false); setTimeout(() => barcodeInputRef.current?.focus(), 100); }}>Done</button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '40px', color: '#666', fontSize: '12px' }}>
                            <p>Thank you for shopping at MNB Mini Mart!</p>
                            <p style={{ fontWeight: '700', marginTop: '4px' }}>HAVE A GREAT DAY!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
