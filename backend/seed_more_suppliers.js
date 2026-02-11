const { pool } = require('./src/config/db');

const newSuppliers = [
    {
        name: 'Parle Products',
        contact_person: 'Ravi Verma',
        phone: '9988001122',
        product_categories: 'Biscuits, Confectionery',
        address: '56, North Zone, Mumbai',
        gst_number: '27AAAAA0000A1Z5'
    },
    {
        name: 'Dabur India',
        contact_person: 'Priya Sharma',
        phone: '8877665500',
        product_categories: 'Ayurvedic, Honey, Juices',
        address: '89, Kaushambi, Ghaziabad',
        gst_number: '09BBBBB1111B1Z5'
    },
    {
        name: 'Patanjali Ayurved',
        contact_person: 'Amit Singh',
        phone: '7766554433',
        product_categories: 'Ghee, Daily Needs, Herbal',
        address: 'Haridwar Industrial Area',
        gst_number: '05CCCCC2222C1Z5'
    },
    {
        name: 'PepsiCo India',
        contact_person: 'John Doe',
        phone: '6655443322',
        product_categories: 'Beverages, Chips, Lay\'s',
        address: 'DLF Cyber City, Gurgaon',
        gst_number: '06DDDDD3333D1Z5'
    },
    {
        name: 'Cadbury (Mondelez)',
        contact_person: 'Sarah Khan',
        phone: '5544332211',
        product_categories: 'Chocolates, Bournvita',
        address: 'Indiabulls Finance Centre, Mumbai',
        gst_number: '27EEEEE4444E1Z5'
    }
];

const seedMoreSuppliers = async () => {
    try {
        console.log('🌱 Seeding 5 NEW suppliers...');

        for (const s of newSuppliers) {
            await pool.query(
                `INSERT INTO suppliers (name, contact_person, phone, product_categories, address, gst_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [s.name, s.contact_person, s.phone, s.product_categories, s.address, s.gst_number]
            );
        }

        console.log('✅ Successfully added 5 NEW suppliers!');
    } catch (err) {
        console.error('❌ Error seeding suppliers:', err);
    } finally {
        process.exit();
    }
};

seedMoreSuppliers();
