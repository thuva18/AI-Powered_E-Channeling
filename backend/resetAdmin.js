require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function resetAdmin() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin to avoid double-hash issues
    const deleted = await User.deleteOne({ email: 'admin@mediportal.com' });
    console.log('Deleted existing admin records:', deleted.deletedCount);

    // Create fresh admin — pre-save hook will hash 'admin123' once
    const admin = await User.create({
        email: 'admin@mediportal.com',
        passwordHash: 'admin123',
        role: 'ADMIN',
    });

    console.log('✅ Admin recreated successfully!');
    console.log('   Email:    admin@mediportal.com');
    console.log('   Password: admin123');
    process.exit(0);
}

resetAdmin().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
