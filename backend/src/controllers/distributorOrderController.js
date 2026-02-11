const asyncHandler = require('express-async-handler');
const distributorOrderService = require('../services/distributorOrderService');

const getOrders = asyncHandler(async (req, res) => {
    const orders = await distributorOrderService.getOrdersBySupplierId(req.params.supplierId);
    res.status(200).json({ success: true, data: orders });
});

const getOrder = asyncHandler(async (req, res) => {
    const order = await distributorOrderService.getOrderById(req.params.orderId);
    if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
    }
    res.status(200).json({ success: true, data: order });
});

const addOrder = asyncHandler(async (req, res) => {
    const body = { ...req.body, supplier_id: req.params.supplierId };
    const order = await distributorOrderService.createOrder(body);
    res.status(201).json({ success: true, data: order });
});

const updateOrder = asyncHandler(async (req, res) => {
    const order = await distributorOrderService.updateOrder(req.params.orderId, req.body);
    if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
    }
    res.status(200).json({ success: true, data: order });
});

const deleteOrder = asyncHandler(async (req, res) => {
    await distributorOrderService.deleteOrder(req.params.orderId);
    res.status(200).json({ success: true, message: 'Order deleted' });
});

const getSummary = asyncHandler(async (req, res) => {
    const summary = await distributorOrderService.getSupplierOrderSummary(req.params.supplierId);
    res.status(200).json({ success: true, data: summary });
});

const getDistributorSummary = asyncHandler(async (req, res) => {
    const data = await distributorOrderService.getDistributorSummaryForCharts();
    res.status(200).json({ success: true, data });
});

const receiveStock = asyncHandler(async (req, res) => {
    const { supplierId, invoiceNumber, orderDate, deliveredDate, paidAmount, notes, items } = req.body;
    if (!supplierId || !items || !Array.isArray(items)) {
        res.status(400).json({ success: false, message: 'Supplier and items are required' });
        return;
    }
    const result = await distributorOrderService.receiveStock({
        supplier_id: supplierId,
        invoice_number: invoiceNumber || null,
        order_date: orderDate || null,
        delivered_date: deliveredDate || orderDate || null,
        paid_amount: paidAmount ?? 0,
        notes: notes || null,
        items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice
        }))
    });
    res.status(201).json({ success: true, data: result });
});

module.exports = {
    getOrders,
    getOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    getSummary,
    getDistributorSummary,
    receiveStock
};
