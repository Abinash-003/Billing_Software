const { pool } = require('./src/config/db');

(async () => {
    try {
        console.log('🔄 Fixing Suppliers Table & Data...');

        // 1. Drop Table to ensure clean state
        await pool.query('DROP TABLE IF EXISTS suppliers');
        console.log('🗑️  Dropped old suppliers table.');

        // 2. Re-create Table with correct schema
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
        console.log('✅ Created suppliers table with [product_categories] column.');

        // 3. Seed Data
        const suppliers = [
            { name: 'Amul Distributors', contact_person: 'Rajesh Kumar', phone: '9876543210', product_categories: 'Dairy, Ice Cream', address: 'Chennai', gst_number: '33AA123' },
            { name: 'Britannia Agencies', contact_person: 'Suresh Babu', phone: '9898989898', product_categories: 'Bakery, Biscuits', address: 'Bangalore', gst_number: '29BB123' },
            { name: 'Nestle Wholesale', contact_person: 'Vikram Singh', phone: '9123456780', product_categories: 'Chocolates, Maggi', address: 'Mumbai', gst_number: '27CC123' },
            { name: 'Hindustan Unilever', contact_person: 'Anita Desai', phone: '9988776655', product_categories: 'Soaps, Detergents', address: 'Delhi', gst_number: '07DD123' },
            { name: 'ITC Limited', contact_person: 'Manoj', phone: '8877665544', product_categories: 'Atta, Snacks', address: 'Kolkata', gst_number: '19EE123' }
        ];

        for (const s of suppliers) {
            await pool.query(
                `INSERT INTO suppliers (name, contact_person, phone, product_categories, address, gst_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [s.name, s.contact_person, s.phone, s.product_categories, s.address, s.gst_number]
            );
        }
        console.log('🌱 Seeded 5 suppliers.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
})();
