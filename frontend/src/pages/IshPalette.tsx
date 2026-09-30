import { useState, useEffect, useRef } from 'react';

import { supabase } from '../supabaseClient';
import './Timer.css'; // Reusing the same CSS for timers

// num はメーカープロトコル (ISHpalette® Short hairpin amplifier) の手順番号。
// 繰り返し洗浄など 1 手順を複数タイマーに分けた場合は同じ番号を共有する。
const protocolData = {
  "protocol_name": "ISHpalette",
  "days": [
    {
      "day": 1,
      "title": "1日目",
      "steps": [
        {
          "num": 1,
          "name": "切片の準備 (PBS)",
          "time_minutes": 5,
          "description": "凍結組織切片を乗せたスライドを用意し、PBS に室温で浸しコンパウンド等を除去する。"
        },
        {
          "num": 2,
          "name": "脱脂および透過処理 (メタノール)",
          "time_minutes": 10,
          "description": "メタノールにスライドを室温で浸し細胞膜の脱脂および透過処理を行う。"
        },
        {
          "num": 3,
          "name": "洗浄 (PBST) 1/2",
          "time_minutes": 5,
          "description": "PBSTにスライドを室温で浸し洗浄する。"
        },
        {
          "num": 3,
          "name": "洗浄 (PBST) 2/2",
          "time_minutes": 5,
          "description": "PBSTにスライドを室温で浸し洗浄する。"
        },
        {
          "num": 4,
          "name": "プレハイブリダイゼーション",
          "time_minutes": 5,
          "description": "室温に戻した Hybridization バッファーを切片一つ一つ覆うように100µL ずつ滴下し、パラフィルムを空気が入らないようにかぶせて湿潤箱で室温静置。"
        },
        {
          "num": 5,
          "name": "ターゲットプロ―ブ入りHybridization液の準備",
          "time_minutes": 0,
          "description": "Hybridizationバッファーは融解・攪拌しておく。プロ―ブ混合液1µMをHybridizationバッファー100µLに対し2µL加える(Final 約20nM)。95℃ 3 分間の熱変性を行い、攪拌して室温で静置。複数遺伝子の場合はすべてのプローブを同一バッファーに混合。(事前に調製も可)"
        },
        {
          "num": 6,
          "name": "Hybridization (37℃ overnight)",
          "time_minutes": 0,
          "description": "余分な液体を除き、プロ―ブ Hybridization 液を100µL ずつ滴下し、パラフィルムをかぶせる(スライドからはみ出さないサイズに)。湿潤箱に入れ37℃で一晩静置する。翌日の洗浄用 0.5×SSCT を一緒に 37℃に入れて保温しておく。"
        }
      ]
    },
    {
      "day": 2,
      "title": "2日目",
      "steps": [
        {
          "num": 7,
          "name": "ヘアピンDNAの熱処理",
          "time_minutes": 60,
          "description": "必要量を計算(2µL必要なら3µLを熱処理)。H1とH2を混ぜずに別々のPCR tubeでサーマルサイクラー処理。95℃ 2分 → 65℃まで徐冷(15分) → 25℃まで徐冷(40分)。熱処理中に 8, 9, 10 を行う。"
        },
        {
          "num": 8,
          "name": "Amplificationバッファーの準備",
          "time_minutes": 30,
          "description": "冷蔵庫から出し、室温で30分以上静置する(この間に 9, 10 を行う)。室温に戻ったら十分に攪拌する。濁りはミセル化によるもので問題なし。"
        },
        {
          "num": 9,
          "name": "洗浄 (0.5×SSCT, 37℃) 1/3",
          "time_minutes": 10,
          "description": "パラフィルムを剥がし、予め温めておいた 37℃の 0.5×SSCT で洗浄する。"
        },
        {
          "num": 9,
          "name": "洗浄 (0.5×SSCT, 37℃) 2/3",
          "time_minutes": 10,
          "description": "37℃の 0.5×SSCT で洗浄する。"
        },
        {
          "num": 9,
          "name": "洗浄 (0.5×SSCT, 37℃) 3/3",
          "time_minutes": 10,
          "description": "37℃の 0.5×SSCT で洗浄する。"
        },
        {
          "num": 10,
          "name": "プレHCR (Amplificationバッファー)",
          "time_minutes": 5,
          "description": "パップペンで組織の周りを囲い、室温に戻したAmplificationバッファーを乗せ、湿潤箱で室温(または25℃)で5分以上静置。"
        },
        {
          "num": 11,
          "name": "HCR反応液の作成",
          "time_minutes": 0,
          "description": "Amplificationバッファー100µLにH1およびH2をスライド1枚あたりそれぞれ2µLずつ加え(チップは交換)、vortex 3秒×3回でよく混合する。核染色が必要な場合は一緒に混合(Hoechst Final 1µg/mL)。"
        },
        {
          "num": 12,
          "name": "増感 HCR (25℃)",
          "time_minutes": 120,
          "description": "余分な液体を除き、反応液を混ぜてから可能な限り早く切片に滴下し、スライドを傾けてよく混合する。湿潤箱で25℃(または室温)で静置。反応時間は手順11で混ぜ始めてから2時間以内。(30分に1回以上傾けて混ぜる)"
        },
        {
          "num": 13,
          "name": "洗浄 (PBST, 37℃) 1/3",
          "time_minutes": 10,
          "description": "PBSTにスライドを浸し、37℃で洗浄する。"
        },
        {
          "num": 13,
          "name": "洗浄 (PBST, 37℃) 2/3",
          "time_minutes": 10,
          "description": "PBSTにスライドを浸し、37℃で洗浄する。"
        },
        {
          "num": 13,
          "name": "洗浄 (PBST, 37℃) 3/3",
          "time_minutes": 10,
          "description": "PBSTにスライドを浸し、37℃で洗浄する。"
        },
        {
          "num": 13,
          "name": "洗浄 (PBS, 室温)",
          "time_minutes": 5,
          "description": "PBSにスライドを浸し、室温で5分間以上洗浄する。"
        },
        {
          "num": 14,
          "name": "封入",
          "time_minutes": 0,
          "description": "蛍光退色防止の封入剤で封入し、観察および撮影まで4℃で保存(1週間程度は観察可能)。"
        }
      ]
    }
  ]
};

