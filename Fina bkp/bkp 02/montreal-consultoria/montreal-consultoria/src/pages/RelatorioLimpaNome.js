import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Form, Row, Col, Card } from 'react-bootstrap';
import EntryController from '../controllers/EntryController';
import { formatDateBrazil } from '../utils/date';

function RelatorioLimpaNome() {
  // Entradas brutas para Limpa Nome
  const [rawEntries, setRawEntries] = useState([]);
  const [selectedService, setSelectedService] = useState('Todos');
  const [dados, setDados] = useState([]);
  const [paidRows, setPaidRows] = useState([]);
  const [loading, setLoading] = useState(true);
  // Custo fixo: valor persistido e input temporário
  const initialCost = parseFloat(localStorage.getItem('custoLimpaNome') || '120');
  const [custoPadrao, setCustoPadrao] = useState(initialCost);
  // Editable cost values per row, persisted in localStorage
  const initialCostEdits = JSON.parse(localStorage.getItem('custoEdits') || '{}');
  const [costEdits, setCostEdits] = useState(initialCostEdits);

  // Buscar e atualizar entradas periodicamente (polling) para refletir novas entradas em tempo real
  useEffect(() => {
    let mounted = true;
    async function fetchEntries() {
      const todas = await EntryController.getEntries();
      if (!mounted) return;
      setRawEntries(todas);
      setLoading(false);
    }
    fetchEntries();
    const intervalId = setInterval(fetchEntries, 5000);
    return () => { mounted = false; clearInterval(intervalId); };
  }, []);

  // Recalcular dados por parcela sempre que rawEntries ou custoPadrao mudem
  useEffect(() => {
    const entriesFiltered = rawEntries.filter(e => selectedService === 'Todos' || e.servico === selectedService);
    const parcelRows = entriesFiltered.slice().reverse().flatMap(e => {
      return e.parcelas.map((p, idx) => {
        const valor = parseFloat(p.valor) || 0;
        // Custo somente na primeira parcela
        const isLimpaNome = e.servico === 'Limpa Nome';
        const custo = idx === 0 && isLimpaNome ? custoPadrao : 0;
        // Lucro: valor descontado do custo na primeira parcela, caso seja 'Limpa Nome'
        const lucroRaw = idx === 0 ? (valor - custo) : valor;
        return {
          entryId: e.id,
          parcelaIndex: idx,
          data: p.data,
          cliente: e.cliente,
          servico: e.servico,
          rawValor: valor,
          rawCost: custo,
          rawLucro: lucroRaw,
          valorParcela: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          custo: custo ? custoPadrao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
          lucro: lucroRaw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        };
      });
    });
    setDados(parcelRows);
  }, [rawEntries, custoPadrao, selectedService]);

  // Função para marcar parcela como paga
  const handleMarkAsPaid = (row) => {
    const key = `${row.entryId}-${row.parcelaIndex}`;
    setPaidRows(prev => prev.includes(key) ? prev : [...prev, key]);
  };

  // Dados all Parcels para cards de resumo
  const entriesFiltered = rawEntries.filter(e => selectedService === 'Todos' || e.servico === selectedService);
  const allParcels = entriesFiltered.flatMap(e => e.parcelas.map(p => ({
    dateOnly: p.data.split('T')[0],
    valor: parseFloat(p.valor) || 0
  })));
  // Datas de referência (meia-noite local)
  const reference = new Date(); reference.setHours(0,0,0,0);
  // 'Hoje'
  const totalToday = allParcels.reduce((sum, p) => {
    const [y, m, d] = p.dateOnly.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getTime() === reference.getTime() ? sum + p.valor : sum;
  }, 0);
  // Próximos 3 dias
  const threeDays = new Date(reference); threeDays.setDate(reference.getDate() + 3);
  const totalWeek = allParcels.reduce((sum, p) => {
    const [y, m, d] = p.dateOnly.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj >= reference && dateObj < threeDays ? sum + p.valor : sum;
  }, 0);
  // Mês Atual
  const totalMonth = allParcels.reduce((sum, p) => {
    const [y, m] = p.dateOnly.split('-').map(Number);
    return y === reference.getFullYear() && (m - 1) === reference.getMonth() ? sum + p.valor : sum;
  }, 0);
  // Total de valores marcados como pagos
  const totalPaid = entriesFiltered.flatMap(e => e.parcelas.map((p, idx) => ({
    key: `${e.id}-${idx}`,
    valor: parseFloat(p.valor) || 0
  })))
    .filter(item => paidRows.includes(item.key))
    .reduce((sum, item) => sum + item.valor, 0);
  // Custo total do dia (somente primeira parcela ou custo editado)
  const costToday = entriesFiltered.reduce((sum, e) => {
    const first = e.parcelas[0];
    const dateOnly = first?.data.split('T')[0];
    const todayOnly = reference.toISOString().split('T')[0];
    if (dateOnly !== todayOnly) return sum;
    const key = `${e.id}-0`;
    const isLimpaNome = e.servico === 'Limpa Nome';
    const defaultCost = isLimpaNome ? custoPadrao : 0;
    const costVal = costEdits[key] != null ? costEdits[key] : defaultCost;
    return sum + costVal;
  }, 0);
  // Inserido: cálculo de custo total de serviços apenas 'Limpa Nome' (primeira parcela ou custo editado)
  const costTotal = entriesFiltered.reduce((sum, e) => {
    const key = `${e.id}-0`;
    const isLimpaNome = e.servico === 'Limpa Nome';
    const defaultCost = isLimpaNome ? custoPadrao : 0;
    const costVal = costEdits[key] != null ? costEdits[key] : defaultCost;
    return sum + costVal;
  }, 0);
  // Saldo Líquido do dia
  const saldoLiquido = totalToday - costToday;

  const handleExport = () => {
    const header = ['Data','Cliente','Serviço','Valor Parcela','Custo','Lucro'];
    const rows = dados.map(d => {
      const key = `${d.entryId}-${d.parcelaIndex}`;
      // Definir custo padrão apenas para 'Limpa Nome'
      const isLimpaNome = d.servico === 'Limpa Nome';
      const defaultCost = d.parcelaIndex === 0 && isLimpaNome ? custoPadrao : 0;
      const costVal = costEdits[key] != null ? costEdits[key] : defaultCost;
      const lucroVal = d.parcelaIndex === 0 ? d.rawValor - costVal : d.rawValor;
      return [
        d.data,
        d.cliente,
        d.servico,
        d.valorParcela,
        costVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        lucroVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ];
    });
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio_limpa_nome.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCostEdit = (key, value) => {
    // parse numeric value from input
    const num = parseFloat(value) || 0;
    const updated = { ...costEdits, [key]: num };
    setCostEdits(updated);
    localStorage.setItem('custoEdits', JSON.stringify(updated));
  };

  return (
    <Container className="mt-4">
      <h2>Relatório: Limpa Nome</h2>
      <Form.Group controlId="serviceFilter" className="mb-3">
        <Form.Label>Filtrar por Serviço</Form.Label>
        <Form.Select value={selectedService} onChange={e => setSelectedService(e.target.value)}>
          <option value="Todos">Todos</option>
          {Array.from(new Set(rawEntries.map(e => e.servico))).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Form.Select>
      </Form.Group>
      {/* Resumo por período */}
      <Row className="mb-4">
        <Col><Card bg="info" text="white" className="text-center"><Card.Body><Card.Title>Hoje</Card.Title><Card.Text>{totalToday.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col><Card bg="warning" text="dark" className="text-center"><Card.Body><Card.Title>Próximos 3 dias</Card.Title><Card.Text>{totalWeek.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col><Card bg="primary" text="white" className="text-center"><Card.Body><Card.Title>Mês Atual</Card.Title><Card.Text>{totalMonth.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col><Card bg="success" text="white" className="text-center"><Card.Body><Card.Title>Pagos</Card.Title><Card.Text>{totalPaid.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col><Card bg="light" text="success" className="text-center"><Card.Body><Card.Title>Saldo Líquido</Card.Title><Card.Text>{saldoLiquido.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col><Card bg="danger" text="white" className="text-center"><Card.Body><Card.Title>Custo Total</Card.Title><Card.Text>{costTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
      </Row>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Data</th><th>Cliente</th><th>Serviço</th><th>Valor Parcela</th><th>Custo</th><th>Lucro</th><th>Marcar pago</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr><td colSpan={6} className="text-center">Nenhuma entrada para Limpa Nome</td></tr>
              ) : dados.map((d,i) => {
                const key = `${d.entryId}-${d.parcelaIndex}`;
                const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
                const dateObj = new Date(y, m - 1, day);
                const reference = new Date(); reference.setHours(0,0,0,0);
                const threeDays = new Date(reference); threeDays.setDate(reference.getDate() + 3);
                let rowClass = '';
                if (paidRows.includes(key)) rowClass = 'table-success';
                else if (dateObj.getTime() < reference.getTime()) rowClass = 'table-danger';
                else if (dateObj > reference && dateObj <= threeDays) rowClass = 'table-warning';
                return (
                  <tr key={key} className={rowClass}>
                    <td>{formatDateBrazil(d.data)}</td>
                    <td>{d.cliente}</td>
                    <td>{d.servico}</td>
                    <td>{d.valorParcela}</td>
                    <td>
                      {d.parcelaIndex === 0 ? (
                        <Form.Control
                          type="number"
                          step="0.01"
                          size="sm"
                          value={costEdits[key] != null ? costEdits[key] : d.rawCost}
                          onChange={e => handleCostEdit(key, e.target.value)}
                        />
                      ) : null}
                    </td>
                    <td>
                      {(() => {
                        const costVal = costEdits[key] != null ? costEdits[key] : d.rawCost;
                        const lucroVal = d.parcelaIndex === 0 ? d.rawValor - costVal : d.rawValor;
                        return lucroVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                      })()}
                    </td>
                    <td><Button size="sm" variant="secondary" onClick={() => handleMarkAsPaid(d)}>Marcar pago</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Button variant="secondary" className="mt-3" onClick={handleExport}>Exportar CSV</Button>
        </>
      )}
    </Container>
  );
}

export default RelatorioLimpaNome; 