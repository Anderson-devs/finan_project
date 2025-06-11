import React, { useContext, useState, useEffect } from 'react';
import { Form, Button, Container, Alert, Table, Modal, InputGroup, FormControl, Row, Col } from 'react-bootstrap';
import { AuthContext } from '../auth/AuthContext';
import ClientController from '../controllers/ClientController';
import ServiceController from '../controllers/ServiceController';
import { ClientRepository } from '../repositories/ClientRepository';
import { ServiceRepository } from '../repositories/ServiceRepository';

function Configuracoes() {
  const { user } = useContext(AuthContext);
  // Para edição de clientes
  const [clients, setClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [newCpf, setNewCpf] = useState('');
  const [docType, setDocType] = useState('CPF');
  // Funções de máscara de CPF e CNPJ
  const maskCPF = (value) => value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
  const maskCNPJ = (value) => value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
  // Para edição de serviços
  const [services, setServices] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editService, setEditService] = useState(null);
  const [newServiceName, setNewServiceName] = useState('');
  // Edição completa de cliente
  const [newClientName, setNewClientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [message, setMessage] = useState(null);
  // Custo salvo como string para permitir edição livre
  const initialCostString = localStorage.getItem('custoLimpaNome') || '120';
  const [custoLimpaNome, setCustoLimpaNome] = useState(initialCostString);
  const [localClients, setLocalClients] = useState([]);
  // Add state for client creation modal
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  useEffect(() => {
    ClientController.searchClients('').then(setClients);
    ServiceController.searchServices('').then(setServices);
    ClientRepository.search('').then(setLocalClients);
  }, []);

  // Combinar clientes remotos e locais, evitando duplicação por id
  const allClients = [
    ...clients,
    ...localClients.filter(lc => !clients.some(rc => rc.id === lc.id))
  ];

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

  // Editar CPF de cliente
  const handleEditClient = (client) => {
    setEditClient(client);
    setNewClientName(client.name || '');
    setNewPhone(client.phone || '');
    setNewWhatsapp(client.whatsapp || '');
    setNewEmail(client.email || '');
    setNewCpf(client.cpfCnpj || '');
    setDocType(client.cpfCnpj?.includes('/') ? 'CNPJ' : 'CPF');
    setShowClientModal(true);
  };
  const saveClient = async () => {
    const updated = {
      name: newClientName,
      phone: newPhone,
      whatsapp: newWhatsapp,
      email: newEmail,
      cpfCnpj: newCpf
    };
    const res = await ClientController.updateClient(editClient.id, updated);
    setClients(prev => prev.map(c => c.id === res.id ? res : c));
    setShowClientModal(false);
  };
  // Editar nome de serviço
  const handleEditService = (service) => {
    setEditService(service);
    setNewServiceName(service.name);
    setShowServiceModal(true);
  };
  const saveServiceName = async () => {
    await ServiceController.updateService(editService.id, { name: newServiceName });
    setServices(prev => prev.map(s => s.id === editService.id ? { ...s, name: newServiceName } : s));
    setShowServiceModal(false);
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

  // Handlers para deletar clientes e serviços com logs
  const handleDeleteClient = async (id) => {
    console.log('Deleting client', id);
    const ok = await ClientController.deleteClient(id);
    console.log('deleteClient ok:', ok);
    if (ok) {
      // Remove from remote clients state
      setClients(prev => prev.filter(c => c.id !== id));
      setMessage({ type: 'success', text: 'Cliente excluído com sucesso!' });
    } else {
      // Fallback: delete from localStorage clients
      const deletedLocal = ClientRepository.delete(id);
      console.log('local delete ok:', deletedLocal);
      if (deletedLocal) {
        setLocalClients(prev => prev.filter(c => c.id !== id));
        setMessage({ type: 'success', text: 'Cliente excluído do armazenamento local!' });
      } else {
        setMessage({ type: 'danger', text: 'Erro ao excluir cliente.' });
      }
    }
  };
  const handleDeleteService = async (id) => {
    console.log('Deleting service', id);
    const ok = await ServiceController.deleteService(id);
    console.log('deleteService ok:', ok);
    if (ok) {
      setServices(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Serviço excluído com sucesso!' });
    } else {
      // Fallback: delete from localStorage
      const deletedLocal = ServiceRepository.delete(id);
      console.log('local service delete ok:', deletedLocal);
      if (deletedLocal) {
        setServices(prev => prev.filter(s => s.id !== id));
        setMessage({ type: 'success', text: 'Serviço excluído do armazenamento local!' });
      } else {
        setMessage({ type: 'danger', text: 'Erro ao excluir serviço.' });
      }
    }
  };
  // Add handlers for adding new client
  const handleAddClient = () => {
    setNewClientName('');
    setNewPhone('');
    setNewWhatsapp('');
    setNewEmail('');
    setNewCpf('');
    setDocType('CPF');
    setShowCreateClientModal(true);
  };
  const saveNewClient = async () => {
    const clientData = {
      name: newClientName,
      phone: newPhone,
      whatsapp: newWhatsapp,
      email: newEmail,
      cpfCnpj: newCpf
    };
    const newClient = await ClientController.createClient(clientData);
    setClients(prev => [...prev, newClient]);
    setShowCreateClientModal(false);
  };

  return (
    <Container fluid className="mt-5">
      <h2>Configurações</h2>
      <p>Usuário logado: <strong>{user?.username}</strong></p>
      {message && <Alert variant={message.type}>{message.text}</Alert>}
      <Row>
        <Col md={6}>
          <h3>Clientes</h3>
          {/* Button to add a new client */}
          <Button variant="success" size="sm" onClick={handleAddClient} className="mb-2">Adicionar Cliente</Button>
          <Table responsive striped bordered size="sm" style={{ whiteSpace: 'nowrap' }}>
            <thead><tr><th>Nome</th><th>CPF/CNPJ</th><th>Ações</th></tr></thead>
            <tbody>
              {allClients.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.cpfCnpj || '-'}</td>
                  <td>
                    <Button size="sm" onClick={() => handleEditClient(c)} className="me-2">Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteClient(c.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <h3 className="mt-4">Serviços</h3>
          <Table responsive striped bordered size="sm" style={{ whiteSpace: 'nowrap' }}>
            <thead><tr><th>Serviço</th><th>Ações</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    <Button size="sm" onClick={() => handleEditService(s)} className="me-2">Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteService(s.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
        <Col md={6}>
          <h3>Alterar Senha</h3>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="currentPassword">
              <Form.Label>Senha Atual</Form.Label>
              <Form.Control type="password" placeholder="Digite sua senha atual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>Nova Senha</Form.Label>
              <Form.Control type="password" placeholder="Digite nova senha" value={newPass} onChange={e => setNewPass(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Confirmar Nova Senha</Form.Label>
              <Form.Control type="password" placeholder="Confirme a nova senha" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">Alterar Senha</Button>
          </Form>
          <h3 className="mt-4">Custo Fixo Limpa Nome</h3>
          <Form.Group className="mb-3" controlId="custoLimpaNome">
            <Form.Control type="text" placeholder="Ex: 120 ou 120,50" value={custoLimpaNome} onChange={e => setCustoLimpaNome(e.target.value)} />
          </Form.Group>
          <Button variant="secondary" onClick={handleSaveCost}>Salvar Custo</Button>
        </Col>
      </Row>
      {/* Modais de edição */}
      <Modal show={showClientModal} onHide={() => setShowClientModal(false)}>
        <Modal.Header closeButton><Modal.Title>Editar Cliente</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Nome</Form.Label><Form.Control type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Telefone</Form.Label><Form.Control type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>WhatsApp</Form.Label><Form.Control type="text" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Tipo de Documento</Form.Label><div>
              <Form.Check inline label="CPF" type="radio" name="docType" checked={docType==='CPF'} onChange={()=>setDocType('CPF')} />
              <Form.Check inline label="CNPJ" type="radio" name="docType" checked={docType==='CNPJ'} onChange={()=>setDocType('CNPJ')} />
            </div></Form.Group>
            {docType==='CPF' ? (
              <Form.Group className="mb-2"><Form.Label>CPF</Form.Label><Form.Control type="text" value={newCpf} onChange={e => setNewCpf(maskCPF(e.target.value))} /></Form.Group>
            ) : (
              <Form.Group className="mb-2"><Form.Label>CNPJ</Form.Label><Form.Control type="text" value={newCpf} onChange={e => setNewCpf(maskCNPJ(e.target.value))} /></Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={saveClient}>Salvar</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showServiceModal} onHide={() => setShowServiceModal(false)}>
        <Modal.Header closeButton><Modal.Title>Editar Serviço</Modal.Title></Modal.Header>
        <Modal.Body>
          <FormControl value={newServiceName} onChange={e => setNewServiceName(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowServiceModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={saveServiceName}>Salvar</Button>
        </Modal.Footer>
      </Modal>
      {/* Modal for creating new client */}
      <Modal show={showCreateClientModal} onHide={() => setShowCreateClientModal(false)}>
        <Modal.Header closeButton><Modal.Title>Novo Cliente</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Nome</Form.Label><Form.Control type="text" value={newClientName} onChange={e => setNewClientName(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Telefone</Form.Label><Form.Control type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>WhatsApp</Form.Label><Form.Control type="text" value={newWhatsapp} onChange={e => setNewWhatsapp(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Tipo de Documento</Form.Label><div>
              <Form.Check inline label="CPF" type="radio" name="docType" checked={docType==='CPF'} onChange={()=>setDocType('CPF')} />
              <Form.Check inline label="CNPJ" type="radio" name="docType" checked={docType==='CNPJ'} onChange={()=>setDocType('CNPJ')} />
            </div></Form.Group>
            {docType==='CPF' ? (
              <Form.Group className="mb-2"><Form.Label>CPF</Form.Label><Form.Control type="text" value={newCpf} onChange={e => setNewCpf(maskCPF(e.target.value))} /></Form.Group>
            ) : (
              <Form.Group className="mb-2"><Form.Label>CNPJ</Form.Label><Form.Control type="text" value={newCpf} onChange={e => setNewCpf(maskCNPJ(e.target.value))} /></Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateClientModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={saveNewClient}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Configuracoes; 