const STORAGE_KEY = 'ishPaletteTimerState';
const RECORDING_KEY = 'ishPaletteRecording';

export default function IshPalette() {
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [remaining, setRemaining] = useState(protocolData.days[0].steps[0].time_minutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showNotifBanner, setShowNotifBanner] = useState(false);
    
    const [isRecording, setIsRecording] = useState(() => {
        return localStorage.getItem(RECORDING_KEY) === 'true';
    });

    const toggleRecording = () => {
        setIsRecording(prev => {
            const next = !prev;
            localStorage.setItem(RECORDING_KEY, next.toString());
            return next;
        });
    };

    const timerRef = useRef<number | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCurrentDayIndex(parsed.day ?? 0);
                setCurrentStepIdx(parsed.step ?? 0);
                
                if (parsed.endTime) {
                    const now = Date.now();
                    if (parsed.endTime > now) {
                        setRemaining(Math.ceil((parsed.endTime - now) / 1000));
                        setIsRunning(true);
                        setIsPaused(false);
                    } else {
                        setRemaining(0);
                        setIsRunning(false);
                        setIsPaused(false);
                    }
                } else if (parsed.pausedRemaining !== null) {
                    setRemaining(parsed.pausedRemaining);
                    setIsRunning(false);
                    setIsPaused(true);
                } else {
                    setRemaining(protocolData.days[parsed.day ?? 0].steps[parsed.step ?? 0].time_minutes * 60);
                }
            } catch (e) {
                console.error('Failed to parse saved state', e);
            }
        }
    }, []);

    // Start timer interval automatically if it's running after state load or startTimer call
    useEffect(() => {
        if (isRunning && remaining > 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Calculate endTime based on current remaining time to prevent drift
            const endTime = Date.now() + remaining * 1000;
            
            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                day: currentDayIndex,
                step: currentStepIdx,
                endTime: endTime,
                pausedRemaining: null
            }));

            timerRef.current = window.setInterval(() => {
                const newRemaining = Math.ceil((endTime - Date.now()) / 1000);
                if (newRemaining <= 0) {
                    setRemaining(0);
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    setIsRunning(false);
                    setIsPaused(false);
                    const stepName = protocolData.days[currentDayIndex].steps[currentStepIdx]?.name || '';
                    playNotification(stepName);
                    handleNextStep(true);
                } else {
                    setRemaining(newRemaining);
                }
            }, 200);
        }
        
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, currentDayIndex, currentStepIdx]); // Depend on isRunning and indices to restart effect when they change

    // Request notification banner
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            setShowNotifBanner(true);
        }
    }, []);

    const requestNotifPermission = () => {
        Notification.requestPermission().then(() => {
            setShowNotifBanner(false);
        });
    };

    const showNotification = (stepName: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ISHpalette タイマー完了', {
                body: `「${stepName}」が終わりました`,
            });
        }
    };

    const playNotification = (stepName: string) => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.warn(e);
        }
        if (navigator.vibrate) navigator.vibrate([100, 80, 100, 80, 400]);
        showNotification(stepName);
    };

    const switchDay = (dayIndex: number) => {
        if (dayIndex === currentDayIndex) return;
        if (isRunning || isPaused) {
            if (!window.confirm("現在進行中（または一時停止中）のタイマーがあります。移動するとリセットされますがよろしいですか？")) {
                return;
            }
        }
        setCurrentDayIndex(dayIndex);
        setCurrentStepIdx(0);
        setRemaining(protocolData.days[dayIndex].steps[0].time_minutes * 60);
        setIsRunning(false);
        setIsPaused(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            day: dayIndex, step: 0, endTime: null, pausedRemaining: null
        }));
    };

    const jumpToStep = (idx: number) => {
        if (idx === currentStepIdx) return;
        if (isRunning || isPaused) {
            if (!window.confirm("現在進行中（または一時停止中）のタイマーがあります。移動するとリセットされますがよろしいですか？")) {
                return;
            }
        }
        setCurrentStepIdx(idx);
        setRemaining(protocolData.days[currentDayIndex].steps[idx].time_minutes * 60);
        setIsRunning(false);
        setIsPaused(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            day: currentDayIndex, step: idx, endTime: null, pausedRemaining: null
        }));
    };

    const toggleTimer = () => {
        if (isRunning) {
            // Pause
            setIsRunning(false);
            setIsPaused(true);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                day: currentDayIndex, step: currentStepIdx, endTime: null, pausedRemaining: remaining
            }));
        } else {
            // Start
            if (remaining <= 0) {
                handleNextStep();
                return;
            }
            setIsRunning(true);
            setIsPaused(false);
        }
    };

    const logStepToSupabase = async (dayIdx: number, stepIdx: number) => {
        if (!isRecording) return;
        try {
            if (dayIdx >= protocolData.days.length || stepIdx >= protocolData.days[dayIdx].steps.length) return;
            const step = protocolData.days[dayIdx].steps[stepIdx];
            const now = new Date();
            // Estimate started_at based on protocol duration. If it was paused, this is a rough estimate.
            const startedAt = new Date(now.getTime() - (step.time_minutes * 60 * 1000));
            
            await supabase.from('timer_logs').insert([{
                protocol_name: protocolData.protocol_name,
                day_number: dayIdx + 1,
                step_number: step.num,
                step_name: step.name,
                started_at: startedAt.toISOString(),
                completed_at: now.toISOString(),
                notes: ''
            }]);
        } catch (e) {
            console.error("Failed to log to Supabase", e);
        }
    };

    const handleNextStep = (autoStart = false) => {
        setIsRunning(false);
        setIsPaused(false);
        
        // Log current step before moving to next
        logStepToSupabase(currentDayIndex, currentStepIdx);
        
        setCurrentStepIdx(prev => {
            const nextIdx = prev + 1;
            const currentDaySteps = protocolData.days[currentDayIndex].steps;
            if (nextIdx < currentDaySteps.length) {
                const nextRemaining = currentDaySteps[nextIdx].time_minutes * 60;
                setRemaining(nextRemaining);
                
                if (autoStart && nextRemaining > 0) {
                    setTimeout(() => setIsRunning(true), 0);
                } else {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({
                        day: currentDayIndex, step: nextIdx, endTime: null, pausedRemaining: null
                    }));
                }
            } else {
                setRemaining(0);
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    day: currentDayIndex, step: nextIdx, endTime: null, pausedRemaining: null
                }));
            }
            return nextIdx;
        });
    };

    const currentDay = protocolData.days[currentDayIndex];
    const isCompleted = currentStepIdx >= currentDay.steps.length;
    const currentStepName = isCompleted ? "全工程完了！" : currentDay.steps[currentStepIdx].name;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeDisplay = isCompleted ? "--:--" : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    
    let btnLabel = 'START';
    if (isRunning) btnLabel = 'PAUSE';
    else if (isPaused) btnLabel = 'RESUME';

    return (
        <div className="timer-container-wrapper">
            <div className="timer-container">
                <a href="/android_app/home/#/" className="back-to-home">🏠 ホームへ戻る</a>
                <h2 style={{ color: '#9c27b0', borderBottomColor: '#f3e5f5' }}>ISHpalette® Timer</h2>

                <div className="record-banner" style={{
                    background: isRecording ? '#ffebee' : '#f5f5f5',
                    border: `1px solid ${isRecording ? '#ef5350' : '#e0e0e0'}`,
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        {isRecording ? (
                            <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>🔴 実験記録中... (自動保存)</span>
                        ) : (
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>※ 記録を開始すると完了した工程が保存されます</span>
                        )}
                    </div>
                    <button 
                        onClick={toggleRecording}
                        style={{
                            background: isRecording ? '#d32f2f' : '#1976d2',
                            padding: '6px 12px',
                            fontSize: '0.9rem'
                        }}
                    >
                        {isRecording ? '⏹️ 記録終了' : '▶️ 記録開始'}
                    </button>
                </div>

                {showNotifBanner && (
                    <div className="notifBanner">
                        <span>タイマー終了時に通知を受け取りますか？</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={requestNotifPermission} style={{ background: '#9c27b0' }}>許可する</button>
                            <button className="close" onClick={() => setShowNotifBanner(false)}>✕</button>
                        </div>
                    </div>
                )}

                <div className="day-tabs">
                    {protocolData.days.map((day, idx) => (
                        <div 
                            key={idx}
                            className={`day-tab ${currentDayIndex === idx ? 'active' : ''}`}
                            onClick={() => switchDay(idx)}
                            style={currentDayIndex === idx ? { borderColor: '#9c27b0', background: '#f3e5f5', color: '#9c27b0' } : {}}
                        >
                            {day.title}
                        </div>
                    ))}
                </div>

                <div className="timer-card" style={{ background: '#9c27b0' }}>
                    <div className="timeLeft">{timeDisplay}</div>
                    <div className="currentStepName">{currentStepName}</div>
                    <div className="controls">
                        <button className="btn-start" onClick={toggleTimer} disabled={isCompleted}>
                            {btnLabel}
                        </button>
                        <button className="btn-skip" onClick={() => handleNextStep()} disabled={isCompleted}>
                            NEXT
                        </button>
                    </div>
                </div>

                <div className="step-list">
                    {currentDay.steps.map((step, i) => {
                        let className = "step-item";
                        if (i === currentStepIdx) className += " active";
                        else if (i < currentStepIdx) className += " completed";

                        return (
                            <div key={i} className={className} onClick={() => jumpToStep(i)} style={i === currentStepIdx ? { borderLeftColor: '#9c27b0', color: '#9c27b0', background: '#f3e5f5' } : {}}>
                                <div className="step-num">{step.num}</div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {step.name}
                                        {step.time_minutes > 0 ? ` [${step.time_minutes}分]` : ''}
                                    </div>
                                    {step.description && <div className="note" style={{ color: '#666', marginTop: 4 }}>{step.description}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
