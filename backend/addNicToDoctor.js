require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');

const updateDoctorNic = async () => {
    try {
        await connectDB();
        
        // Find the user with email thuva@gmail.com
        const user = await User.findOne({ email: 'thuva@gmail.com' });
        if (!user) {
            console.log('User thuva@gmail.com not found');
            process.exit(1);
        }
        
        // Find the doctor with this userId
        const doctor = await Doctor.findOne({ userId: user._id });
        if (!doctor) {
            console.log('Doctor profile for thuva@gmail.com not found');
            process.exit(1);
        }
        
        console.log('Current doctor:', {
            name: `${doctor.firstName} ${doctor.lastName}`,
            email: user.email,
            hasNic: !!doctor.nic,
            hasPhone: !!doctor.phone,
            slmcNumber: doctor.slmcNumber
        });
        
        // Update NIC and phone with sample values
        doctor.nic = '912345678V'; // Sample NIC in valid format
        doctor.phone = '0777654323'; // Sample phone
        
        await doctor.save();
        
        console.log('✅ Successfully updated doctor profile');
        console.log('Updated doctor:', {
            name: `${doctor.firstName} ${doctor.lastName}`,
            nic: doctor.nic,
            phone: doctor.phone,
            slmcNumber: doctor.slmcNumber
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

updateDoctorNic();
