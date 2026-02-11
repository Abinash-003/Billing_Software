import React, { useState, useEffect } from 'react';
import { billService } from '../services';
import { Users, Phone, ShoppingBag, Clock, ChevronRight, X, Calendar, Search, AlertCircle, Gift } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setError(null);
            const resp = await billService.getCustomers();
            setCustomers(resp.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load customers. Please ensure the backend server is running and updated.');
        }
    };

    const handleCustomerClick = async (customer) => {
        setSelectedCustomer(customer);
        setIsLoading(true);
        try {
            const resp = await billService.getCustomerHistory(customer.customer_phone);
            setHistory(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customer_phone?.includes(searchTerm)
    );

    return (
        <div className="animate-fade" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Customers</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Customer list and contact details. Optional for walk-in sales.</p>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>View customer purchase history and patterns.</p>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            style={{ paddingLeft: '48px', background: 'var(--input-bg)', border: '1px solid var(--border)', width: '100%' }}
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '32px' }}>Customer Name</th>
                                <th>Phone Number</th>
                                <th>Total Visits</th>
                                <th>Total Spent</th>
                                <th>Loyalty pts</th>
                                <th>Last Visit</th>
                                <th style={{ textAlign: 'right', paddingRight: '32px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((c, idx) => (
                                <tr key={idx} onClick={() => handleCustomerClick(c)} style={{ cursor: 'pointer' }}>
                                    <td style={{ paddingLeft: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <Users size={20} />
                                            </div>
                                            <span style={{ fontWeight: '700', fontSize: '15px' }}>{c.customer_name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{c.customer_phone}</td>
                                    <td>
                                        <span className="badge badge-success">{c.visit_count} Visits</span>
                                    </td>
                                    <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>₹{parseFloat(c.total_spend).toFixed(2)}</td>
                                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}><Gift size={14} /> {Math.floor(parseFloat(c.total_spend || 0) / 100)} pts</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} />
                                            {new Date(c.last_visit).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                        <button className="btn btn-outline" style={{ display: 'inline-flex', padding: '8px' }}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {error && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--danger)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                            <AlertCircle size={48} opacity={0.5} />
                                            <p style={{ fontWeight: '600' }}>{error}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!error && filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Details Modal */}
            {selectedCustomer && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'end', zIndex: 1000 }}>
                    <div className="animate-slide-left" style={{ width: '500px', backgroundColor: 'white', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--hover-bg)' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{selectedCustomer.customer_name}</h3>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {selectedCustomer.customer_phone}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={14} /> ₹{parseFloat(selectedCustomer.total_spend).toFixed(2)} Total Spent</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: '600' }}><Gift size={14} /> {Math.floor(parseFloat(selectedCustomer.total_spend || 0) / 100)} loyalty points</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Purchase History</h4>

                            {isLoading ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>Loading history...</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {history.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--border)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                                                    <Calendar size={18} color="var(--text-muted)" />
                                                </div>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.2' }}>
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{item.product_name}</span>
                                                    <span style={{ fontWeight: '700' }}>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    <span>Qty: {item.quantity} × ₹{item.unit_price}</span>
                                                    <span>Bill #{item.bill_number}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {history.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No history found.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
