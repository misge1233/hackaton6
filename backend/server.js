const express = require('express');
const cors = require('cors');
const { WeatherClient, FloodClient, DeforestationClient, SoilClient } = require('openepi-client');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const weatherClient = new WeatherClient();
        const result = await weatherClient.getLocationForecast({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Flood API endpoints
app.get('/api/flood/thresholds', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const floodClient = new FloodClient();
        const result = await floodClient.getThresholds({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/flood/summary', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const floodClient = new FloodClient();
        const result = await floodClient.getSummaryForecast({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/flood/detailed', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const floodClient = new FloodClient();
        const result = await floodClient.getDetailedForecast({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legacy flood endpoint for backward compatibility
app.get('/api/flood', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const floodClient = new FloodClient();
        const result = await floodClient.getSummaryForecast({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/deforestation', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const deforestationClient = new DeforestationClient();
        const result = await deforestationClient.getBasin({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/soil', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Missing lat or lon parameter' });
    }
    try {
        const soilClient = new SoilClient();
        const result = await soilClient.getSoilType({ lat, lon });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
}); 