import { useState, useEffect, useRef } from 'react';

import './Timer.css';

const protocols = [
    // ── 一日目 ──────────────────────────────────────
    [
        { name: "脱パラ・DDW", time: 0 },
        { name: "PBS洗浄", time: 10 * 60 },
        { name: "マイクロウェーブ (クエン酸バッファー)", time: 15 * 60, note: "液量注意" },
        { name: "冷却 (庫内)", time: 15 * 60 },
        { name: "冷却 (庫外)", time: 15 * 60 },
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "一次抗体 RXFP1", time: 0, note: "1:500 Blocking Buffer希釈・4℃ overnight / negative controlはBufferのみ" }
    ],

    // ── 二日目 ──────────────────────────────────────
    [
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "二次抗体 Poly HRP (Rabbit)", time: 30 * 60, note: "希釈不要・室温" },
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "チラミド増感 488", time: 10 * 60, note: "ワーキングソリューション・暗所・室温" },
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "ストリッピング (マイクロウェーブ)", time: 15 * 60, note: "クエン酸バッファー・液量注意" },
        { name: "冷却 (庫内)", time: 15 * 60 },
        { name: "冷却 (庫外)", time: 15 * 60 },
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "一次抗体 vimentin", time: 0, note: "1:500 Blocking Buffer希釈・4℃ overnight / negative controlはBufferのみ" }
    ],

    // ── 三日目 ──────────────────────────────────────
    [
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "二次抗体 Poly HRP (Rabbit)", time: 30 * 60, note: "希釈不要・室温" },
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "チラミド増感 555", time: 10 * 60, note: "ワーキングソリューション・暗所・室温" },
        ...Array(3).fill(null).map((_, i) => ({ name: `PBS洗浄 (${i+1}/3)`, time: 10 * 60 })),
        { name: "封入", time: 0 }
    ]
];

export default function Timer() {
    const [currentDay, setCurrentDay] = useState(0);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [remaining, setRemaining] = useState(protocols[0][0].time);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showNotifBanner, setShowNotifBanner] = useState(false);
    
    const timerRef = useRef<number | null>(null);

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
            new Notification('IHC タイマー完了', {
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

    const switchDay = (day: number) => {
        if (day === currentDay) return;
        if (isRunning || isPaused) {
            if (!window.confirm("現在進行中（または一時停止中）のタイマーがあります。移動するとリセットされますがよろしいですか？")) {
                return;
            }
        }
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCurrentDay(day);
        setCurrentIdx(0);
        setRemaining(protocols[day][0].time);
        setIsRunning(false);
        setIsPaused(false);
    };

    const jumpToStep = (idx: number) => {
        if (idx === currentIdx) return;
        if (isRunning || isPaused) {
            if (!window.confirm("現在進行中（または一時停止中）のタイマーがあります。移動するとリセットされますがよろしいですか？")) {
                return;
            }
        }
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setCurrentIdx(idx);
        setRemaining(protocols[currentDay][idx].time);
        setIsRunning(false);
        setIsPaused(false);
    };

    const toggleTimer = () => {
        if (isRunning) {
            // Pause
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setIsRunning(false);
            setIsPaused(true);
        } else {
            // Start
            startTimer();
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (remaining <= 0) {
            handleNextStep();
            return;
        }
        setIsRunning(true);
        setIsPaused(false);
        const endTime = Date.now() + remaining * 1000;
        
        timerRef.current = window.setInterval(() => {
            const newRemaining = Math.ceil((endTime - Date.now()) / 1000);
            if (newRemaining <= 0) {
                setRemaining(0);
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = null;
                setIsRunning(false);
                setIsPaused(false);
                const stepName = protocols[currentDay][currentIdx]?.name || '';
                playNotification(stepName);
                handleNextStep(true);
            } else {
                setRemaining(newRemaining);
            }
        }, 200);
    };

    const handleNextStep = (autoStart = false) => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRunning(false);
        setIsPaused(false);
        
        setCurrentIdx(prev => {
            const nextIdx = prev + 1;
            if (nextIdx < protocols[currentDay].length) {
                setRemaining(protocols[currentDay][nextIdx].time);
                if (autoStart && protocols[currentDay][nextIdx].time > 0) {
                    setTimeout(() => startTimer(), 0);
                }
            } else {
                setRemaining(0);
            }
            return nextIdx;
        });
    };

    const protocol = protocols[currentDay];
    const isCompleted = currentIdx >= protocol.length;
    const currentStepName = isCompleted ? "全工程完了！" : protocol[currentIdx].name;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const timeDisplay = isCompleted ? "--:--" : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    
    let btnLabel = 'START';
    if (isRunning) btnLabel = 'PAUSE';
    else if (isPaused) btnLabel = 'RESUME';

    return (
        <div className="timer-container-wrapper">
            <div className="timer-container">
                <a href="?app=home#/" className="back-to-home">🏠 ホームへ戻る</a>
                <h2>IHC 二重染色</h2>

                {showNotifBanner && (
                    <div className="notifBanner">
                        <span>タイマー終了時に通知を受け取りますか？</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={requestNotifPermission}>許可する</button>
                            <button className="close" onClick={() => setShowNotifBanner(false)}>✕</button>
                        </div>
                    </div>
                )}

                <div className="day-tabs">
                    {[0, 1, 2].map(day => (
                        <div 
                            key={day}
                            className={`day-tab ${currentDay === day ? 'active' : ''}`}
                            onClick={() => switchDay(day)}
                        >
                            {day === 0 ? '一日目' : day === 1 ? '二日目' : '三日目'}
                        </div>
                    ))}
                </div>

                <div className="timer-card">
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
                    {protocol.map((step, i) => {
                        let className = "step-item";
                        if (i === currentIdx) className += " active";
                        else if (i < currentIdx) className += " completed";

                        return (
                            <div key={i} className={className} onClick={() => jumpToStep(i)}>
                                <div className="step-num">{i + 1}</div>
                                <div>
                                    <div>{step.name}{step.time > 0 ? ` [${step.time / 60}分]` : ''}</div>
                                    {step.note && <div className="note">※ {step.note}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
