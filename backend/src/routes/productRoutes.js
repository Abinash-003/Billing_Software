const express = require('express');
const {
    getProducts,
    getProduct,
    getByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/barcode/:barcode', getByBarcode);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', authorize('ADMIN'), addProduct);
router.put('/:id', authorize('ADMIN'), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

module.exports = router;
