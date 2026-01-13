import express from 'express';
import { chatWithAI, getServiceInfo, getAllServices } from '../services/aiService.js';

const router = express.Router();

// Chat with AI - no authentication required for demo
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const result = await chatWithAI(
            [{ role: 'user', content: message }],
            conversationHistory
        );

        res.json(result);
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            error: 'Failed to process AI request',
            message: error.message
        });
    }
});

// Get all services
router.get('/services', (req, res) => {
    try {
        const services = getAllServices();
        res.json({ success: true, services });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Get specific service info
router.get('/services/:serviceId', (req, res) => {
    try {
        const service = getServiceInfo(req.params.serviceId);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ success: true, service });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

export default router;
