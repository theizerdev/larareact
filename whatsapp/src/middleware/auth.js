const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorización requerido'
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    logger.security('auth-success', {
      userId: decoded.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    
    next();
  } catch (error) {
    logger.security('auth-failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path
    });
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
};

module.exports = authMiddleware;