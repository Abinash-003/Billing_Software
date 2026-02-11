const { pool } = require('./src/config/db');

const suppliers = [
    {
        name: 'Amul Distributors',
        contact_person: 'Rajesh Kumar',
        phone: '9876543210',
        product_categories: 'Dairy Products, Ice Cream',
        address: '123, Milk Colony, Chennai',
        gst_number: '33AABCA1234A1Z5'
    },
    {
        name: 'Britannia Agencies',
        contact_person: 'Suresh Babu',
        phone: '9898989898',
        product_categories: 'Bakery, Biscuits, Bread',
        address: '45, Industrial Estate, Bangalore',
        gst_number: '29ABCDE1234F1Z5'
    },
    {
        name: 'Nestle Wholesale',
        contact_person: 'Vikram Singh',
        phone: '9123456780',
        product_categories: 'Chocolates, Coffee, Maggi',
        address: '78, Food Park, Mumbai',
        gst_number: '27PQRST1234G1Z5'
    },
    {
        name: 'Hindustan Unilever',
        contact_person: 'Anita Desai',
        phone: '9988776655',
        product_categories: 'Soaps, Shampoos, Detergents',
        address: '101, FMCG Hub, Delhi',
        gst_number: '07UVWXY1234H1Z5'
    },
    {
        name: 'ITC Limited',
        contact_person: 'Manoj Gupta',
        phone: '8877665544',
        product_categories: 'Atta, Noodles, Snacks',
        address: '202, Trade Center, Kolkata',
        gst_number: '19KLMNO1234I1Z5'
    }
];

const seedSuppliers = async () => {
    try {
        console.log('🌱 Seeding 5 suppliers...');

        for (const s of suppliers) {
            await pool.query(
                `INSERT INTO suppliers (name, contact_person, phone, product_categories, address, gst_number) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [s.name, s.contact_person, s.phone, s.product_categories, s.address, s.gst_number]
            );
        }

        console.log('✅ Successfully added 5 suppliers!');
    } catch (err) {
        console.error('❌ Error seeding suppliers:', err);
    } finally {
        process.exit();
    }
};

seedSuppliers();
