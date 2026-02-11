const { pool } = require('../config/db');

const getOrdersBySupplierId = async (supplierId) => {
    const [rows] = await pool.query(
        `SELECT * FROM distributor_orders WHERE supplier_id = ? ORDER BY COALESCE(ordered_date, created_at) DESC, id DESC`,
        [supplierId]
    );
    return rows;
};

const getOrderById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM distributor_orders WHERE id = ?', [id]);
    return rows[0] || null;
};

const createOrder = async (data) => {
    const {
        supplier_id,
        ordered_date,
        delivered_date,
        delivery_status = 'Pending',
        invoice_number,
        total_amount = 0,
        paid_amount = 0,
        balance_amount,
        payment_status,
        notes,
        bill_file_url
    } = data;
    const balance = balance_amount != null ? balance_amount : Math.max(0, parseFloat(total_amount) - parseFloat(paid_amount));
    const [result] = await pool.query(
        `INSERT INTO distributor_orders (
            supplier_id, ordered_date, delivered_date, delivery_status,
            invoice_number, total_amount, paid_amount, balance_amount,
            payment_status, notes, bill_file_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            supplier_id,
            ordered_date || null,
            delivered_date || null,
            delivery_status,
            invoice_number || null,
            total_amount,
            paid_amount,
            balance,
            payment_status || (balance <= 0 ? 'Paid' : (paid_amount > 0 ? 'Partial' : 'Unpaid')),
            notes || null,
            bill_file_url || null
        ]
    );
    return { id: result.insertId, ...data, balance_amount: balance };
};

const updateOrder = async (id, data) => {
    const existing = await getOrderById(id);
    if (!existing) return null;
    const {
        ordered_date,
        delivered_date,
        delivery_status,
        invoice_number,
        total_amount,
        paid_amount,
        balance_amount,
        payment_status,
        notes,
        bill_file_url
    } = { ...existing, ...data };
    const paid = parseFloat(paid_amount ?? existing.paid_amount) || 0;
    const total = parseFloat(total_amount ?? existing.total_amount) || 0;
    const balance = balance_amount != null ? balance_amount : Math.max(0, total - paid);
    const status = payment_status || (balance <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'));
    await pool.query(
        `UPDATE distributor_orders SET
            ordered_date = ?, delivered_date = ?, delivery_status = ?,
            invoice_number = ?, total_amount = ?, paid_amount = ?, balance_amount = ?,
            payment_status = ?, notes = ?, bill_file_url = COALESCE(?, bill_file_url)
        WHERE id = ?`,
        [
            ordered_date ?? existing.ordered_date,
            delivered_date ?? existing.delivered_date,
            delivery_status ?? existing.delivery_status,
            invoice_number ?? existing.invoice_number,
            total,
            paid,
            balance,
            status,
            notes ?? existing.notes,
            bill_file_url,
            id
        ]
    );
    return getOrderById(id);
};

const deleteOrder = async (id) => {
    const [result] = await pool.query('DELETE FROM distributor_orders WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

const getSupplierOrderSummary = async (supplierId) => {
    const [rows] = await pool.query(
        `SELECT
            COALESCE(SUM(paid_amount), 0) as total_paid,
            COALESCE(SUM(balance_amount), 0) as total_pending,
            COUNT(*) as order_count
        FROM distributor_orders WHERE supplier_id = ?`,
        [supplierId]
    );
    return rows[0] || { total_paid: 0, total_pending: 0, order_count: 0 };
};

const getDistributorSummaryForCharts = async () => {
    const [rows] = await pool.query(`
        SELECT s.id, s.name,
            COALESCE(SUM(o.total_amount), 0) as total_amount,
            COALESCE(SUM(o.paid_amount), 0) as total_paid,
            COALESCE(SUM(o.balance_amount), 0) as total_pending,
            COUNT(o.id) as order_count
        FROM suppliers s
        LEFT JOIN distributor_orders o ON s.id = o.supplier_id
        GROUP BY s.id, s.name
        ORDER BY total_amount DESC
    `);
    return rows;
};

/**
 * Receive stock: create distributor order + line items, then increase product stocks.
 * Updates distributor balance (order record) and product stock in one transaction.
 */
const receiveStock = async (data) => {
    const {
        supplier_id,
        invoice_number,
        order_date,
        delivered_date,
        paid_amount = 0,
        notes,
        items
    } = data;

    if (!items || !items.length) {
        const err = new Error('At least one product with quantity is required');
        err.status = 400;
        throw err;
    }

    const total_amount = items.reduce((sum, it) => {
        const qty = parseInt(it.quantity, 10) || 0;
        const up = parseFloat(it.unitPrice) || 0;
        return sum + qty * up;
    }, 0);
    const paid = parseFloat(paid_amount) || 0;
    const balance_amount = Math.max(0, total_amount - paid);
    const payment_status = balance_amount <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const [orderResult] = await connection.query(
            `INSERT INTO distributor_orders (
                supplier_id, ordered_date, delivered_date, delivery_status,
                invoice_number, total_amount, paid_amount, balance_amount,
                payment_status, notes
            ) VALUES (?, ?, ?, 'Delivered', ?, ?, ?, ?, ?, ?)`,
            [
                supplier_id,
                order_date || null,
                delivered_date || order_date || null,
                invoice_number || null,
                total_amount,
                paid,
                balance_amount,
                payment_status,
                notes || null
            ]
        );
        const orderId = orderResult.insertId;

        for (const it of items) {
            const productId = parseInt(it.productId, 10);
            const quantity = Math.max(0, parseInt(it.quantity, 10) || 0);
            const unitPrice = parseFloat(it.unitPrice) || 0;
            const subtotal = quantity * unitPrice;
            if (quantity <= 0) continue;

            await connection.query(
                `INSERT INTO distributor_order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
                [orderId, productId, quantity, unitPrice, subtotal]
            );
            await connection.query(
                'UPDATE products SET stocks = stocks + ?, cost_price = ? WHERE id = ?',
                [quantity, unitPrice, productId]
            );
        }

        await connection.commit();
        return { id: orderId, total_amount, message: 'Stock received and updated' };
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    getOrdersBySupplierId,
    getOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    getSupplierOrderSummary,
    getDistributorSummaryForCharts,
    receiveStock
};
