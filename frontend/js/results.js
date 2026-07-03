// ── results.js — EP003/EP004: Análisis IA y Reporte ──────────────────────

const API = 'http://localhost:3000/api';

const loadingWrap    = document.getElementById('loadingWrap');
const resultsWrap    = document.getElementById('resultsWrap');
const scoreNumber    = document.getElementById('scoreNumber');
const scoreMensaje   = document.getElementById('scoreMensaje');
const scoreCircle    = document.getElementById('scoreCircle');
const barFluidez     = document.getElementById('barFluidez');
const barVelocidad   = document.getElementById('barVelocidad');
const barClaridad    = document.getElementById('barClaridad');
const valFluidez     = document.getElementById('valFluidez');
const valVelocidad   = document.getElementById('valVelocidad');
const valClaridad    = document.getElementById('valClaridad');
const muletillasList = document.getElementById('muletillasList');
const velocidadTexto = document.getElementById('velocidadTexto');
const transcripcion  = document.getElementById('transcripcionTexto');
const listaFortalezas      = document.getElementById('listaFortalezas');
const listaDebilidades     = document.getElementById('listaDebilidades');
const listaRecomendaciones = document.getElementById('listaRecomendaciones');
const btnDescargarPDF      = document.getElementById('btnDescargarPDF');

// Cerrar sesión
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('speakup_user');
    sessionStorage.removeItem('speakup_user');
    window.location.href = 'index.html';
  });
}

const navUser = document.getElementById('navUser');
const raw2 = localStorage.getItem('speakup_user') || sessionStorage.getItem('speakup_user');
if (raw2 && navUser) {
  const u = JSON.parse(raw2);
  navUser.textContent = '👤 ' + (u.name || u.email);
}
// ── Cargar resultados ─────────────────────────────────────────────────────
window.addEventListener('load', () => {
  const raw = localStorage.getItem('speakup_resultado') || sessionStorage.getItem('speakup_resultado');
  if (raw) {
    const data = JSON.parse(raw);
    setTimeout(() => mostrarResultados(data), 2000);
  } else {
    // Si no hay resultado guardado, usar datos de demo
    setTimeout(() => mostrarResultados(getDemoData()), 2000);
  }
});

function mostrarResultados(data) {
  loadingWrap.classList.add('hidden');
  resultsWrap.classList.remove('hidden');

  const { puntuaciones, muletillas, palabrasPorMin,
          transcripcion: texto, fortalezas, debilidades, recomendaciones } = data;

  // Puntuación general
  animarNumero(scoreNumber, puntuaciones.general);
  scoreMensaje.textContent = getMensaje(puntuaciones.general);
  if (puntuaciones.general >= 80)      scoreCircle.style.background = '#16A34A';
  else if (puntuaciones.general >= 60) scoreCircle.style.background = '#D97706';
  else                                  scoreCircle.style.background = '#DC2626';

  // Barras de métricas
  setTimeout(() => {
    barFluidez.style.width   = puntuaciones.fluidez + '%';
    barVelocidad.style.width = puntuaciones.velocidad + '%';
    barClaridad.style.width  = puntuaciones.claridad + '%';
    valFluidez.textContent   = puntuaciones.fluidez + '%';
    valVelocidad.textContent = puntuaciones.velocidad + '%';
    valClaridad.textContent  = puntuaciones.claridad + '%';
  }, 300);

  // Muletillas
  const totalMuletillas = Object.keys(muletillas).length;
  if (totalMuletillas === 0) {
    muletillasList.innerHTML = '<p style="color:var(--green)">✅ No se detectaron muletillas</p>';
  } else {
    muletillasList.innerHTML = Object.entries(muletillas)
      .map(([m, c]) => `<span class="muletilla-tag">"${m}" × ${c}</span>`)
      .join('');
  }

  // Velocidad
  const rango = palabrasPorMin >= 120 && palabrasPorMin <= 160 ? '✅ dentro del rango óptimo' : 
                palabrasPorMin < 120 ? '⚠️ un poco lento' : '⚠️ un poco rápido';
  velocidadTexto.textContent = `Velocidad: ${palabrasPorMin} palabras/minuto — ${rango} (óptimo: 120-160 pal/min)`;

  // Transcripción
  transcripcion.textContent = texto || 'No se pudo obtener la transcripción.';

  // Fortalezas
  listaFortalezas.innerHTML = fortalezas.map(f => `<li>✅ ${f}</li>`).join('');

  // Debilidades
  listaDebilidades.innerHTML = debilidades.map(d => `<li>⚠️ ${d}</li>`).join('');

  // Recomendaciones
  listaRecomendaciones.innerHTML = recomendaciones.map(r => `<li>💡 ${r}</li>`).join('');
}

// ── Descargar PDF ─────────────────────────────────────────────────────────
btnDescargarPDF.addEventListener('click', () => {
  window.print();
});

// ── Helpers ───────────────────────────────────────────────────────────────
function animarNumero(el, target) {
  let current = 0;
  const step  = Math.ceil(target / 40);
  const iv    = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(iv);
  }, 40);
}

function getMensaje(score) {
  if (score >= 85) return '¡Excelente exposición! Sigue así.';
  if (score >= 70) return 'Buena exposición con áreas de mejora.';
  if (score >= 55) return 'Exposición regular. Practica más.';
  return 'Necesitas practicar más. ¡Tú puedes!';
}

// ── Datos de demo (cuando no hay audio real) ──────────────────────────────
function getDemoData() {
  return {
    transcripcion: 'Buenas tardes, eh, hoy voy a hablar sobre, este, la importancia de la comunicación oral en estudiantes. Básicamente, eh, la comunicación es fundamental para, o sea, expresar nuestras ideas de manera clara y efectiva.',
    duracion: 45,
    palabrasPorMin: 142,
    muletillas: { 'eh': 3, 'este': 2, 'básicamente': 1, 'o sea': 2 },
    totalMuletillas: 8,
    puntuaciones: { fluidez: 70, velocidad: 88, claridad: 82, general: 78 },
    fortalezas: [
      'Velocidad del habla adecuada',
      'Claridad en la expresión',
      'Buen desarrollo del contenido'
    ],
    debilidades: [
      'Uso frecuente de muletillas',
      'Pausas largas entre ideas'
    ],
    recomendaciones: [
      'Practica pausar en lugar de usar muletillas como "eh" o "este".',
      'Graba y escucha tus exposiciones para identificar muletillas.',
      'Realiza respiraciones profundas antes de exponer para reducir nervios.',
      'Practica frente al espejo para mejorar tu lenguaje corporal.'
    ]
  };
}