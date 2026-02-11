const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = (path.extname(file.originalname) || '').toLowerCase() || '.bin';
        const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80);
        cb(null, `${Date.now()}-${safe}${ext}`);
    }
});

const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

const fileFilter = (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and images (JPEG, PNG, GIF, WebP) are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = { upload };
