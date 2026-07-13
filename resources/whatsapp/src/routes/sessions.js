const express = require('express');
const Session = require('../models/Session');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const sessions = await Session.findAll();
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;