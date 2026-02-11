const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { error: err.name, stack: err.stack }),
    });
};

module.exports = errorHandler;
