// ── record.js — EP002: US-07, US-08, US-09, US-10, US-11 ─────────────────

const TIEMPO_LIMITE = 120; // 2 minutos en segundos

// Elementos grabación
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

// Elementos subida
const uploadArea        = document.getElementById('uploadArea');
const fileInput         = document.getElementById('fileInput');
const filePreview       = document.getElementById('filePreview');
const fileName          = document.getElementById('fileName');
const fileSize          = document.getElementById('fileSize');
const videoUploadPreview= document.getElementById('videoUploadPreview');
const formatError       = document.getElementById('formatError');
const btnAnalizarVideo  = document.getElementById('btnAnalizarVideo');

// Estado
let stream         = null;
let mediaRecorder  = null;
let chunks         = []
let segundos       = 0;
let timerInterval  = null;
let pausado        = false;

// ── Tabs ─────────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('panelGrabar').classList.toggle('hidden', tab !== 'grabar');
  document.getElementById('panelSubir').classList.toggle('hidden', tab !== 'subir');
  document.getElementById('tabGrabar').classList.toggle('active', tab === 'grabar');
  document.getElementById('tabSubir').classList.toggle('active', tab === 'subir');
}

// ── Activar cámara (US-07) ───────────────────────────────────────────────
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
  chunks    = [];
  segundos  = 0;
  pausado   = false;

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => chunks.push(e.data);
  mediaRecorder.onstop = guardarVideo;
  mediaRecorder.start();

  recIndicator.classList.remove('hidden');
  btnIniciarGrab.classList.add('hidden');
  btnDetener.classList.remove('hidden');
  btnPausar.classList.remove('hidden');
  alert30.classList.add('hidden');
  alert10.classList.add('hidden');

  // Cronómetro (US-10)
  timerInterval = setInterval(() => {
    if (!pausado) {
      segundos++;
      cronometroEl.textContent = formatTime(segundos);

      // Alertas progresivas (US-10)
      const restante = TIEMPO_LIMITE - segundos;
      if (restante === 30) {
        alert30.classList.remove('hidden');
        alert10.classList.add('hidden');
      }
      if (restante === 10) {
        alert10.classList.remove('hidden');
        alert30.classList.add('hidden');
      }
      if (restante <= 0) {
        clearInterval(timerInterval);
        mediaRecorder.stop();
        modalTiempo.classList.remove('hidden');
      }
    }
  }, 1000);
});

// ── Pausar ────────────────────────────────────────────────────────────────
btnPausar.addEventListener('click', () => {
  pausado = !pausado;
  if (pausado) {
    mediaRecorder.pause();
    btnPausar.textContent = '▶ Reanudar';
    recIndicator.classList.add('hidden');
  } else {
    mediaRecorder.resume();
    btnPausar.textContent = '⏸ Pausar';
    recIndicator.classList.remove('hidden');
  }
});

// ── Detener ───────────────────────────────────────────────────────────────
btnDetener.addEventListener('click', () => {
  clearInterval(timerInterval);
  mediaRecorder.stop();
  recIndicator.classList.add('hidden');
  btnDetener.classList.add('hidden');
  btnPausar.classList.add('hidden');
  alert30.classList.add('hidden');
  alert10.classList.add('hidden');
  btnIniciarGrab.classList.remove('hidden');
  btnIniciarGrab.textContent = '⏳ Subiendo y analizando...';
  btnIniciarGrab.disabled = true;
});

// ── Guardar y analizar video grabado ─────────────────────────────────────
function guardarVideo() {
  const blob     = new Blob(chunks, { type: 'video/webm' });
  
  console.log('Tamaño del video:', blob.size, 'bytes');
  
  const formData = new FormData();
  formData.append('audio', blob, 'grabacion.webm');

  fetch('http://localhost:3000/api/analysis/subir', {
    method: 'POST',
    body: formData,
    keepalive: false
  })
  .then(res => {
    console.log('Status respuesta:', res.status);
    return res.json();
  })
 .then(data => {
    console.log('Datos recibidos:', data);
    if (data && data.puntuaciones) {
      localStorage.setItem('speakup_resultado', JSON.stringify(data));
      console.log('Guardado en localStorage, redirigiendo...');
      setTimeout(() => {
        window.location.href = 'http://127.0.0.1:5500/SPEAKUP/frontend/results.html';
      }, 100);
    } else {
      console.error('Datos inválidos:', data);
      alert('Error: respuesta inválida del servidor');
      btnIniciarGrab.textContent = '▶ Nueva grabación';
      btnIniciarGrab.disabled = false;
    }
  })
  .catch(err => {
    console.error('Error fetch:', err);
    btnIniciarGrab.textContent = '▶ Nueva grabación';
    btnIniciarGrab.disabled = false;
    alert('Error de conexión: ' + err.message);
  });
}

// ── Modal tiempo agotado ──────────────────────────────────────────────────
btnVerResultados.addEventListener('click', () => {
  modalTiempo.classList.add('hidden');
  guardarVideo();
});

btnMasTiempo.addEventListener('click', () => {
  modalTiempo.classList.add('hidden');
  segundos = 0;
  cronometroEl.textContent = '00:00';
  alert30.classList.add('hidden');
  alert10.classList.add('hidden');
  // Reanudar grabación
  timerInterval = setInterval(() => {
    segundos++;
    cronometroEl.textContent = formatTime(segundos);
  }, 1000);
});

// ── Subida de archivo (US-08, US-09) ─────────────────────────────────────
const FORMATOS = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const EXTENSIONES = ['.mp4', '.avi', '.mov', '.webm'];

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) validarYMostrar(file);
});

// Drag & drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) validarYMostrar(file);
});

function validarYMostrar(file) {
  formatError.classList.add('hidden');
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  // US-09 E2: formato no permitido
  if (!EXTENSIONES.includes(ext) && !FORMATOS.includes(file.type)) {
    formatError.classList.remove('hidden');
    return;
  }

  // US-09 E1: mostrar preview
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  videoUploadPreview.src = URL.createObjectURL(file);
  uploadArea.classList.add('hidden');
  filePreview.classList.remove('hidden');
}

function removeFile() {
  fileInput.value = '';
  videoUploadPreview.src = '';
  filePreview.classList.add('hidden');
  uploadArea.classList.remove('hidden');
  formatError.classList.add('hidden');
}

btnAnalizarVideo.addEventListener('click', () => {
  window.location.href = 'http://127.0.0.1:5500/SPEAKUP/frontend/results.html';
});

// ── Helpers ───────────────────────────────────────────────────────────────
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}