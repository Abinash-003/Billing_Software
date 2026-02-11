const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (username, password) => {
    const [rows] = await pool.query(
        `SELECT u.*, r.name as role 
     FROM users u 
     JOIN roles r ON u.role_id = r.id 
     WHERE u.username = ?`,
        [username]
    );

    const user = rows[0];
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.full_name
        }
    };
};

module.exports = { login };
