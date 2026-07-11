const Company = require('../models/Company');
const logger = require('../utils/logger');

const companyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key requerida en header X-API-Key'
      });
    }

    const company = await Company.findOne({
      where: { 
        apiKey,
        isActive: true
      }
    });

    if (!company) {
      return res.status(401).json({
        success: false,
        error: 'API key inválida o empresa inactiva'
      });
    }

    req.company = company;
    logger.info(`Request from company: ${company.name} (ID: ${company.id})`);
    
    next();
  } catch (error) {
    logger.error('Error in company auth:', error);
    res.status(500).json({
      success: false,
      error: 'Error de autenticación'
    });
  }
};

module.exports = companyAuth;