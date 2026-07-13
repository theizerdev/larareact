const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.findAndCountAll({
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      messages: messages.rows,
      total: messages.count,
      page: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;