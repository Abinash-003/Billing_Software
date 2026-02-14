const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 22977,
    user: 'root',
    password: 'MVEowpincUgtyNyfpCtiLchuQdvCDVac',
    database: 'railway',
    ssl: { rejectUnauthorized: false }
};

const checkGrants = async () => {
    try {
        console.log('🔌 Connecting to check grants...');
        const connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected successfully.');

        const [rows] = await connection.query("SELECT user, host FROM mysql.user WHERE user = 'root'");
        console.log('👤 Root user hosts:', rows);

        await connection.end();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
};

checkGrants();
