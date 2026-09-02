import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = authHeader;
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles
    .flat()
    .map((role) => String(role).trim().toUpperCase());

  return (req, res, next) => {
    // Resolve user role across common JWT payload structures
    const rawRole = req.user?.role || req.user?.user?.role || '';
    const userRole = String(rawRole).trim().toUpperCase();

    if (!userRole || !normalizedAllowed.includes(userRole)) {
      console.warn(
        `[403 Forbidden] User role '${userRole || 'UNDEFINED'}' does not match allowed roles: [${normalizedAllowed.join(', ')}]`
      );
      return res.status(403).json({
        message: 'Forbidden: You do not have permission to access this resource.',
        required: normalizedAllowed,
        current: userRole,
      });
    }

    next();
  };
};