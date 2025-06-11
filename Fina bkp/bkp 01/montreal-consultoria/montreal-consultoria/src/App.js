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
import Relatorios from './pages/Relatorios';
import Anotacoes from './pages/Anotacoes';
import Configuracoes from './pages/Configuracoes';

function App() {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={NavLink} to="/">Montreal Consultoria</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/">Dashboard</Nav.Link>
              <Nav.Link as={NavLink} to="/entradas">Entradas</Nav.Link>
              <Nav.Link as={NavLink} to="/saidas">Saídas</Nav.Link>
              <Nav.Link as={NavLink} to="/relatorios">Relatórios</Nav.Link>
              <Nav.Link as={NavLink} to="/anotacoes">Anotações</Nav.Link>
              <Nav.Link as={NavLink} to="/configuracoes">Configurações</Nav.Link>
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
          <Route path="/" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Dashboard /></ProtectedRoute>} />
          <Route path="/entradas" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Entradas /></ProtectedRoute>} />
          <Route path="/saidas" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Saidas /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute allowedRoles={[ 'admin' ]}><Relatorios /></ProtectedRoute>} />
          <Route path="/anotacoes" element={<ProtectedRoute allowedRoles={[ 'admin' ]}><Anotacoes /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Configuracoes /></ProtectedRoute>} />
          <Route path="*" element={<ProtectedRoute allowedRoles={[ 'admin','user' ]}><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Container>
    </div>
  );
}

export default App;
