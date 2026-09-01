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
  return (req, res, next) => {
    const flatRoles = allowedRoles.flat();
    if (!req.user || !flatRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Forbidden: You do not have permission to access this resource.',
      });
    }
    next();
  };
};