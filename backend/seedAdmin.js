require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const seedAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@mediportal.com' });

        if (adminExists) {
            console.log('Admin user already exists!');
            process.exit();
        }

        // Create new admin user
        const admin = await User.create({
            email: 'admin@mediportal.com',
            passwordHash: 'admin123', // Will be automatically hashed by User model pre-save hook
            role: 'ADMIN',
        });

        console.log(`Admin user created successfully!`);
        console.log(`Email: ${admin.email}`);
        console.log(`Password: admin123`);
        process.exit();
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
