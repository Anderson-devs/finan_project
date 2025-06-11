import './App.css';
import { NavLink, Routes, Route } from 'react-router-dom';
import React, { useContext } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { AuthContext } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Entradas from './pages/Entradas';
import Saidas from './pages/Saidas';
import Anotacoes from './pages/Anotacoes';
import RelatorioLimpaNome from './pages/RelatorioLimpaNome';
import Configuracoes from './pages/Configuracoes';
import { FeatureFlagContext } from './featureFlags/FeatureFlagContext';

function App() {
  const { user, logout } = useContext(AuthContext);
  const { flags } = useContext(FeatureFlagContext);
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={NavLink} to="/">Montreal Consultoria</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {flags.dashboard && <Nav.Link as={NavLink} to="/">Dashboard</Nav.Link>}
              {flags.entradas && <Nav.Link as={NavLink} to="/entradas">Entradas</Nav.Link>}
              {flags.saidas && <Nav.Link as={NavLink} to="/saidas">Saídas</Nav.Link>}
              {flags.relatorios && <Nav.Link as={NavLink} to="/relatorios/limpa-nome">Relatórios</Nav.Link>}
              {flags.anotacoes && <Nav.Link as={NavLink} to="/anotacoes">Anotações</Nav.Link>}
              {flags.configuracoes && <Nav.Link as={NavLink} to="/configuracoes">Configurações</Nav.Link>}
            </Nav>
            <Nav>
              {user && <Nav.Link onClick={logout}>Sair</Nav.Link>}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          {flags.dashboard && <Route path="/" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Dashboard /></ProtectedRoute>} />}
          {flags.entradas && <Route path="/entradas" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Entradas /></ProtectedRoute>} />}
          {flags.saidas && <Route path="/saidas" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Saidas /></ProtectedRoute>} />}
          {flags.relatorios && <Route path="/relatorios/limpa-nome" element={<ProtectedRoute allowedRoles={[ 'admin' ]}><RelatorioLimpaNome /></ProtectedRoute>} />}
          {flags.anotacoes && <Route path="/anotacoes" element={<ProtectedRoute allowedRoles={[ 'admin' ]}><Anotacoes /></ProtectedRoute>} />}
          {flags.configuracoes && <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Configuracoes /></ProtectedRoute>} />}
          {flags.dashboard && <Route path="*" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Dashboard /></ProtectedRoute>} />}
        </Routes>
      </Container>
    </div>
  );
}

export default App;
