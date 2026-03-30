const mongoose = require('mongoose');

const patientJournalSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        entryDate: {
            type: Date,
            required: [true, 'Entry date is required'],
        },
        symptoms: {
            type: String,
            default: '',
        },
        medications: {
            type: String,
            default: '',
        },
        moodStatus: {
            type: String,
            enum: {
                values: ['Improving', 'Stable', 'Worsening'],
                message: 'moodStatus must be Improving, Stable, or Worsening',
            },
            default: 'Stable',
        },
        painLevel: {
            type: Number,
            min: [1, 'Pain level must be at least 1'],
            max: [10, 'Pain level must be at most 10'],
        },
        notes: {
            type: String,
            default: '',
        },
        visibility: {
            type: String,
            enum: {
                values: ['PRIVATE', 'SHARED'],
                message: 'Visibility must be PRIVATE or SHARED',
            },
            default: 'PRIVATE',
        },
    },
    { timestamps: true }
);

const PatientJournal = mongoose.model('PatientJournal', patientJournalSchema);
module.exports = PatientJournal;
