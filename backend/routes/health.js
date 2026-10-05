const express = require('express');
const router = express.Router();

// GET /health — returns service status
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
