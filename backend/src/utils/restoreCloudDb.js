const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Hardcoded for the restoration script only (or could use env vars if set)
const DB_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 22977,
    user: 'root',
    password: 'MVEowpincUgtyNyfpCtiLchuQdvCDVac',
    database: 'railway',
    ssl: { rejectUnauthorized: false } // Important for external connections
};

const restore = async () => {
    try {
        console.log('🔌 Connecting to Railway DB...');
        const connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected.');

        const sqlPath = path.join(__dirname, '..', '..', 'backup_cloud.sql');
        console.log(`📂 Reading SQL file: ${sqlPath}`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split into statements (basic splitting by semicolon)
        // Note: mysqldump files are usually safe to split by lines ending in ;
        // But complex stored procedures might break this. For simple dumps, it's okay.
        // Better approach: execute the whole content if library supports multiple statements.
        // mysql2 supports multiple statements if enabled in config.

        await connection.end();

        // Reconnect with multipleStatements: true
        const multiStmtConnection = await mysql.createConnection({
            ...DB_CONFIG,
            multipleStatements: true
        });

        console.log('🚀 Executing SQL import...');
        await multiStmtConnection.query(sqlContent);

        console.log('✅ Database restoration complete!');
        await multiStmtConnection.end();

    } catch (err) {
        console.error('❌ Restoration failed:', err);
    }
};

restore();
