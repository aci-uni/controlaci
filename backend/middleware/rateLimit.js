const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { message: 'Demasiados intentos. Por favor, espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: { message: 'Demasiadas solicitudes. Por favor, espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 uploads per window
  message: { message: 'Demasiadas cargas de archivos. Por favor, espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { authLimiter, apiLimiter, uploadLimiter };
