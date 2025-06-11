import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PersonalExpenseController from '../controllers/PersonalExpenseController';

export default function DespesasPessoais() {
  const [items, setItems] = useState([{ id: null, description: '', amount: '', isMonthly: false, dueDay: '' }]);
  const navigate = useNavigate();

  // Carrega despesas do dia ao iniciar
  useEffect(() => {
    PersonalExpenseController.getExpensesToday().then(data => {
      const loaded = data.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount.toString(),
        isMonthly: e.isMonthly,
        dueDay: e.dueDay || ''
      }));
      // sempre pelo menos uma linha vazia
      setItems(loaded.length ? loaded : [{ id: null, description: '', amount: '', isMonthly: false, dueDay: '' }]);
    });
  }, []);

  const addRow = () => {
    setItems(prev => [...prev, { id: null, description: '', amount: '', isMonthly: false, dueDay: '' }]);
  };

  // Salva ou atualiza registro
  const saveSingle = async (idx) => {
    const item = items[idx];
    if (!item.description || isNaN(parseFloat(item.amount))) return;
    if (item.id) {
      await PersonalExpenseController.updateExpense(item.id, {
        description: item.description,
        amount: parseFloat(item.amount),
        isMonthly: item.isMonthly,
        dueDay: item.dueDay ? parseInt(item.dueDay): null
      });
    } else {
      const created = await PersonalExpenseController.createExpense({
        description: item.description,
        amount: parseFloat(item.amount),
        isMonthly: item.isMonthly,
        dueDay: item.dueDay ? parseInt(item.dueDay): null
      });
      const updated = [...items]; updated[idx].id = created.id; setItems(updated);
    }
  };

  // Limpar todas despesas
  const handleClear = async () => {
    await PersonalExpenseController.deleteAllExpenses();
    setItems([{ id: null, description: '', amount: '', isMonthly: false, dueDay: '' }]);
  };

  // Salvar todas as despesas manualmente (create ou update, e recarrega lista)
  const handleSaveAll = async () => {
    console.log('handleSaveAll chamado, items:', items);
    const validItems = items.filter(item => item.description && !isNaN(parseFloat(item.amount)));
    try {
      await Promise.all(validItems.map(item => {
        const payload = {
          description: item.description,
          amount: parseFloat(item.amount),
          isMonthly: item.isMonthly,
          dueDay: item.dueDay ? parseInt(item.dueDay) : null
        };
        if (item.id) {
          return PersonalExpenseController.updateExpense(item.id, payload);
        }
        return PersonalExpenseController.createExpense(payload);
      }));
      // Recarrega despesas do dia
      const data = await PersonalExpenseController.getExpensesToday();
      const loaded = data.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount.toString(),
        isMonthly: e.isMonthly,
        dueDay: e.dueDay || ''
      }));
      setItems(loaded.length ? loaded : [{ id: null, description: '', amount: '', isMonthly: false, dueDay: '' }]);
    } catch (err) {
      console.error('Erro ao salvar todas as despesas:', err);
    }
  };

  return (
    <Container fluid className="mt-4">
      <h2>Despesas Pessoais</h2>
      <Form>
        {items.map((item, idx) => {
          const today = new Date().getDate();
          const due = item.dueDay ? parseInt(item.dueDay) : null;
          // estilo para mensal e alerta próximo ao vencimento
          const rowStyle = {};
          if (item.isMonthly) rowStyle.backgroundColor = '#e2e3e5';
          if (item.isMonthly && due !== null && due - today >= 0 && due - today <= 3) rowStyle.backgroundColor = '#f8d7da';
          return (
            <Row key={idx} className="mb-2" style={rowStyle}>
              <Col md={1} className="d-flex align-items-center justify-content-center">
                <Form.Check
                  type="checkbox"
                  label=""
                  checked={item.isMonthly}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].isMonthly = e.target.checked;
                    setItems(newItems);
                    saveSingle(idx);
                  }}
                  onBlur={() => saveSingle(idx)}
                />
              </Col>
              <Col md={5}>
                <Form.Control
                  type="text"
                  placeholder="Descrição"
                  value={item.description}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].description = e.target.value;
                    setItems(newItems);
                    saveSingle(idx);
                  }}
                  onBlur={() => saveSingle(idx)}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  type="number"
                  placeholder="Valor"
                  value={item.amount}
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].amount = e.target.value;
                    setItems(newItems);
                    saveSingle(idx);
                  }}
                  onBlur={() => saveSingle(idx)}
                />
              </Col>
              <Col md={2}>
                {item.isMonthly && (
                  <Form.Control
                    type="number"
                    min="1" max="31"
                    placeholder="Dia"
                    value={item.dueDay}
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx].dueDay = e.target.value;
                      setItems(newItems);
                      saveSingle(idx);
                    }}
                    onBlur={() => saveSingle(idx)}
                  />
                )}
              </Col>
              <Col md={1} className="d-flex align-items-center justify-content-center">
                <Button variant="outline-primary" onClick={addRow}>+</Button>
              </Col>
            </Row>
          );
        })}
      </Form>
      <div className="mt-3">
        <Button variant="primary" onClick={handleSaveAll}>Salvar</Button>{' '}
        <Button variant="success" onClick={handleClear}>Limpar Despesas</Button>{' '}
        <Button variant="secondary" onClick={() => navigate('/despesas-pessoais/relatorio')}>Ver Relatório</Button>
      </div>
    </Container>
  );
} 