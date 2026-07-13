const express = require('express');
const Message = require('../models/Message');
const antiBlockProtection = require('../middleware/antiBlockProtection');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const total = await Message.count();
    const sent = await Message.count({ where: { status: 'sent' } });
    const failed = await Message.count({ where: { status: 'failed' } });
    
    res.json({
      success: true,
      stats: { total, sent, failed }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔒 Ruta protegida para ver estadísticas del sistema anti-bloqueo
router.get('/anti-block', authMiddleware, async (req, res) => {
  try {
    const antiBlockStats = antiBlockProtection.getStats();
    
    res.json({
      success: true,
      antiBlock: antiBlockStats,
      message: 'Estadísticas del sistema de protección contra bloqueo'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;