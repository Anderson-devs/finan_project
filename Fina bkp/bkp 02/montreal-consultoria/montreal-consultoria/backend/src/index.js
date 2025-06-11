const express = require('express');
const cors = require('cors');
const db = require('../models');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Clients
app.get('/clients', async (req, res) => {
  const clients = await db.Client.findAll();
  res.json(clients);
});
app.post('/clients', async (req, res) => {
  const client = await db.Client.create(req.body);
  res.status(201).json(client);
});

// Services
app.get('/services', async (req, res) => {
  const services = await db.Service.findAll();
  res.json(services);
});
app.post('/services', async (req, res) => {
  const service = await db.Service.create(req.body);
  res.status(201).json(service);
});

// Entries
app.get('/entries', async (req, res) => {
  const entries = await db.Entry.findAll();
  res.json(entries);
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

// Saidas
app.get('/saidas', async (req, res) => {
  const saidas = await db.Saida.findAll();
  res.json(saidas);
});
app.post('/saidas', async (req, res) => {
  const saida = await db.Saida.create(req.body);
  res.status(201).json(saida);
});

// Start server after DB sync
db.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
  });
}); 