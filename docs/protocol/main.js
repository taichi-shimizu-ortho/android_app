// Supabase 設定
const SUPABASE_URL = 'https://zfuklmuilcejinkzfimq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yB7PtClaSDoX7S074E1wLA_KoEpg5uN';

// Google Forms 設定
const GOOGLE_FORM_ID = '1VxNshvXzE5QqtxSh64DxXJLQgIA5bydAB8Vm0ekfHpg';
const GOOGLE_FORM_URL = `https://docs.google.com/forms/d/${GOOGLE_FORM_ID}/formResponse`;
const FORM_ENTRIES = {
  count_1: 'entry.965089671',
  count_2: 'entry.766252459',
  cell_count: 'entry.76098497', // 平均細胞数（×10^5）
  density: 'entry.1236607395',
  notes: 'entry.1858207442'
};

let sections = [];
let currentSection = 0;
let timerInterval = null;
let timerSeconds = 0;
let totalTimerSeconds = 0;
let hasUnsavedDataInSection6 = false;

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

  // セクション6に移動したときにフラグをリセット
  if (section.section_number === 6) {
    hasUnsavedDataInSection6 = false;
  }

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
          <label>計測1（×10<sup>5</sup>）</label>
          <input type="number" id="counted-value-1" placeholder="例: 120" step="0.1" onchange="autoCellCount()" oninput="autoCellCount()">
        </div>
        <div class="form-group">
          <label>計測2（×10<sup>5</sup>）</label>
          <input type="number" id="counted-value-2" placeholder="例: 110" step="0.1" onchange="autoCellCount()" oninput="autoCellCount()">
        </div>
        <div id="result-display" class="result-display" style="display:none;">
          <p>平均計数値: <span id="avg-value"></span></p>
          <p id="cell-count-display"></p>
          <p id="cell-density-display" style="display:none;"></p>
          <p class="volume-result">播種に必要な体積: <span id="volume-value"></span> μL</p>
          <div class="form-group">
            <label>メモ（任意）</label>
            <textarea id="notes-input" placeholder="実験の備考などを入力" rows="2"></textarea>
          </div>
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
      <p class="elapsed-time" id="elapsed-time">経過: 0:00</p>
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
    // セクション6からの移動時に未保存データがあれば警告
    if (currentSection === 5 && hasUnsavedDataInSection6) {
      if (!confirm('未保存のデータがあります。移動しますか？')) {
        return;
      }
    }
    resetTimer();
    currentSection++;
    displaySection();
  }
}

function previousSection() {
  if (currentSection > 0) {
    // セクション6からの移動時に未保存データがあれば警告
    if (currentSection === 5 && hasUnsavedDataInSection6) {
      if (!confirm('未保存のデータがあります。移動しますか？')) {
        return;
      }
    }
    resetTimer();
    currentSection--;
    displaySection();
  }
}

