import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Protocol from './pages/Protocol';
import Timer from './pages/Timer';
import IshPalette from './pages/IshPalette';
import Prompter from './pages/Prompter';
import LogsViewer from './pages/LogsViewer';

// index.html が URL のディレクトリ (/android_app/<app>/) から設定するアプリ名
const APP_START_ROUTES: Record<string, string> = {
  msc: '/protocol',
  ihc: '/timer',
  ish: '/ish-palette',
  prompter: '/prompter',
};

function App() {
  const appName = (window as { __APP_NAME__?: string }).__APP_NAME__ ?? 'home';
  const startRoute = APP_START_ROUTES[appName];

  return (
    <Router>
      <Routes>
        <Route path="/" element={startRoute ? <Navigate to={startRoute} replace /> : <Home />} />
        <Route path="/protocol" element={<Protocol />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/ish-palette" element={<IshPalette />} />
        <Route path="/prompter" element={<Prompter />} />
        <Route path="/logs" element={<LogsViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
