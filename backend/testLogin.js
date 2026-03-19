require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const testLogin = async () => {
    try {
        await connectDB();
        const user = await User.findOne({ email: 'admin@mediportal.com' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }
        console.log('User found! Hashed password in DB:', user.passwordHash);

        const isMatch = await user.matchPassword('admin123');
        console.log('Does password match "admin123"?', isMatch);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testLogin();
