const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Supports Vercel KV (auto-set when you create KV in dashboard)
// or Upstash directly (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)
function redisUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function redisToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}

async function kvCmd(cmd) {
  const r = await fetch(redisUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error(`Redis error: ${r.status}`);
  return r.json();
}

async function load() {
  const { result } = await kvCmd(['GET', 'predictions']);
  return result ? JSON.parse(result) : { users: [] };
}

async function save(d) {
  await kvCmd(['SET', 'predictions', JSON.stringify(d)]);
}

app.get('/api/users', async (req, res) => {
  try {
    const { users } = await load();
    res.json(users.map(u => ({
      id: u.id, name: u.name, updatedAt: u.updatedAt,
      picks: Object.keys(u.bracket || {}).length
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name required' });
    const d = await load();
    let user = d.users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (user) return res.json({ id: user.id, name: user.name, existing: true });
    user = {
      id: crypto.randomBytes(4).toString('hex'),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bracket: {},
      groups: {}
    };
    d.users.push(user);
    await save(d);
    res.json({ id: user.id, name: user.name, existing: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { users } = await load();
    const u = users.find(u => u.id === req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const d = await load();
    const idx = d.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    d.users[idx].bracket = req.body.bracket || {};
    d.users[idx].groups = req.body.groups || {};
    d.users[idx].updatedAt = new Date().toISOString();
    await save(d);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const d = await load();
    d.users = d.users.filter(u => u.id !== req.params.id);
    await save(d);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/board', async (req, res) => {
  try {
    const { users } = await load();
    res.json(users.map(u => ({
      id: u.id, name: u.name,
      bracket: u.bracket || {},
      groups: u.groups || {}
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
