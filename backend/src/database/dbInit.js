const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const initDb = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Explicitly select the database
        await pool.query(`USE ${process.env.DB_NAME}`);

        // Split and execute SQL (Basic approach, works for simple schemas)
        const statements = schemaSql.split(';').filter(s => s.trim() !== '');

        for (let statement of statements) {
            await pool.query(statement);
        }

        // Add cost_price to products if missing (for profit calculation)
        try {
            await pool.query(`
                ALTER TABLE products ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0 AFTER price
            `);
            console.log('✅ Added cost_price to products');
        } catch (e) {
            if (!e.message || !e.message.includes('Duplicate column')) {}
        }

        // Ensure suppliers table exists (legacy DBs created via fix_suppliers)
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS suppliers (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    contact_person VARCHAR(100),
                    phone VARCHAR(20),
                    product_categories VARCHAR(255),
                    address TEXT,
                    gst_number VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) { /* ignore */ }

        // Distributor orders (for distributor module upgrade)
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS distributor_orders (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    supplier_id INT NOT NULL,
                    ordered_date DATE,
                    delivered_date DATE,
                    delivery_status ENUM('Pending', 'Delivered', 'Cancelled') DEFAULT 'Pending',
                    invoice_number VARCHAR(80),
                    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    balance_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
                    payment_status ENUM('Paid', 'Partial', 'Unpaid') DEFAULT 'Unpaid',
                    notes TEXT,
                    bill_file_url VARCHAR(512),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_supplier_orders (supplier_id),
                    INDEX idx_order_dates (ordered_date, delivered_date)
                )
            `);
            console.log('✅ distributor_orders table ready');
        } catch (e) {
            if (!e.message || !e.message.includes('already exists')) console.error('distributor_orders init:', e.message);
        }

        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS distributor_order_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL,
                    unit_price DECIMAL(10, 2) NOT NULL,
                    subtotal DECIMAL(10, 2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_order_items (order_id)
                )
            `);
            console.log('✅ distributor_order_items table ready');
        } catch (e) {
            if (!e.message || !e.message.includes('already exists')) console.error('distributor_order_items init:', e.message);
        }

        // Check if admin user exists, if not create one
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (rows.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', ['ADMIN']);
            const adminRoleId = roleRows[0].id;

            await pool.query(
                'INSERT INTO users (username, password, role_id, full_name) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, adminRoleId, 'Super Admin']
            );
            console.log('✅ Default admin user created (admin / admin123)');
        }

        console.log('✅ Database schema initialized');
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
    }
};

module.exports = { initDb };
