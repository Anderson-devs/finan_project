import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Container, Modal, Toast, Table, ListGroup, Card, InputGroup } from 'react-bootstrap';
import ClientController from '../controllers/ClientController';
import ServiceController from '../controllers/ServiceController';
import EntryController from '../controllers/EntryController';
import { ClientRepository } from '../repositories/ClientRepository';
import './Entradas.css';
import { formatDateBrazil } from '../utils/date';

// Add validation functions at top
function isValidCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (!cpf || cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}
function isValidCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, '');
  if (!cnpj || cnpj.length !== 14 || /^([0-9])\1+$/.test(cnpj)) return false;
  const t = cnpj.length - 2;
  const d = cnpj.substring(t);
  const d1 = parseInt(d.charAt(0));
  const d2 = parseInt(d.charAt(1));
  const calc = (x) => {
    let n = cnpj.substring(0, x);
    let y = x - 7;
    let sum = 0;
    for (let i = x; i >= 1; i--) {
      sum += parseInt(n.charAt(x - i)) * y--;
      if (y < 2) y = 9;
    }
    return sum;
  };
  let sum1 = calc(t);
  let rev = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  if (rev !== d1) return false;
  let sum2 = calc(t + 1);
  rev = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  return rev === d2;
}

// Add input masking for CPF and CNPJ
function maskCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length >= 10) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (digits.length >= 7) return digits.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (digits.length >= 4) return digits.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return digits;
}

function maskCNPJ(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length >= 13) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  if (digits.length >= 9) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
  if (digits.length >= 6) return digits.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (digits.length >= 3) return digits.replace(/(\d{2})(\d{1,3})/, '$1.$2');
  return digits;
}

