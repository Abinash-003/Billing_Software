import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, AlertCircle } from 'lucide-react';

const EXPENSE_TYPES = [
    { value: 'discount_loss', label: 'Discount / Promotion' },
    { value: 'damaged', label: 'Damaged goods' },
    { value: 'expired', label: 'Expired stock' },
    { value: 'manual', label: 'Other / Manual' }
];

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({ type: 'manual', amount: '', note: '' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('expenses');
            if (saved) setExpenses(JSON.parse(saved));
        } catch (_) {}
    }, []);

    const saveExpenses = (list) => {
        localStorage.setItem('expenses', JSON.stringify(list));
        setExpenses(list);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amount = parseFloat(form.amount);
        if (!amount || amount <= 0) {
            alert('Enter a valid amount.');
            return;
        }
        const newExp = {
            id: Date.now(),
            type: form.type,
            typeLabel: EXPENSE_TYPES.find(t => t.value === form.type)?.label || form.type,
            amount,
            note: form.note || '',
            date: new Date().toISOString()
        };
        saveExpenses([newExp, ...expenses]);
        setForm({ type: 'manual', amount: '', note: '' });
        setShowForm(false);
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    };

    const handleDelete = (id) => {
        if (window.confirm('Remove this expense entry?')) {
            saveExpenses(expenses.filter(e => e.id !== id));
            window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        }
    };

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Expenses</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Record and track business expenses.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={20} /> Add expense
                </button>
            </div>

            <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div className="stat-card" style={{ animationDelay: '0s' }}>
                    <div className="stat-icon icon-orange">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Total expenses (recorded)</p>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>₹{totalExpenses.toFixed(2)}</h3>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Expense history</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '32px' }}>Date</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Note</th>
                                <th style={{ textAlign: 'right', paddingRight: '32px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(e => (
                                <tr key={e.id}>
                                    <td style={{ paddingLeft: '32px' }}>{new Date(e.date).toLocaleString()}</td>
                                    <td><span className="badge badge-warning">{e.typeLabel || e.type}</span></td>
                                    <td style={{ fontWeight: '700', color: 'var(--danger)' }}>₹{parseFloat(e.amount).toFixed(2)}</td>
                                    <td style={{ color: 'var(--text-muted)', maxWidth: '200px' }}>{e.note || '—'}</td>
                                    <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                        <button type="button" className="btn btn-outline" style={{ padding: '6px', border: 'none', color: 'var(--danger)' }} onClick={() => handleDelete(e.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        No expenses recorded. Add discount loss, damaged goods, expired stock or other expenses.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card animate-fade" style={{ width: '440px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Add expense</h3>
                            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: '2px solid var(--border)' }}>
                                    {EXPENSE_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input type="number" step="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
                            </div>
                            <div className="form-group">
                                <label>Note (optional)</label>
                                <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Brief description" />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
