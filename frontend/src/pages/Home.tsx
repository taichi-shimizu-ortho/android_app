import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="container">
      <h1>📱 Apps</h1>
      <div className="app-grid">
        <Link to="/timer" className="app-card">
          <div className="app-icon timer">⏱️</div>
          <div className="app-title">IHC Timer</div>
          <div className="app-desc">二重染色プロトコルタイマー</div>
        </Link>
        <Link to="/prompter" className="app-card">
          <div className="app-icon prompter">🎤</div>
          <div className="app-title">Prompter</div>
          <div className="app-desc">プレゼンテーション補助</div>
        </Link>
        <Link to="/ish-palette" className="app-card">
          <div className="app-icon" style={{ color: '#9c27b0' }}>🧬</div>
          <div className="app-title">ISHpalette Timer</div>
          <div className="app-desc">Short hairpin amplifier</div>
        </Link>
        <Link to="/protocol" className="app-card">
          <div className="app-icon protocol">🧪</div>
          <div className="app-title">Protocol</div>
          <div className="app-desc">細胞培養プロトコル</div>
        </Link>
      </div>
    </div>
  );
}
