/**
 * Global error handler middleware.
 * Must be registered as the LAST middleware in Express.
 * Returns HTTP 500 with { "error": "<message>" } — no stack trace in response.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const message = (err && err.message) ? err.message : 'Internal server error';
  res.status(500).json({ error: message });
}

module.exports = errorHandler;
