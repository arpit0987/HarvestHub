const express = require('express');
const router = express.Router();
const aiAdvisor = require('../services/aiAdvisor');

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history, userProfile } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const response = await aiAdvisor.chatWithCopilot(message, history || [], userProfile || null);
    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/recommend-rotation/:fieldId
router.get('/recommend-rotation/:fieldId', (req, res) => {
  try {
    const recommendation = aiAdvisor.recommendRotation(req.params.fieldId);
    res.json({ success: true, data: recommendation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/diagnose-machinery/:equipmentId
router.get('/diagnose-machinery/:equipmentId', (req, res) => {
  try {
    const diagnosis = aiAdvisor.diagnoseMachinery(req.params.equipmentId);
    res.json({ success: true, data: diagnosis });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/financial-insights
router.get('/financial-insights', (req, res) => {
  try {
    const insights = aiAdvisor.generateFinancialInsights();
    res.json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
