// ── record.js — EP002 ─────────────────────────────────────────────────────

const BACKEND_URL = 'https://speakup-production-132c.up.railway.app';
const TIEMPO_LIMITE = 120;

const videoPreview      = document.getElementById('videoPreview');
const recIndicator      = document.getElementById('recIndicator');
const cronometroEl      = document.getElementById('cronometro');
const btnIniciarCamara  = document.getElementById('btnIniciarCamara');
const controlsInicio    = document.getElementById('controlsInicio');
const controlsGrabando  = document.getElementById('controlsGrabando');
const btnIniciarGrab    = document.getElementById('btnIniciarGrabacion');
const btnDetener        = document.getElementById('btnDetenerGrabacion');
const btnPausar         = document.getElementById('btnPausar');
const alert30           = document.getElementById('alert30');
const alert10           = document.getElementById('alert10');
const modalTiempo       = document.getElementById('modalTiempo');
const btnVerResultados  = document.getElementById('btnVerResultados');
const btnMasTiempo      = document.getElementById('btnMasTiempo');
const uploadArea        = document.getElementById('uploadArea');
const fileInput         = document.getElementById('fileInput');
const filePreview       = document.getElementById('filePreview');
const fileName          = document.getElementById('fileName');
const fileSize          = document.getElementById('fileSize');
const videoUploadPreview = document.getElementById('videoUploadPreview');
const formatError       = document.getElementById('formatError');
const btnAnalizarVideo  = document.getElementById('btnAnalizarVideo');

let stream        = null;
let mediaRecorder = null;
let chunks        = [];
let segundos      = 0;
let timerInterval = null;
let pausado       = false;
let analizando    = false;

// ── Tabs ──────────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('panelGrabar').classList.toggle('hidden', tab !== 'grabar');
  document.getElementById('panelSubir').classList.toggle('hidden', tab !== 'subir');
  document.getElementById('tabGrabar').classList.toggle('active', tab === 'grabar');
  document.getElementById('tabSubir').classList.toggle('active', tab === 'subir');
}

// ── Activar cámara ────────────────────────────────────────────────────────
btnIniciarCamara.addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoPreview.srcObject = stream;
    controlsInicio.classList.add('hidden');
    controlsGrabando.classList.remove('hidden');
    btnIniciarGrab.classList.remove('hidden');
    cronometroEl.classList.remove('hidden');
  } catch (err) {
    alert('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
  }
});

// ── Iniciar grabación ─────────────────────────────────────────────────────
btnIniciarGrab.addEventListener('click', () => {
  if (analizando) return;
  chunks   = [];
  segundos = 0;
  pausado  = false;

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    if (!analizando) {
      analizando = true;
      enviarAlBackend();
    }
  };
  mediaRecorder.start(1000);

  recIndicator.classList.remove('hidden');
  btnIniciarGrab.classList.add('hidden');
  btnDetener.classList.remove('hidden');
  btnPausar.classList.remove('hidden');
  alert30.classList.add('hidden');
  alert10.classList.add('hidden');

  timerInterval = setInterval(() => {
    if (!pausado) {
      segundos++;
      cronometroEl.textContent = formatTime(segundos);
      const restante = TIEMPO_LIMITE - segundos;
      if (restante === 30) { alert30.classList.remove('hidden'); alert10.classList.add('hidden'); }
      if (restante === 10) { alert10.classList.remove('hidden'); alert30.classList.add('hidden'); }
      if (restante <= 0)   { clearInterval(timerInterval); mediaRecorder.stop(); modalTiempo.classList.remove('hidden'); }
    }
  }, 1000);
});

// ── Pausar ────────────────────────────────────────────────────────────────
btnPausar.addEventListener('click', () => {
  pausado = !pausado;
  if (pausado) { mediaRecorder.pause();  btnPausar.textContent = '▶ Reanudar'; recIndicator.classList.add('hidden'); }
  else         { mediaRecorder.resume(); btnPausar.textContent = '⏸ Pausar';   recIndicator.classList.remove('hidden'); }
});

// ── Detener ───────────────────────────────────────────────────────────────
btnDetener.addEventListener('click', () => {
  clearInterval(timerInterval);
  recIndicator.classList.add('hidden');
  btnDetener.classList.add('hidden');
  btnPausar.classList.add('hidden');
  alert30.classList.add('hidden');
  alert10.classList.add('hidden');
  btnIniciarGrab.classList.remove('hidden');
  btnIniciarGrab.textContent = '⏳ Subiendo y analizando...';
  btnIniciarGrab.disabled = true;
  setTimeout(() => mediaRecorder.stop(), 300);
});

