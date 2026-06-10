const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'predictions.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function load() {
  if (!fs.existsSync(DATA)) fs.writeFileSync(DATA, JSON.stringify({ users: [] }, null, 2));
  return JSON.parse(fs.readFileSync(DATA, 'utf8'));
}
function save(d) { fs.writeFileSync(DATA, JSON.stringify(d, null, 2)); }

// List all users (summary only)
app.get('/api/users', (req, res) => {
  const { users } = load();
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    updatedAt: u.updatedAt,
    picks: Object.keys(u.bracket || {}).length
  })));
});

// Create or reopen user
app.post('/api/users', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name required' });
  const d = load();
  let user = d.users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (user) return res.json({ id: user.id, name: user.name, existing: true });
  user = {
    id: crypto.randomBytes(4).toString('hex'),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bracket: {}
  };
  d.users.push(user);
  save(d);
  res.json({ id: user.id, name: user.name, existing: false });
});

// Get full user data
app.get('/api/users/:id', (req, res) => {
  const { users } = load();
  const u = users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json(u);
});

// Save bracket
app.put('/api/users/:id', (req, res) => {
  const d = load();
  const idx = d.users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  d.users[idx].bracket = req.body.bracket || {};
  d.users[idx].groups = req.body.groups || {};
  d.users[idx].updatedAt = new Date().toISOString();
  save(d);
  res.json({ ok: true });
});

// All brackets for comparison
app.get('/api/board', (req, res) => {
  const { users } = load();
  res.json(users.map(u => ({ id: u.id, name: u.name, bracket: u.bracket || {} })));
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const d = load();
  d.users = d.users.filter(u => u.id !== req.params.id);
  save(d);
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  const nets = require('os').networkInterfaces();
  let ip = 'localhost';
  for (const iface of Object.values(nets).flat()) {
    if (iface.family === 'IPv4' && !iface.internal) { ip = iface.address; break; }
  }
  console.log('\n🏆  WC2026 Predictions Server');
  console.log(`   Local:   http://localhost:${PORT}/wc2026_predict.html`);
  console.log(`   Network: http://${ip}:${PORT}/wc2026_predict.html  ← share this with friends\n`);
});
