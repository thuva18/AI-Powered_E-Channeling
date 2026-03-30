const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const patientJournalRoutes = require('./src/routes/patientJournalRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Return a clear status while DB is reconnecting instead of failing at proxy layer.
app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: 'Service temporarily unavailable. Database reconnecting, please retry.',
        });
    }
    next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/patients/journals', patientJournalRoutes); // ← must be BEFORE /patients
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/ai', aiRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('Doctor Management API is running...');
});

const PORT = process.env.PORT || 5000;

const connectDBWithRetry = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error('Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectDBWithRetry, 5000);
    }
};

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
    connectDBWithRetry();
};

startServer();
