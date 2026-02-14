const express = require('express');
const {
    generateBill,
    getBills,
    getBillingHistory,
    getBill,
    getReports,
    getTopProducts,
    getDashboardStats,
    getCustomers,
    getCustomerHistory,
    getSalesByTime
} = require('../controllers/billController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { createBillValidation } = require('../middleware/billValidation');

const router = express.Router();

router.use(protect);

router.post('/', createBillValidation, validate, generateBill);
router.get('/stats', getDashboardStats);
router.get('/', getBills);
router.get('/history', getBillingHistory);
router.get('/reports', authorize('ADMIN'), getReports);
router.get('/top-products', authorize('ADMIN'), getTopProducts);
router.get('/customers', authorize('ADMIN'), getCustomers);
router.get('/customers/:phone', authorize('ADMIN'), getCustomerHistory);
router.get('/sales-by-time', authorize('ADMIN'), getSalesByTime);
router.get('/:id', getBill);

module.exports = router;
