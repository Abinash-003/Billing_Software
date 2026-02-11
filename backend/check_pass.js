const mysql = require('mysql2/promise');

const passwords = ['', 'root', 'admin', 'password', '12345678', 'mysql'];

async function crack() {
    for (const p of passwords) {
        try {
            const conn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: p
            });
            console.log(`FOUND_PASSWORD: "${p}"`);
            await conn.end();
            return;
        } catch (e) {
            console.log(`Failed with "${p}": ${e.message}`);
        }
    }
    console.log('NOT_FOUND');
}

crack();
