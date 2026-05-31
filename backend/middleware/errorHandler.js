// middleware/errorHandler.js
// Centralized error handler — Express identifies it by its 4-parameter signature.
// Any controller that calls next(err) lands here, keeping error logic in one place.

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log full stack in development; suppress in production to avoid leaking internals
  if (process.env.NODE_ENV !== "test") {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);
    if (process.env.NODE_ENV === "development") console.error(err.stack);
  }

  // Use the statusCode we attached in the service, or fall back to 500
  const statusCode = err.statusCode || 500;

  const payload = {
    success: false,
    error: err.message || "An unexpected internal error occurred.",
  };

  // In development, include the stack trace to aid debugging
  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;
