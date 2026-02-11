const express = require('express');
const router = express.Router();
const { receiveStock } = require('../controllers/distributorOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/', receiveStock);

module.exports = router;
