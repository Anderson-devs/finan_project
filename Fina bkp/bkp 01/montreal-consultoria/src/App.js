import './App.css';
import { NavLink, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Entradas from './pages/Entradas';
import Saidas from './pages/Saidas';
import Relatorios from './pages/Relatorios';
import Anotacoes from './pages/Anotacoes';

function App() {
  return (
    <div className="App">
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/entradas">Entradas</NavLink>
        <NavLink to="/saidas">Saídas</NavLink>
        <NavLink to="/relatorios">Relatórios</NavLink>
        <NavLink to="/anotacoes">Anotações</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/entradas" element={<Entradas />} />
        <Route path="/saidas" element={<Saidas />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/anotacoes" element={<Anotacoes />} />
      </Routes>
    </div>
  );
}

export default App;
