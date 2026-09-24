
import './Home.css';

export default function Home() {
  return (
    <div className="container">
      <h1>📱 Apps</h1>
      <div className="app-grid">
        <a href="/android_app/ihc/" className="app-card">
          <div className="app-icon timer">⏱️</div>
          <div className="app-title">IHC Timer</div>
          <div className="app-desc">二重染色プロトコルタイマー</div>
        </a>
        <a href="/android_app/prompter/" className="app-card">
          <div className="app-icon prompter">🎤</div>
          <div className="app-title">Prompter</div>
          <div className="app-desc">プレゼンテーション補助</div>
        </a>
        <a href="/android_app/ish/" className="app-card">
          <div className="app-icon" style={{ color: '#9c27b0' }}>🧬</div>
          <div className="app-title">ISHpalette Timer</div>
          <div className="app-desc">Short hairpin amplifier</div>
        </a>
        <a href="/android_app/msc/" className="app-card">
          <div className="app-icon protocol">🧪</div>
          <div className="app-title">Protocol</div>
          <div className="app-desc">細胞培養プロトコル</div>
        </a>
        <a href="/android_app/home/#/logs" className="app-card">
          <div className="app-icon" style={{ color: '#333' }}>📊</div>
          <div className="app-title">Data Logs</div>
          <div className="app-desc">記録・履歴一覧</div>
        </a>
      </div>
    </div>
  );
}
