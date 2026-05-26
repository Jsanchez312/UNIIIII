const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/user');
const protect  = require('../middleware/auth');
const notifier = require('../services/telegram');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, university, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Faltan campos' });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'El correo ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, university, phone });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    notifier.notifyNewUser({ name, email }).catch(err =>
      console.error('[Telegram] Fallo al notificar nuevo usuario:', err.message)
    );

    res.status(201).json({ token, user: { id: user._id, name, email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, phone: user.phone || '' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone || '' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile — actualizar teléfono (requiere login)
router.put('/profile', protect, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Falta el número de teléfono' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { phone },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Emitir nuevo token con el phone actualizado
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
