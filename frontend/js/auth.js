// ── auth.js — US-01, US-03, US-04, US-05 ──────────────────────────────────

const API = 'http://localhost:3000/api';

// Elementos
const form        = document.getElementById('loginForm');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const emailMsg    = document.getElementById('emailMsg');
const passMsg     = document.getElementById('passMsg');
const btnLogin    = document.getElementById('btnLogin');
const bannerError = document.getElementById('bannerError');
const bannerOk    = document.getElementById('bannerSuccess');
const progressBar = document.getElementById('progressBar');
const progressFill= document.getElementById('progressFill');
const togglePw    = document.getElementById('togglePw');
const remember    = document.getElementById('remember');

// ── Si ya hay sesión guardada, ir directo al dashboard (US-04) ──────────────
const saved = localStorage.getItem('speakup_user') || sessionStorage.getItem('speakup_user');
if (saved) window.location.href = 'dashboard.html';

// ── Toggle contraseña ───────────────────────────────────────────────────────
togglePw.addEventListener('click', () => {
  const show = passInput.type === 'password';
  passInput.type = show ? 'text' : 'password';
  togglePw.textContent = show ? '🙈' : '👁️';
});

// ── Validación en tiempo real ───────────────────────────────────────────────
function validateEmail(val) {
  if (!val) return { ok: false, msg: 'El correo es obligatorio.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return { ok: false, msg: 'Ingresa un correo válido.' };
  return { ok: true, msg: '✓ Correo válido' };
}

function validatePass(val) {
  if (!val) return { ok: false, msg: 'La contraseña es obligatoria.' };
  if (val.length < 6) return { ok: false, msg: 'Mínimo 6 caracteres.' };
  return { ok: true, msg: '' };
}

function applyValidation(input, msgEl, result) {
  input.classList.toggle('error', !result.ok);
  input.classList.toggle('valid',  result.ok);
  msgEl.textContent  = result.msg;
  msgEl.className    = 'field-msg ' + (result.ok ? 'valid' : 'error');
}

emailInput.addEventListener('blur', () => applyValidation(emailInput, emailMsg, validateEmail(emailInput.value.trim())));
passInput .addEventListener('blur', () => applyValidation(passInput,  passMsg,  validatePass(passInput.value)));

// ── Submit ──────────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const pass  = passInput.value;

  const ev = validateEmail(email);
  const pv = validatePass(pass);
  applyValidation(emailInput, emailMsg, ev);
  applyValidation(passInput,  passMsg,  pv);

  // US-01 E3: campos vacíos → no procesar
  if (!ev.ok || !pv.ok) return;

  // Deshabilitar botón mientras espera
  btnLogin.disabled = true;
  btnLogin.textContent = 'Verificando...';
  bannerError.classList.add('hidden');
  bannerOk.classList.add('hidden');

  try {
    const start = Date.now();

    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });

    const data = await res.json();
    const elapsed = Date.now() - start; // US-05: medir tiempo

    if (res.ok) {
      // US-05: mostrar barra de progreso animada
      progressBar.classList.remove('hidden');
      animateProgress(() => {
        // Guardar sesión (US-04: recordar sesión)
        const storage = remember.checked ? localStorage : sessionStorage;
        storage.setItem('speakup_user', JSON.stringify({ name: data.name, email: data.email, token: data.token }));

        // Banner éxito
        bannerOk.classList.remove('hidden');
        btnLogin.classList.add('success');
        btnLogin.textContent = '✓ Ingresando...';

        // Redirigir
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
      });
    } else {
      // US-01 E2: credenciales incorrectas
      showError(data.message || 'Correo o contraseña incorrectos.');
    }

  } catch (err) {
    showError('No se pudo conectar con el servidor. Intenta de nuevo.');
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function showError(msg) {
  bannerError.textContent = '⚠️ ' + msg;
  bannerError.classList.remove('hidden');
  emailInput.classList.add('error');
  passInput.classList.add('error');
  btnLogin.disabled = false;
  btnLogin.textContent = 'Iniciar sesión';
}

function animateProgress(onDone) {
  let pct = 0;
  const iv = setInterval(() => {
    pct += 4;
    progressFill.style.width = pct + '%';
    if (pct >= 100) { clearInterval(iv); onDone(); }
  }, 30);
}