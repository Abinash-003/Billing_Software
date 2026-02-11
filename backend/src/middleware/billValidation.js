const { body } = require('express-validator');

const createBillValidation = [
    body('customerName').optional().trim().isLength({ max: 100 }).withMessage('Customer name max 100 chars'),
    body('customerPhone').optional().trim().isLength({ max: 15 }).withMessage('Phone max 15 chars'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('items.*.productId').isInt({ min: 1 }).withMessage('Invalid productId'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Invalid unit price'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Invalid total amount'),
    body('taxAmount').isFloat({ min: 0 }).withMessage('Invalid tax amount'),
    body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Invalid discount'),
    body('grandTotal').isFloat({ min: 0 }).withMessage('Invalid grand total'),
];

module.exports = { createBillValidation };
