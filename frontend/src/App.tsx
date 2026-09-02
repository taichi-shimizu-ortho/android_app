import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Protocol from './pages/Protocol';
import Timer from './pages/Timer';
import IshPalette from './pages/IshPalette';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/protocol" element={<Protocol />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/ish-palette" element={<IshPalette />} />
      </Routes>
    </Router>
  );
}

export default App;
