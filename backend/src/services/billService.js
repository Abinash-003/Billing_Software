const { pool } = require('../config/db');

const createBill = async (billData, cashierId) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        const {
            customerName,
            customerPhone,
            items, // Array of { productId, quantity, unitPrice, gstPercent }
            totalAmount,
            taxAmount,
            discountAmount,
            grandTotal
        } = billData;

        // Check stock before creating bill
        for (const item of items) {
            const [rows] = await connection.query('SELECT name, stocks FROM products WHERE id = ?', [item.productId]);
            if (rows.length === 0) {
                const err = new Error(`Product id ${item.productId} not found`);
                err.status = 400;
                throw err;
            }
            if (rows[0].stocks < item.quantity) {
                const err = new Error(`Insufficient stock for ${rows[0].name}. Available: ${rows[0].stocks}`);
                err.status = 400;
                throw err;
            }
        }

        // Generate Bill Number: SB-RANDOM-TIMESTAMP
        const billNumber = `SB-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-6)}`;

        // 1. Insert into bills table
        const [billResult] = await connection.query(
            `INSERT INTO bills (bill_number, customer_name, customer_phone, total_amount, tax_amount, discount_amount, grand_total, cashier_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [billNumber, customerName, customerPhone, totalAmount, taxAmount, discountAmount, grandTotal, cashierId]
        );

        const billId = billResult.insertId;

        // 2. Insert bill items and update stock
        for (const item of items) {
            const gstAmount = (item.unitPrice * item.quantity * item.gstPercent) / 100;
            const subtotal = (item.unitPrice * item.quantity) + gstAmount;

            await connection.query(
                `INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, gst_amount, subtotal) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [billId, item.productId, item.quantity, item.unitPrice, gstAmount, subtotal]
            );

            // Deduct stocks
            await connection.query(
                'UPDATE products SET stocks = stocks - ? WHERE id = ?',
                [item.quantity, item.productId]
            );
        }

        await connection.commit();
        return { id: billId, billNumber };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const getRecentBills = async () => {
    const [rows] = await pool.query(
        `SELECT b.*, u.full_name as cashier_name 
     FROM bills b 
     JOIN users u ON b.cashier_id = u.id 
     ORDER BY b.created_at DESC LIMIT 10`
    );
    return rows;
};

const getBillDetails = async (id) => {
    const [billRows] = await pool.query(
        `SELECT b.*, u.full_name as cashier_name 
     FROM bills b 
     JOIN users u ON b.cashier_id = u.id 
     WHERE b.id = ?`,
        [id]
    );

    if (billRows.length === 0) return null;

    const [itemRows] = await pool.query(
        `SELECT bi.*, p.name as product_name 
     FROM bill_items bi 
     JOIN products p ON bi.product_id = p.id 
     WHERE bi.bill_id = ?`,
        [id]
    );

    return { ...billRows[0], items: itemRows };
};

const getSalesReport = async (period = 'daily') => {
    let query = '';
    if (period === 'daily') {
        query = `SELECT DATE(created_at) as date, SUM(grand_total) as revenue, COUNT(*) as bill_count 
                 FROM bills WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
                 GROUP BY DATE(created_at)
                 ORDER BY date ASC`;
    } else if (period === 'monthly') {
        query = `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(grand_total) as revenue, COUNT(*) as bill_count 
                 FROM bills WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) 
                 GROUP BY month 
                 ORDER BY month ASC`;
    }

    const [rows] = await pool.query(query);
    return rows;
};

const getTopProducts = async (period = 'daily') => {
    let query = '';

    if (period === 'daily') {
        query = `
            SELECT p.name, SUM(bi.quantity) as total_quantity, SUM(bi.subtotal) as total_sales
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN bills b ON bi.bill_id = b.id
            WHERE DATE(b.created_at) = CURDATE()
            GROUP BY bi.product_id
            ORDER BY total_sales DESC
            LIMIT 10
        `;
    } else if (period === 'monthly') {
        query = `
            SELECT p.name, SUM(bi.quantity) as total_quantity, SUM(bi.subtotal) as total_sales
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN bills b ON bi.bill_id = b.id
            WHERE MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE())
            GROUP BY bi.product_id
            ORDER BY total_sales DESC
            LIMIT 10
        `;
    } else if (period === 'yearly') {
        query = `
            SELECT p.name, SUM(bi.quantity) as total_quantity, SUM(bi.subtotal) as total_sales
            FROM bill_items bi
            JOIN products p ON bi.product_id = p.id
            JOIN bills b ON bi.bill_id = b.id
            WHERE YEAR(b.created_at) = YEAR(CURDATE())
            GROUP BY bi.product_id
            ORDER BY total_sales DESC
            LIMIT 10
        `;
    }

    const [rows] = await pool.query(query);
    return rows;
};

