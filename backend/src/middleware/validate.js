const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map(e => e.msg).join('; ');
        return res.status(400).json({ success: false, message });
    }
    next();
};

const sanitizeString = (s) => (typeof s === 'string' ? s.trim().slice(0, 500) : s);

module.exports = { validate, sanitizeString };
