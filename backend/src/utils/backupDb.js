const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'mnb_data';

const dumpFile = path.join(__dirname, '..', '..', 'backup.sql'); // Saved to backend/backup.sql

console.log(`📦 Creating MySQL dump for database: ${DB_NAME}...`);

// Construct command
// Note: If password contains special characters, it might need escaping, but for this simple script we assume standard shell escaping.
// On Windows, putting password directly in command line with special chars can be tricky.
// Safest way is to set MYSQL_PWD env var for the child process.

const env = { ...process.env, MYSQL_PWD: DB_PASSWORD };
const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} --databases ${DB_NAME} --result-file="${dumpFile}"`;

exec(command, { env }, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error creating dump: ${error.message}`);
        console.error(stderr);
        return;
    }
    console.log(`✅ Backup successfully created at: ${dumpFile}`);
    console.log('👉 You can now import this file into your cloud database using a tool like MySQL Workbench, DBeaver, or via command line.');
});
