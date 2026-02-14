const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { testConnection } = require('./config/db');
const { initDb } = require('./database/dbInit');
require('dotenv').config();

const app = express();

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: 'https://mnb-billing-software.vercel.app',
    credentials: true
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (bills / images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test DB and Initialize
const startServer = async () => {
    await testConnection();
    await initDb();

    const PORT = process.env.PORT || 5000;

    // Routes
    const authRoutes = require('./routes/authRoutes');
    const productRoutes = require('./routes/productRoutes');
    const billRoutes = require('./routes/billRoutes');
    const supplierRoutes = require('./routes/supplierRoutes');
    const uploadRoutes = require('./routes/uploadRoutes');
    const receiveStockRoutes = require('./routes/receiveStockRoutes');

    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/products', productRoutes);
    app.use('/api/v1/bills', billRoutes);
    app.use('/api/v1/suppliers', supplierRoutes);
    app.use('/api/v1/upload', uploadRoutes);
    app.use('/api/v1/receive-stock', receiveStockRoutes);

    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', message: 'Server is running' });
    });

    // 404
    app.use((req, res) => {
        res.status(404).json({ success: false, message: 'Route not found' });
    });

    // Global Error Handler
    const errorHandler = require('./middleware/errorHandler');
    app.use(errorHandler);

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
};

startServer();
