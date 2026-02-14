const { pool } = require('../config/db');

const getAllProducts = async () => {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    return rows;
};

const getProductById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
};

const createProduct = async (productData) => {
    const { name, category, price, quantity, stocks, unit, gst_percent = 0 } = productData;
    const [result] = await pool.query(
        'INSERT INTO products (name, category, price, quantity, stocks, unit, gst_percent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, category, price, quantity || 0, stocks, unit, gst_percent]
    );
    return { id: result.insertId, ...productData };
};

const updateProduct = async (id, productData) => {
    const { name, category, price, quantity, stocks, unit, gst_percent = 0 } = productData;
    await pool.query(
        'UPDATE products SET name = ?, category = ?, price = ?, quantity = ?, stocks = ?, unit = ?, gst_percent = ? WHERE id = ?',
        [name, category, price, quantity || 0, stocks, unit, gst_percent, id]
    );
    return { id, ...productData };
};

const deleteProduct = async (id) => {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return { id };
};

const searchProducts = async (term) => {
    const t = typeof term === 'string' ? term.trim() : '';
    if (!t) return [];
    const [rows] = await pool.query(
        'SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR barcode = ?',
        [`%${t}%`, `%${t}%`, t]
    );
    return rows;
};

const getProductByBarcode = async (barcode) => {
    if (!barcode || !String(barcode).trim()) return null;
    const [rows] = await pool.query('SELECT * FROM products WHERE barcode = ?', [String(barcode).trim()]);
    return rows[0] || null;
};

module.exports = {
    getAllProducts,
    getProductById,
    getProductByBarcode,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
};
