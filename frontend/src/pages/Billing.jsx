import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    const [allProducts, setAllProducts] = useState([]);
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
            const resp = await productService.getAll();
            setAllProducts(getData(resp) || []);
        } catch (err) {
            toastError(err?.message || 'Failed to load products');
        }
    }, [toastError]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        if (!q) return allProducts;
        return allProducts.filter(
            (p) =>
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.barcode && String(p.barcode).toLowerCase().includes(q))
        );
    }, [allProducts, searchTerm]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = filteredProducts[0];
            if (first && (first.stocks ?? 0) > 0) {
                addToCart(first);
                searchInputRef.current?.focus();
            } else if (first) {
                toastError('Product is out of stock');
            } else if ((searchTerm || '').trim()) {
                toastError('No products found');
            }
        }
    };

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
            setAllProducts(prev => prev.some(p => p.id === product.id) ? prev : [...prev, product]);
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
            const originalProduct = allProducts.find(p => p.id === id);
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
            const p = allProducts.find(x => x.id === item.id) || item;
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

            <div className="pos-grid">
                <div className="card pos-products" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
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
                                placeholder="Search by name or barcode — Enter to add first"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                aria-label="Search products"
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
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {allProducts.length === 0 ? 'Loading products...' : 'No products found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map(p => (
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={`card cart-panel ${cartHighlight ? 'cart-panel--highlight' : ''}`}>
                    <div className="cart-panel__header">
                        <ShoppingCart size={24} />
                        <h3 className="cart-panel__title">Your cart</h3>
                        <span className="cart-panel__badge">{cart.length} items</span>
                    </div>
                    {cart.length > 0 && runningProfit > 0 && (
                        <div className="cart-panel__profit">
                            <TrendingUp size={16} /> Profit: ₹{runningProfit.toFixed(2)}
                        </div>
                    )}

                    <div className="cart-panel__customer">
                        <p className="cart-panel__label">Customer (optional)</p>
                        <div className="cart-panel__customer-fields">
                            <input
                                placeholder="Walk-in Customer"
                                value={customer.name}
                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                className="input"
                            />
                            <input
                                placeholder="Phone (optional)"
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="cart-panel__items">
                        {cart.length === 0 ? (
                            <div className="cart-panel__empty">
                                <ShoppingBag size={48} className="empty-state-icon" />
                                <p className="cart-panel__empty-title">Cart is empty</p>
                                <p className="cart-panel__empty-sub">Search and add products to start</p>
                            </div>
                        ) : (
                            <ul className="cart-panel__list">
                                {cart.map(item => (
                                    <li key={item.id} className="cart-panel__row">
                                        <div className="cart-panel__row-info">
                                            <span className="cart-panel__row-name">{item.name}</span>
                                            <span className="cart-panel__row-meta">₹{parseFloat(item.price).toFixed(2)} × {item.unit}</span>
                                        </div>
                                        <div className="cart-panel__row-actions">
                                            <div className="cart-panel__qty">
                                                <button type="button" onClick={() => updateQuantity(item.id, -1)} className="cart-panel__qty-btn" aria-label="Decrease"><Minus size={14} /></button>
                                                <span className="cart-panel__qty-val">{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.id, 1)} className="cart-panel__qty-btn" aria-label="Increase"><Plus size={14} /></button>
                                            </div>
                                            <span className="cart-panel__row-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            <button type="button" onClick={() => removeFromCart(item.id)} className="cart-panel__remove" aria-label="Remove"><X size={18} /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="cart-panel__footer">
                            <div className="cart-panel__totals">
                                <div className="cart-panel__total-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="cart-panel__total-row">
                                    <span>GST</span>
                                    <span>₹{gstTotal.toFixed(2)}</span>
                                </div>
                                <div className="cart-panel__total-row cart-panel__discount-row">
                                    <span>Discount (₹)</span>
                                    <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="cart-panel__discount-input" />
                                </div>
                            </div>
                            <div className="cart-panel__payment">
                                <label className="cart-panel__label">Payment</label>
                                <div className="cart-panel__payment-btns">
                                    {['cash', 'upi', 'card'].map(m => (
                                        <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`cart-panel__pay-btn ${paymentMethod === m ? 'active' : ''}`}>{m}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="cart-panel__grand-total">
                                <span>Total</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>
                            <button data-pos-checkout type="button" className="btn btn-primary cart-panel__checkout" onClick={handleCheckout} disabled={isProcessing || !canCheckout()}>
                                {isProcessing ? 'Saving...' : <><Printer size={20} /> Print & Complete (F2)</>}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastBill && (
                <div className="receipt-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
                    <div className="card animate-fade receipt-modal-content" id="printable-bill" style={{ backgroundColor: 'white', padding: '40px', width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-xl)' }}>
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                #printable-bill, #printable-bill * { visibility: visible; }
                                #printable-bill { position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; max-width: 80mm !important; min-width: 80mm !important; padding: 4mm !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; font-size: 11px !important; }
                                #printable-bill h2 { font-size: 14px !important; }
                                #printable-bill p, #printable-bill td, #printable-bill th { font-size: 10px !important; }
                                #printable-bill table { width: 100% !important; table-layout: fixed !important; }
                                .no-print { display: none !important; }
                                @page { size: 80mm auto; margin: 2mm; }
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

                        <div className="receipt-table-wrap">
                        <table className="receipt-table" style={{ width: '100%', marginBottom: '24px' }}>
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
                        </div>

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