function Entradas() {
  const [cliente, setCliente] = useState('');
  const [clienteOptions, setClienteOptions] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [docType, setDocType] = useState('CPF');
  const [newClient, setNewClient] = useState({ name: '', phone: '', whatsapp: '', email: '', cpf: '', cnpj: '' });

  const [servico, setServico] = useState('');
  const [servicoOptions, setServicoOptions] = useState([]);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [newServico, setNewServico] = useState({ name: '' });

  const [formaPagamento, setFormaPagamento] = useState('À vista');
  const [valorTotal, setValorTotal] = useState('');
  // Estados da calculadora modal
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const handleCalcClick = () => {
    setCalcExpr(''); setCalcResult(''); setShowCalcModal(true);
  };
  const handleCalcEvaluate = () => {
    try {
      const res = Function('"use strict";return (' + calcExpr + ')')();
      setCalcResult(res);
    } catch {
      setCalcResult('Erro');
    }
  };
  const handleCalcConfirm = () => {
    if (calcResult !== '' && calcResult !== 'Erro') setValorTotal(calcResult.toString());
    setShowCalcModal(false);
  };
  const [numParcelas, setNumParcelas] = useState(1);
  const [parcelas, setParcelas] = useState([]);
  const [dataRef, setDataRef] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [entriesList, setEntriesList] = useState([]);
  // Sorting for saved entries
  const [sortType, setSortType] = useState('dateDesc');
  const sortedEntriesList = entriesList.slice().sort((a, b) => {
    if (sortType === 'dateAsc') return new Date(a.dataRef) - new Date(b.dataRef);
    if (sortType === 'dateDesc') return b.id - a.id;
    if (sortType === 'alpha') return a.cliente.localeCompare(b.cliente);
    return 0;
  });

  // Formatter para moeda BRL
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    // fetch initial autocomplete lists via Controller
    ClientController.searchClients('').then(setClienteOptions);
    ServiceController.searchServices('').then(setServicoOptions);
  }, []);

  const handleClienteChange = (e) => {
    const q = e.target.value;
    setCliente(q);
    ClientController.searchClients(q).then(results => {
      setClienteOptions(results);
      setShowClientSuggestions(true);
    });
  };

  const handleServiceChange = (e) => {
    const q = e.target.value;
    setServico(q);
    ServiceController.searchServices(q).then(results => {
      setServicoOptions(results);
      setShowServiceSuggestions(true);
    });
  };

  const handleClientBlur = () => {
    ClientController.searchClients(cliente).then(results => {
      if (results.length === 0 && cliente) {
        setDocType('CPF');
        setNewClient({ name: cliente, phone: '', whatsapp: '', email: '', cpf: '', cnpj: '' });
        setShowClientModal(true);
      } else {
        setClienteOptions(results);
      }
    });
  };

  const handleServiceBlur = () => {
    ServiceController.searchServices(servico).then(results => {
      if (results.length === 0 && servico) {
        setNewServico({ name: servico });
        setShowServiceModal(true);
      } else {
        setServicoOptions(results);
      }
    });
  };

  const handleCreateClient = async () => {
    console.log('Debug: handleCreateClient invoked', { newClient, docType });
    // Validate CPF or CNPJ based on selected type
    const value = docType === 'CPF' ? newClient.cpf : newClient.cnpj;
    const cleaned = value.replace(/\D/g, '');
    if (docType === 'CPF') {
      if (cleaned.length !== 11 || !isValidCPF(cleaned)) { window.alert('CPF inválido'); return; }
    } else {
      if (cleaned.length !== 14 || !isValidCNPJ(cleaned)) { window.alert('CNPJ inválido'); return; }
    }
    // Prepare payload
    const payload = { name: newClient.name, phone: newClient.phone, whatsapp: newClient.whatsapp, email: newClient.email, cpfCnpj: value };
    try {
      // Try remote save
      const client = await ClientController.createClient(payload);
      console.log('Debug: createClient response', client);
      setCliente(client.name);
      setClienteOptions(prev => [...prev, client]);
    } catch (error) {
      console.warn('Remote create failed, falling back to local storage', error);
      // Fallback to localStorage
      const client = await ClientRepository.create({ name: newClient.name, phone: newClient.phone, whatsapp: newClient.whatsapp, email: newClient.email, cpfCnpj: value });
      console.log('Debug: fallback createClient with local storage', client);
      setCliente(client.name);
      setClienteOptions(prev => [...prev, client]);
    }
    // Common cleanup after create
    setShowClientModal(false);
    setShowClientSuggestions(false);
    setDocType('CPF');
    setNewClient({ name: '', phone: '', whatsapp: '', email: '', cpf: '', cnpj: '' });
  };

  const handleCreateService = async () => {
    const service = await ServiceController.createService(newServico);
    setServico(service.name);
    setServicoOptions(prev => [...prev, service]);
    setShowServiceModal(false);
    setNewServico({ name: '' });
  };

  const generateParcelas = async () => {
    // Validar data de referência
    if (!dataRef) {
      window.alert('Por favor, selecione uma data de referência antes de gerar parcelas');
      return;
    }
    // Limpar entrada: remover caracteres não numéricos, pontos e vírgulas
    let cleaned = valorTotal.replace(/[^0-9\.,]/g, '');
    if (cleaned.includes(',')) {
      // se houver vírgula, tratar ponto como separador de milhar e vírgula como decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // caso não haja vírgula, remover pontos
      cleaned = cleaned.replace(/\./g, '');
    }
    const total = parseFloat(cleaned) || 0;
    const num = parseInt(numParcelas, 10) || 1;
    // Calcular divisão exata em centavos para evitar erros de arredondamento
    const totalCents = Math.round(total * 100);
    const baseCents = Math.floor(totalCents / num);
    const remainder = totalCents - baseCents * num;
    // Função para adicionar meses considerando anos bissextos e variação de dias no mês
    const addMonths = (dateStr, months) => {
      // dateStr esperado no formato 'yyyy-mm-dd'
      const [year, month, day] = dateStr.split('-').map(Number);
      // Criar data local ajustada para o primeiro dia do mês
      const date = new Date(year, month - 1, 1);
      date.setMonth(date.getMonth() + months);
      // Ajustar dia ao último dia do mês destino, se necessário
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(day, daysInMonth));
      return date;
    };
    const arr = Array.from({ length: num }, (_, i) => {
      const cents = baseCents + (i < remainder ? 1 : 0);
      return {
        id: i + 1,
        valor: (cents / 100).toFixed(2),
        data: addMonths(dataRef, i)
      };
    });
    setParcelas(arr);
    // Auto-save entry após gerar parcelas
    const entryData = { cliente, servico, formaPagamento, parcelas: arr, dataRef };
    await EntryController.saveEntry(entryData);
    setShowToast(true);
    loadEntries();
  };

  const loadEntries = async () => {
    try {
      const all = await EntryController.getEntries();
      setEntriesList(all);
    } catch (err) {
      console.error('Erro ao carregar entradas:', err);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  // Função para deletar entrada
  const handleDeleteEntry = async (id) => {
    try {
      const ok = await EntryController.deleteEntry(id);
      if (ok) loadEntries();
    } catch (err) {
      console.error('Erro ao deletar entrada:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Preparar parcelas: para à vista gerar única parcela com valorTotal
    let submittingParcelas = parcelas;
    if (formaPagamento === 'À vista') {
      // Limpar e parsear valorTotal
      let cleanedSubmit = valorTotal.replace(/[^0-9\.,]/g, '');
      if (cleanedSubmit.includes(',')) {
        cleanedSubmit = cleanedSubmit.replace(/\./g, '').replace(',', '.');
      } else {
        cleanedSubmit = cleanedSubmit.replace(/\./g, '');
      }
      const totalSubmit = parseFloat(cleanedSubmit) || 0;
      const perSubmit = totalSubmit.toFixed(2);
      submittingParcelas = [{ id: 1, valor: perSubmit, data: dataRef }];
    }
    const entryData = { cliente, servico, formaPagamento, parcelas: submittingParcelas, dataRef };
    await EntryController.saveEntry(entryData);
    setShowToast(true);
    loadEntries();
    // reset form
    setCliente(''); setServico(''); setFormaPagamento('À vista'); setValorTotal(''); setNumParcelas(1); setParcelas([]); setDataRef('');
  };

  return (
    <Container fluid className="mt-4 entradas-page">
      <Row>
        <Col md={6} className="border-end entradas-container">
          <h3>Nova Entrada</h3>
          <Card className="entradas-card mb-4">
            <Form onSubmit={handleSubmit} className="entradas-form">
              <Form.Group className="mb-3 position-relative">
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  type="text"
                  value={cliente}
                  onChange={handleClienteChange}
                  onBlur={() => { handleClientBlur(); setTimeout(() => setShowClientSuggestions(false), 100); }}
                  onFocus={() => setShowClientSuggestions(true)}
                  placeholder="Digite ou selecione cliente"
                />
                {showClientSuggestions && (
                  <ListGroup style={{ position: 'absolute', zIndex: 1000, width: '100%' }}>
                    {clienteOptions.length > 0 ? (
                      clienteOptions.map((c, i) => (
                        <ListGroup.Item key={i} action onMouseDown={() => { setCliente(c.name); setShowClientSuggestions(false); }}>
                          {c.name}
                        </ListGroup.Item>
                      ))
                    ) : cliente ? (
                      <ListGroup.Item action onMouseDown={() => { setDocType('CPF'); setNewClient({ name: cliente, phone: '', whatsapp: '', email: '', cpf: '', cnpj: '' }); setShowClientSuggestions(false); setShowClientModal(true); }}>
                        Adicionar novo cliente "{cliente}"
                      </ListGroup.Item>
                    ) : null}
                  </ListGroup>
                )}
              </Form.Group>

              <Form.Group className="mb-3 position-relative">
                <Form.Label>Tipo de Serviço</Form.Label>
                <Form.Control
                  type="text"
                  value={servico}
                  onChange={handleServiceChange}
                  onBlur={() => { handleServiceBlur(); setTimeout(() => setShowServiceSuggestions(false), 100); }}
                  onFocus={() => setShowServiceSuggestions(true)}
                  placeholder="Digite ou selecione serviço"
                />
                {showServiceSuggestions && servicoOptions.length > 0 && (
                  <ListGroup style={{ position: 'absolute', zIndex: 1000, width: '100%' }}>
                    {servicoOptions.map((s, i) => (
                      <ListGroup.Item key={i} action onMouseDown={() => { setServico(s.name); setShowServiceSuggestions(false); }}>
                        {s.name}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Forma de Pagamento</Form.Label>
                <div>
                  <Form.Check inline label="À vista" type="radio" name="pagamento" checked={formaPagamento==='À vista'} onChange={()=>setFormaPagamento('À vista')} />
                  <Form.Check inline label="Parcelado" type="radio" name="pagamento" checked={formaPagamento==='Parcelado'} onChange={()=>setFormaPagamento('Parcelado')} />
                </div>
              </Form.Group>

              {/* Valor Total sempre visível */}
              <Form.Group className="mb-3">
                <Form.Label>Valor Total</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={valorTotal}
                    onChange={e => setValorTotal(e.target.value)}
                  />
                  <Button variant="secondary" onClick={handleCalcClick}>Calculadora</Button>
                </InputGroup>
              </Form.Group>

              {formaPagamento === 'Parcelado' && (
                <div className="parcelado-block">
                  <Form.Group className="mb-3">
                    <Form.Label>Número de Parcelas</Form.Label>
                    <Form.Control type="number" value={numParcelas} onChange={e=>setNumParcelas(e.target.value)} />
                  </Form.Group>
                  {parcelas.length > 0 && (
                    <Table bordered size="sm" className="mt-3">
                      <thead><tr><th>#</th><th>Valor</th><th>Data</th></tr></thead>
                      <tbody>
                        {parcelas.map(p => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{formatter.format(parseFloat(p.valor))}</td>
                            <td>{formatDateBrazil(p.data)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}

              {/* Data Referência sempre visível */}
              <Form.Group className="mb-3">
                <Form.Label>Data Referência</Form.Label>
                <Form.Control type="date" value={dataRef} onChange={e=>setDataRef(e.target.value)} />
              </Form.Group>
              {formaPagamento === 'Parcelado' && (
                <Button variant="secondary" onClick={generateParcelas}>Gerar Parcelas</Button>
              )}
              {formaPagamento === 'À vista' && (
                <Button variant="primary" type="submit" className="entradas-btn">Incluir</Button>
              )}
            </Form>
          </Card>
        </Col>
        <Col md={6}>
          <h3>Entradas Automáticas</h3>
          <div className="p-3" style={{ backgroundColor: '#e9ecef', minHeight: '400px' }}>
            <em>Área reservada para integrações futuras</em>
          </div>
        </Col>
      </Row>

      {/* Client Modal */}
      <Modal show={showClientModal} onHide={()=>setShowClientModal(false)}>
        <Modal.Header closeButton><Modal.Title>Novo Cliente</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                value={newClient.name}
                onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                value={newClient.phone}
                onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                placeholder="Opcional"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>WhatsApp</Form.Label>
              <Form.Control
                type="text"
                value={newClient.whatsapp}
                onChange={e => setNewClient({ ...newClient, whatsapp: e.target.value })}
                placeholder="Opcional"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newClient.email}
                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                placeholder="Opcional"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Documento</Form.Label>
              <div>
                <Form.Check inline label="CPF" type="radio" name="docType" checked={docType === 'CPF'} onChange={() => setDocType('CPF')} />
                <Form.Check inline label="CNPJ" type="radio" name="docType" checked={docType === 'CNPJ'} onChange={() => setDocType('CNPJ')} />
              </div>
            </Form.Group>
            {docType === 'CPF' && (
              <Form.Group className="mb-3">
                <Form.Label>CPF</Form.Label>
                <Form.Control
                  type="text"
                  value={newClient.cpf}
                  onChange={e => setNewClient({ ...newClient, cpf: maskCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  required
                />
              </Form.Group>
            )}
            {docType === 'CNPJ' && (
              <Form.Group className="mb-3">
                <Form.Label>CNPJ</Form.Label>
                <Form.Control
                  type="text"
                  value={newClient.cnpj}
                  onChange={e => setNewClient({ ...newClient, cnpj: maskCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowClientModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleCreateClient}>Salvar</Button>
        </Modal.Footer>
      </Modal>

      {/* Service Modal */}
      <Modal show={showServiceModal} onHide={()=>setShowServiceModal(false)}>
        <Modal.Header closeButton><Modal.Title>Novo Serviço</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Serviço</Form.Label>
              <Form.Control value={newServico.name} onChange={e=>setNewServico({...newServico, name:e.target.value})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setShowServiceModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleCreateService}>Salvar</Button>
        </Modal.Footer>
      </Modal>

      {/* Calculator Modal */}
      <Modal show={showCalcModal} onHide={() => setShowCalcModal(false)}>
        <Modal.Header closeButton><Modal.Title>Calculadora</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Expressão</Form.Label>
              <Form.Control type="text" value={calcExpr} onChange={e => setCalcExpr(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleCalcEvaluate}>Calcular</Button>
            {calcResult !== '' && <Card className="mt-3"><Card.Body>Resultado: {calcResult}</Card.Body></Card>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCalcModal(false)}>Cancelar</Button>
          <Button variant="success" onClick={handleCalcConfirm}>Confirmar</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <Toast show={showToast} onClose={()=>setShowToast(false)} delay={3000} autohide style={{ position: 'fixed', bottom: 20, right: 20 }}>
        <Toast.Header><strong className="me-auto">Nova Entrada</strong></Toast.Header>
        <Toast.Body>Entrada salva com sucesso!</Toast.Body>
      </Toast>

      {/* Listagem de entradas salvas */}
      {entriesList.length > 0 && (
        <div className="mt-5 entradas-list">
          <h4>Entradas Salvas</h4>
          <Form.Group controlId="sortEntries" className="mb-3">
            <Form.Label>Ordenar por</Form.Label>
            <Form.Select value={sortType} onChange={e => setSortType(e.target.value)}>
              <option value="dateDesc">Mais Recentes</option>
              <option value="dateAsc">Data Antiga</option>
              <option value="alpha">Cliente (A-Z)</option>
            </Form.Select>
          </Form.Group>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th><th>Cliente</th><th>Serviço</th><th>Forma</th><th>Parcelas</th><th>Valor Total</th><th>Data Ref</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntriesList.map((entry, index) => {
                // calcular valor total somando todas as parcelas
                const totalNum = entry.parcelas?.reduce((sum, p) => sum + parseFloat(p.valor), 0) || 0;
                const totalFormatted = formatter.format(totalNum);
                return (
                  <tr key={entry.id}>
                    <td>{index + 1}</td>
                    <td>{entry.cliente}</td>
                    <td>{entry.servico}</td>
                    <td>{entry.formaPagamento}</td>
                    <td>{entry.parcelas?.length || 1}</td>
                    <td>{totalFormatted}</td>
                    <td>{formatDateBrazil(entry.dataRef)}</td>
                    <td><Button variant="danger" size="sm" onClick={() => handleDeleteEntry(entry.id)}>Excluir</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}

export default Entradas; 