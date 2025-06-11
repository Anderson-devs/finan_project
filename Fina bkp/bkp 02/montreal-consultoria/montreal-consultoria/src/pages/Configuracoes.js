import React, { useContext, useState, useEffect } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import { AuthContext } from '../auth/AuthContext';

function Configuracoes() {
  const { user } = useContext(AuthContext);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [message, setMessage] = useState(null);
  // Custo salvo como string para permitir edição livre
  const initialCostString = localStorage.getItem('custoLimpaNome') || '120';
  const [custoLimpaNome, setCustoLimpaNome] = useState(initialCostString);

  const handleSaveCost = () => {
    // Limpar e normalizar valor do custo para '.' como decimal
    let cleaned = custoLimpaNome.replace(/[^0-9\.,]/g, '');
    if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/\./g, '');
    }
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      localStorage.setItem('custoLimpaNome', cleaned);
      setCustoLimpaNome(cleaned);
      setMessage({ type: 'success', text: 'Custo fixo salvo com sucesso!' });
    } else {
      setMessage({ type: 'danger', text: 'Valor de custo inválido' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMessage({ type: 'danger', text: 'Senhas não coincidem' });
      return;
    }
    // TODO: Implementar lógica de alteração de senha
    setMessage({ type: 'success', text: 'Funcionalidade de alteração de senha em desenvolvimento' });
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
      <h2>Configurações</h2>
      <p>Usuário logado: <strong>{user?.username}</strong></p>
      {message && <Alert variant={message.type}>{message.text}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="currentPassword">
          <Form.Label>Senha Atual</Form.Label>
          <Form.Control
            type="password"
            placeholder="Digite sua senha atual"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="newPassword">
          <Form.Label>Nova Senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Digite nova senha"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="confirmPassword">
          <Form.Label>Confirmar Nova Senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Confirme a nova senha"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Alterar Senha
        </Button>

        <hr />
        <Form.Group className="mt-4 mb-3" controlId="custoLimpaNome">
          <Form.Label>Custo Fixo Limpa Nome</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ex: 120 ou 120,50"
            value={custoLimpaNome}
            onChange={(e) => setCustoLimpaNome(e.target.value)}
          />
        </Form.Group>
        <Button variant="secondary" onClick={handleSaveCost} className="mb-3">
          Salvar Custo
        </Button>
      </Form>
    </Container>
  );
}

export default Configuracoes; 