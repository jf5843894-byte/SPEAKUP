// ── dashboard.js ─────────────────────────────────────────────────────────

// Verificar sesión activa
const raw = localStorage.getItem('speakup_user') || sessionStorage.getItem('speakup_user');
if (!raw) { window.location.href = 'index.html'; }

const user = JSON.parse(raw);

// Mostrar nombre
document.getElementById('navUser').textContent  = '👤 ' + (user.name || user.email);
document.getElementById('welcomeName').textContent = user.name || user.email;

// Cerrar sesión
document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('speakup_user');
  sessionStorage.removeItem('speakup_user');
  window.location.href = 'index.html';
});