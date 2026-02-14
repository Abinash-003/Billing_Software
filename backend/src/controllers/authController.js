const authService = require('../services/authService');
const asyncHandler = require('express-async-handler');

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    try {
        const result = await authService.login(username, password);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        if (error.message === 'Invalid credentials') {
            res.status(401);
        }
        throw error;
    }
});

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
});

module.exports = { loginUser, getMe };
