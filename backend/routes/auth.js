// ── routes/auth.js — con SQLite ───────────────────────────────────────────
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path     = require('path');
const router   = express.Router();

const JWT_SECRET = 'speakup_secret_2026';

// ── Conectar a SQLite ─────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, '../speakup.db'));

// Crear tabla si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    email    TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role     TEXT DEFAULT 'student',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Insertar usuarios de prueba si la tabla está vacía
const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (count.c === 0) {
  const hash = '$2a$10$mDsU8XGsVQFHDiSh5SDXvevjz9YapSkBHDrW6Owd0n.zGyilBv8em';
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run('Lucas Magallanes', 'lucas@speakup.com', hash, 'student');
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
    .run('Padre Demo', 'padre@speakup.com', hash, 'parent');
  console.log('✅ Usuarios de prueba creados');
}

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

  try {
    const user  = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
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

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (exists) {
      return res.status(409).json({ message: 'Este correo ya está registrado.' });
    }

    const hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)')
      .run(name, email.toLowerCase(), hash, 'student');

    console.log(`✅ Nuevo usuario registrado: ${email}`);
    return res.json({ message: 'Usuario registrado correctamente.' });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/recover ────────────────────────────────────────────────
router.post('/recover', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'El correo es obligatorio.' });
  }

  try {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());

    if (!user) {
      return res.status(404).json({ message: 'Este correo no está registrado.' });
    }

    console.log(`📧 Enlace de recuperación enviado a: ${email}`);
    return res.json({ message: `Enlace enviado a ${email}.` });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;