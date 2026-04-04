require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Appointment = require('../src/models/Appointment');
const Transaction = require('../src/models/Transaction');
const SavedReport = require('../src/models/SavedReport');
const Journal = require('../src/models/Journal');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Create 5 Patients
        console.log('Creating Patients...');
        const patientUsers = [];
        const passwordHash = 'password123';

        const firstNames = ['Amal', 'Nimal', 'Kamal', 'Sunil', 'Saman', 'Ruwan', 'Nuwan', 'Kasun'];
        const lastNames = ['Perera', 'Silva', 'Fernando', 'De Silva', 'Bandara', 'Kumara', 'Jayasinghe'];

        for (let i = 0; i < 5; i++) {
            const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
            const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
            const user = await User.create({
                email: `patient_seed_${Date.now()}_${i}@example.com`,
                passwordHash,
                role: 'PATIENT',
                patientProfile: {
                    firstName: fn,
                    lastName: ln,
                    phone: `077${Math.floor(1000000 + Math.random() * 9000000)}`,
                    nic: `${Math.floor(100000000 + Math.random() * 900000000)}V`
                }
            });
            patientUsers.push(user);
        }

        // 2. Create 3 Doctors
        console.log('Creating Doctors...');
        const doctorUsers = [];
        const specs = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'General Physician'];

        for (let i = 0; i < 3; i++) {
            const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
            const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
            const user = await User.create({
                email: `doctor_seed_${Date.now()}_${i}@example.com`,
                passwordHash,
                role: 'DOCTOR'
            });

            const doctor = await Doctor.create({
                userId: user._id,
                firstName: fn,
                lastName: ln,
                slmcNumber: `SLMC${Math.floor(10000 + Math.random() * 90000)}`,
                nic: `${Math.floor(100000000 + Math.random() * 900000000)}V`,
                phone: `071${Math.floor(1000000 + Math.random() * 9000000)}`,
                specialization: specs[Math.floor(Math.random() * specs.length)],
                approvalStatus: 'APPROVED',
                consultationFee: Math.floor(1500 + Math.random() * 3000),
                availability: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => ({
                    day, startTime: '09:00', endTime: '17:00', maxSlots: 20
                })),
                isActive: true
            });
            doctorUsers.push(doctor);
        }

        // 3. Create 25 Appointments & Transactions
        console.log('Creating Appointments and Transactions...');
        let adminUser = await User.findOne({ role: 'ADMIN' });

        const statuses = ['COMPLETED', 'PENDING', 'CANCELLED', 'ACCEPTED'];

        for (let i = 0; i < 25; i++) {
            const patient = patientUsers[Math.floor(Math.random() * patientUsers.length)];
            const doctor = doctorUsers[Math.floor(Math.random() * doctorUsers.length)];

            // Random date between 30 days ago and 7 days from now
            const dateOffset = Math.floor(Math.random() * 37) - 30;
            const apptDate = new Date();
            apptDate.setDate(apptDate.getDate() + dateOffset);

            const status = statuses[Math.floor(Math.random() * statuses.length)];
            let paymentStatus = 'PENDING_PAYMENT';
            if (status === 'COMPLETED' || status === 'ACCEPTED') paymentStatus = 'PAID';
            if (status === 'CANCELLED') paymentStatus = 'FAILED';

            // Random time slot between 09:00 and 16:30
            const hour = 9 + Math.floor(Math.random() * 8);
            const min = Math.random() > 0.5 ? '00' : '30';
            const timeSlot = `${hour.toString().padStart(2, '0')}:${min}`;

            const appointment = await Appointment.create({
                patientId: patient._id,
                doctorId: doctor._id,
                appointmentDate: apptDate,
                timeSlot,
                status,
                paymentStatus,
                symptoms: ['Routine checkup', 'General consultation']
            });

            // Create Transaction if not purely cancelled from start
            if (status !== 'CANCELLED') {
                const methods = ['PAYHERE', 'BANK_TRANSFER', 'PAYPAL'];
                const method = methods[Math.floor(Math.random() * methods.length)];
                let txnStatus = 'SUCCESS';
                if (status === 'PENDING') txnStatus = 'PENDING_APPROVAL';

                const txn = await Transaction.create({
                    appointmentId: appointment._id,
                    patientId: patient._id,
                    amount: doctor.consultationFee,
                    method,
                    status: txnStatus,
                    paidAt: txnStatus === 'SUCCESS' ? apptDate : null,
                    approvedBy: txnStatus === 'SUCCESS' && method !== 'PAYHERE' ? (adminUser?._id || null) : null
                });

                appointment.paymentId = txn._id;
                await appointment.save();
            }

            // Create a Journal Entry if the appointment is COMPLETED
            if (status === 'COMPLETED') {
                const diagnoses = ['Viral Fever', 'Hypertension', 'Migraine', 'Gastritis', 'Bronchitis', 'Allergic Rhinitis'];
                const medications = ['Paracetamol', 'Amlodipine', 'Ibuprofen', 'Omeprazole', 'Amoxicillin', 'Cetirizine'];
                await Journal.create({
                    doctorId: doctor._id,
                    patientId: patient._id,
                    patientName: `${patient.patientProfile.firstName} ${patient.patientProfile.lastName}`,
                    patientAge: Math.floor(20 + Math.random() * 40),
                    patientGender: Math.random() > 0.5 ? 'Male' : 'Female',
                    contactNumber: patient.patientProfile.phone,
                    visitDate: apptDate,
                    diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
                    prescription: [
                        {
                            medication: medications[Math.floor(Math.random() * medications.length)],
                            dosage: '500mg',
                            frequency: 'Twice a day',
                            duration: '5 days'
                        }
                    ],
                    notes: 'Patient responded well to initial examination. Advised rest and fluids.',
                    status: Math.random() > 0.7 ? 'Follow-up' : 'Recovered',
                    followUpDate: new Date(apptDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                });
            }
        }

        // 4. Create 2 Saved Reports
        console.log('Creating Saved Reports...');
        if (adminUser) {
            await SavedReport.create({
                name: 'Monthly Revenue Overview',
                type: 'standard',
                dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
                sections: { appointmentSummary: true, doctorRevenue: true, paymentDetails: true },
                data: {
                    appointments: { total: 120, completed: 85, accepted: 10, pending: 5, cancelled: 20 },
                    totalRevenue: 345000,
                    revenueByDoctor: [],
                    paymentStats: [],
                },
                createdBy: adminUser._id
            });

            await SavedReport.create({
                name: 'Advanced Performance Analytics',
                type: 'advanced',
                dateFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0],
                advSections: { appointmentSummary: true, doctorPerformance: true, cancellationAnalysis: true, financialSummary: true, peakHours: true },
                data: {
                    appointments: { total: 240, completed: 180, accepted: 15, pending: 15, cancelled: 30 },
                    doctorPerformance: [],
                    cancellationAnalysis: [],
                    financialSummary: { totalRevenue: 850000, avgTransaction: 3500 },
                    peakHours: [],
                },
                createdBy: adminUser._id
            });
        }

        console.log('Database seeded successfully with additional mock data!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error.message);
        if (error.errors) {
            Object.values(error.errors).forEach(e => console.error(e.message));
        }
        process.exit(1);
    }
};

seedData();
