const billService = require('../services/billService');
const asyncHandler = require('express-async-handler');

const generateBill = asyncHandler(async (req, res) => {
    const result = await billService.createBill(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
});

const getBills = asyncHandler(async (req, res) => {
    const bills = await billService.getRecentBills();
    res.status(200).json({ success: true, data: bills });
});

const getBill = asyncHandler(async (req, res) => {
    const bill = await billService.getBillDetails(req.params.id);
    if (!bill) {
        const err = new Error('Bill not found');
        err.status = 404;
        throw err;
    }
    res.status(200).json({ success: true, data: bill });
});

const getReports = asyncHandler(async (req, res) => {
    const { period } = req.query;
    const report = await billService.getSalesReport(period);
    res.status(200).json({ success: true, data: report });
});

const getTopProducts = asyncHandler(async (req, res) => {
    const { period } = req.query;
    const topProducts = await billService.getTopProducts(period);
    res.status(200).json({ success: true, data: topProducts });
});

const getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await billService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
});

const getCustomers = asyncHandler(async (req, res) => {
    const customers = await billService.getCustomers();
    res.status(200).json({ success: true, data: customers });
});

const getCustomerHistory = asyncHandler(async (req, res) => {
    const history = await billService.getCustomerHistory(req.params.phone);
    res.status(200).json({ success: true, data: history });
});

const getSalesByTime = asyncHandler(async (req, res) => {
    const data = await billService.getSalesByTime();
    res.status(200).json({ success: true, data: data });
});

module.exports = {
    generateBill,
    getBills,
    getBill,
    getReports,
    getTopProducts,
    getDashboardStats,
    getCustomers,
    getCustomerHistory,
    getSalesByTime
};
