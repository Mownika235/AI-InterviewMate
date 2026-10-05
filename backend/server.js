require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use(healthRouter);

// TODO: Mount additional routes here (questions, evaluate)

// Guard: require OPENAI_API_KEY at startup (checked after routes so /health works without it)
if (require.main === module && !process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set. Please create a .env file based on .env.example.');
  process.exit(1);
}

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only start listening when this file is run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AI InterviewMate backend running on port ${PORT}`);
  });
}

module.exports = app;
