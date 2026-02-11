import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { billService } from "../services";
import { getData } from "../services/api";
import {
    ReceiptText,
    Package,
    AlertCircle,
    ArrowRight,
    DollarSign,
    TrendingUp,
    Wallet,
    Minus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CardSkeleton } from "../components/Skeleton";
import AnimatedCounter from "../components/AnimatedCounter";

const getExpensesTotal = () => {
    try {
        const saved = localStorage.getItem("expenses");
        const list = saved ? JSON.parse(saved) : [];
        return list.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    } catch (_) {
        return 0;
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        billCount: 0,
        productCount: 0,
        lowStockCount: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        todayProfit: 0,
        monthProfit: 0,
        todayOrders: 0,
    });
    const [expensesTotal, setExpensesTotal] = useState(0);
    const [recentBills, setRecentBills] = useState([]);
    const [dailyReport, setDailyReport] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [highlightSection, setHighlightSection] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsResp, billsResp, dailyResp, monthlyResp] = await Promise.all([
                billService.getStats(),
                billService.getRecent(),
                billService.getReports("daily").catch(() => ({ data: [] })),
                billService.getReports("monthly").catch(() => ({ data: [] })),
            ]);

            const dashboardStats = getData(statsResp) || {};
            const recent = getData(billsResp) || [];
            const daily = getData(dailyResp) || [];
            const monthly = getData(monthlyResp) || [];

            const todayStr = new Date().toISOString().slice(0, 10);
            const todayData = daily.find((d) => d.date && String(d.date).slice(0, 10) === todayStr);

            setStats({
                totalSales: Number(dashboardStats.totalRevenue) || 0,
                billCount: Number(dashboardStats.billCount) || 0,
                productCount: Number(dashboardStats.productCount) || 0,
                lowStockCount: Number(dashboardStats.lowStockCount) || 0,
                todayRevenue: Number(dashboardStats.todayRevenue) ?? (todayData ? parseFloat(todayData.revenue) || 0 : 0),
                monthRevenue: Number(dashboardStats.monthRevenue) ?? 0,
                todayProfit: Number(dashboardStats.todayProfit) || 0,
                monthProfit: Number(dashboardStats.monthProfit) || 0,
                todayOrders: todayData ? (todayData.bill_count || 0) : 0,
            });
            setRecentBills(Array.isArray(recent) ? recent.slice(0, 8) : []);
            setDailyReport(Array.isArray(daily) ? daily : []);
            setMonthlyReport(Array.isArray(monthly) ? monthly : []);
            setExpensesTotal(getExpensesTotal());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        const onRefresh = () => {
            setExpensesTotal(getExpensesTotal());
            fetchDashboardData();
            setHighlightSection("stats");
            setTimeout(() => setHighlightSection(null), 1500);
        };
        window.addEventListener("dashboardRefresh", onRefresh);
        return () => window.removeEventListener("dashboardRefresh", onRefresh);
    }, [fetchDashboardData]);

    const formatCurrency = (v) => `₹${(Number(v) || 0).toFixed(2)}`;
    const netProfit = (stats.monthProfit || 0) - expensesTotal;
    const chartData = monthlyReport.length > 0 ? monthlyReport : dailyReport;
    const chartXKey = monthlyReport.length > 0 ? "month" : "date";

    const mainStats = [
        { label: "Today's Sales", value: stats.todayRevenue, format: "currency", icon: <DollarSign size={26} />, class: "icon-green" },
        { label: "Today's Profit", value: stats.todayProfit, format: "currency", icon: <TrendingUp size={26} />, class: "icon-blue" },
        { label: "Monthly Sales", value: stats.monthRevenue, format: "currency", icon: <ReceiptText size={26} />, class: "icon-purple" },
        { label: "Monthly Profit", value: stats.monthProfit, format: "currency", icon: <TrendingUp size={26} />, class: "icon-green" },
        { label: "Expenses", value: expensesTotal, format: "currency", icon: <Wallet size={26} />, class: "icon-orange" },
        { label: "Net Profit", value: netProfit, format: "currency", icon: <Minus size={26} />, class: netProfit >= 0 ? "icon-green" : "icon-orange" },
    ];

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", marginBottom: "6px" }}>
                    Dashboard
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
                    Sales and profit at a glance. Updates after every sale.
                </p>
            </div>

            {loading ? (
                <CardSkeleton count={6} />
            ) : (
                <>
                    <div
                        className="stats-grid"
                        style={{
                            transition: "box-shadow 0.4s ease",
                            ...(highlightSection === "stats" ? { animation: "highlightPulse 1.5s ease" } : {}),
                        }}
                    >
                        {mainStats.map((card, idx) => (
                            <div key={idx} className="stat-card">
                                <div className={`stat-icon ${card.class}`}>{card.icon}</div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", marginBottom: "4px" }}>
                                        {card.label}
                                    </p>
                                    <h3 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-main)" }}>
                                        {card.format === "currency" ? (
                                            <AnimatedCounter value={card.value} prefix="₹" decimals={2} />
                                        ) : (
                                            <AnimatedCounter value={card.value} decimals={0} />
                                        )}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card" style={{ marginBottom: "28px", padding: "24px" }}>
                        <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)", marginBottom: "20px" }}>
                            Sales overview
                        </h4>
                        <div style={{ height: "260px" }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey={chartXKey}
                                            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                                            tickFormatter={(v) => (typeof v === "string" ? v.slice(-5) : v)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                                            tickFormatter={(v) => `₹${v}`}
                                        />
                                        <Tooltip
                                            formatter={(v) => [formatCurrency(v), "Sales"]}
                                            contentStyle={{
                                                borderRadius: "var(--radius-md)",
                                                border: "1px solid var(--border)",
                                                background: "var(--card-bg)",
                                            }}
                                            labelStyle={{ color: "var(--text-muted)" }}
                                            cursor={{ stroke: "var(--primary)", strokeWidth: 1 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--primary)"
                                            strokeWidth={2}
                                            dot={{ fill: "var(--primary)" }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div
                                    style={{
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--text-muted)",
                                        fontSize: "14px",
                                    }}
                                >
                                    No sales yet. Complete a sale at Billing Counter to see trends.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: "0" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "20px 24px",
                                borderBottom: "1px solid var(--border)",
                            }}
                        >
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>
                                Recent sales
                            </h3>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: "8px 16px", fontSize: "13px" }}
                                onClick={() => navigate("/billing")}
                            >
                                Billing Counter <ArrowRight size={16} />
                            </button>
                        </div>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Bill No.</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBills.map((bill) => (
                                        <tr key={bill.id}>
                                            <td style={{ fontWeight: "700", color: "var(--primary)" }}>
                                                #{bill.bill_number}
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: "600", fontSize: "14px" }}>{bill.customer_name}</span>
                                                {bill.customer_phone && (
                                                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)" }}>
                                                        {bill.customer_phone}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                                                {new Date(bill.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ fontWeight: "700" }}>₹{parseFloat(bill.grand_total).toFixed(2)}</td>
                                            <td>
                                                <span className="badge badge-success">Done</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentBills.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                style={{
                                                    textAlign: "center",
                                                    padding: "48px 24px",
                                                    color: "var(--text-muted)",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                No sales yet. Go to Billing Counter to start.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes highlightPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; box-shadow: 0 0 0 4px var(--primary-glow); }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
