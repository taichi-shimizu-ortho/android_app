// Supabase初期化
const SUPABASE_URL = 'https://zfuklmuilcejinkzfimq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yB7PtClaSDoX7S074E1wLA_KoEpg5uN';

let sections = [];
let currentSection = 0;
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

    const protocols = await response.json();
    sections = groupBySection(protocols);
    currentSection = 0;
    displaySection();
  } catch (error) {
    console.error('Error loading protocols:', error);
    document.getElementById('step-container').innerHTML =
      `<p style="color: red;">エラー: ${error.message}<br/>コンソールを確認してください</p>`;
  }
}

function groupBySection(protocols) {
  const grouped = {};
  protocols.forEach(protocol => {
    if (!grouped[protocol.section_number]) {
      grouped[protocol.section_number] = {
        section_number: protocol.section_number,
        section_title: protocol.section_title,
        steps: [],
        total_duration: 0
      };
    }
    grouped[protocol.section_number].steps.push(protocol);
    if (protocol.duration_minutes) {
      grouped[protocol.section_number].total_duration += protocol.duration_minutes;
    }
  });
  return Object.values(grouped);
}

function displaySection() {
  if (sections.length === 0) return;

  const section = sections[currentSection];
  const container = document.getElementById('step-container');
  const totalDuration = section.total_duration || 0;

  const stepsHtml = section.steps.map((step, idx) => `
    <div class="step-item">
      <h3>ステップ ${step.step_number}: ${step.step_title}</h3>
      ${step.description ? `<p class="description">${step.description}</p>` : ''}
      ${step.notes ? `<div class="notes">📝 ${step.notes}</div>` : ''}
    </div>
  `).join('');

  // セクション6（細胞数カウント）に計算機を追加
  const calculatorHtml = section.section_number === 6 ? `
    <div class="calculator-section">
      <h3>細胞数計算機</h3>
      <div class="calculator-form">
        <div class="form-group">
          <label>計数値</label>
          <input type="number" id="counted-value" placeholder="例: 120" step="0.1">
        </div>
        <div class="form-group">
          <label>希釈倍率</label>
          <input type="number" id="dilution-ratio" placeholder="例: 2" step="0.1">
        </div>
        <div class="form-group">
          <label>計算式: 計数値 × 希釈倍率 × 10^4</label>
          <button onclick="calculateCellCount()" class="calculate-btn">計算</button>
        </div>
        <div id="result-display" class="result-display" style="display:none;">
          <p>細胞数: <span id="result-value"></span> × 10<sup>5</sup> cells/mL</p>
          <button onclick="saveCellCount()" class="save-btn">ログに保存</button>
        </div>
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="section-header">
      <h1>セクション ${section.section_number}: ${section.section_title}</h1>
    </div>

    <div class="steps-list">
      ${stepsHtml}
    </div>

    ${calculatorHtml}

    <div class="timer-section" ${totalDuration ? '' : 'style="display:none;"'}>
      <p class="timer-label">セクション作業時間</p>
      <div class="timer-display" id="timer-display">
        ${totalDuration}:00
      </div>
      <div class="timer-buttons">
        <button id="timer-start" onclick="startTimer(${totalDuration})">開始</button>
        <button id="timer-pause" onclick="pauseTimer()" style="display:none;">一時停止</button>
        <button id="timer-reset" onclick="resetTimer(${totalDuration})">リセット</button>
      </div>
    </div>

    <div class="section-progress">
      <p>${currentSection + 1} / ${sections.length}</p>
    </div>

    <div class="navigation-buttons">
      <button onclick="previousSection()" ${currentSection === 0 ? 'disabled' : ''}>← 前へ</button>
      <button onclick="nextSection()" ${currentSection === sections.length - 1 ? 'disabled' : ''}>次へ →</button>
    </div>
  `;
}

function nextSection() {
  if (currentSection < sections.length - 1) {
    resetTimer();
    currentSection++;
    displaySection();
  }
}

function previousSection() {
  if (currentSection > 0) {
    resetTimer();
    currentSection--;
    displaySection();
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

function resetTimer(minutes) {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 0;

  const section = sections[currentSection];
  const duration = minutes || (section && section.total_duration) || 0;
  if (duration > 0) {
    document.getElementById('timer-display').textContent = `${duration}:00`;
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

function calculateCellCount() {
  const countedValue = parseFloat(document.getElementById('counted-value').value);
  const dilutionRatio = parseFloat(document.getElementById('dilution-ratio').value);

  if (!countedValue || !dilutionRatio || countedValue <= 0 || dilutionRatio <= 0) {
    alert('計数値と希釈倍率を正しく入力してください');
    return;
  }

  // 計算: 計数値 × 希釈倍率 × 10^4
  const cellCount = (countedValue * dilutionRatio * 10000) / 100000; // ÷10^5 で10^5単位に変換

  document.getElementById('result-value').textContent = cellCount.toFixed(2);
  document.getElementById('result-display').style.display = 'block';

  // グローバル変数に保存（保存時に使用）
  window.currentCellCount = cellCount;
  window.currentCountedValue = countedValue;
  window.currentDilutionRatio = dilutionRatio;
}

async function saveCellCount() {
  if (!window.currentCellCount) {
    alert('先に計算を実行してください');
    return;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/experiment_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cell_count: window.currentCellCount,
          counted_value: window.currentCountedValue,
          dilution_ratio: window.currentDilutionRatio
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    alert(`ログを保存しました: ${window.currentCellCount.toFixed(2)} × 10^5 cells/mL`);

    // フォームをリセット
    document.getElementById('counted-value').value = '';
    document.getElementById('dilution-ratio').value = '';
    document.getElementById('result-display').style.display = 'none';
    window.currentCellCount = null;
  } catch (error) {
    console.error('Error saving cell count:', error);
    alert('ログ保存に失敗しました');
  }
}

// グローバルスコープに登録（HTMLのonclick用）
window.nextSection = nextSection;
window.previousSection = previousSection;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.calculateCellCount = calculateCellCount;
window.saveCellCount = saveCellCount;

// Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/android_app/protocol/sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// 初期化
loadProtocols();
