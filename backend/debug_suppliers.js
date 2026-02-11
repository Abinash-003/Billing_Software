const { pool } = require('./src/config/db');

(async () => {
    try {
        console.log('--- Checking Suppliers Table ---');
        const [rows] = await pool.query('SELECT * FROM suppliers');
        console.log(`Found ${rows.length} suppliers.`);
        rows.forEach(r => console.log(JSON.stringify(r)));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
})();
