const asyncHandler = require('express-async-handler');
const supplierService = require('../services/supplierService');

const getSuppliers = asyncHandler(async (req, res) => {
    const suppliers = await supplierService.getAllSuppliers();
    res.status(200).json({ success: true, data: suppliers });
});

const addSupplier = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(400);
        throw new Error('Supplier name is required');
    }
    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
});

const updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    res.status(200).json({ success: true, data: supplier });
});

const deleteSupplier = asyncHandler(async (req, res) => {
    await supplierService.deleteSupplier(req.params.id);
    res.status(200).json({ success: true, message: 'Supplier deleted' });
});

module.exports = {
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier
};
