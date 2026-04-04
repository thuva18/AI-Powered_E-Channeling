const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

// @desc    Predict doctor specialization from symptom text (proxies to Python Flask)
// @route   POST /api/v1/ai/predict-specialist
// @access  Private (any authenticated user)
router.post('/predict-specialist', protect, async (req, res) => {
    const { symptoms } = req.body;

    if (!symptoms || !symptoms.trim()) {
        return res.status(400).json({ message: 'symptoms field is required' });
    }

    try {
        const response = await fetch(`${AI_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms: symptoms.trim() }),
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[AI] Flask service error:', errText);
            return res.status(502).json({ message: 'AI service error', detail: errText });
        }

        const data = await response.json();
        return res.json(data);
    } catch (err) {
        if (err.name === 'TimeoutError') {
            return res.status(504).json({ message: 'AI service timed out. Please try again.' });
        }
        console.error('[AI] Proxy error:', err.message);
        return res.status(503).json({
            message: 'AI service unavailable. Make sure the Python service is running on port 5001.',
        });
    }
});

// @desc    Health check for the AI service
// @route   GET /api/v1/ai/health
// @access  Public
router.get('/health', async (req, res) => {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/health`, {
            signal: AbortSignal.timeout(3000),
        });
        const data = await response.json();
        return res.json({ nodeProxy: 'ok', aiService: data });
    } catch {
        return res.status(503).json({ nodeProxy: 'ok', aiService: 'unreachable' });
    }
});

module.exports = router;
