/**
 * seed.js — Comprehensive dummy data seeder
 * Populates: 5 doctors, 20 patients, 120+ appointments with symptoms & ratings
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./src/config/db');

const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Appointment = require('./src/models/Appointment');

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

// ── Seed data definitions ─────────────────────────────────────────────────────

const DOCTOR_SEEDS = [
    {
        firstName: 'Amara', lastName: 'Perera',
        email: 'amara.perera@mediportal.com',
        slmcNumber: 'SLMC/10001', specialization: 'Cardiologist',
        consultationFee: 2500,
        bio: 'Specialist in cardiovascular disease with 12 years of clinical experience.',
        qualifications: ['MBBS – University of Colombo', 'MD Cardiology – PGIM Sri Lanka', 'MRCP (UK)'],
        experienceYears: 12, contactNumber: '0771234501',
        availability: [
            { day: 'MONDAY', startTime: '09:00', endTime: '13:00', maxSlots: 8 },
            { day: 'WEDNESDAY', startTime: '14:00', endTime: '18:00', maxSlots: 8 },
            { day: 'FRIDAY', startTime: '09:00', endTime: '12:00', maxSlots: 6 },
        ],
    },
    {
        firstName: 'Roshan', lastName: 'Silva',
        email: 'roshan.silva@mediportal.com',
        slmcNumber: 'SLMC/10002', specialization: 'Neurologist',
        consultationFee: 3000,
        bio: 'Expert in neurological disorders, stroke management, and epilepsy treatment.',
        qualifications: ['MBBS – University of Kelaniya', 'MD Neurology – PGIM Sri Lanka'],
        experienceYears: 9, contactNumber: '0771234502',
        availability: [
            { day: 'TUESDAY', startTime: '08:00', endTime: '12:00', maxSlots: 7 },
            { day: 'THURSDAY', startTime: '13:00', endTime: '17:00', maxSlots: 7 },
        ],
    },
    {
        firstName: 'Priya', lastName: 'Fernando',
        email: 'priya.fernando@mediportal.com',
        slmcNumber: 'SLMC/10003', specialization: 'Dermatologist',
        consultationFee: 1800,
        bio: 'Specializes in skin disorders, cosmetic dermatology, and allergy management.',
        qualifications: ['MBBS – University of Sri Jayewardenepura', 'MD Dermatology – PGIM'],
        experienceYears: 7, contactNumber: '0771234503',
        availability: [
            { day: 'MONDAY', startTime: '09:00', endTime: '17:00', maxSlots: 12 },
            { day: 'WEDNESDAY', startTime: '09:00', endTime: '13:00', maxSlots: 8 },
            { day: 'SATURDAY', startTime: '09:00', endTime: '12:00', maxSlots: 6 },
        ],
    },
    {
        firstName: 'Kasun', lastName: 'Jayawardena',
        email: 'kasun.jayawardena@mediportal.com',
        slmcNumber: 'SLMC/10004', specialization: 'Gastroenterologist',
        consultationFee: 2200,
        bio: 'Focused on digestive health, liver disease, and endoscopic procedures.',
        qualifications: ['MBBS – University of Colombo', 'MD Gastroenterology'],
        experienceYears: 11, contactNumber: '0771234504',
        availability: [
            { day: 'TUESDAY', startTime: '09:00', endTime: '14:00', maxSlots: 10 },
            { day: 'FRIDAY', startTime: '09:00', endTime: '14:00', maxSlots: 10 },
        ],
    },
    {
        firstName: 'Nimal', lastName: 'Bandara',
        email: 'nimal.bandara@mediportal.com',
        slmcNumber: 'SLMC/10005', specialization: 'General Physician',
        consultationFee: 1200,
        bio: 'Broad experience in primary care, chronic disease management, and preventive medicine.',
        qualifications: ['MBBS – University of Ruhuna', 'Diploma in Diabetes Management'],
        experienceYears: 15, contactNumber: '0771234505',
        availability: [
            { day: 'MONDAY', startTime: '08:00', endTime: '17:00', maxSlots: 16 },
            { day: 'TUESDAY', startTime: '08:00', endTime: '17:00', maxSlots: 16 },
            { day: 'WEDNESDAY', startTime: '08:00', endTime: '17:00', maxSlots: 16 },
            { day: 'THURSDAY', startTime: '08:00', endTime: '17:00', maxSlots: 16 },
            { day: 'FRIDAY', startTime: '08:00', endTime: '14:00', maxSlots: 12 },
        ],
    },
];

const PATIENT_SEEDS = [
    { name: 'Dinesh Kumara', email: 'dinesh.kumara@gmail.com' },
    { name: 'Shalini Ranatunga', email: 'shalini.r@gmail.com' },
    { name: 'Rajitha Mendis', email: 'rajitha.m@yahoo.com' },
    { name: 'Thilini Wickrama', email: 'thilini.w@hotmail.com' },
    { name: 'Gayan Pathirana', email: 'gayan.p@gmail.com' },
    { name: 'Iresha Senarathna', email: 'iresha.s@gmail.com' },
    { name: 'Hiruni Jayasena', email: 'hiruni.j@gmail.com' },
    { name: 'Chaminda Hemantha', email: 'chaminda.h@gmail.com' },
    { name: 'Sachini Perera', email: 'sachini.p@gmail.com' },
    { name: 'Lakshan Dias', email: 'lakshan.d@gmail.com' },
    { name: 'Madushanka Silva', email: 'madu.s@gmail.com' },
    { name: 'Prabodha Rathnayake', email: 'prabodha.r@gmail.com' },
    { name: 'Asanka Gunawardena', email: 'asanka.g@yahoo.com' },
    { name: 'Nethmi Siriwardhana', email: 'nethmi.s@gmail.com' },
    { name: 'Danushka Tharanga', email: 'danushka.t@gmail.com' },
    { name: 'Malshi Dissanayake', email: 'malshi.d@gmail.com' },
    { name: 'Udara Liyanage', email: 'udara.l@gmail.com' },
    { name: 'Supuni Aberathne', email: 'supuni.a@gmail.com' },
    { name: 'Isuru Nanayakkara', email: 'isuru.n@gmail.com' },
    { name: 'Tharushi Adikari', email: 'tharushi.a@gmail.com' },
];

// Symptom sets per specialization
const SYMPTOMS_MAP = {
    Cardiologist: ['Chest pain', 'Shortness of breath', 'Palpitations', 'Dizziness', 'Fatigue', 'Swollen ankles', 'High blood pressure'],
    Neurologist: ['Persistent headache', 'Memory loss', 'Tremors', 'Numbness in limbs', 'Blurred vision', 'Seizures', 'Balance issues'],
    Dermatologist: ['Skin rash', 'Acne breakout', 'Eczema flare-up', 'Hair loss', 'Itchy skin', 'Psoriasis patches', 'Nail discoloration'],
    Gastroenterologist: ['Abdominal pain', 'Bloating', 'Acid reflux', 'Nausea', 'Constipation', 'Diarrhoea', 'Blood in stool'],
    'General Physician': ['Fever', 'Common cold', 'Fatigue', 'Body aches', 'Sore throat', 'Cough', 'Headache', 'Loss of appetite'],
};

const NOTES_TEMPLATES = [
    'Patient reports symptoms for the past {n} days. Prescribed medication and follow-up in 2 weeks.',
    'Routine checkup. All vitals within normal range. Advised lifestyle modifications.',
    'Referred for blood panel and imaging. Results pending.',
    'Follow-up visit. Improvement noted since last consultation.',
    'Patient presents with recurring symptoms. Adjusted dosage accordingly.',
    'First-time visit. Thorough history taken and initial assessment completed.',
];

const TIME_SLOTS = ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30', '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30'];

// ── Main seeder ───────────────────────────────────────────────────────────────
const seed = async () => {
    await connectDB();
    console.log('\n🌱 Starting database seeder...\n');

    // ── 1. Wipe existing doctor/patient/appointment seed data ──────────────────
    const existingEmails = DOCTOR_SEEDS.map(d => d.email);
    const existingPatients = PATIENT_SEEDS.map(p => p.email);

    const existingUsers = await User.find({ email: { $in: [...existingEmails, ...existingPatients] } });
    const existingUserIds = existingUsers.map(u => u._id);
    const existingDoctors = await Doctor.find({ userId: { $in: existingUserIds } });
    const existingDoctorIds = existingDoctors.map(d => d._id);

    await Appointment.deleteMany({ $or: [{ doctorId: { $in: existingDoctorIds } }, { patientId: { $in: existingUserIds } }] });
    await Doctor.deleteMany({ userId: { $in: existingUserIds } });
    await User.deleteMany({ email: { $in: [...existingEmails, ...existingPatients] } });

    console.log('✓ Cleared previous seeded data');

    // ── 2. Create patients ─────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('patient123', 10);
    const patients = await User.insertMany(
        PATIENT_SEEDS.map(p => ({ email: p.email, passwordHash, role: 'PATIENT' }))
    );
    console.log(`✓ Created ${patients.length} patients  (password: patient123)`);

    // ── 3. Create doctors + their user accounts ────────────────────────────────
    const doctorDocs = [];
    for (const ds of DOCTOR_SEEDS) {
        const userHash = await bcrypt.hash('doctor123', 10);
        const userDoc = await User.create({ email: ds.email, passwordHash: userHash, role: 'DOCTOR' });
        const doctorDoc = await Doctor.create({
            userId: userDoc._id,
            firstName: ds.firstName,
            lastName: ds.lastName,
            slmcNumber: ds.slmcNumber,
            specialization: ds.specialization,
            approvalStatus: 'APPROVED',
            consultationFee: ds.consultationFee,
            availability: ds.availability,
            profileDetails: {
                bio: ds.bio,
                qualifications: ds.qualifications,
                experienceYears: ds.experienceYears,
                contactNumber: ds.contactNumber,
            },
            isActive: true,
        });
        doctorDocs.push(doctorDoc);
        console.log(`  ✓ Dr. ${ds.firstName} ${ds.lastName} — ${ds.specialization}`);
    }
    console.log(`\n✓ Created ${doctorDocs.length} doctors   (password: doctor123)`);

    // ── 4. Create appointments ─────────────────────────────────────────────────
    const appointments = [];
    const STATUSES = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'ACCEPTED', 'ACCEPTED', 'PENDING', 'REJECTED'];

    for (const doctor of doctorDocs) {
        const symptoms = SYMPTOMS_MAP[doctor.specialization] || SYMPTOMS_MAP['General Physician'];
        // 20-30 appointments per doctor spread over the last 6 months
        const count = randInt(22, 30);

        for (let i = 0; i < count; i++) {
            const patient = rand(patients);
            const daysBack = randInt(0, 180);
            const status = rand(STATUSES);
            const isPast = daysBack > 3;
            const finalStatus = isPast && status === 'PENDING' ? 'COMPLETED' : status;
            const payment = finalStatus === 'COMPLETED' ? 'PAID' : 'UNPAID';
            const apptSymptoms = [rand(symptoms), rand(symptoms)].filter((s, i, arr) => arr.indexOf(s) === i);
            const note = rand(NOTES_TEMPLATES).replace('{n}', randInt(2, 14));

            appointments.push({
                doctorId: doctor._id,
                patientId: patient._id,
                appointmentDate: daysAgo(daysBack),
                timeSlot: rand(TIME_SLOTS),
                status: finalStatus,
                paymentStatus: payment,
                symptoms: apptSymptoms,
                notes: note,
                rating: finalStatus === 'COMPLETED' ? randInt(3, 5) : null,
                consultationFeeCharged: finalStatus === 'COMPLETED' ? doctor.consultationFee : 0,
            });
        }
    }

    await Appointment.insertMany(appointments);
    console.log(`✓ Created ${appointments.length} appointments with symptoms & ratings`);

    // ── 5. Summary ─────────────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════');
    console.log('          SEED COMPLETE — SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`  Patients:      ${patients.length} (password: patient123)`);
    console.log(`  Doctors:       ${doctorDocs.length}  (password: doctor123)`);
    console.log(`  Appointments:  ${appointments.length}`);
    console.log('\n  Doctor login credentials:');
    DOCTOR_SEEDS.forEach(d => {
        console.log(`    ${d.email}  →  doctor123`);
    });
    console.log('\n  Admin credentials remain: admin@mediportal.com / admin123');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
};

seed().catch((err) => {
    console.error('Seeder failed:', err);
    process.exit(1);
});
