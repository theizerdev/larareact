const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign(
      { id: 1, username: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, error: 'Credenciales inválidas' });
  }
});

module.exports = router;