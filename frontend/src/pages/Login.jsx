import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services';
import { LogIn, ShieldCheck, Sun, Moon } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ username, password });
            login(response.data);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-bg">
            <div className="card animate-fade" style={{ width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', position: 'relative' }}>
                <button
                    type="button"
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    style={{ position: 'absolute', top: '20px', right: '20px' }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ padding: '14px', background: 'var(--primary-gradient)', borderRadius: 'var(--radius-lg)', color: 'white', boxShadow: '0 4px 14px var(--primary-glow)' }}>
                        <ShieldCheck size={32} />
                    </div>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '6px', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
                    MNB Mini Mart
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '28px', fontSize: '14px' }}>
                    Secure staff login
                </p>

                {error && (
                    <div style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label style={{ color: 'var(--text-muted)' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label style={{ color: 'var(--text-muted)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '15px' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : <><LogIn size={20} /> Sign in</>}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', padding: '12px', background: 'var(--hover-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Default: <span style={{ color: 'var(--primary-light)', fontWeight: '600' }}>admin / admin123</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
