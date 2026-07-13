const { body, validationResult } = require('express-validator');

const validateMessage = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .matches(/^\d{10,15}$/)
    .withMessage('Invalid phone number format'),
  body('message')
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 4096 })
    .withMessage('Message too long'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'document', 'audio', 'video'])
    .withMessage('Invalid message type'),
  body('sessionId')
    .optional()
    .isAlphanumeric()
    .withMessage('Invalid session ID')
];

const validateSession = [
  body('sessionId')
    .optional()
    .isAlphanumeric()
    .withMessage('Invalid session ID')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateMessage,
  validateSession,
  handleValidationErrors
};