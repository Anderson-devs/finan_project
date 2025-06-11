import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import EntryController from '../controllers/EntryController';
import SaidaController from '../controllers/SaidaController';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [saidas, setSaidas] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const ent = await EntryController.getEntries();
      const sai = await SaidaController.getSaidas();
      setEntries(ent);
      setSaidas(sai);
    }
    fetchData();
  }, []);

  const today = new Date();
  const entryParcels = entries.reduce((acc, e) => {
    const parcels = e.parcelas && e.parcelas.length > 0 ? e.parcelas : [{ valor: e.valorTotal, data: e.dataRef }];
    parcels.forEach(p => acc.push({ valor: parseFloat(p.valor), data: p.data }));
    return acc;
  }, []);
  const saidaItems = saidas.map(s => ({ valor: parseFloat(s.valor), data: s.data }));

  const sumValues = (items, predicate) => items.filter(predicate).reduce((sum, i) => sum + i.valor, 0);
  const formatBRL = val => `R$ ${val.toFixed(2)}`;
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);

  const entradasDia = formatBRL(sumValues(entryParcels, p => new Date(p.data).toDateString() === today.toDateString()));
  const receberHoje = formatBRL(sumValues(entryParcels, p => new Date(p.data).toDateString() === today.toDateString()));
  const receberSemana = formatBRL(sumValues(entryParcels, p => { const d = new Date(p.data); return d >= startOfWeek && d <= endOfWeek; }));
  const receberMes = formatBRL(sumValues(entryParcels, p => { const d = new Date(p.data); return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); }));

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
    return { label: date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }), date };
  });
  const dataMonthly = months.map(m => {
    const ent = sumValues(entryParcels, p => { const d = new Date(p.data); return d.getMonth() === m.date.getMonth() && d.getFullYear() === m.date.getFullYear(); });
    const sai = sumValues(saidaItems, p => { const d = new Date(p.data); return d.getMonth() === m.date.getMonth() && d.getFullYear() === m.date.getFullYear(); });
    return { month: m.label, Entradas: ent, 'Saídas': sai };
  });

  const days = Array.from({ length: 30 }, (_, i) => { const date = new Date(today); date.setDate(today.getDate() - (29 - i)); return date; });
  const dataDaily = days.map(d => {
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const ent = sumValues(entryParcels, p => new Date(p.data).toDateString() === d.toDateString());
    const sai = sumValues(saidaItems, p => new Date(p.data).toDateString() === d.toDateString());
    return { date: label, valor: ent - sai };
  });

  const serviceDistribution = entries.reduce((acc, e) => {
    const totalValue = e.parcelas.reduce((sum, p) => sum + (parseFloat(p.valor) || 0), 0);
    acc[e.servico] = (acc[e.servico] || 0) + totalValue;
    return acc;
  }, {});
  const pieData = Object.entries(serviceDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <Container fluid className="mt-4">
      <Row className="g-3">
        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Total de entradas do dia</Card.Title>
              <Card.Text>{entradasDia}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Valores a receber hoje</Card.Title>
              <Card.Text>{receberHoje}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Valores a receber na semana</Card.Title>
              <Card.Text>{receberSemana}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6} lg={3}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Valores a receber no mês</Card.Title>
              <Card.Text>{receberMes}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="g-3 mt-3">
        <Col xs={12} md={4}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Distribuição de Entradas por Serviço</Card.Title>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Entradas × Saídas (12 meses)</Card.Title>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataMonthly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Entradas" fill="#0E63FE" />
                  <Bar dataKey="Saídas" fill="#14B8A6" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="shadow-sm rounded">
            <Card.Body>
              <Card.Title>Fluxo de Caixa Diário (30 dias)</Card.Title>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dataDaily} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="valor" stroke="#0E63FE" />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard; 