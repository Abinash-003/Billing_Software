import React, { useState, useEffect } from 'react';
import { billService, productService, supplierService } from '../services';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Users, Package, Wallet, Download, FileSpreadsheet } from 'lucide-react';
import CsvPreviewModal from '../components/CsvPreviewModal';

const downloadCSV = (filename, headers, rows) => {
    const escape = (v) => (v == null ? '' : String(v).replace(/"/g, '""'));
    const line = (arr) => arr.map((c) => `"${escape(c)}"`).join(',');
    const csv = [line(headers), ...rows.map((r) => line(r))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};

const Reports = () => {
    const [dailyData, setDailyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topProductsPeriod, setTopProductsPeriod] = useState('daily');
    const [stats, setStats] = useState({ totalRevenue: 0, totalBills: 0, totalTransactions: 0, activeProducts: 0 });
    const [csvModal, setCsvModal] = useState(null);

    useEffect(() => {
        fetchReports();
        fetchTopProducts(topProductsPeriod);
        fetchGlobalStats();
    }, [topProductsPeriod]);

    const fetchGlobalStats = async () => {
        try {
            const resp = await billService.getStats();
            const data = resp?.data || resp || {};
            setStats(prev => ({
                ...prev,
                totalTransactions: data.billCount ?? 0,
                activeProducts: data.productCount ?? 0
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReports = async () => {
        try {
            const daily = await billService.getReports('daily');
            const monthly = await billService.getReports('monthly');

            setDailyData(daily?.data || []);
            setMonthlyData(monthly?.data || []);

            // Get today's date in YYYY-MM-DD format (local time)
            const getLocalDateString = (date) => {
                const d = new Date(date);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };

            const today = getLocalDateString(new Date());

            // Find data for today
            const dailyArr = daily?.data || [];
            const todayData = dailyArr.find(d => getLocalDateString(d.date) === today);

            setStats(prev => ({
                ...prev,
                totalRevenue: todayData ? parseFloat(todayData.revenue) : 0,
                totalBills: todayData ? todayData.bill_count : 0
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchTopProducts = async (period) => {
        try {
            const response = await billService.getTopProducts(period);
            setTopProducts(response?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        } catch (e) {
            return dateStr;
        }
    };

    const formatMonth = (monthStr) => {
        try {
            const [year, month] = monthStr.split('-');
            const date = new Date(year, month - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
            return monthStr;
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label, isCurrency }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    padding: '12px 16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    borderLeft: `4px solid ${payload[0].color || payload[0].fill || 'var(--primary)'}`
                }}>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: 700 }}>
                        {isCurrency ? formatCurrency(payload[0].value) : payload[0].value}
                        {!isCurrency && typeof payload[0].value === 'number' && !label.includes('₹') && ' Units'}
                    </p>
                </div>
            );
        }
        return null;
    };

    const statCards = [
        { label: "Today's Revenue", value: formatCurrency(stats.totalRevenue), icon: <Wallet size={20} color="var(--primary)" />, bg: 'var(--success-soft)' },
        { label: "Today's Bills", value: stats.totalBills, icon: <TrendingUp size={20} color="var(--secondary)" />, bg: 'rgba(59, 130, 246, 0.15)' },
        { label: "Total Transactions", value: stats.totalTransactions, icon: <Users size={20} color="var(--warning)" />, bg: 'var(--warning-soft)' },
        { label: "Active Products", value: stats.activeProducts, icon: <Package size={20} style={{ color: 'var(--danger)' }} />, bg: 'var(--danger-soft)' },
    ];

    const openCsvPreview = (title, filename, headers, rows, doDownload) => {
        setCsvModal({ title, filename, headers, rows, doDownload });
    };

    const exportSalesReport = async () => {
        try {
            const resp = await billService.getRecent();
            const bills = resp?.data || resp || [];
            const headers = ['Invoice', 'Customer', 'Phone', 'Date', 'Total'];
            const rows = bills.map((b) => [b.bill_number, b.customer_name, b.customer_phone, b.created_at, b.grand_total]);
            const filename = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
            openCsvPreview('Sales Report – Preview', filename, headers, rows, () => downloadCSV(filename, headers, rows));
        } catch (e) {
            alert('Export failed: ' + (e.message || 'Unknown error'));
        }
    };

    const exportProfitReport = () => {
        const headers = ['Period', 'Revenue', 'Expenses', 'Profit'];
        const expenses = (() => { try { return JSON.parse(localStorage.getItem('expenses') || '[]'); } catch (_) { return []; } })();
        const totalExp = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        const rows = [[new Date().toISOString().slice(0, 7), stats.totalRevenue, totalExp, (stats.totalRevenue || 0) - totalExp]];
        const filename = `profit-report-${new Date().toISOString().slice(0, 10)}.csv`;
        openCsvPreview('Profit Report – Preview', filename, headers, rows, () => downloadCSV(filename, headers, rows));
    };

    const exportInventoryReport = async () => {
        try {
            const resp = await productService.getAll();
            const products = resp?.data || resp || [];
            const headers = ['Name', 'Category', 'Price', 'Stocks', 'Unit'];
            const rows = products.map((p) => [p.name, p.category, p.price, p.stocks, p.unit]);
            const filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
            openCsvPreview('Inventory Report – Preview', filename, headers, rows, () => downloadCSV(filename, headers, rows));
        } catch (e) {
            alert('Export failed: ' + (e.message || 'Unknown error'));
        }
    };

    const exportDistributorReport = async () => {
        try {
            const resp = await supplierService.getAll();
            const distributors = resp?.data || resp || [];
            const headers = ['Name', 'Contact', 'Phone', 'Categories', 'Address', 'GST'];
            const rows = distributors.map((d) => [d.name, d.contact_person, d.phone, d.product_categories, d.address, d.gst_number]);
            const filename = `distributor-report-${new Date().toISOString().slice(0, 10)}.csv`;
            openCsvPreview('Distributor Report – Preview', filename, headers, rows, () => downloadCSV(filename, headers, rows));
        } catch (e) {
            alert('Export failed: ' + (e.message || 'Unknown error'));
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Daily Reports</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>View and download sales, profit, and stock reports.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }} onClick={exportSalesReport}><FileSpreadsheet size={18} /> Sales (View & Download)</button>
                    <button type="button" className="btn btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }} onClick={exportProfitReport}><FileSpreadsheet size={18} /> Profit (View & Download)</button>
                    <button type="button" className="btn btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }} onClick={exportInventoryReport}><FileSpreadsheet size={18} /> Inventory (View & Download)</button>
                    <button type="button" className="btn btn-outline" style={{ padding: '10px 16px', fontSize: '13px' }} onClick={exportDistributorReport}><FileSpreadsheet size={18} /> Distributors (View & Download)</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {statCards.map((s, i) => (
                    <div className="card" key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '24px',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ padding: '14px', backgroundColor: s.bg, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '4px' }}>{s.label}</p>
                            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>Top selling products</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>By total sales value</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--input-bg)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        {['daily', 'monthly', 'yearly'].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setTopProductsPeriod(p)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    backgroundColor: topProductsPeriod === p ? 'var(--primary)' : 'transparent',
                                    color: topProductsPeriod === p ? '#fff' : 'var(--text-muted)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ height: '450px' }}>
                    {topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topProducts}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={150}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 13, fill: 'var(--text-main)', fontWeight: 600 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--hover-bg)' }}
                                    content={<CustomTooltip isCurrency={true} />}
                                />
                                <Bar
                                    dataKey="total_sales"
                                    fill="var(--primary)"
                                    radius={[0, 8, 8, 0]}
                                    barSize={24}
                                    isAnimationActive
                                    animationDuration={600}
                                >
                                    {topProducts.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`hsl(160, 84%, ${39 + (index * 4)}%)`}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <Package size={48} className="empty-state-icon" style={{ marginBottom: '16px' }} />
                                <p style={{ color: 'var(--text-muted)' }}>No sales data for this period</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {csvModal && (
                <CsvPreviewModal
                    title={csvModal.title}
                    filename={csvModal.filename}
                    headers={csvModal.headers}
                    rows={csvModal.rows}
                    onDownload={csvModal.doDownload}
                    onClose={() => setCsvModal(null)}
                />
            )}
        </div>
    );
};

export default Reports;

