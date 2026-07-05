// ── server.js ─────────────────────────────────────────────────────────────
const express        = require('express');
const cors           = require('cors');
const authRoutes     = require('./routes/auth');
const analysisRoutes = require('./routes/analysis2');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Rutas
app.use('/api/auth',     authRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check
app.get('/', (req, res) => res.json({ status: 'Speak UP API corriendo ✅' }));

app.listen(PORT, () => {
  console.log(`\n🎙️  Speak UP Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋  Rutas disponibles:`);
  console.log(`    POST /api/auth/login`);
  console.log(`    POST /api/auth/recover`);
  console.log(`    POST /api/analysis/subir`);
});