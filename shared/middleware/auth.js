const jwt = require('jsonwebtoken');

/**
 * Middleware for individual services.
 * The API Gateway already verifies the JWT and forwards user info
 * via x-user-id and x-user-role headers.
 * This middleware just reads those headers — no re-verification needed.
 */
const authenticate = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorised — missing user context' });
  }

  req.user = { id: userId, role };
  next();
};

/**
 * Role-based access control factory.
 * Usage: router.post('/admin-only', authorize('admin'), handler)
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden — insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, authorize };
