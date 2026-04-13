/**
 * Centralised error response helper.
 * Usage: return errorResponse(res, 404, 'Doctor not found');
 */
const errorResponse = (res, status, message, details = null) => {
  const body = { error: message };
  if (details) body.details = details;
  return res.status(status).json(body);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorResponse, asyncHandler };
