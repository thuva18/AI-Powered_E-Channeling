<<<<<<< Updated upstream
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
=======
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
>>>>>>> Stashed changes

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorRoutes);
<<<<<<< Updated upstream
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/payments', paymentRoutes);
=======
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/payments', paymentRoutes);
>>>>>>> Stashed changes

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('Doctor Management API is running...');
});

<<<<<<< Updated upstream
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
=======
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
>>>>>>> Stashed changes
