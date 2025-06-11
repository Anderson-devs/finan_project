import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import SaidaController from '../controllers/SaidaController';
import EntryController from '../controllers/EntryController';
import ServiceController from '../controllers/ServiceController';
import ClientController from '../controllers/ClientController';
import { formatDateBrazil } from '../utils/date';

function Saidas() {
  const [rawSaidas, setRawSaidas] = useState([]);
  const [rawEntries, setRawEntries] = useState([]);
  const [services, setServices] = useState([]);
  const [filterService, setFilterService] = useState('Todos');
  const [loading, setLoading] = useState(true);

  // Mirror report's paidRows persisted key
  const [paidRows, setPaidRows] = useState(() => JSON.parse(localStorage.getItem('limpaNomePaidRows') || '[]'));
  useEffect(() => {
    localStorage.setItem('limpaNomePaidRows', JSON.stringify(paidRows));
  }, [paidRows]);
  const handleMarkAsPaid = id => {
    if (!paidRows.includes(id)) setPaidRows(prev => [...prev, id]);
  };

  // Initial cash balance in caixa
  const [startingCash, setStartingCash] = useState(() => parseFloat(localStorage.getItem('startingCash') || '0'));
  const [displayStartingCash, setDisplayStartingCash] = useState(() => new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(startingCash));
  useEffect(() => {
    localStorage.setItem('startingCash', startingCash);
    setDisplayStartingCash(new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(startingCash));
  }, [startingCash]);

  useEffect(() => {
    loadSaidas();
    EntryController.getEntries().then(setRawEntries);
    ServiceController.searchServices('').then(setServices);
  }, []);

  const loadSaidas = async () => {
    setLoading(true);
    const all = await SaidaController.getSaidas();
    setRawSaidas(all);
    setLoading(false);
  };

  const servicesOptions = ['Todos', ...services.map(s => s.name)];
  const filteredSaidas = rawSaidas.filter(s => filterService === 'Todos' || s.nome === filterService);
  const filteredEntries = rawEntries.filter(e => filterService === 'Todos' || e.servico === filterService);
  // Compute Pagos PJ from report entries
  const totalReportPaid = filteredEntries
    .flatMap(e => e.parcelas.map((p, idx) => ({ key: `${e.id}-${idx}`, valor: parseFloat(p.valor) || 0 })))
    .filter(item => paidRows.includes(item.key))
    .reduce((sum, item) => sum + item.valor, 0);

  const totalFiltered = filteredSaidas.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
  const saldoLiquidoPJ = totalFiltered - totalReportPaid;

  // Manual expenses state and handlers
  const [manualName, setManualName] = useState('');
  const [manualObservations, setManualObservations] = useState('');
  const [manualValor, setManualValor] = useState('');
  const [paymentType, setPaymentType] = useState('avista');
  const [parcelasCount, setParcelasCount] = useState(2);
  const [manualExpenses, setManualExpenses] = useState(() => JSON.parse(localStorage.getItem('manualExpenses') || '[]'));
  useEffect(() => {
    localStorage.setItem('manualExpenses', JSON.stringify(manualExpenses));
  }, [manualExpenses]);

  // Derivo nomes únicos para sugestões no campo Nome do Evento
  const eventNames = Array.from(new Set(manualExpenses.map(me => me.name).filter(n => n)));

  const handleAddManual = e => {
    e.preventDefault();
    setManualExpenses(prev => [...prev, {
      name: manualName,
      observations: manualObservations,
      valor: manualValor,
      paymentType,
      parcelas: paymentType === 'parcelado' ? parcelasCount : 1
    }]);
    // limpa campos sem confirmação
    setManualName(''); setManualObservations(''); setManualValor(''); setPaymentType('avista'); setParcelasCount(2);
  };
  const handleRemoveManual = idx => {
    setManualExpenses(prev => prev.filter((_, i) => i !== idx));
  };

  // Cálculo de Total Manual e Saldo Restante
  const totalManual = manualExpenses.reduce((sum, me) => sum + ((parseFloat(me.valor) || 0) / me.parcelas), 0);
  const netRemaining = totalReportPaid - totalManual;

  // Compute cost of paid operations from report entries
  const costEdits = JSON.parse(localStorage.getItem('custoEdits') || '{}');
  const custoPadrao = parseFloat(localStorage.getItem('custoLimpaNome') || '120');
  const costSum = filteredEntries
    .flatMap(e => e.parcelas.map((p, idx) => ({ key: `${e.id}-${idx}`, rawCost: idx === 0 && e.servico === 'Limpa Nome' ? custoPadrao : 0 })))
    .filter(item => paidRows.includes(item.key))
    .reduce((sum, item) => sum + (costEdits[item.key] != null ? costEdits[item.key] : item.rawCost), 0);
  // Net balance: starting cash + receipts paid - operation costs
  const netBalance = startingCash + totalReportPaid - costSum;

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col md={12} className="pe-3">
          <Link to="/relatorios/limpa-nome" className="text-decoration-none">
            <div className="p-2 mb-3 bg-danger text-white text-center" style={{ cursor: 'pointer' }}>DESPESAS EMPRESA</div>
          </Link>
          <Row>
            <Col>
              <Card bg="light" text="dark" className="shadow-sm rounded mb-3" style={{ fontSize: '0.9rem' }}>
                <Card.Body>
                  <Card.Title className="fs-6">Saldo em Caixa</Card.Title>
                  <Form.Control
                    type="text"
                    value={displayStartingCash}
                    onChange={e => setDisplayStartingCash(e.target.value)}
                    onBlur={() => {
                      const parsed = Number(displayStartingCash.replace(/\./g,'').replace(',', '.')) || 0;
                      setStartingCash(parsed);
                    }}
                    className="mb-2"
                  />
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setStartingCash(totalReportPaid)}
                  >Sincronizar Caixa</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card bg="success" text="white" className="shadow-sm rounded mb-3" style={{ fontSize: '0.9rem' }}>
                <Card.Body>
                  <Card.Title className="fs-6">Pagos PJ</Card.Title>
                  <Card.Text className="fs-6">{totalReportPaid.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="text-center shadow-sm rounded mb-3" style={{ fontSize: '0.9rem' }}>
                <Card.Body>
                  <Card.Title className="fs-6">Total Despesas</Card.Title>
                  <Card.Text className="fs-6">{totalManual.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="text-center shadow-sm rounded mb-3" style={{ fontSize: '0.9rem' }}>
                <Card.Body>
                  <Card.Title className="fs-6">Saldo Restante</Card.Title>
                  <Card.Text className="fs-6">{netRemaining.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="text-center shadow-sm rounded mb-3" style={{ fontSize: '0.9rem' }}>
                <Card.Body>
                  <Card.Title className="fs-6">Saldo Líquido</Card.Title>
                  <Card.Text className="fs-6">{netBalance.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {/* Manual expense form */}
          <Form onSubmit={handleAddManual} className="mb-3">
            <Form.Group controlId="manualName" className="mb-2">
              <Form.Label>Nome do Evento</Form.Label>
              <Form.Control
                type="text"
                list="eventNames"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                required
              />
              <datalist id="eventNames">
                {eventNames.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
            </Form.Group>
            <Form.Group controlId="manualObservations" className="mb-2">
              <Form.Label>Observações</Form.Label>
              <Form.Control as="textarea" rows={2} value={manualObservations} onChange={e => setManualObservations(e.target.value)} />
            </Form.Group>
            <Form.Group controlId="manualValor" className="mb-2">
              <Form.Label>Valor</Form.Label>
              <Form.Control type="number" step="0.01" value={manualValor} onChange={e => setManualValor(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Tipo de Pagamento</Form.Label><br/>
              <Form.Check inline label="À vista" name="paymentType" type="radio" value="avista" checked={paymentType === 'avista'} onChange={e => setPaymentType(e.target.value)} />
              <Form.Check inline label="Parcelado" name="paymentType" type="radio" value="parcelado" checked={paymentType === 'parcelado'} onChange={e => setPaymentType(e.target.value)} />
            </Form.Group>
            {paymentType === 'parcelado' && (
              <Form.Group controlId="parcelasCount" className="mb-2">
                <Form.Label>Parcelas</Form.Label>
                <Form.Control type="number" min="2" value={parcelasCount} onChange={e => setParcelasCount(Number(e.target.value))} />
              </Form.Group>
            )}
            <Button type="submit">Adicionar Despesa</Button>
          </Form>
          {/* Combined report costs and manual expenses */}
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Nome</th><th>Observações</th><th>Valor</th><th>Pagamento</th><th>Parcelas</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* Report cost items based on filter */}
              {filteredSaidas.map(s => {
                const isPaid = paidRows.includes(s.id);
                return (
                  <tr key={`cost-${s.id}`} className={isPaid ? 'table-success' : ''}>
                    <td>{s.nome}</td>
                    <td>{s.justificativa}</td>
                    <td>{parseFloat(s.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                    <td>{isPaid ? 'Pago' : ''}</td>
                    <td>1</td>
                    <td>
                      {!isPaid && <Button size="sm" onClick={() => handleMarkAsPaid(s.id)}>Pagar</Button>}
                    </td>
                  </tr>
                );
              })}
              {/* Manual added expenses */}
              {manualExpenses.map((me, i) => (
                <tr key={`manual-${i}`}> 
                  <td>{me.name}</td>
                  <td>{me.observations}</td>
                  <td>{(parseFloat(me.valor) / me.parcelas).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td>{me.paymentType === 'avista' ? 'À vista' : 'Parcelado'}</td>
                  <td>{me.parcelas}</td>
                  <td><Button variant="danger" size="sm" onClick={() => handleRemoveManual(i)}>Remover</Button></td>  
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
}

export default Saidas; 