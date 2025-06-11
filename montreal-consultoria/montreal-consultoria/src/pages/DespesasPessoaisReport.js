import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Form, Table } from 'react-bootstrap';
import PersonalExpenseController from '../controllers/PersonalExpenseController';

export default function DespesasPessoaisReport() {
  const [period, setPeriod] = useState('day');
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      if (period === 'day') {
        setItems(await PersonalExpenseController.getExpensesToday());
      } else {
        const all = await PersonalExpenseController.getExpenses();
        // TODO: filtrar por semana, mês e ano no cliente ou criar endpoints
        setItems(all);
      }
    }
    load();
  }, [period]);

  return (
    <Container fluid className="mt-4">
      <h2>Relatório de Despesas Pessoais</h2>
      <Form.Select value={period} onChange={e => setPeriod(e.target.value)} className="mb-3" style={{ maxWidth: '200px' }}>
        <option value="day">Dia</option>
        <option value="week">Semana</option>
        <option value="month">Mês</option>
        <option value="year">Ano</option>
      </Form.Select>
      <Table striped bordered>
        <thead><tr><th>Data</th><th>Descrição</th><th>Valor (R$)</th></tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{new Date(it.date).toLocaleDateString()}</td>
              <td>{it.description}</td>
              <td>{parseFloat(it.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th colSpan={2}>{items.reduce((sum, it) => sum + parseFloat(it.amount), 0).toFixed(2)}</th>
          </tr>
        </tfoot>
      </Table>
    </Container>
  );
} 