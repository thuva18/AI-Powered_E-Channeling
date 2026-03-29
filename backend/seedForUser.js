require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Appointment = require('./src/models/Appointment');

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const SYMPTOMS_MAP = {
    Cardiologist: ['Chest pain', 'Shortness of breath', 'Palpitations', 'Dizziness', 'Fatigue', 'Swollen ankles', 'High blood pressure', 'Irregular heartbeat'],
    Neurologist: ['Persistent headache', 'Memory loss', 'Tremors', 'Numbness in limbs', 'Blurred vision', 'Seizures', 'Balance issues'],
    Dermatologist: ['Skin rash', 'Acne breakout', 'Eczema flare-up', 'Hair loss', 'Itchy skin', 'Psoriasis patches', 'Nail discoloration'],
    Gastroenterologist: ['Abdominal pain', 'Bloating', 'Acid reflux', 'Nausea', 'Constipation', 'Diarrhoea', 'Blood in stool'],
    'General Physician': ['Fever', 'Common cold', 'Fatigue', 'Body aches', 'Sore throat', 'Cough', 'Headache', 'Loss of appetite'],
    default: ['Fatigue', 'Headache', 'Pain', 'Fever', 'Nausea', 'Dizziness', 'Swelling'],
};

const TIME_SLOTS = ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30', '13:00 - 13:30', '14:00 - 14:30', '15:00 - 15:30', '16:00 - 16:30'];
const NOTES = [
    'Patient reports symptoms for the past {n} days. Prescribed medication and follow-up in 2 weeks.',
    'Routine checkup. All vitals within normal range. Advised lifestyle modifications.',
    'Referred for blood panel and imaging. Results pending.',
    'Follow-up visit. Improvement noted since last consultation.',
    'Patient presents with recurring symptoms. Adjusted dosage accordingly.',
    'First-time visit. Thorough history taken and initial assessment completed.',
    'Patient managing condition well. Continue current treatment plan.',
    'New complaint reported alongside existing condition. Monitoring closely.',
];

const PATIENT_NAMES = [
    { name: 'Chamath Senanayake', email: 'chamath.s@gmail.com' },
    { name: 'Dilani Wijesekara', email: 'dilani.w@gmail.com' },
    { name: 'Eranda Rajapaksha', email: 'eranda.r@yahoo.com' },
    { name: 'Fathima Nusra', email: 'fathima.n@gmail.com' },
    { name: 'Gehan Mendis', email: 'gehan.m@hotmail.com' },
    { name: 'Hashini Balasuriya', email: 'hashini.b@gmail.com' },
    { name: 'Ishara Gunasekara', email: 'ishara.g@gmail.com' },
    { name: 'Janith Perera', email: 'janith.p@gmail.com' },
    { name: 'Kavindra Silva', email: 'kavindra.s@gmail.com' },
    { name: 'Lasantha Kumara', email: 'lasantha.k@gmail.com' },
    { name: 'Malsha Wickrama', email: 'malsha.w@gmail.com' },
    { name: 'Niluka Fernando', email: 'niluka.f@gmail.com' },
    { name: 'Oshada Liyanage', email: 'oshada.l@gmail.com' },
    { name: 'Prasanna Herath', email: 'prasanna.h@gmail.com' },
    { name: 'Qadeena Farook', email: 'qadeena.f@gmail.com' },
];

