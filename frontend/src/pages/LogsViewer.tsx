import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './LogsViewer.css';

interface ExperimentLog {
    id: string;
    logged_at: string;
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

    const [editingMsc, setEditingMsc] = useState<ExperimentLog | null>(null);
    const [editingTimer, setEditingTimer] = useState<TimerLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const [mscRes, timerRes] = await Promise.all([
                supabase.from('experiment_logs').select('*').order('logged_at', { ascending: false }).limit(50),
                supabase.from('timer_logs').select('*').order('created_at', { ascending: false }).limit(50)
            ]);
            
            if (mscRes.error) console.error('Error fetching msc logs:', mscRes.error);
            if (timerRes.error) console.error('Error fetching timer logs:', timerRes.error);

            if (mscRes.data) setMscLogs(mscRes.data);
            if (timerRes.data) setTimerLogs(timerRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteLog = async (table: string, id: string) => {
        if (!window.confirm("この記録を本当に削除しますか？")) return;
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            fetchLogs();
        } catch (e: any) {
            alert('削除に失敗しました: ' + e.message);
        }
    };

    const saveMscEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMsc) return;
        try {
            const c1 = Number(editingMsc.count_1);
            const c2 = Number(editingMsc.count_2);
            const mean = (c1 + c2) / 2;
            const cellCount = mean * 10000;
            
            const { error } = await supabase.from('experiment_logs').update({
                count_1: c1,
                count_2: c2,
                counted_value_mean: mean,
                cell_count: cellCount,
                dish_size: editingMsc.dish_size,
                notes: editingMsc.notes
            }).eq('id', editingMsc.id);

            if (error) throw error;
            setEditingMsc(null);
            fetchLogs();
        } catch (e: any) {
            alert('保存に失敗しました: ' + e.message);
        }
    };

    const saveTimerEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTimer) return;
        try {
            const { error } = await supabase.from('timer_logs').update({
                notes: editingTimer.notes
            }).eq('id', editingTimer.id);

            if (error) throw error;
            setEditingTimer(null);
            fetchLogs();
        } catch (e: any) {
            alert('保存に失敗しました: ' + e.message);
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
                                        <span className="log-date">{formatDate(log.logged_at)}</span>
                                        <div className="log-actions">
                                            <button onClick={() => setEditingMsc(log)}>✏️</button>
                                            <button onClick={() => deleteLog('experiment_logs', log.id)}>🗑️</button>
                                        </div>
                                    </div>
                                    <div className="log-card-body">
                                        <div className="log-stat">
                                            <span className="label">濃度:</span>
                                            <span className="val">{(log.cell_count / 100000).toFixed(2)} × 10⁵ cells/mL</span>
                                            <span className="log-dish" style={{marginLeft: 8}}>{log.dish_size}</span>
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
                                        <div className="log-actions">
                                            <button onClick={() => setEditingTimer(log)}>✏️</button>
                                            <button onClick={() => deleteLog('timer_logs', log.id)}>🗑️</button>
                                        </div>
                                    </div>
                                    <div className="log-card-body">
                                        <div className="log-stat">
                                            <span className="label">Day {log.day_number} - Step {log.step_number}:</span>
                                            <span className="val">{log.step_name}</span>
                                            <span className="log-protocol" style={{marginLeft: 8}}>{log.protocol_name}</span>
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

            {/* Edit Modals */}
            {editingMsc && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>MSC記録の編集</h3>
                        <form onSubmit={saveMscEdit}>
                            <div className="form-group">
                                <label>カウント1</label>
                                <input type="number" step="0.1" required value={editingMsc.count_1} onChange={e => setEditingMsc({...editingMsc, count_1: Number(e.target.value)})} />
                            </div>
                            <div className="form-group">
                                <label>カウント2</label>
                                <input type="number" step="0.1" required value={editingMsc.count_2} onChange={e => setEditingMsc({...editingMsc, count_2: Number(e.target.value)})} />
                            </div>
                            <div className="form-group">
                                <label>ディッシュサイズ</label>
                                <input type="text" value={editingMsc.dish_size || ''} onChange={e => setEditingMsc({...editingMsc, dish_size: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>メモ (Notes)</label>
                                <textarea value={editingMsc.notes || ''} onChange={e => setEditingMsc({...editingMsc, notes: e.target.value})}></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setEditingMsc(null)} className="btn-cancel">キャンセル</button>
                                <button type="submit" className="btn-save">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingTimer && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>タイマー記録の編集</h3>
                        <form onSubmit={saveTimerEdit}>
                            <div className="form-group">
                                <label>メモ (Notes)</label>
                                <textarea value={editingTimer.notes || ''} onChange={e => setEditingTimer({...editingTimer, notes: e.target.value})} placeholder="この工程に関するメモを追加"></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setEditingTimer(null)} className="btn-cancel">キャンセル</button>
                                <button type="submit" className="btn-save">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
