// ── dashboard.js ─────────────────────────────────────────────────────────

const raw = localStorage.getItem('speakup_user') || sessionStorage.getItem('speakup_user');
if (!raw) window.location.href = 'index.html';

const user = JSON.parse(raw);

// Navbar
const navUserEl   = document.getElementById('navUser');
const navAvatarEl = document.getElementById('navAvatar');
const welcomeEl   = document.getElementById('welcomeName');
const btnLogoutEl = document.getElementById('btnLogout');

if (navUserEl)   navUserEl.textContent   = user.name || user.email;
if (welcomeEl)   welcomeEl.textContent   = (user.name || user.email).split(' ')[0];
if (navAvatarEl) navAvatarEl.textContent = (user.name || user.email).charAt(0).toUpperCase();

// Stats desde historial
const historial = JSON.parse(localStorage.getItem('speakup_historial') || '[]');

const statPracticas  = document.getElementById('statPracticas');
const statPromedio   = document.getElementById('statPromedio');
const statMuletillas = document.getElementById('statMuletillas');
const statVelocidad  = document.getElementById('statVelocidad');

if (statPracticas) statPracticas.textContent = historial.length;

if (historial.length > 0) {
  const promedio   = Math.round(historial.reduce((a, b) => a + b.puntuaciones.general, 0) / historial.length);
  const muletillas = historial.reduce((a, b) => a + (b.totalMuletillas || 0), 0);
  const velocidad  = Math.round(historial.reduce((a, b) => a + b.palabrasPorMin, 0) / historial.length);
  if (statPromedio)   statPromedio.textContent   = promedio + '/100';
  if (statMuletillas) statMuletillas.textContent = muletillas;
  if (statVelocidad)  statVelocidad.textContent  = velocidad + ' ppm';
}

// Cerrar sesión
if (btnLogoutEl) {
  btnLogoutEl.addEventListener('click', () => {
    localStorage.removeItem('speakup_user');
    sessionStorage.removeItem('speakup_user');
    window.location.href = 'index.html';
  });
}