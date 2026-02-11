import React, { useState, useEffect } from 'react';
import { billService, supplierService } from '../services';
import { getData } from '../services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { TrendingUp, Package, Clock, DollarSign, BarChart3, Truck } from 'lucide-react';

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            boxShadow: 'var(--shadow-lg)',
            minWidth: '140px'
        }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                {labelFormatter ? labelFormatter(label) : label}
            </p>
            {payload.map((entry, i) => (
                <p key={i} style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: entry.color }}>
                    {formatter ? formatter(entry.value, entry.name) : `${entry.name}: ${entry.value}`}
                </p>
            ))}
        </div>
    );
};

const Analytics = () => {
    const [dailyData, setDailyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [period, setPeriod] = useState('daily');
    const [stats, setStats] = useState({ totalRevenue: 0, billCount: 0 });
    const [salesByTime, setSalesByTime] = useState([]);
    const [distributorSummary, setDistributorSummary] = useState([]);

    useEffect(() => {
        fetchData();
    }, [period]);

    useEffect(() => {
        (async () => {
            try {
                const [timeResp, distResp] = await Promise.all([
                    billService.getSalesByTime(),
                    supplierService.getDistributorSummary()
                ]);
                setSalesByTime(getData(timeResp) || []);
                setDistributorSummary(getData(distResp) || []);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    const fetchData = async () => {
        try {
            const [daily, monthly, top, statsResp] = await Promise.all([
                billService.getReports('daily'),
                billService.getReports('monthly'),
                billService.getTopProducts(period),
                billService.getStats()
            ]);
            setDailyData(getData(daily) || []);
            setMonthlyData(getData(monthly) || []);
            setTopProducts(getData(top) || []);
            const s = getData(statsResp) || {};
            setStats({ totalRevenue: Number(s.totalRevenue) || 0, billCount: Number(s.billCount) || 0 });
        } catch (err) {
            console.error(err);
        }
    };

    const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
    const chartData = period === 'daily' ? dailyData : monthlyData;
    const xKey = period === 'daily' ? 'date' : 'month';

    const topProductsData = topProducts.slice(0, 8);
    const distributorChartData = distributorSummary.map((d, i) => ({
        name: d.name?.slice(0, 12) || `D${d.id}`,
        total: parseFloat(d.total_amount) || 0,
        paid: parseFloat(d.total_paid) || 0,
        pending: parseFloat(d.total_pending) || 0,
        fill: CHART_COLORS[i % CHART_COLORS.length]
    })).filter(d => d.total > 0);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Sales Summary</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Interactive charts, sales trend, top products, and distributor overview.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div className="stat-card">
                    <div className="stat-icon icon-blue"><DollarSign size={28} /></div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Total revenue</p>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{formatCurrency(stats.totalRevenue)}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-purple"><BarChart3 size={28} /></div>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Transactions</p>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>{stats.billCount}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-green"><Package size={28} /></div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Top product</p>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topProducts[0]?.name || '—'}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon icon-orange"><Clock size={28} /></div>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Sales by time</p>
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>Last 30 days</h3>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Sales trend</h4>
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--input-bg)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            {['daily', 'monthly'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: '8px 14px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                                        background: period === p ? 'var(--primary)' : 'transparent', color: period === p ? '#fff' : 'var(--text-muted)'
                                    }}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '280px' }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip
                                        content={<CustomTooltip formatter={(v) => formatCurrency(v)} labelFormatter={(l) => l} />}
                                        cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                    />
                                    <Legend formatter={() => 'Revenue'} />
                                    <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revenueGrad)" isAnimationActive animationDuration={800} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No data for this period</div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Top products</h4>
                        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--input-bg)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            {['daily', 'monthly', 'yearly'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriod(p)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        background: period === p ? 'var(--primary)' : 'transparent', color: period === p ? '#fff' : 'var(--text-muted)'
                                    }}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '280px' }}>
                        {topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 90, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={90} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-main)' }} />
                                    <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ fill: 'var(--hover-bg)' }} />
                                    <Bar dataKey="total_sales" radius={[0, 8, 8, 0]} barSize={22} isAnimationActive animationDuration={600}>
                                        {topProductsData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No sales data</div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '20px' }}>Sales by time of day (last 30 days)</h4>
                    <div style={{ height: '280px' }}>
                        {salesByTime.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesByTime} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ fill: 'var(--hover-bg)' }} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No time data yet</div>
                        )}
                    </div>
                </div>

                {distributorChartData.length > 0 && (
                    <div className="card" style={{ padding: '24px', gridColumn: '1 / -1' }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Truck size={20} /> Distributor summary (purchase orders)
                        </h4>
                        <div style={{ height: '260px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distributorChartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }} layout="vertical" barCategoryGap="12%">
                                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="var(--border)" />
                                    <XAxis type="number" tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-main)' }} />
                                    <Tooltip content={<CustomTooltip formatter={(v) => formatCurrency(v)} />} cursor={{ fill: 'var(--hover-bg)' }} />
                                    <Legend />
                                    <Bar dataKey="paid" name="Paid" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} isAnimationActive animationDuration={600} />
                                    <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--danger)" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={600} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
