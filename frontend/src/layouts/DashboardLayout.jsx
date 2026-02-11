import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    ReceiptText,
    BarChart3,
    Truck,
    LogOut,
    User,
    ShoppingBag,
    Users,
    ShoppingCart,
    FolderOpen,
    Wallet,
    FileText,
    Settings,
    ClipboardList,
    Sun,
    Moon,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = () => {
    const { user, logout, isAdmin } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const overview = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    ];
    const billing = [
        { icon: <ShoppingCart size={20} />, label: 'Billing Counter', path: '/billing' },
        { icon: <ClipboardList size={20} />, label: 'Sales History', path: '/orders' },
    ];
    const stock = [
        { icon: <Package size={20} />, label: 'Products', path: '/products' },
        { icon: <FolderOpen size={20} />, label: 'Stock Management', path: '/inventory' },
    ];
    const people = [
        { icon: <Users size={20} />, label: 'Customers', path: '/customers' },
        { icon: <Truck size={20} />, label: 'Distributors', path: '/suppliers' },
    ];
    const admin = isAdmin ? [
        { icon: <ReceiptText size={20} />, label: 'Receive Stock', path: '/purchases' },
        { icon: <Wallet size={20} />, label: 'Expenses', path: '/expenses' },
        { icon: <BarChart3 size={20} />, label: 'Sales Summary', path: '/analytics' },
        { icon: <FileText size={20} />, label: 'Daily Reports', path: '/reports' },
        { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
    ] : [];

    const groups = [
        { title: 'Overview', items: overview },
        { title: 'Billing', items: billing },
        { title: 'Stock', items: stock },
        { title: 'People', items: people },
        ...(admin.length ? [{ title: 'Admin', items: admin }] : []),
    ];

    return (
        <div className="dashboard-container">
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header" style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px', flexShrink: 0 }}>
                    <div style={{ padding: '10px', background: 'var(--primary-gradient)', borderRadius: 'var(--radius-md)', color: 'white', boxShadow: '0 4px 14px var(--primary-glow)', flexShrink: 0 }}>
                        <ShoppingBag size={24} />
                    </div>
                    <div className="sidebar-brand nav-label" style={{ minWidth: 0, flex: 1 }}>
                        <h2 className="nav-label" style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>MNB Mini</h2>
                        <p className="nav-label" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Mart & Co</p>
                    </div>
                    <button
                        type="button"
                        className="theme-toggle sidebar-toggle"
                        style={{ flexShrink: 0, minWidth: '40px', minHeight: '40px' }}
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {groups.map((g) => (
                        <div key={g.title} style={{ marginBottom: '16px' }}>
                            <p className="nav-group-title" style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', padding: '0 14px' }}>{g.title}</p>
                            {g.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-label" style={{ fontWeight: '600', fontSize: '14px' }}>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '12px' }}>
                    <div className="theme-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <button
                            type="button"
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <span className="nav-label" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                        </span>
                    </div>
                    <div className="sidebar-user-card" style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--hover-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <User size={20} color="var(--primary)" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p className="user-name" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.user?.fullName || 'User'}</p>
                                <p className="user-role" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>{user?.user?.role || 'Staff'}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="btn btn-danger logout-btn"
                            style={{ width: '100%', padding: '10px 14px', justifyContent: 'center', fontSize: '13px' }}
                        >
                            <LogOut size={16} /> <span className="nav-label">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.4s ease forwards' }}>
                    <Outlet />
                </div>
            </main>

            <style>{`
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 12px 14px;
                    margin-bottom: 4px;
                    border-radius: var(--radius-md);
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    font: inherit;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .sidebar-link:hover { background: var(--hover-bg); color: var(--text-main); }
                .sidebar-link.active {
                    background: var(--primary-gradient) !important;
                    color: white !important;
                    box-shadow: 0 4px 14px var(--primary-glow);
                }
                .sidebar .nav-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            `}</style>
        </div>
    );
};

export default DashboardLayout;
