import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

import './Protocol.css';

// Types
interface ProtocolStep {
  id: string;
  section_number: number;
  section_title: string;
  step_number: number;
  step_title: string;
  description?: string;
  notes?: string;
  duration_minutes?: number;
}

interface Section {
  section_number: number;
  section_title: string;
  steps: ProtocolStep[];
  total_duration: number;
}

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/1VxNshvXzE5QqtxSh64DxXJLQgIA5bydAB8Vm0ekfHpg/formResponse';
const FORM_ENTRIES = {
  count_1: 'entry.965089671',
  count_2: 'entry.766252459',
  cell_count: 'entry.76098497',
  notes: 'entry.1858207442',
  dish_size: 'entry.1802548858'
};

export default function Protocol() {
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [totalTimerSeconds, setTotalTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Calculator state
  const [dishSize, setDishSize] = useState('60');
  const [count1, setCount1] = useState('');
  const [count2, setCount2] = useState('');
  const [notes, setNotes] = useState('');
  const [hasUnsavedData, setHasUnsavedData] = useState(false);

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('section_number', { ascending: true })
        .order('step_number', { ascending: true });

      if (error) throw error;

      const grouped = (data as ProtocolStep[]).reduce((acc, step) => {
        if (!acc[step.section_number]) {
          acc[step.section_number] = {
            section_number: step.section_number,
            section_title: step.section_title,
            steps: [],
            total_duration: 0
          };
        }
        acc[step.section_number].steps.push(step);
        if (step.duration_minutes) {
          acc[step.section_number].total_duration += step.duration_minutes;
        }
        return acc;
      }, {} as Record<number, Section>);

      setSections(Object.values(grouped));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex === 5 && hasUnsavedData) {
      if (!window.confirm('未保存のデータがあります。移動しますか？')) return;
    }
    resetTimer();
    setCurrentSectionIndex(prev => prev + 1);
    if (currentSectionIndex + 1 === 5) setHasUnsavedData(false); // Entering section 6
  };

  const handlePrev = () => {
    if (currentSectionIndex === 5 && hasUnsavedData) {
      if (!window.confirm('未保存のデータがあります。移動しますか？')) return;
    }
    resetTimer();
    setCurrentSectionIndex(prev => prev - 1);
    if (currentSectionIndex - 1 === 5) setHasUnsavedData(false);
  };

  // Timer logic
  const startTimer = async (minutes: number) => {
    if (isTimerRunning) return;

    if (timerSeconds === 0) {
      setTimerSeconds(minutes * 60);
      setTotalTimerSeconds(minutes * 60);
    }

    setIsTimerRunning(true);

    if ('wakeLock' in navigator) {
      try {
        await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Wake Lock failed:', err);
      }
    }

    timerRef.current = window.setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setIsTimerRunning(false);
          playNotification();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTotalTimerSeconds(0);
  };

  const playNotification = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  };

  // Calculator logic
  useEffect(() => {
    if (count1 && count2) {
      setHasUnsavedData(true);
    } else {
      setHasUnsavedData(false);
    }
  }, [count1, count2]);

  const saveCellCount = async (avgValue: number, cellCountPerMl: number, volumeUl: number) => {
    if (!count1 || !count2) {
      alert('計測値を両方入力してください');
      return;
    }

    try {
      const formParams = new URLSearchParams();
      formParams.append(FORM_ENTRIES.count_1, count1);
      formParams.append(FORM_ENTRIES.count_2, count2);
      formParams.append(FORM_ENTRIES.cell_count, avgValue.toString());
      formParams.append(FORM_ENTRIES.notes, notes);
      formParams.append(FORM_ENTRIES.dish_size, dishSize + 'mm');

      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        body: formParams,
        mode: 'no-cors'
      });

      const { error } = await supabase.from('experiment_logs').insert({
        count_1: parseFloat(count1),
        count_2: parseFloat(count2),
        counted_value_mean: avgValue,
        cell_count: cellCountPerMl,
        notes: notes,
        dish_size: dishSize + 'mm'
      });

      if (error) console.warn('Supabase backup failed', error);

      alert(`ログを保存しました:\n${(cellCountPerMl / 100000).toFixed(2)} × 10^5 cells/mL\n必要体積: ${volumeUl.toFixed(1)} μL`);
      setHasUnsavedData(false);
    } catch (err: any) {
      alert('ログ保存に失敗しました: ' + err.message);
    }
  };

  if (error) return <div className="error">Error: {error}</div>;
  if (sections.length === 0) return <div className="loading">Loading protocols...</div>;

  const currentSection = sections[currentSectionIndex];
  const totalDuration = currentSection.total_duration || 0;
  
  // Timer formatting
  const displayTimerSeconds = timerSeconds > 0 ? timerSeconds : totalDuration * 60;
  const m = Math.floor(displayTimerSeconds / 60);
  const s = displayTimerSeconds % 60;
  
  const elapsedSeconds = totalTimerSeconds > 0 ? totalTimerSeconds - timerSeconds : 0;
  const em = Math.floor(elapsedSeconds / 60);
  const es = elapsedSeconds % 60;

  // Calculator calculations
  const v1 = parseFloat(count1);
  const v2 = parseFloat(count2);
  let calcResult = null;

  if (v1 > 0 && v2 > 0) {
    const avgValue = (v1 + v2) / 2;
    const cellCountPerMl = avgValue * 100000;
    const targetCells = dishSize === '60' ? 100000 : 277778;
    const minAvgValue = dishSize === '60' ? 1.0 : 2.78;
    const volumeUl = (targetCells / cellCountPerMl) * 1000;

    calcResult = { avgValue, cellCountPerMl, minAvgValue, volumeUl };
  }

  return (
    <div className="protocol-container">
      <a href="?app=home#/" className="back-to-home">🏠 ホームへ戻る</a>
      <div className="navigation-buttons top-nav">
        <button onClick={handlePrev} disabled={currentSectionIndex === 0}>← 前へ</button>
        <button onClick={handleNext} disabled={currentSectionIndex === sections.length - 1}>次へ →</button>
      </div>

      <div className="section-header">
        <h1>セクション {currentSection.section_number}: {currentSection.section_title}</h1>
      </div>

      <div className="steps-list">
        {currentSection.steps.map(step => (
          <div key={step.id || step.step_number} className="step-item">
            <h3>ステップ {step.step_number}: {step.step_title}</h3>
            {step.description && <p className="description">{step.description}</p>}
            {step.notes && <div className="notes">📝 {step.notes}</div>}
          </div>
        ))}
      </div>

      {currentSection.section_number === 6 && (
        <div className="calculator-section">
          <h3>細胞数計算機</h3>
          <div className="calculator-form">
            <div className="form-group">
              <label>シャーレサイズ</label>
              <select value={dishSize} onChange={e => setDishSize(e.target.value)}>
                <option value="100">100mm (面積: 78.5 cm² / 播種目標: 27.8万個)</option>
                <option value="60">60mm (面積: 28.26 cm² / 播種目標: 10万個)</option>
              </select>
            </div>
            <div className="form-group">
              <label>計測1（×10<sup>5</sup>）</label>
              <input type="number" value={count1} onChange={e => setCount1(e.target.value)} placeholder="例: 120" step="0.1" />
            </div>
            <div className="form-group">
              <label>計測2（×10<sup>5</sup>）</label>
              <input type="number" value={count2} onChange={e => setCount2(e.target.value)} placeholder="例: 110" step="0.1" />
            </div>

            {calcResult && (
              <div className="result-display">
                <p>平均計数値: <span>{calcResult.avgValue.toFixed(2)}</span></p>
                <p>細胞数: {(calcResult.cellCountPerMl / 100000).toFixed(2)} × 10<sup>5</sup> cells/mL</p>
                <p className="volume-result" style={{
                  backgroundColor: calcResult.avgValue < calcResult.minAvgValue ? '#ffe0b2' : '#fff9c4',
                  color: calcResult.avgValue < calcResult.minAvgValue ? '#e65100' : '#f57f17'
                }}>
                  {dishSize}mm播種に必要な体積: {calcResult.avgValue < calcResult.minAvgValue 
                    ? '播種に充分な細胞数ではありません' 
                    : `${calcResult.volumeUl.toFixed(1)} μL`}
                </p>
                <div className="form-group">
                  <label>メモ（任意）</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="実験の備考などを入力" rows={2} />
                </div>
                <button onClick={() => saveCellCount(calcResult!.avgValue, calcResult!.cellCountPerMl, calcResult!.volumeUl)} className="save-btn">
                  ログに保存
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {totalDuration > 0 && (
        <div className="timer-section">
          <p className="timer-label">セクション作業時間</p>
          <div className="timer-display">
            {m}:{s.toString().padStart(2, '0')}
          </div>
          <p className="elapsed-time">経過: {em}:{es.toString().padStart(2, '0')}</p>
          <div className="timer-buttons">
            {!isTimerRunning ? (
              <button onClick={() => startTimer(totalDuration)}>開始</button>
            ) : (
              <button onClick={pauseTimer}>一時停止</button>
            )}
            <button onClick={() => resetTimer()}>リセット</button>
          </div>
        </div>
      )}

      <div className="section-progress">
        <p>{currentSectionIndex + 1} / {sections.length}</p>
      </div>

      <div className="navigation-buttons">
        <button onClick={handlePrev} disabled={currentSectionIndex === 0}>← 前へ</button>
        <button onClick={handleNext} disabled={currentSectionIndex === sections.length - 1}>次へ →</button>
      </div>
    </div>
  );
}