const getDashboardStats = async () => {
    const [revenueRows] = await pool.query('SELECT SUM(grand_total) as totalRevenue, COUNT(*) as billCount FROM bills');
    const [productRows] = await pool.query('SELECT COUNT(*) as productCount, SUM(CASE WHEN stocks < 10 THEN 1 ELSE 0 END) as lowStockCount FROM products');
    const [todayRows] = await pool.query(
        `SELECT COALESCE(SUM(grand_total), 0) as todayRevenue FROM bills WHERE DATE(created_at) = CURDATE()`
    );
    const [monthRows] = await pool.query(
        `SELECT COALESCE(SUM(grand_total), 0) as monthRevenue FROM bills WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`
    );
    let todayProfit = 0, monthProfit = 0;
    try {
        const [todayProfitRows] = await pool.query(
            `SELECT COALESCE(SUM((bi.unit_price - COALESCE(p.cost_price, 0)) * bi.quantity), 0) as profit
             FROM bill_items bi JOIN bills b ON bi.bill_id = b.id JOIN products p ON bi.product_id = p.id
             WHERE DATE(b.created_at) = CURDATE()`
        );
        const [monthProfitRows] = await pool.query(
            `SELECT COALESCE(SUM((bi.unit_price - COALESCE(p.cost_price, 0)) * bi.quantity), 0) as profit
             FROM bill_items bi JOIN bills b ON bi.bill_id = b.id JOIN products p ON bi.product_id = p.id
             WHERE YEAR(b.created_at) = YEAR(CURDATE()) AND MONTH(b.created_at) = MONTH(CURDATE())`
        );
        todayProfit = todayProfitRows[0]?.profit ?? 0;
        monthProfit = monthProfitRows[0]?.profit ?? 0;
    } catch (_) {}

    return {
        totalRevenue: revenueRows[0].totalRevenue || 0,
        billCount: revenueRows[0].billCount || 0,
        productCount: productRows[0].productCount || 0,
        lowStockCount: productRows[0].lowStockCount || 0,
        todayRevenue: parseFloat(todayRows[0]?.todayRevenue) || 0,
        monthRevenue: parseFloat(monthRows[0]?.monthRevenue) || 0,
        todayProfit: parseFloat(todayProfit) || 0,
        monthProfit: parseFloat(monthProfit) || 0
    };
};

const getCustomers = async () => {
    const [rows] = await pool.query(`
        SELECT 
            customer_name, 
            customer_phone, 
            COUNT(id) as visit_count, 
            SUM(grand_total) as total_spend, 
            MAX(created_at) as last_visit 
        FROM bills 
        WHERE customer_phone IS NOT NULL AND customer_phone != '' 
        GROUP BY customer_phone, customer_name 
        ORDER BY last_visit DESC
    `);
    return rows;
};

const getCustomerHistory = async (phone) => {
    const [rows] = await pool.query(`
        SELECT 
            b.created_at,
            b.bill_number,
            p.name as product_name,
            bi.quantity,
            bi.unit_price,
            bi.subtotal
        FROM bills b
        JOIN bill_items bi ON b.id = bi.bill_id
        JOIN products p ON bi.product_id = p.id
        WHERE b.customer_phone = ?
        ORDER BY b.created_at DESC
    `, [phone]);
    return rows;
};

const getSalesByTime = async () => {
    const [rows] = await pool.query(`
        SELECT 
            HOUR(created_at) as hour,
            COUNT(*) as bill_count,
            COALESCE(SUM(grand_total), 0) as revenue
        FROM bills
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY HOUR(created_at)
        ORDER BY hour
    `);
    const labels = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];
    return (rows || []).map((r) => ({
        name: labels[r.hour] || `${r.hour}:00`,
        hour: r.hour,
        bill_count: r.bill_count,
        revenue: parseFloat(r.revenue) || 0
    }));
};

module.exports = {
    createBill,
    getRecentBills,
    getBillDetails,
    getSalesReport,
    getTopProducts,
    getDashboardStats,
    getCustomers,
    getCustomerHistory,
    getSalesByTime
};
