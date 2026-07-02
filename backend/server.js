// ── server.js ─────────────────────────────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const authRoutes = require('./routes/auth');

const app  = express();
const PORT = 3000;

// Middlewares
app.use(cors({ origin: '*' }));          // permite conexión desde el frontend
app.use(express.json());                 // parsear JSON del body

// Rutas
app.use('/api/auth', authRoutes);

// Health check
app.get('/', (req, res) => res.json({ status: 'Speak UP API corriendo ✅' }));

app.listen(PORT, () => {
  console.log(`\n🎙️  Speak UP Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋  Rutas disponibles:`);
  console.log(`    POST /api/auth/login`);
  console.log(`    POST /api/auth/recover`);
});