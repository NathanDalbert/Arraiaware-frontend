import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import RH from './pages//RH/RH';
import Admin from './pages/Admin/Admin';
import Comite from './pages/Committee/Committee';
import Dashboard from './pages/Dashboard/Dashboard';
import Avaliacao from './pages/Evaluation/Evaluation';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Gestor from './pages/Manager/Manager';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/avaliacao/:section" element={<Avaliacao />} />
        <Route path="/RH" element={<RH />} />
        <Route path="/Comite" element={<Comite />} />
        <Route path="/Gestor" element={<Gestor />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      
        
        {/* Painel Admin */}

        <Route path="/admin" element={<Admin />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
