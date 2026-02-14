const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', '..', 'backup.sql');
const outputPath = path.join(__dirname, '..', '..', 'backup_cloud.sql');

try {
    let sql = fs.readFileSync(inputPath, 'utf8');

    // Remove CREATE DATABASE and USE statements to allow importing into 'railway' DB
    sql = sql.replace(/CREATE DATABASE .*? `mnb_data` .*?;/g, '-- CREATE DATABASE commented out for cloud migration');
    sql = sql.replace(/USE `mnb_data`;/g, '-- USE mnb_data commented out for cloud migration');

    fs.writeFileSync(outputPath, sql);
    console.log('✅ backup_cloud.sql prepared successfully.');
} catch (err) {
    console.error('❌ Error preparing backup:', err);
}
