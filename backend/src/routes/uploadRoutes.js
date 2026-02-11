const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }
        res.status(200).json({ success: true, url: `/uploads/${req.file.filename}` });
    });
});

module.exports = router;
