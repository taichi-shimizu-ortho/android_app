// Supabase初期化
const SUPABASE_URL = 'https://zfuklmuilcejinkzfimq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yB7PtClaSDoX7S074E1wLA_KoEpg5uN';

let protocols = [];
let currentStep = 0;
let timerInterval = null;
let timerSeconds = 0;

async function loadProtocols() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/protocols?select=*&order=section_number.asc,step_number.asc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    protocols = await response.json();
    currentStep = 0;
    displayStep();
  } catch (error) {
    console.error('Error loading protocols:', error);
    document.getElementById('step-container').innerHTML =
      `<p style="color: red;">エラー: ${error.message}<br/>コンソールを確認してください</p>`;
  }
}

function displayStep() {
  if (protocols.length === 0) return;

  const step = protocols[currentStep];
  const container = document.getElementById('step-container');

  container.innerHTML = `
    <div class="step-header">
      <h1>セクション ${step.section_number}: ${step.section_title}</h1>
      <p class="step-counter">ステップ ${step.step_number}</p>
    </div>

    <div class="step-content">
      <h2>${step.step_title}</h2>
      ${step.description ? `<p class="description">${step.description}</p>` : ''}
      ${step.notes ? `<div class="notes">📝 ${step.notes}</div>` : ''}
    </div>

    <div class="timer-section" ${step.duration_minutes ? '' : 'style="display:none;"'}>
      <div class="timer-display" id="timer-display">
        ${step.duration_minutes}:00
      </div>
      <div class="timer-buttons">
        <button id="timer-start" onclick="startTimer(${step.duration_minutes})">開始</button>
        <button id="timer-pause" onclick="pauseTimer()" style="display:none;">一時停止</button>
        <button id="timer-reset" onclick="resetTimer()">リセット</button>
      </div>
    </div>

    <div class="step-progress">
      <p>${currentStep + 1} / ${protocols.length}</p>
    </div>

    <div class="navigation-buttons">
      <button onclick="previousStep()" ${currentStep === 0 ? 'disabled' : ''}>← 前へ</button>
      <button onclick="nextStep()" ${currentStep === protocols.length - 1 ? 'disabled' : ''}>次へ →</button>
    </div>
  `;
}

function nextStep() {
  if (currentStep < protocols.length - 1) {
    resetTimer();
    currentStep++;
    displayStep();
  }
}

function previousStep() {
  if (currentStep > 0) {
    resetTimer();
    currentStep--;
    displayStep();
  }
}

function startTimer(minutes) {
  if (timerInterval) return;

  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  const display = document.getElementById('timer-display');

  if (!timerSeconds) {
    timerSeconds = minutes * 60;
  }

  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      playNotification();
      startBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;

  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  startBtn.style.display = 'inline-block';
  pauseBtn.style.display = 'none';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 0;

  const step = protocols[currentStep];
  if (step && step.duration_minutes) {
    document.getElementById('timer-display').textContent = `${step.duration_minutes}:00`;
  }

  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  if (startBtn) startBtn.style.display = 'inline-block';
  if (pauseBtn) pauseBtn.style.display = 'none';
}

function updateTimerDisplay() {
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const display = document.getElementById('timer-display');
  if (display) {
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function playNotification() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// グローバルスコープに登録（HTMLのonclick用）
window.nextStep = nextStep;
window.previousStep = previousStep;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;

// Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/android_app/protocol/sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// 初期化
loadProtocols();
