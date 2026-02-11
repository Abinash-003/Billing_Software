const productService = require('../services/productService');
const asyncHandler = require('express-async-handler');

const VALID_UNITS = ['kg', 'ltr', 'ml', 'packet', 'pcs'];

const validateProduct = (data) => {
    const { name, price, stocks, unit } = data;
    if (!name || !price || stocks === undefined || !unit) {
        throw new Error('Please provide all mandatory fields: name, price, stocks, unit');
    }
    if (stocks < 0) {
        throw new Error('Stocks cannot be negative');
    }
    if (!VALID_UNITS.includes(unit)) {
        throw new Error(`Invalid unit. Allowed values: ${VALID_UNITS.join(', ')}`);
    }
};

const getProducts = asyncHandler(async (req, res) => {
    const products = await productService.getAllProducts();
    res.status(200).json({ success: true, data: products });
});

const getByBarcode = asyncHandler(async (req, res) => {
    const product = await productService.getProductByBarcode(req.params.barcode);
    if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
    }
    res.status(200).json({ success: true, data: product });
});

const getProduct = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    res.status(200).json({ success: true, data: product });
});

const addProduct = asyncHandler(async (req, res) => {
    validateProduct(req.body);
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
    validateProduct(req.body);
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Product removed' });
});

const searchProducts = asyncHandler(async (req, res) => {
    const products = await productService.searchProducts(req.query.q);
    res.status(200).json({ success: true, data: products });
});

module.exports = {
    getProducts,
    getProduct,
    getByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    VALID_UNITS
};
