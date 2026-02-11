const { pool } = require('./src/config/db');

(async () => {
    try {
        console.log('--- Creating Suppliers Table ---');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                contact_person VARCHAR(100),
                phone VARCHAR(20),
                email VARCHAR(100),
                address TEXT,
                gst_number VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Suppliers table created successfully.');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        process.exit();
    }
})();
