// ── routes/analysis.js — EP003: Análisis real con AssemblyAI ─────────────
const express  = require('express');
const axios    = require('axios');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const router   = express.Router();

const ASSEMBLYAI_KEY = 'b21ab6b91df545309c2c947e04641d59';
const API_URL        = 'https://api.assemblyai.com/v2';
const MULETILLAS     = ['eh', 'este', 'o sea', 'básicamente', 'osea', 'mmm', 'eeh', 'bueno', 'entonces'];

// ── Configurar multer para recibir archivos ───────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => cb(null, `audio-${Date.now()}.webm`)
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// ── POST /api/analysis/subir ──────────────────────────────────────────────
router.post('/subir', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se recibió ningún archivo.' });
  }

  const filePath = req.file.path;

  try {
    console.log('📤 Subiendo audio a AssemblyAI...');

    // 1. Subir archivo a AssemblyAI
    const fileData = fs.readFileSync(filePath);
    const uploadRes = await axios.post(`${API_URL}/upload`, fileData, {
      headers: {
        authorization: ASSEMBLYAI_KEY,
        'content-type': 'application/octet-stream'
      }
    });

    const audioUrl = uploadRes.data.upload_url;
    console.log('✅ Audio subido:', audioUrl);

    // 2. Solicitar transcripción
    const transcriptRes = await axios.post(`${API_URL}/transcript`, {
      audio_url:     audioUrl,
      language_code: 'es',
      punctuate:     true,
      format_text:   true
    }, {
      headers: { authorization: ASSEMBLYAI_KEY }
    });

    const transcriptId = transcriptRes.data.id;
    console.log('⏳ Procesando transcripción:', transcriptId);

    // 3. Esperar resultado
    let transcript = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await axios.get(`${API_URL}/transcript/${transcriptId}`, {
        headers: { authorization: ASSEMBLYAI_KEY }
      });

      console.log(`   Estado: ${poll.data.status} (intento ${i + 1})`);

      if (poll.data.status === 'completed') {
        transcript = poll.data;
        break;
      }
      if (poll.data.status === 'error') {
        throw new Error('AssemblyAI no pudo procesar el audio.');
      }
    }

    // Borrar archivo temporal
    fs.unlinkSync(filePath);

    if (!transcript) {
      return res.status(408).json({ message: 'El análisis tardó demasiado. Intenta de nuevo.' });
    }

    // 4. Procesar resultados
    const texto         = transcript.text || '';
    const palabras      = texto.split(' ').filter(p => p.length > 0);
    const duracionSeg   = transcript.audio_duration || 60;
    const duracionMin   = Math.max(duracionSeg / 60, 0.1);
    const palabrasPorMin = Math.round(palabras.length / duracionMin);
    const textoLower    = texto.toLowerCase();

    // Detectar muletillas
    const muletillasDetectadas = {};
    MULETILLAS.forEach(m => {
      const regex   = new RegExp(`\\b${m}\\b`, 'gi');
      const matches = textoLower.match(regex);
      if (matches && matches.length > 0) muletillasDetectadas[m] = matches.length;
    });

    const totalMuletillas = Object.values(muletillasDetectadas).reduce((a, b) => a + b, 0);

    // Puntuaciones
    const fluidez   = Math.max(0, Math.min(100, 100 - totalMuletillas * 4));
    const velocidad = palabrasPorMin >= 120 && palabrasPorMin <= 160 ? 90 :
                      palabrasPorMin < 120 ? 70 : 75;
    const claridad  = Math.min(100, Math.round((palabras.length / Math.max(duracionSeg, 1)) * 10 + 60));
    const general   = Math.round((fluidez + velocidad + claridad) / 3);

    // Fortalezas y debilidades
    const fortalezas  = [];
    const debilidades = [];
    if (fluidez >= 70)        fortalezas.push('Buena fluidez en el discurso');
    else                      debilidades.push('Uso frecuente de muletillas');
    if (velocidad >= 80)      fortalezas.push('Velocidad del habla adecuada');
    else                      debilidades.push('Velocidad del habla irregular');
    if (claridad >= 75)       fortalezas.push('Claridad en la expresión');
    else                      debilidades.push('Falta de claridad en algunas partes');
    if (totalMuletillas === 0) fortalezas.push('Sin muletillas detectadas');
    if (palabras.length > 50)  fortalezas.push('Buen desarrollo del contenido');

    // Recomendaciones
    const recomendaciones = [];
    if (totalMuletillas > 0)  recomendaciones.push('Practica pausar en lugar de usar muletillas como "eh" o "este".');
    if (velocidad < 80)       recomendaciones.push('Intenta mantener una velocidad de 120-160 palabras por minuto.');
    if (fluidez < 70)         recomendaciones.push('Graba y escucha tus exposiciones para identificar muletillas.');
    recomendaciones.push('Practica frente al espejo para mejorar tu lenguaje corporal.');
    recomendaciones.push('Realiza respiraciones profundas antes de exponer para reducir nervios.');

    console.log(`✅ Análisis completado: ${general}/100`);

    return res.json({
      transcripcion: texto,
      duracion: duracionSeg,
      palabrasPorMin,
      muletillas: muletillasDetectadas,
      totalMuletillas,
      puntuaciones: { fluidez, velocidad, claridad, general },
      fortalezas,
      debilidades,
      recomendaciones
    });

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Error análisis:', err.message);
    return res.status(500).json({ message: 'Error al analizar el audio: ' + err.message });
  }
});

module.exports = router;