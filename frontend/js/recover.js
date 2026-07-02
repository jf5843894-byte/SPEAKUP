// ── recover.js — US-02 ────────────────────────────────────────────────────

const API = 'http://localhost:3000/api';

const form        = document.getElementById('recoverForm');
const emailInput  = document.getElementById('email');
const emailMsg    = document.getElementById('emailMsg');
const btnRecover  = document.getElementById('btnRecover');
const bannerError = document.getElementById('bannerError');
const bannerOk    = document.getElementById('bannerSuccess');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  // US-02 E4: campo vacío
  if (!email) {
    setFieldError(emailInput, emailMsg, 'El correo es obligatorio.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError(emailInput, emailMsg, 'Ingresa un correo válido.');
    return;
  }

  btnRecover.disabled = true;
  btnRecover.textContent = 'Enviando...';
  bannerError.classList.add('hidden');
  bannerOk.classList.add('hidden');

  try {
    const res  = await fetch(`${API}/auth/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (res.ok) {
      // US-02 E1: éxito
      bannerOk.classList.remove('hidden');
      form.style.display = 'none';
    } else {
      // US-02 E2: correo no registrado
      bannerError.textContent = '⚠️ ' + (data.message || 'Correo no encontrado.');
      bannerError.classList.remove('hidden');
      setFieldError(emailInput, emailMsg, '');
      btnRecover.disabled = false;
      btnRecover.textContent = 'Enviar enlace de recuperación';
    }
  } catch {
    bannerError.textContent = '⚠️ Error de conexión. Intenta de nuevo.';
    bannerError.classList.remove('hidden');
    btnRecover.disabled = false;
    btnRecover.textContent = 'Enviar enlace de recuperación';
  }
});

function setFieldError(input, msgEl, msg) {
  input.classList.add('error');
  msgEl.textContent = msg;
  msgEl.className = 'field-msg error';
}