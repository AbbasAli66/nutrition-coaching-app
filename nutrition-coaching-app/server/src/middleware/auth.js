import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, email, role
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// Middleware to restrict access based on Role (e.g. COACH or CLIENT)
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to access this resource.",
      });
    }
    next();
  };
};