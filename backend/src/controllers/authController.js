const authService = require('../services/authService');
const asyncHandler = require('express-async-handler');

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    const result = await authService.login(username, password);

    res.status(200).json({
        success: true,
        data: result
    });
});

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user
    });
});

module.exports = { loginUser, getMe };