// ── Enviar al backend ─────────────────────────────────────────────────────
function enviarAlBackend() {
  if (chunks.length === 0) {
    alert('No se grabó ningún video.');
    btnIniciarGrab.textContent = '▶ Nueva grabación';
    btnIniciarGrab.disabled = false;
    analizando = false;
    return;
  }

  const blob     = new Blob(chunks, { type: 'video/webm' });
  const formData = new FormData();
  formData.append('audio', blob, 'grabacion.webm');

  fetch(`${BACKEND_URL}/api/analysis/subir`, {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data && data.puntuaciones) {
      localStorage.setItem('speakup_resultado', JSON.stringify(data));
      const historial = JSON.parse(localStorage.getItem('speakup_historial') || '[]');
      const yaExiste  = historial[0] && historial[0].transcripcion === data.transcripcion;
      if (!yaExiste) {
        historial.unshift({
          ...data,
          fecha: new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' }),
          hora:  new Date().toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' })
        });
        localStorage.setItem('speakup_historial', JSON.stringify(historial.slice(0, 20)));
      }
      window.location.href = 'results.html';
    } else {
      alert('Error al procesar. Intenta de nuevo.');
      btnIniciarGrab.textContent = '▶ Nueva grabación';
      btnIniciarGrab.disabled = false;
      analizando = false;
    }
  })
  .catch(err => {
    alert('Error de conexión: ' + err.message);
    btnIniciarGrab.textContent = '▶ Nueva grabación';
    btnIniciarGrab.disabled = false;
    analizando = false;
  });
}

// ── Modal tiempo agotado ──────────────────────────────────────────────────
btnVerResultados.addEventListener('click', () => {
  modalTiempo.classList.add('hidden');
  analizando = true;
  enviarAlBackend();
});

btnMasTiempo.addEventListener('click', () => {
  modalTiempo.classList.add('hidden');
  segundos = 0;
  cronometroEl.textContent = '00:00';
  alert30.classList.add('hidden');
  alert10.classList.add('hidden');
  timerInterval = setInterval(() => {
    segundos++;
    cronometroEl.textContent = formatTime(segundos);
  }, 1000);
});

// ── Subida de archivo ─────────────────────────────────────────────────────
const FORMATOS    = ['video/mp4','video/avi','video/quicktime','video/webm','video/x-msvideo'];
const EXTENSIONES = ['.mp4','.avi','.mov','.webm'];

fileInput.addEventListener('change', (e) => { if (e.target.files[0]) validarYMostrar(e.target.files[0]); });

uploadArea.addEventListener('dragover',  (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', ()  => { uploadArea.classList.remove('dragover'); });
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files[0]) validarYMostrar(e.dataTransfer.files[0]);
});

function validarYMostrar(file) {
  formatError.classList.add('hidden');
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!EXTENSIONES.includes(ext) && !FORMATOS.includes(file.type)) {
    formatError.classList.remove('hidden');
    return;
  }
  fileName.textContent   = file.name;
  fileSize.textContent   = formatBytes(file.size);
  videoUploadPreview.src = URL.createObjectURL(file);
  uploadArea.classList.add('hidden');
  filePreview.classList.remove('hidden');
}

function removeFile() {
  fileInput.value        = '';
  videoUploadPreview.src = '';
  filePreview.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  formatError.classList.add('hidden');
}

btnAnalizarVideo.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (!file) return;
  analizando = true;
  btnAnalizarVideo.textContent = '⏳ Analizando...';
  btnAnalizarVideo.disabled = true;
  const formData = new FormData();
  formData.append('audio', file, file.name);
  fetch(`${BACKEND_URL}/api/analysis/subir`, { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
      if (data && data.puntuaciones) {
        localStorage.setItem('speakup_resultado', JSON.stringify(data));
        window.location.href = 'results.html';
      }
    })
    .catch(err => {
      alert('Error: ' + err.message);
      btnAnalizarVideo.textContent = '🤖 Analizar con IA';
      btnAnalizarVideo.disabled = false;
      analizando = false;
    });
});

// ── Helpers ───────────────────────────────────────────────────────────────
function formatTime(s) {
  return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
}

function formatBytes(bytes) {
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
} 