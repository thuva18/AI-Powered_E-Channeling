const mongoose = require('mongoose');

const presetSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        reportName: {
            type: String,
            default: '',
            trim: true,
        },
        dateRange: {
            from: { type: String, default: '' },
            to: { type: String, default: '' },
            preset: { type: String, default: '' },
        },
        sections: {
            type: [String],
            default: [],
        },
        doctors: {
            type: [String],
            default: [],
        },
        filters: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

const Preset = mongoose.model('Preset', presetSchema);
module.exports = Preset;