async function startTimer(minutes) {
  if (timerInterval) return;

  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  const display = document.getElementById('timer-display');

  if (!timerSeconds) {
    timerSeconds = minutes * 60;
    totalTimerSeconds = minutes * 60;
  }

  startBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-block';

  // Android スリープ抑制
  if ('wakeLock' in navigator) {
    try {
      await navigator.wakeLock.request('screen');
    } catch (err) {
      console.warn('Wake Lock failed:', err);
    }
  }

  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    updateElapsedTime();

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
  totalTimerSeconds = 0;

  const section = sections[currentSection];
  const duration = minutes || (section && section.total_duration) || 0;
  if (duration > 0) {
    document.getElementById('timer-display').textContent = `${duration}:00`;
    document.getElementById('elapsed-time').textContent = '経過: 0:00';
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

function updateElapsedTime() {
  const elapsedSeconds = totalTimerSeconds - timerSeconds;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const display = document.getElementById('elapsed-time');
  if (display) {
    display.textContent = `経過: ${minutes}:${seconds.toString().padStart(2, '0')}`;
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

function autoCellCount() {
  const value1 = parseFloat(document.getElementById('counted-value-1').value);
  const value2 = parseFloat(document.getElementById('counted-value-2').value);

  // 両方入力されていない場合は表示しない
  if (!value1 || !value2 || value1 <= 0 || value2 <= 0) {
    document.getElementById('result-display').style.display = 'none';
    hasUnsavedDataInSection6 = false;
    return;
  }

  // データが入力されている場合、未保存フラグを設定
  hasUnsavedDataInSection6 = true;

  // 平均計数値
  const avgValue = (value1 + value2) / 2;

  // 計算式: 平均 × 10^5 = 細胞数/mL
  const cellCountPerMl = avgValue * 100000;
  const cellCountPerMlHundredThousand = cellCountPerMl / 100000; // × 10^5 単位に変換

  // 25万個に必要な体積(uL) = 250000 / (細胞数/mL) × 1000
  const volumeUl = (250000 / cellCountPerMl) * 1000;

  // 100mm シャーレの密度計算
  const dishArea = 78.5; // cm²
  const cellDensityPerCm2 = cellCountPerMl / dishArea; // cells/cm²
  const cellDensityRounded = Math.round(cellDensityPerCm2); // 四捨五入

  // 表示（有効数字3桁）
  document.getElementById('avg-value').textContent = avgValue.toFixed(2);

  // すべてのケースで密度を表示
  document.getElementById('cell-count-display').innerHTML =
    `細胞数: ${cellCountPerMlHundredThousand.toFixed(2)} × 10<sup>5</sup> cells/mL`;
  document.getElementById('cell-density-display').innerHTML =
    `密度: ${cellDensityRounded} cells/cm²`;
  document.getElementById('cell-density-display').style.display = 'block';

  // 平均値 < 2.5（25万個未満）の場合
  if (avgValue < 2.5) {
    document.getElementById('volume-value').textContent = '播種に充分な細胞数ではありません';
    document.getElementById('volume-value').parentElement.style.backgroundColor = '#ffe0b2';
    document.getElementById('volume-value').parentElement.style.color = '#e65100';
  } else {
    document.getElementById('volume-value').textContent = volumeUl.toFixed(1);
    document.getElementById('volume-value').parentElement.style.backgroundColor = '#fff9c4';
    document.getElementById('volume-value').parentElement.style.color = '#f57f17';
  }
  document.getElementById('result-display').style.display = 'block';

  // グローバル変数に保存（保存時に使用）
  window.currentCellCount = cellCountPerMlHundredThousand;
  window.currentCountedValue1 = value1;
  window.currentCountedValue2 = value2;
  window.currentAvgValue = avgValue;
  window.currentVolumeUl = volumeUl;
}

async function saveCellCount() {
  const value1 = parseFloat(document.getElementById('counted-value-1').value);
  const value2 = parseFloat(document.getElementById('counted-value-2').value);

  if (!value1 || !value2 || value1 <= 0 || value2 <= 0) {
    alert('計測値を両方入力してください');
    return;
  }

  const avgValue = (value1 + value2) / 2;
  const cellCountPerMl = avgValue * 100000;
  const cellCountPerMlHundredThousand = cellCountPerMl / 100000;
  const volumeUl = (250000 / cellCountPerMl) * 1000;
  const dishArea = 78.5;
  const cellDensityPerCm2 = cellCountPerMl / dishArea;
  const cellDensityDisplay = Math.round(cellDensityPerCm2);
  const notesInput = document.getElementById('notes-input').value || '';

  try {
    console.log('Saving to Google Forms and Supabase:', {
      count_1: value1,
      count_2: value2,
      density: cellDensityDisplay,
      notes: notesInput
    });

    // Google Forms に送信
    const formData = new FormData();
    formData.append(FORM_ENTRIES.count_1, value1);
    formData.append(FORM_ENTRIES.count_2, value2);
    formData.append(FORM_ENTRIES.cell_count, avgValue); // 平均細胞数（×10^5）
    formData.append(FORM_ENTRIES.density, cellDensityDisplay);
    formData.append(FORM_ENTRIES.notes, notesInput);

    const formResponse = await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });

    console.log('Google Forms submission completed');

    // Supabase にもバックアップで送信
    const supabaseResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/experiment_logs`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          count_1: value1,
          count_2: value2,
          counted_value_mean: avgValue,
          cell_count: cellCountPerMl,
          density: cellDensityDisplay,
          notes: notesInput
        })
      }
    );

    if (!supabaseResponse.ok) {
      console.warn('Supabase backup failed, but Google Forms saved successfully');
    } else {
      console.log('Supabase backup saved successfully');
    }

    alert(`ログを保存しました:\n${cellCountPerMlHundredThousand.toFixed(2)} × 10^5 cells/mL\n必要体積: ${volumeUl.toFixed(1)} μL`);

    // フォームと計算結果はそのまま表示（クリアしない）
    // 未保存フラグをリセット
    hasUnsavedDataInSection6 = false;
  } catch (error) {
    console.error('Error saving cell count:', error);
    alert('ログ保存に失敗しました: ' + error.message);
  }
}

// グローバルスコープに登録（HTMLのonclick用）
window.nextSection = nextSection;
window.previousSection = previousSection;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.autoCellCount = autoCellCount;
window.saveCellCount = saveCellCount;

// Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/android_app/protocol/sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// 初期化
loadProtocols();
