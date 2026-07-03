// ── dashboard.js ─────────────────────────────────────────────────────────

// Verificar sesión activa
const raw = localStorage.getItem('speakup_user') || sessionStorage.getItem('speakup_user');
if (!raw) { window.location.href = 'index.html'; }

const user = JSON.parse(raw);

// Mostrar nombre solo si los elementos existen
const navUserEl    = document.getElementById('navUser');
const welcomeEl    = document.getElementById('welcomeName');
const btnLogoutEl  = document.getElementById('btnLogout');

if (navUserEl)   navUserEl.textContent   = '👤 ' + (user.name || user.email);
if (welcomeEl)   welcomeEl.textContent   = user.name || user.email;

// Cerrar sesión
if (btnLogoutEl) {
  btnLogoutEl.addEventListener('click', () => {
    localStorage.removeItem('speakup_user');
    sessionStorage.removeItem('speakup_user');
    window.location.href = 'index.html';
  });
}