const seedForDoctor = async () => {
    await connectDB();
    console.log('\n🎯 Seeding data for thuva@gmail.com...\n');

    // 1. Find the user
    const user = await User.findOne({ email: 'thuva@gmail.com' });
    if (!user) {
        console.error('❌ User thuva@gmail.com not found in database!');
        process.exit(1);
    }
    console.log(`✓ Found user: ${user.email} (${user.role})`);

    // 2. Find or prompt to update doctor profile
    let doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) {
        console.log('  No doctor profile found. Creating one...');
        doctor = await Doctor.create({
            userId: user._id,
            firstName: 'Thuva',
            lastName: 'Doctor',
            slmcNumber: 'SLMC/99001',
            specialization: 'Cardiologist',
            approvalStatus: 'APPROVED',
            consultationFee: 2000,
            availability: [
                { day: 'MONDAY', startTime: '09:00', endTime: '13:00', maxSlots: 8 },
                { day: 'WEDNESDAY', startTime: '14:00', endTime: '18:00', maxSlots: 8 },
                { day: 'FRIDAY', startTime: '09:00', endTime: '12:00', maxSlots: 6 },
            ],
            profileDetails: {
                bio: 'Specialist in cardiovascular disease with extensive clinical experience in Sri Lanka.',
                qualifications: ['MBBS – University of Colombo', 'MD Cardiology – PGIM Sri Lanka', 'MRCP (UK)'],
                experienceYears: 8,
                contactNumber: '0777654321',
            },
            isActive: true,
        });
        console.log('  ✓ Created doctor profile (Cardiologist, Rs. 2000 fee)');
    } else {
        // Update approval to ensure access
        if (doctor.approvalStatus !== 'APPROVED') {
            doctor.approvalStatus = 'APPROVED';
        }
        if (!doctor.consultationFee || doctor.consultationFee === 0) {
            doctor.consultationFee = 2000;
        }
        if (!doctor.profileDetails?.bio) {
            doctor.profileDetails = {
                bio: 'Experienced medical professional dedicated to patient care.',
                qualifications: ['MBBS – University of Colombo', 'Postgraduate Diploma in Clinical Medicine'],
                experienceYears: 6,
                contactNumber: '0777654321',
            };
        }
        await doctor.save();
        console.log(`✓ Found existing doctor: Dr. ${doctor.firstName} ${doctor.lastName} — ${doctor.specialization} (fee: Rs. ${doctor.consultationFee})`);
    }

    // 3. Remove old appointments for this doctor to start fresh
    const deleted = await Appointment.deleteMany({ doctorId: doctor._id });
    console.log(`✓ Cleared ${deleted.deletedCount} old appointments`);

    // 4. Create/Find 15 patients
    const patientIds = [];
    for (const p of PATIENT_NAMES) {
        let patient = await User.findOne({ email: p.email });
        if (!patient) patient = await User.create({ email: p.email, passwordHash: 'patient123', role: 'PATIENT' });
        patientIds.push(patient._id);
    }
    console.log(`✓ Ready with ${patientIds.length} patients`);

    // 5. Generate 35 appointments across last 6 months
    const symptoms = SYMPTOMS_MAP[doctor.specialization] || SYMPTOMS_MAP.default;
    const fee = doctor.consultationFee || 2000;
    const STATUSES = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'ACCEPTED', 'PENDING', 'REJECTED'];
    const appointments = [];

    for (let i = 0; i < 35; i++) {
        const daysBack = randInt(0, 180);
        const status = daysBack > 5 && rand(STATUSES) === 'PENDING' ? 'COMPLETED' : rand(STATUSES);
        const isPaid = status === 'COMPLETED';
        const patSymptoms = [rand(symptoms), rand(symptoms)].filter((s, idx, arr) => arr.indexOf(s) === idx);

        appointments.push({
            doctorId: doctor._id,
            patientId: rand(patientIds),
            appointmentDate: daysAgo(daysBack),
            timeSlot: rand(TIME_SLOTS),
            status,
            paymentStatus: isPaid ? 'PAID' : 'UNPAID',
            symptoms: patSymptoms,
            notes: rand(NOTES).replace('{n}', randInt(2, 14)),
            rating: isPaid ? randInt(3, 5) : null,
            consultationFeeCharged: isPaid ? fee : 0,
        });
    }

    await Appointment.insertMany(appointments);

    // Summary
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const pending = appointments.filter(a => a.status === 'PENDING').length;
    const revenue = appointments.filter(a => a.paymentStatus === 'PAID').reduce((s, a) => s + a.consultationFeeCharged, 0);

    console.log('\n════════════════════════════════════════');
    console.log('   SEED COMPLETE for thuva@gmail.com');
    console.log('════════════════════════════════════════');
    console.log(`  Doctor:       Dr. ${doctor.firstName} ${doctor.lastName}`);
    console.log(`  Specialization: ${doctor.specialization}`);
    console.log(`  Approval:     ${doctor.approvalStatus}`);
    console.log(`  Appointments: ${appointments.length} total`);
    console.log(`    ↳ Completed: ${completed}  |  Pending: ${pending}`);
    console.log(`  Revenue:      Rs. ${revenue.toLocaleString()}`);
    console.log(`  Patients:     ${patientIds.length}`);
    console.log('\n  Log in at http://localhost:5173/login');
    console.log('  Email:    thuva@gmail.com');
    console.log('  Password: (your existing password)');
    console.log('════════════════════════════════════════\n');

    process.exit(0);
};

seedForDoctor().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
