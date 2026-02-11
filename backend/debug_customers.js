const { pool } = require('./src/config/db');

(async () => {
    try {
        console.log('--- Checking Bills Table ---');
        const [rows] = await pool.query('SELECT id, customer_name, customer_phone, grand_total FROM bills');
        console.log(`Found ${rows.length} bills.`);
        rows.forEach(r => console.log(JSON.stringify(r)));

        console.log('\n--- Checking getCustomers Query ---');
        const [customers] = await pool.query(`
            SELECT 
                customer_name, 
                customer_phone, 
                COUNT(id) as visit_count, 
                SUM(grand_total) as total_spend, 
                MAX(created_at) as last_visit 
            FROM bills 
            WHERE customer_phone IS NOT NULL AND customer_phone != '' 
            GROUP BY customer_phone, customer_name 
            ORDER BY last_visit DESC
        `);
        console.log(`Query returned ${customers.length} customers.`);
        customers.forEach(c => console.log(JSON.stringify(c)));

    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
})();
