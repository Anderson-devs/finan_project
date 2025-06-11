import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Table, Spinner, Tabs, Tab } from 'react-bootstrap';
import SaidaController from '../controllers/SaidaController';
import ServiceController from '../controllers/ServiceController';
import ClientController from '../controllers/ClientController';
import { formatDateBrazil } from '../utils/date';

function Saidas() {
  const [rawSaidas, setRawSaidas] = useState([]);
  const [services, setServices] = useState([]);
  const [filterService, setFilterService] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaidas();
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

  const totalSaidas = rawSaidas.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);
  const descontoDefault = 0; // placeholder para futuros descontos
  const saldoLiquidoPJ = totalSaidas - descontoDefault;
  const totalFiltered = filteredSaidas.reduce((sum, s) => sum + (parseFloat(s.valor) || 0), 0);

  return (
    <Container fluid className="mt-4">
      <Tabs defaultActiveKey="pj" id="saidas-tabs" className="mb-3">
        <Tab eventKey="pf" title="Pessoa Física">
          <Card className="text-center shadow-sm rounded">
            <Card.Body>
              <Card.Title>Saídas PF</Card.Title>
              <Card.Text>Em construção</Card.Text>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="pj" title="Pessoa Jurídica">
          <Row>
            <Col>
              <Card className="text-center shadow-sm rounded mb-3">
                <Card.Body>
                  <Card.Title>Saldo Total de Saídas PJ</Card.Title>
                  <Card.Text>{totalSaidas.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card className="text-center shadow-sm rounded mb-3">
                <Card.Body>
                  <Card.Title>Saldo Líquido PJ</Card.Title>
                  <Card.Text>{saldoLiquidoPJ.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Form.Group controlId="filterService" className="mb-3">
            <Form.Label>Filtrar por Serviço</Form.Label>
            <Form.Select value={filterService} onChange={e => setFilterService(e.target.value)}>
              {servicesOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </Form.Select>
          </Form.Group>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Valor</th><th>Justificativa</th></tr>
              </thead>
              <tbody>
                {filteredSaidas.length === 0 ? (
                  <tr><td colSpan={5} className="text-center">Nenhuma saída</td></tr>
                ) : filteredSaidas.map(s => (
                  <tr key={s.id}>
                    <td>{formatDateBrazil(s.data)}</td>
                    <td>{s.cliente}</td>
                    <td>{s.nome}</td>
                    <td>{parseFloat(s.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                    <td>{s.justificativa}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-end"><strong>Total:</strong></td>
                  <td colSpan={2}>{totalFiltered.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                </tr>
              </tfoot>
            </Table>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Saidas; 