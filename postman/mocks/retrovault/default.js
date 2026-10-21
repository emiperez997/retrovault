// Contract: api/src/domain/{catalog,collection}/{router,schemas}.py.
// Test-only data: the catalog seed plus Pokemon Snap for accent normalization.
const http = require('node:http');
const platforms = {
  n64: { id: 1, slug: 'n64', name: 'Nintendo 64' },
  ps1: { id: 2, slug: 'ps1', name: 'PlayStation' },
  snes: { id: 3, slug: 'snes', name: 'Super Nintendo' },
};
const seeds = [
  ['n64', 'Super Mario 64', 1996], ['n64', 'The Legend of Zelda: Ocarina of Time', 1998],
  ['n64', 'GoldenEye 007', 1997], ['n64', 'Paper Mario', 2000],
  ['ps1', 'Metal Gear Solid', 1998], ['ps1', 'Silent Hill', 1999],
  ['ps1', 'Final Fantasy VII', 1997], ['ps1', 'Castlevania: Symphony of the Night', 1997],
  ['snes', 'Chrono Trigger', 1995], ['snes', 'Super Metroid', 1994],
  ['snes', 'Donkey Kong Country', 1994], ['snes', 'Super Mario World', 1990],
  ['n64', 'Pokémon Snap', 1999],
];
const normalize = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const games = seeds.map(([platform, title, releaseYear], index) => ({
  id: index + 1, slug: `${platform}-${normalize(title).replaceAll(' ', '-')}`,
  title, releaseYear, coverUrl: null, region: 'NTSC_U', platform: platforms[platform],
})).sort((a, b) => a.title.localeCompare(b.title, 'en'));
const statuses = ['WISHLIST', 'BACKLOG', 'PLAYING', 'ON_HOLD', 'COMPLETED', 'ABANDONED'];

// Prefix state keys because simulation members share a local state store.
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(status === 204 ? undefined : JSON.stringify(body));
}
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const path = url.pathname;
    let body = req.body;
    if (body === undefined && ['POST', 'PATCH'].includes(req.method)) {
      let raw = ''; for await (const chunk of req) raw += chunk;
      body = raw ? JSON.parse(raw) : {};
    }
    if (typeof body === 'string') body = JSON.parse(body);
    let items = await pm.state.get('retrovault.items') || [];
    const nextId = await pm.state.get('retrovault.nextId') || 1;
    const failure = await pm.state.get('retrovault.failure');
    if (req.method === 'POST' && path === '/__test/reset') {
      await pm.state.set('retrovault.items', []); await pm.state.set('retrovault.nextId', 1); await pm.state.set('retrovault.failure', null);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && path === '/__test/failure') { await pm.state.set('retrovault.failure', body); return send(res, 200, { ok: true }); }
    if (failure && (!failure.path || path === failure.path) && (!failure.method || req.method === failure.method)) {
      return send(res, failure.status || 503, { detail: 'Simulated upstream failure' });
    }
    if (req.method === 'GET' && path === '/api/games') {
      const page = Number(url.searchParams.get('page') || 1), size = Number(url.searchParams.get('page_size') || 24);
      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100) return send(res, 422, { detail: 'Invalid pagination' });
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const platform = Number(url.searchParams.get('platform_id'));
      const filtered = games.filter(game => (!q || normalize(game.title).includes(q)) && (!platform || game.platform.id === platform));
      return send(res, 200, { items: filtered.slice((page - 1) * size, page * size), total: filtered.length, page, pageSize: size });
    }
    const gameMatch = path.match(/^\/api\/games\/(\d+)$/);
    if (req.method === 'GET' && gameMatch) { const game = games.find(game => game.id === Number(gameMatch[1])); return send(res, game ? 200 : 404, game || { detail: 'No encontramos ese juego' }); }
    if (path === '/api/collection' && req.method === 'GET') return send(res, 200, items);
    if (path === '/api/collection' && req.method === 'POST') {
      const game = games.find(game => game.id === body.gameId);
      if (!game) return send(res, 404, { detail: 'No encontramos ese juego' });
      if (items.some(item => item.game.id === game.id)) return send(res, 409, { detail: 'Ese juego ya está en tu backlog' });
      const item = { id: nextId, game, status: 'BACKLOG', owned: false, ownedCondition: null, personalRating: null, hoursPlayed: null, notes: null, startedAt: null, finishedAt: null };
      items.unshift(item); await pm.state.set('retrovault.items', items); await pm.state.set('retrovault.nextId', nextId + 1); return send(res, 201, item);
    }
    const itemMatch = path.match(/^\/api\/collection\/(\d+)$/);
    if (itemMatch && ['PATCH', 'DELETE'].includes(req.method)) {
      const item = items.find(item => item.id === Number(itemMatch[1]));
      if (!item) return send(res, 404, { detail: 'No encontramos ese ítem' });
      if (req.method === 'DELETE') { items = items.filter(old => old.id !== item.id); await pm.state.set('retrovault.items', items); return send(res, 204); }
      if (!statuses.includes(body.status)) return send(res, 422, { detail: 'Invalid status' });
      item.status = body.status; await pm.state.set('retrovault.items', items); return send(res, 200, item);
    }
    return send(res, 501, { detail: 'Endpoint not modeled for frontend tests' });
  } catch { send(res, 400, { detail: 'Invalid JSON body' }); }
}).listen(process.env.PORT || 4901);
