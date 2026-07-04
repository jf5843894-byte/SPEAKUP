// ── routes/auth.js — Base de datos en memoria (compatible Railway) ────────
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const router   = express.Router();

const JWT_SECRET = 'speakup_secret_2026';

// ── Base de datos en memoria ──────────────────────────────────────────────
const users = [
  {
    id: 1,
    name: 'Lucas Magallanes',
    email: 'lucas@speakup.com',
    password: '$2a$10$mDsU8XGsVQFHDiSh5SDXvevjz9YapSkBHDrW6Owd0n.zGyilBv8em',
    role: 'student'
  },
  {
    id: 2,
    name: 'Padre Demo',
    email: 'padre@speakup.com',
    password: '$2a$10$mDsU8XGsVQFHDiSh5SDXvevjz9YapSkBHDrW6Owd0n.zGyilBv8em',
    role: 'parent'
  }
];

let nextId = 3;

// Registro de intentos fallidos
const failedAttempts = {};
const MAX_ATTEMPTS   = 5;
const LOCK_MINUTES   = 15;

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
  }

  const attempts = failedAttempts[email];
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const minutesPassed = (Date.now() - attempts.lastAttempt) / 60000;
    if (minutesPassed < LOCK_MINUTES) {
      const remaining = Math.ceil(LOCK_MINUTES - minutesPassed);
      return res.status(429).json({ message: `Cuenta bloqueada. Espera ${remaining} minuto(s).` });
    } else {
      delete failedAttempts[email];
    }
  }

  const user  = users.find(u => u.email === email.toLowerCase());
  const valid = user && await bcrypt.compare(password, user.password);

  if (!valid) {
    if (!failedAttempts[email]) failedAttempts[email] = { count: 0, lastAttempt: Date.now() };
    failedAttempts[email].count++;
    failedAttempts[email].lastAttempt = Date.now();
    return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  }

  delete failedAttempts[email];

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log(`✅ Login exitoso: ${user.email}`);
  return res.json({ message: 'Login exitoso', name: user.name, email: user.email, role: user.role, token });
});

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  const exists = users.find(u => u.email === email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: 'Este correo ya está registrado.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = { id: nextId++, name, email: email.toLowerCase(), password: hash, role: 'student' };
  users.push(newUser);

  console.log(`✅ Nuevo usuario: ${email}`);
  return res.json({ message: 'Usuario registrado correctamente.' });
});

// ── POST /api/auth/recover ────────────────────────────────────────────────
router.post('/recover', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El correo es obligatorio.' });
  }

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ message: 'Este correo no está registrado.' });
  }

  console.log(`📧 Recuperación enviada a: ${email}`);
  return res.json({ message: `Enlace enviado a ${email}.` });
});

module.exports = router; 