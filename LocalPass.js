import {
  Application,
  Router,
  helpers,
} from 'https://deno.land/x/oak@v10.6.0/mod.ts';
import * as sqlite from 'https://deno.land/x/sqlite@v3.4.0/mod.ts';

const db = new sqlite.DB('LocalPass.db');

// utils
(function initDb() {
  db.query(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT,
    value TEXT
  )
`);

  db.query(`
  CREATE TABLE IF NOT EXISTS sites (
    site TEXT
  )
`);
})();

async function sha256(str) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  );
  return Array.prototype.map
    .call(new Uint8Array(buf), (x) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

function getConfig() {
  const config = {};
  for (const [key, value] of db.query('SELECT key, value from config')) {
    config[key] = value;
  }
  return config;
}

function setConfig(key, value) {
  db.query(`INSERT INTO config (key, value) VALUES (?, ?)`, [key, value]);
}

function getSites() {
  return db.query('SELECT site from sites');
}

function addSite(site) {
  db.query(`INSERT INTO sites (site) VALUES (?)`, [site]);
}

// routes
const router = new Router();
router.get('/', async (ctx) => {
  ctx.response.body = await Deno.readFile('./LocalPass.html');
  ctx.response.headers.set('Content-Type', 'text/html');
});

router.get('/api/config', (ctx) => {
  ctx.response.body = getConfig();
});

router.get('/api/sites', async (ctx) => {
  const query = helpers.getQuery(ctx);
  const action = query['action'] || '';

  if (action === 'fetchAll') {
    const masterPassword = query['password'] || '';
    const sites = getSites();
    const result = [];
    for (const [site] of sites) {
      const hashResult = await sha256(site + masterPassword);
      const password = btoa(hashResult).substring(0, 12);
      result.push({ site, password });
    }

    ctx.response.body = { sites: result };
    return;
  }

  if (action === 'add') {
    const site = query['site'];
    addSite(site);
    ctx.response.body = { status: 'ok' };
    return;
  }
});

router.get('/api/password', async (ctx) => {
  const query = helpers.getQuery(ctx);
  const action = query['action'] || '';
  if (action === 'add') {
    const password = query['value'];
    setConfig('masterPassword', await sha256(password));
    ctx.response.body = { status: 'ok' };
    return;
  }
  if (action === 'verify') {
    const config = getConfig();
    const password = query['value'];
    if (config['masterPassword'] === (await sha256(password))) {
      ctx.response.body = { status: 'ok' };
    } else {
      ctx.response.body = { status: 'ko', message: 'wrong password' };
    }
    return;
  }
  ctx.response.body = { status: 'ko' };
});

// configure app
const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log('Web server is available at http://127.0.0.1:5555');
await app.listen({ port: 5555 });
