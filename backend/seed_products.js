const { pool } = require('./src/config/db');

const products = [
    { name: 'Amul Taaza Milk', category: 'Dairy', price: 27.00, stocks: 50, quantity: 500, unit: 'ml', gst_percent: 0 },
    { name: 'Britannia Milk Bread', category: 'Bakery', price: 45.00, stocks: 30, quantity: 1, unit: 'packet', gst_percent: 0 },
    { name: 'Farm Fresh Eggs (6s)', category: 'Dairy', price: 42.00, stocks: 100, quantity: 6, unit: 'pcs', gst_percent: 0 },
    { name: 'Daawat Basmati Rice', category: 'Grains', price: 120.00, stocks: 200, quantity: 1, unit: 'kg', gst_percent: 5 },
    { name: 'Aashirvaad Atta', category: 'Grains', price: 58.00, stocks: 150, quantity: 1, unit: 'kg', gst_percent: 5 },
    { name: 'Maggi Noodles', category: 'Snacks', price: 14.00, stocks: 500, quantity: 1, unit: 'packet', gst_percent: 12 },
    { name: 'Tata Salt', category: 'Essentials', price: 28.00, stocks: 100, quantity: 1, unit: 'kg', gst_percent: 0 },
    { name: 'Gold Winner Oil', category: 'Oils', price: 165.00, stocks: 80, quantity: 1, unit: 'ltr', gst_percent: 5 },
    { name: 'Lays Classic Salted', category: 'Snacks', price: 20.00, stocks: 200, quantity: 1, unit: 'packet', gst_percent: 12 },
    { name: 'Colgate Strong Teeth', category: 'Personal Care', price: 95.00, stocks: 60, quantity: 1, unit: 'pcs', gst_percent: 18 }
];

const seedProducts = async () => {
    try {
        console.log('🌱 Seeding 10 products...');

        for (const p of products) {
            await pool.query(
                `INSERT INTO products (name, category, price, stocks, quantity, unit, gst_percent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [p.name, p.category, p.price, p.stocks, p.quantity, p.unit, p.gst_percent]
            );
        }

        console.log('✅ Successfully added 10 products!');
    } catch (err) {
        console.error('❌ Error seeding products:', err);
    } finally {
        process.exit();
    }
};

seedProducts();
