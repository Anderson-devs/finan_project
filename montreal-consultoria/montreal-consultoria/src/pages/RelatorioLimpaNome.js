import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Form, Row, Col, Card, Modal, ListGroup } from 'react-bootstrap';
import EntryController from '../controllers/EntryController';
import ClientController from '../controllers/ClientController';
import { ClientRepository } from '../repositories/ClientRepository';
import { formatDateBrazil } from '../utils/date';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';

export default function RelatorioLimpaNome() {
  // Entradas brutas para Limpa Nome, inicializa de sessionStorage se existir
  const [rawEntries, setRawEntries] = useState(() => {
    const stored = localStorage.getItem('rawEntries');
    return stored ? JSON.parse(stored) : [];
  });
  const [clients, setClients] = useState([]);
  const [localClients, setLocalClients] = useState([]);
  // Filtro por nome de cliente
  const [nameFilter, setNameFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [highlightNext3Days, setHighlightNext3Days] = useState(false);
  // Toggle para mostrar apenas os pagos hoje
  const [highlightTodayPaid, setHighlightTodayPaid] = useState(false);
  // Toggle para mostrar apenas parcelas em atraso
  const [showOverdue, setShowOverdue] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  // Novo toggle para mostrar apenas itens com custo > 0
  const [showCost, setShowCost] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [finalizeList, setFinalizeList] = useState(false);
  const [sendForPayment, setSendForPayment] = useState(false);
  const [selectedService, setSelectedService] = useState('Todos');
  const [dados, setDados] = useState([]);
  // Helper for marking paid rows (persisted)
  const [paidRows, setPaidRows] = useState(() => JSON.parse(localStorage.getItem('limpaNomePaidRows') || '[]'));
  // Loading inicial baseado na existência de dados em sessionStorage
  const [loading, setLoading] = useState(() => {
    const stored = localStorage.getItem('rawEntries');
    return stored ? false : true;
  });
  // Custo fixo: valor persistido e input temporário
  const initialCost = parseFloat(localStorage.getItem('custoLimpaNome') || '120');
  const [custoPadrao, setCustoPadrao] = useState(initialCost);
  // Editable cost values per row, persisted in localStorage
  const initialCostEdits = JSON.parse(localStorage.getItem('custoEdits') || '{}');
  const [costEdits, setCostEdits] = useState(initialCostEdits);
  // Linhas de custo aplicadas para pagamento
  const [appliedRows, setAppliedRows] = useState(() => JSON.parse(localStorage.getItem('limpaNomeAppliedRows') || '[]'));

  useEffect(() => {
    localStorage.setItem('limpaNomePaidRows', JSON.stringify(paidRows));
    localStorage.setItem('limpaNomeAppliedRows', JSON.stringify(appliedRows));
  }, [paidRows, appliedRows]);

  useEffect(() => {
    ClientController.searchClients('').then(setClients);
    ClientRepository.search('').then(setLocalClients);
  }, []);

  // Função para buscar e atualizar entradas
  const fetchEntries = async () => {
    setLoading(true);
    const todas = await EntryController.getEntries();
    setRawEntries(todas);
    localStorage.setItem('rawEntries', JSON.stringify(todas));
    setLoading(false);
  };
  // Carrega entradas apenas ao entrar na rota (remove polling automático)
  useEffect(() => {
    fetchEntries();
  }, []);
  // Re-fetch ao navegar para esta rota
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === '/relatorios/limpa-nome') {
      // Reset to Todos filter on navigation, so summaries update immediately
      setSelectedService('Todos');
      fetchEntries();
    }
  }, [location]);

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

  // Dados filtrados por nome de cliente
  const filteredDados = dados.filter(d => {
    const matchesName = d.cliente.toLowerCase().includes(nameFilter.toLowerCase());
    const dDate = new Date(d.data);
    const matchesFrom = dateFrom ? dDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? dDate <= new Date(dateTo) : true;
    return matchesName && matchesFrom && matchesTo;
  });

  // Combina clientes locais e remotos para lookup de CPF
  const allClients = [...clients, ...localClients];
  // Dados de preview: clientes do serviço Limpa Nome com custo (editado ou padrão) > 10 e com CPF
  const previewData = Array.from(new Set(
    filteredDados.filter(d => {
      if (d.servico !== 'Limpa Nome') return false;
      const key = `${d.entryId}-${d.parcelaIndex}`;
      const costVal = costEdits[key] != null ? costEdits[key] : d.rawCost;
      return costVal > 10;
    }).map(d => d.cliente)
  ))
    .map(name => {
      const clientObj = allClients.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
      return { name, cpf: clientObj?.cpfCnpj || '' };
    })
    .filter(item => item.cpf);

  // Função para alternar marcação de parcela como paga
  const handleTogglePaid = (row) => {
    const key = `${row.entryId}-${row.parcelaIndex}`;
    setPaidRows(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Dados all Parcels para cards de resumo
  const entriesFiltered = rawEntries.filter(e => selectedService === 'Todos' || e.servico === selectedService);
  const allParcels = entriesFiltered.flatMap(e => e.parcelas.map(p => ({
    dateOnly: p.data.split('T')[0],
    valor: parseFloat(p.valor) || 0
  })));
  // Filtrar parcelas pelo intervalo de datas
  const parcelsDateFiltered = allParcels.filter(p => {
    const [y, m, d] = p.dateOnly.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const fromDateObj = dateFrom ? new Date(dateFrom) : null;
    const toDateObj = dateTo ? new Date(dateTo) : null;
    return (!fromDateObj || dateObj >= fromDateObj) && (!toDateObj || dateObj <= toDateObj);
  });
  // Build reference date (midnight) from dateFrom or today
  let reference;
  if (dateFrom) {
    const [yr, mo, da] = dateFrom.split('-').map(Number);
    reference = new Date(yr, mo - 1, da);
  } else {
    const now = new Date();
    reference = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  // 'Hoje'
  const totalToday = parcelsDateFiltered.reduce((sum, p) => {
    const [y, m, d] = p.dateOnly.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getTime() === reference.getTime() ? sum + p.valor : sum;
  }, 0);
  // Próximos 3 dias
  const threeDays = new Date(reference); threeDays.setDate(reference.getDate() + 3);
  const totalWeek = parcelsDateFiltered.reduce((sum, p) => {
    const [y, m, d] = p.dateOnly.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj >= reference && dateObj < threeDays ? sum + p.valor : sum;
  }, 0);
  // Mês Atual
  const totalMonth = parcelsDateFiltered.reduce((sum, p) => {
    const [y, m] = p.dateOnly.split('-').map(Number);
    return y === reference.getFullYear() && (m - 1) === reference.getMonth() ? sum + p.valor : sum;
  }, 0);
  // Total de valores marcados como pagos
  const totalPaid = entriesFiltered.flatMap(e => e.parcelas.map((p, idx) => ({
    key: `${e.id}-${idx}`,
    dateOnly: p.data.split('T')[0],
    valor: parseFloat(p.valor) || 0
  })))
    .filter(item => paidRows.includes(item.key))
    .filter(item => {
      const [y, m, d] = item.dateOnly.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const fromDateObj = dateFrom ? new Date(dateFrom) : null;
      const toDateObj = dateTo ? new Date(dateTo) : null;
      return (!fromDateObj || dateObj >= fromDateObj) && (!toDateObj || dateObj <= toDateObj);
    })
    .reduce((sum, item) => sum + item.valor, 0);
  // Total de valores pagos hoje (para card quando acionado)
  const totalPaidTodayPaid = filteredDados.reduce((sum, d) => {
    const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);
    const key = `${d.entryId}-${d.parcelaIndex}`;
    if (dateObj.getTime() === reference.getTime() && paidRows.includes(key)) {
      return sum + d.rawValor;
    }
    return sum;
  }, 0);
  // Total de próximos 3 dias sem pagos (para card ao clicar)
  const totalWeekUnpaid = filteredDados.reduce((sum, d) => {
    const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);
    const key = `${d.entryId}-${d.parcelaIndex}`;
    if (dateObj > reference && dateObj <= threeDays && !paidRows.includes(key)) {
      return sum + d.rawValor;
    }
    return sum;
  }, 0);
  // Total de parcelas em atraso (antes de 'hoje') dentro do contexto filtrado
  const totalOverdue = filteredDados.reduce((sum, d) => {
    const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
    const dateObj = new Date(y, m - 1, day);
    const key = `${d.entryId}-${d.parcelaIndex}`;
    return (dateObj.getTime() < reference.getTime() && !paidRows.includes(key))
      ? sum + d.rawValor
      : sum;
  }, 0);
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
  const costTotal = entriesFiltered
    .filter(e => {
      const dateOnly = e.parcelas[0]?.data.split('T')[0];
      const [y, m, d] = dateOnly.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const fromDateObj = dateFrom ? new Date(dateFrom) : null;
      const toDateObj = dateTo ? new Date(dateTo) : null;
      return (!fromDateObj || dateObj >= fromDateObj) && (!toDateObj || dateObj <= toDateObj);
    })
    .reduce((sum, e) => {
      const key = `${e.id}-0`;
      const isLimpaNome = e.servico === 'Limpa Nome';
      const defaultCost = isLimpaNome ? custoPadrao : 0;
      const costVal = costEdits[key] != null ? costEdits[key] : defaultCost;
      return sum + costVal;
    }, 0);
  // Saldo Líquido mensal (Total do mês menos custo total)
  const saldoLiquido = totalMonth - costTotal;
  // Filtra apenas parcelas não pagas nos próximos 3 dias quando ativo
  let displayDados = filteredDados;
  if (showCost) {
    displayDados = filteredDados.filter(d => {
      const key = `${d.entryId}-${d.parcelaIndex}`;
      const costVal = costEdits[key] != null ? costEdits[key] : d.rawCost;
      return costVal > 0;
    });
  } else if (showPaid) {
    displayDados = filteredDados
      .filter(d => {
        const key = `${d.entryId}-${d.parcelaIndex}`;
        return paidRows.includes(key);
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  } else if (showOverdue) {
    displayDados = filteredDados.filter(d => {
      const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
      const dateObj = new Date(y, m - 1, day);
      const key = `${d.entryId}-${d.parcelaIndex}`;
      return dateObj.getTime() < reference.getTime() && !paidRows.includes(key);
    });
  } else if (highlightTodayPaid) {
    displayDados = filteredDados.filter(d => {
      const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
      const dateObj = new Date(y, m - 1, day);
      const key = `${d.entryId}-${d.parcelaIndex}`;
      return dateObj.getTime() === reference.getTime() && paidRows.includes(key);
    });
  } else if (highlightNext3Days) {
    const today = reference;
    const next3 = threeDays;
    displayDados = filteredDados.filter(d => {
      const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
      const dateObj = new Date(y, m - 1, day);
      const key = `${d.entryId}-${d.parcelaIndex}`;
      return dateObj > today && dateObj <= next3 && !paidRows.includes(key);
    });
  }

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

  // Exportar Excel com Nome e CPF, aceita lista de chaves a exportar
  const exportExcel = (keys) => {
    // Preparar dados de export a partir das chaves fornecidas (keys)
    // Combinar clientes remotos e locais
    const allClients = [...clients, ...localClients];
    const names = keys.map(key => {
      const [entryId, idx] = key.split('-');
      const d = filteredDados.find(
        x => `${x.entryId}` === entryId && `${x.parcelaIndex}` === idx
      );
      return d ? d.cliente : '';
    }).filter(name => name);
    const uniqueNames = Array.from(new Set(names));
    // Gerar lista incluindo CPF buscando em allClients por nome (case-insensitive)
    const exportData = uniqueNames.map(name => {
      const clientObj = allClients.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
      const cpf = clientObj?.cpfCnpj || clientObj?.cpf || clientObj?.cnpj || '';
      return { Cliente: name, CPF: cpf };
    });
    const ws = XLSX.utils.json_to_sheet(exportData, { header: ['Cliente','CPF'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista');
    XLSX.writeFile(wb, 'relatorio_limpa_nome.xlsx');
  };

  // Confirmar exportação e ações de finalizar lista/enviar para pagamento
  const confirmExport = () => {
    // Chaves dos custos (primeira parcela) do serviço Limpa Nome com custo (editado ou padrão) >10
    const costKeys = filteredDados.filter(d => {
      if (d.servico !== 'Limpa Nome') return false;
      const key = `${d.entryId}-${d.parcelaIndex}`;
      const costVal = costEdits[key] != null ? costEdits[key] : d.rawCost;
      return costVal > 10;
    }).map(d => `${d.entryId}-${d.parcelaIndex}`);
    // Atualizar appliedRows se necessário
    if (sendForPayment) {
      setAppliedRows(prev => [...new Set([...prev, ...costKeys])]);
    }
    // Gerar e baixar Excel sempre para costKeys
    exportExcel(costKeys);
    if (finalizeList) {
      // Resetar ciclo semanal
      setPaidRows([]);
      setCostEdits({});
      setAppliedRows([]);
    }
    // Reset de filtros
    setShowOverdue(false);
    setHighlightTodayPaid(false);
    setHighlightNext3Days(false);
    setShowPaid(false);
    setNameFilter('');
    setDateFrom('');
    setDateTo('');
    setFinalizeList(false);
    setSendForPayment(false);
    setShowExportModal(false);
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
      <Form.Group controlId="dateFilter" className="mb-3">
        <Form.Label>Filtrar por Data</Form.Label>
        <Row>
          <Col>
            <Form.Control type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </Col>
          <Col>
            <Form.Control type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </Col>
        </Row>
      </Form.Group>
      <Form.Group controlId="nameFilter" className="mb-3">
        <Form.Label>Buscar por Cliente</Form.Label>
        <Form.Control type="text" placeholder="Digite o nome do cliente" value={nameFilter} onChange={e => setNameFilter(e.target.value)} />
      </Form.Group>
      {/* Resumo por período */}
      <Row className="mb-4">
        <Col>
          <Card
            bg="info"
            text="white"
            className="text-center"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setHighlightTodayPaid(prev => !prev);
              setShowPaid(false);
              setShowOverdue(false);
              setHighlightNext3Days(false);
            }}
          >
            <Card.Body>
              <Card.Title>Hoje</Card.Title>
              <Card.Text>
                {(highlightTodayPaid ? totalPaidTodayPaid : totalToday).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card bg="warning" text="dark" className="text-center" style={{cursor: 'pointer'}}
            onClick={() => {
              setHighlightNext3Days(prev => !prev);
              setShowPaid(false);
              setShowOverdue(false);
              setHighlightTodayPaid(false);
            }}
          >
            <Card.Body>
              <Card.Title>Próximos 3 dias</Card.Title>
              <Card.Text>{(highlightNext3Days ? totalWeekUnpaid : totalWeek).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card bg="danger" text="white" className="text-center" style={{ cursor: 'pointer' }}
            onClick={() => {
              setShowOverdue(prev => !prev);
              setShowPaid(false);
              setHighlightTodayPaid(false);
              setHighlightNext3Days(false);
            }}
          >
            <Card.Body>
              <Card.Title>Atrasados</Card.Title>
              <Card.Text>{totalOverdue.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col><Card bg="primary" text="white" className="text-center"><Card.Body><Card.Title>Mês Atual</Card.Title><Card.Text>{totalMonth.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col>
          <Card bg="dark" text="white" className="text-center">
            <Card.Body>
              <Card.Title>Realizado Hoje</Card.Title>
              <Card.Text>{totalPaidTodayPaid.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card
            bg="success"
            text="white"
            className="text-center"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setShowPaid(prev => !prev);
              setShowOverdue(false);
              setHighlightTodayPaid(false);
              setHighlightNext3Days(false);
            }}
          >
            <Card.Body>
              <Card.Title>Pagos</Card.Title>
              <Card.Text>{totalPaid.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col><Card bg="light" text="success" className="text-center"><Card.Body><Card.Title>Saldo Líquido</Card.Title><Card.Text>{saldoLiquido.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text></Card.Body></Card></Col>
        <Col>
          <Card
            bg={showCost ? "primary" : "danger"}
            text="white"
            className="text-center"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setShowCost(prev => !prev);
              setShowPaid(false);
              setShowOverdue(false);
              setHighlightTodayPaid(false);
              setHighlightNext3Days(false);
            }}
          >
            <Card.Body>
              <Card.Title>Custo Total</Card.Title>
              <Card.Text>{costTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Data</th><th>Cliente</th><th>Serviço</th><th>Valor Parcela</th><th>Custo</th><th>Lucro</th><th>% Lucro</th><th>Marcar pago</th>
              </tr>
            </thead>
            <tbody>
              {displayDados.length === 0 ? (
                <tr><td colSpan={8} className="text-center">Nenhuma entrada para Limpa Nome</td></tr>
              ) : displayDados.map((d,i) => {
                const key = `${d.entryId}-${d.parcelaIndex}`;
                const [y, m, day] = d.data.split('T')[0].split('-').map(Number);
                const dateObj = new Date(y, m - 1, day);
                // reuse outer reference and threeDays for row styling
                let rowClass = '';
                if (paidRows.includes(key)) rowClass = 'table-success';
                else if (dateObj.getTime() === reference.getTime()) rowClass = 'table-info';
                else if (dateObj > reference && dateObj <= threeDays) rowClass = 'table-warning';
                else if (dateObj.getTime() < reference.getTime()) rowClass = 'bg-danger text-white';
                return (
                  <tr
                    key={key}
                    className={rowClass}
                    style={dateObj.getTime() < reference.getTime() && !paidRows.includes(key) ? { backgroundColor: '#dc3545', color: 'white' } : {}}
                  >
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
                    <td>
                      {d.rawValor > 0
                        ? `${((d.rawLucro / d.rawValor) * 100).toFixed(2)}%`
                        : '-'}
                    </td>
                    <td>
                      <Button size="sm" variant={paidRows.includes(key) ? 'danger' : 'success'} onClick={() => handleTogglePaid(d)}>
                        {paidRows.includes(key) ? 'Desmarcar' : 'Marcar pago'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Button variant="secondary" className="mt-3" onClick={handleExport}>Exportar CSV</Button>
          <Button variant="primary" className="mt-3 ms-2" onClick={() => setShowExportModal(true)}>Enviar Lista</Button>
        </>
      )}
      {/* Modal para opção de finalizar lista e enviar para pagamento */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enviar Lista</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Serão enviados no Excel os seguintes clientes:</p>
          <ListGroup variant="flush" className="mb-3">
            {previewData.map((item, i) => (
              <ListGroup.Item key={i}>{item.name} - {item.cpf}</ListGroup.Item>
            ))}
          </ListGroup>
          <Form.Check type="checkbox" id="finalizeList" label="Finalizar Lista" checked={finalizeList} onChange={() => setFinalizeList(prev => !prev)} />
          <Form.Check type="checkbox" id="sendForPayment" label="Enviar para Pagamento" checked={sendForPayment} onChange={() => setSendForPayment(prev => !prev)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={confirmExport}>Confirmar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
} 