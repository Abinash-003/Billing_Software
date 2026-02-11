const { pool } = require('./src/config/db');

(async () => {
    try {
        console.log('Adding single supplier: Coca-Cola Beverages...');
        await pool.query(
            `INSERT INTO suppliers (name, contact_person, phone, product_categories, address, gst_number) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Coca-Cola Beverages', 'Michael D', '9876500000', 'Soft Drinks, Water', 'Plot 45, Industrial Area', '01COKE1234Z1']
        );
        console.log('✅ Successfully added Coca-Cola Beverages!');
    } catch (err) {
        console.error('❌ Error adding supplier:', err);
    } finally {
        process.exit();
    }
})();
