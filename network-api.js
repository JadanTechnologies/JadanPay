const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

/**
 * Simulates a random value within a given range.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @param {number} decimals - The number of decimal places.
 * @returns {number} A random number.
 */
function simulateValue(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

/**
 * POST /api/network/test
 * Simulates a network performance test for a given provider.
 * NOTE: This endpoint simulates client-side network conditions from the server.
 * In a real-world scenario, these tests would ideally be run from the client's browser.
 */
app.post('/api/network/test', (req, res) => {
  const { provider } = req.body;

  if (!provider || !['mtn', 'airtel', 'glo', '9mobile'].includes(provider.toLowerCase())) {
    return res.status(400).json({ error: 'A valid provider (mtn, airtel, glo, 9mobile) is required.' });
  }

  // Simulate metrics based on typical Nigerian network performance
  const packetLossPercent = simulateValue(0.1, 8.0);
  const successRate = 100 - packetLossPercent;

  const response = {
    provider: provider.toLowerCase(),
    latency: simulateValue(25, 350, 0), // in ms
    downloadSpeedMbps: simulateValue(5.0, 60.0),
    uploadSpeedMbps: simulateValue(1.0, 15.0),
    packetLossPercent: parseFloat(packetLossPercent.toFixed(2)),
    successRate: parseFloat(successRate.toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  // Add a small delay to simulate network latency for the API call itself
  setTimeout(() => {
    res.json(response);
  }, simulateValue(200, 800, 0));
});

app.listen(PORT, () => {
  console.log(`JadanPay Network Success Rate API listening on port ${PORT}`);
  console.log(`Endpoint available at: POST http://localhost:${PORT}/api/network/test`);
});
