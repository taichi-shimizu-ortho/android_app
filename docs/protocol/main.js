// Google Sheets 設定
const CLIENT_ID = '933170879377-cu87tlo4b90q7gkojq2duha0a7tmnpm4.apps.googleusercontent.com';
const PROTOCOLS_SHEET_ID = '1hVMUM2rm1wxcmaAa0u_agym87aBT34K1fPBePYWB7ag';
const EXPERIMENT_LOGS_SHEET_ID = '1x1nRhXyxEky-Zdm34BMwphoONvCc1BsyoKWWJa_Dv_w';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let sections = [];
let currentSection = 0;
let timerInterval = null;
let timerSeconds = 0;
let totalTimerSeconds = 0;
let gapi_loaded = false;
let auth_instance = null;

async function loadProtocols() {
  try {
    if (!gapi_loaded) {
      throw new Error('Google API がまだ読み込まれていません');
    }

    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: PROTOCOLS_SHEET_ID,
      range: 'protocols!A2:I1000'
    });

    const rows = response.result.values || [];
    if (rows.length === 0) {
      throw new Error('プロトコルデータが見つかりません');
    }

    const protocols = rows.map(row => ({
      id: row[0],
      section_number: parseInt(row[1]),
      section_title: row[2],
      step_number: parseInt(row[3]),
      step_title: row[4],
      description: row[5],
      duration_minutes: parseInt(row[6]) || 0,
      notes: row[7],
      created_at: row[8]
    }));

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
    return;
  }

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
  const timestamp = new Date().toISOString();

  try {
    if (!gapi_loaded) {
      throw new Error('Google API がまだ読み込まれていません');
    }

    const response = await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: EXPERIMENT_LOGS_SHEET_ID,
      range: 'experiment_logs!A2:G2',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[
          '',
          timestamp,
          value1,
          value2,
          avgValue,
          cellCountPerMl,
          notesInput,
          cellDensityDisplay
        ]]
      }
    });

    alert(`ログを保存しました:\n${cellCountPerMlHundredThousand.toFixed(2)} × 10^5 cells/mL\n必要体積: ${volumeUl.toFixed(1)} μL`);

    document.getElementById('counted-value-1').value = '';
    document.getElementById('counted-value-2').value = '';
    document.getElementById('notes-input').value = '';
    document.getElementById('result-display').style.display = 'none';
    window.currentCellCount = null;
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

// Google API 初期化
function initializeGoogleAPI() {
  if (typeof gapi === 'undefined') {
    console.error('gapi not loaded');
    document.getElementById('step-container').innerHTML =
      `<p style="color: red;">Google API スクリプトが読み込まれていません</p>`;
    return;
  }

  gapi.load('client:auth2', async () => {
    try {
      console.log('Initializing Google API with CLIENT_ID:', CLIENT_ID);

      await gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
      });

      console.log('Google API initialized successfully');
      auth_instance = gapi.auth2.getAuthInstance();
      gapi_loaded = true;

      // ユーザーがサインインしているかチェック
      if (!auth_instance.isSignedIn.get()) {
        console.log('User not signed in, attempting auto sign-in');
        try {
          await auth_instance.signIn();
          console.log('Auto sign-in successful');
        } catch (err) {
          console.warn('Auto sign-in failed:', err);
          document.getElementById('step-container').innerHTML =
            `<p style="color: red;">Google サインインが必要です<br/>ページをリロードして再度サインインしてください<br/>エラー: ${err.message}</p>`;
          return;
        }
      } else {
        console.log('User already signed in');
      }

      loadProtocols();
    } catch (error) {
      console.error('Google API initialization failed:', error);
      document.getElementById('step-container').innerHTML =
        `<p style="color: red;">Google API 初期化エラー: ${error.message}<br/>コンソール(F12)を確認してください</p>`;
    }
  });
}

// Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/android_app/protocol/sw.js').catch(err => {
    console.warn('Service Worker registration failed:', err);
  });
}

// Google API 初期化
initializeGoogleAPI();
