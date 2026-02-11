const express = require('express');
const router = express.Router();
const { getSuppliers, addSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const {
    getOrders,
    getOrder,
    addOrder,
    updateOrder,
    deleteOrder,
    getSummary,
    getDistributorSummary
} = require('../controllers/distributorOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getSuppliers);
router.post('/', authorize('ADMIN'), addSupplier);
router.put('/:id', authorize('ADMIN'), updateSupplier);
router.delete('/:id', authorize('ADMIN'), deleteSupplier);

router.get('/distributor-summary', authorize('ADMIN'), getDistributorSummary);

router.get('/:supplierId/orders/summary', authorize('ADMIN'), getSummary);
router.get('/:supplierId/orders', authorize('ADMIN'), getOrders);
router.post('/:supplierId/orders', authorize('ADMIN'), addOrder);
router.get('/:supplierId/orders/:orderId', authorize('ADMIN'), getOrder);
router.put('/:supplierId/orders/:orderId', authorize('ADMIN'), updateOrder);
router.delete('/:supplierId/orders/:orderId', authorize('ADMIN'), deleteOrder);

module.exports = router;
