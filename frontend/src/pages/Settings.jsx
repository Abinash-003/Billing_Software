import React, { useState, useEffect } from 'react';
import { Building2, Save } from 'lucide-react';

const STORAGE_KEY = 'supermarket_settings';

const Settings = () => {
    const [settings, setSettings] = useState({
        storeName: 'MNB Mini Mart',
        tagline: 'MART & CO',
        address: '123 Zoho High Street, Chennai',
        phone: '',
        gstNumber: ''
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (_) {}
    }, []);

    const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        alert('Settings saved.');
    };

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Settings</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>System and store configuration.</p>
                <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Store and billing preferences.</p>
            </div>

            <div className="card" style={{ maxWidth: '560px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '12px', background: 'var(--primary-gradient)', borderRadius: '12px', color: 'white' }}>
                        <Building2 size={24} />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Store details</h3>
                </div>
                <div className="form-group">
                    <label>Store name</label>
                    <input value={settings.storeName} onChange={e => handleChange('storeName', e.target.value)} placeholder="Store name" />
                </div>
                <div className="form-group">
                    <label>Tagline</label>
                    <input value={settings.tagline} onChange={e => handleChange('tagline', e.target.value)} placeholder="e.g. MART & CO" />
                </div>
                <div className="form-group">
                    <label>Address</label>
                    <textarea value={settings.address} onChange={e => handleChange('address', e.target.value)} placeholder="Full address" style={{ minHeight: '80px' }} />
                </div>
                <div className="form-group">
                    <label>Phone</label>
                    <input value={settings.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="Store phone" />
                </div>
                <div className="form-group">
                    <label>GST number</label>
                    <input value={settings.gstNumber} onChange={e => handleChange('gstNumber', e.target.value)} placeholder="GSTIN (optional)" />
                </div>
                <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: '8px' }}>
                    <Save size={18} /> Save settings
                </button>
            </div>
        </div>
    );
};

export default Settings;
