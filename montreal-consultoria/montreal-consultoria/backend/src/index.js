require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const express = require('express');
const cors = require('cors');
const db = require('../models');
const multer = require('multer');
const upload = multer();
const { Op, Sequelize } = require('sequelize');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Clients
app.get('/clients', async (req, res) => {
  try {
    const clients = await db.Client.findAll();
    res.json(clients);
  } catch (err) {
    console.error('GET /clients error:', err);
    res.json([]);
  }
});
app.post('/clients', async (req, res) => {
  const client = await db.Client.create(req.body);
  res.status(201).json(client);
});

// Atualizar cliente existente
app.put('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const [updated] = await db.Client.update(req.body, { where: { id } });
  if (updated) {
    const client = await db.Client.findByPk(id);
    return res.json(client);
  }
  res.status(404).json({ error: 'Client not found' });
});

// DELETE client by id
app.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await db.Client.destroy({ where: { id } });
  if (deleted) return res.status(204).send();
  res.status(404).json({ error: 'Client not found' });
});

// Services
app.get('/services', async (req, res) => {
  try {
    const services = await db.Service.findAll();
    res.json(services);
  } catch (err) {
    console.error('GET /services error:', err);
    res.json([]);
  }
});
app.post('/services', async (req, res) => {
  const service = await db.Service.create(req.body);
  res.status(201).json(service);
});

// Atualizar serviço existente
app.put('/services/:id', async (req, res) => {
  const { id } = req.params;
  const [updated] = await db.Service.update(req.body, { where: { id } });
  if (updated) {
    const service = await db.Service.findByPk(id);
    return res.json(service);
  }
  res.status(404).json({ error: 'Service not found' });
});

// DELETE service by id
app.delete('/services/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await db.Service.destroy({ where: { id } });
  if (deleted) return res.status(204).send();
  res.status(404).json({ error: 'Service not found' });
});

// Entries
app.get('/entries', async (req, res) => {
  try {
    const entries = await db.Entry.findAll();
    res.json(entries);
  } catch (err) {
    console.error('GET /entries error:', err);
    res.json([]);
  }
});
app.post('/entries', async (req, res) => {
  const entry = await db.Entry.create(req.body);
  res.status(201).json(entry);
});

// DELETE entry by id
app.delete('/entries/:id', async (req, res) => {
  const id = req.params.id;
  const deleted = await db.Entry.destroy({ where: { id } });
  if (deleted) return res.status(204).send();
  res.status(404).json({ error: 'Entry not found' });
});

// Adicionando rota para deletar todas as entradas
app.delete('/entries', async (req, res) => {
  const deleted = await db.Entry.destroy({ where: {} });
  res.json({ deleted });
});

// Saidas
app.get('/saidas', async (req, res) => {
  try {
    const saidas = await db.Saida.findAll();
    res.json(saidas);
  } catch (err) {
    console.error('GET /saidas error:', err);
    res.json([]);
  }
});
app.post('/saidas', async (req, res) => {
  const saida = await db.Saida.create(req.body);
  res.status(201).json(saida);
});

// Adicionando rota para deletar todas as saídas
app.delete('/saidas', async (req, res) => {
  const deleted = await db.Saida.destroy({ where: {} });
  res.json({ deleted });
});

// Personal Expenses
app.get('/personalExpenses', async (req, res) => {
  try {
    const exps = await db.PersonalExpense.findAll();
    res.json(exps);
  } catch (err) {
    console.error('GET /personalExpenses error:', err);
    res.json([]);
  }
});
app.get('/personalExpenses/today', async (req, res) => {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  try {
    const exps = await db.PersonalExpense.findAll({ where: { date: { [Op.between]: [start, end] } } });
    res.json(exps);
  } catch (err) {
    console.error('GET /personalExpenses/today error:', err);
    res.status(500).json([]);
  }
});
app.post('/personalExpenses', async (req, res) => {
  const exp = await db.PersonalExpense.create(req.body);
  res.status(201).json(exp);
});
app.put('/personalExpenses/:id', async (req, res) => {
  const { id } = req.params;
  const [updated] = await db.PersonalExpense.update(req.body, { where: { id } });
  if (updated) {
    const exp = await db.PersonalExpense.findByPk(id);
    return res.json(exp);
  }
  res.status(404).json({ error: 'Personal expense not found' });
});
app.delete('/personalExpenses/:id', async (req, res) => {
  const { id } = req.params;
  const deleted = await db.PersonalExpense.destroy({ where: { id } });
  if (deleted) return res.status(204).send();
  res.status(404).json({ error: 'Personal expense not found' });
});
app.delete('/personalExpenses', async (req, res) => {
  const deleted = await db.PersonalExpense.destroy({ where: {} });
  res.json({ deleted });
});

// Rota para parsear texto de despesa usando OpenAI
app.post('/parse-expense', async (req, res) => {
  const { text, apiKey } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  try {
    // Use dynamic API key if provided
    const client = apiKey ? new OpenAI({ apiKey }) : openai;
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é um assistente que extrai dados de despesas.' },
        { role: 'user', content: `Analise o seguinte texto de despesa e retorne JSON com chaves: description, category, asset, amount. Categorias possíveis: Combustível, Alimentação, Transporte, Outros.\nTexto: "${text}"` }
      ],
      temperature: 0
    });
    const content = completion.choices[0].message.content;
    const parsed = JSON.parse(content);
    return res.json(parsed);
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ error: 'Erro ao processar o texto via IA' });
  }
});

// Rota para chat com IA (mensagem livre e texto OCR)
app.post('/chat', async (req, res) => {
  const { message, ocrText, apiKey } = req.body;
  if (!message && !ocrText) return res.status(400).json({ error: 'Message or OCR text is required' });
  try {
    let userContent = message || '';
    if (ocrText) {
      userContent += `\nTexto extraído da imagem:\n${ocrText}`;
    }
    const client = apiKey ? new OpenAI({ apiKey }) : openai;
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é um assistente de finanças pessoais que ajuda a analisar despesas.' },
        { role: 'user', content: userContent }
      ],
      temperature: 0.7
    });
    const content = completion.choices[0].message.content;
    return res.json({ content });
  } catch (err) {
    console.error('Chat IA error:', err);
    return res.status(500).json({ error: 'Erro ao conversar com a IA' });
  }
});

// Rota para OCR + GPT Vision: extrair despesas diretamente da imagem usando GPT
app.post('/parse-expense-gpt', upload.single('image'), async (req, res) => {
  const apiKey = req.body.apiKey || process.env.OPENAI_API_KEY;
  if (!req.file) return res.status(400).json({ error: 'Image file required' });
  try {
    const client = apiKey ? new OpenAI({ apiKey }) : openai;
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente que extrai dados de despesas de uma imagem. Retorne um array JSON de objetos com chaves: description, category, asset, amount.' },
        { role: 'user', content: ' ', name: 'image' }
      ],
      files: [ { name: req.file.originalname, data: req.file.buffer } ]
    });
    const content = completion.choices[0].message.content;
    return res.json(JSON.parse(content));
  } catch (err) {
    console.error('GPT Vision OCR error:', err);
    return res.status(500).json({ error: 'Erro ao processar OCR com GPT' });
  }
});

// Start server after DB sync
db.sequelize.sync({ alter: true }).then(() => {
  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
  });
}); 