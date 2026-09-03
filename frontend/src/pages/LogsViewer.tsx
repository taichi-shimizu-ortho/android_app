import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './LogsViewer.css';

interface ExperimentLog {
    id: string;
    created_at: string;
    count_1: number;
    count_2: number;
    counted_value_mean: number;
    cell_count: number;
    dish_size: string;
    notes: string;
}

interface TimerLog {
    id: string;
    created_at: string;
    protocol_name: string;
    day_number: number;
    step_number: number;
    step_name: string;
    started_at: string;
    completed_at: string;
    notes: string;
}

export default function LogsViewer() {
    const [activeTab, setActiveTab] = useState<'msc' | 'timers'>('msc');
    const [mscLogs, setMscLogs] = useState<ExperimentLog[]>([]);
    const [timerLogs, setTimerLogs] = useState<TimerLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const [mscRes, timerRes] = await Promise.all([
                supabase.from('experiment_logs').select('*').order('created_at', { ascending: false }).limit(50),
                supabase.from('timer_logs').select('*').order('created_at', { ascending: false }).limit(50)
            ]);
            
            if (mscRes.data) setMscLogs(mscRes.data);
            if (timerRes.data) setTimerLogs(timerRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoStr: string) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        return d.toLocaleString('ja-JP', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };
    
    const formatTimeOnly = (isoStr: string) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="logs-container">
            <header className="logs-header">
                <Link to="/" className="back-link">🏠 戻る</Link>
                <h2>データ履歴 (Logs)</h2>
            </header>

            <div className="logs-tabs">
                <button 
                    className={activeTab === 'msc' ? 'active' : ''} 
                    onClick={() => setActiveTab('msc')}
                >
                    細胞カウント (MSC)
                </button>
                <button 
                    className={activeTab === 'timers' ? 'active' : ''} 
                    onClick={() => setActiveTab('timers')}
                >
                    タイマー履歴
                </button>
            </div>

            <div className="logs-content">
                {loading && <div className="loading-state">読み込み中...</div>}
                
                {!loading && activeTab === 'msc' && (
                    <div className="logs-list">
                        {mscLogs.length === 0 ? <p className="empty-state">記録がありません</p> : 
                            mscLogs.map(log => (
                                <div key={log.id} className="log-card msc-card">
                                    <div className="log-card-header">
                                        <span className="log-date">{formatDate(log.created_at)}</span>
                                        <span className="log-dish">{log.dish_size}</span>
                                    </div>
                                    <div className="log-card-body">
                                        <div className="log-stat">
                                            <span className="label">濃度:</span>
                                            <span className="val">{(log.cell_count / 100000).toFixed(2)} × 10⁵ cells/mL</span>
                                        </div>
                                        <div className="log-sub">
                                            <span>生データ: {log.count_1}, {log.count_2} (平均: {log.counted_value_mean.toFixed(1)})</span>
                                        </div>
                                        {log.notes && <div className="log-notes">📝 {log.notes}</div>}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}

                {!loading && activeTab === 'timers' && (
                    <div className="logs-list">
                        {timerLogs.length === 0 ? <p className="empty-state">記録がありません</p> : 
                            timerLogs.map(log => (
                                <div key={log.id} className="log-card timer-card">
                                    <div className="log-card-header">
                                        <span className="log-date">{formatDate(log.created_at)}</span>
                                        <span className="log-protocol">{log.protocol_name}</span>
                                    </div>
                                    <div className="log-card-body">
                                        <div className="log-stat">
                                            <span className="label">Day {log.day_number} - Step {log.step_number}:</span>
                                            <span className="val">{log.step_name}</span>
                                        </div>
                                        <div className="log-sub">
                                            <span>開始: {formatTimeOnly(log.started_at)}</span>
                                            <span style={{ marginLeft: 10 }}>終了: {formatTimeOnly(log.completed_at)}</span>
                                        </div>
                                        {log.notes && <div className="log-notes">📝 {log.notes}</div>}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
}
