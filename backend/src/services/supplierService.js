const { pool } = require('../config/db');

const getAllSuppliers = async () => {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    return rows;
};

const createSupplier = async (data) => {
    const { name, contact_person, phone, product_categories, address, gst_number } = data;
    const [result] = await pool.query(
        'INSERT INTO suppliers (name, contact_person, phone, product_categories, address, gst_number) VALUES (?, ?, ?, ?, ?, ?)',
        [name, contact_person, phone, product_categories, address, gst_number]
    );
    return { id: result.insertId, ...data };
};

const updateSupplier = async (id, data) => {
    const { name, contact_person, phone, product_categories, address, gst_number } = data;
    await pool.query(
        'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, product_categories = ?, address = ?, gst_number = ? WHERE id = ?',
        [name, contact_person, phone, product_categories, address, gst_number, id]
    );
    return { id, ...data };
};

const deleteSupplier = async (id) => {
    await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    return true;
};

module.exports = {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
};
