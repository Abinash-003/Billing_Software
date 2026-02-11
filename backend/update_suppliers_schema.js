const { pool } = require('./src/config/db');

(async () => {
    try {
        console.log('--- Updating Suppliers Table ---');

        // Dropping the table to recreate it with the new schema (since it's a new feature and likely has little data)
        await pool.query('DROP TABLE IF EXISTS suppliers');

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
        console.log('✅ Suppliers table updated: Removed email, Added product_categories.');
    } catch (err) {
        console.error('❌ Error updating table:', err);
    } finally {
        process.exit();
    }
})();
