const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'paraibana.db');

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
  throw new Error('Configure ADMIN_USERNAME, ADMIN_PASSWORD e ADMIN_SESSION_SECRET antes de iniciar o servidor.');
}

if (ADMIN_PASSWORD.length < 14 || Buffer.byteLength(ADMIN_SESSION_SECRET) < 32) {
  throw new Error('ADMIN_PASSWORD deve ter pelo menos 14 caracteres e ADMIN_SESSION_SECRET pelo menos 32 bytes.');
}

fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Erro ao abrir o banco de dados:', error.message);
    process.exit(1);
  }
  console.log('Banco de dados conectado em:', dbPath);
});

const ensureSchema = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        image TEXT,
        status TEXT DEFAULT 'disponível',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const seedProducts = [
      {
        title: 'Kit de Embreagem Pesada Reforçada',
        category: 'caminhao',
        description: 'Platô, disco e rolamento com durabilidade extrema para transporte de carga pesada.',
        price: 899.9,
        stock: 8,
        image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Sistema de Cuícas e Freio a Ar',
        category: 'caminhao',
        description: 'Válvulas, pastilhas e lonas de alto atrito e segurança para frotas e cavalos mecânicos.',
        price: 1240,
        stock: 5,
        image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Kit de Pastilhas e Discos Ventilados',
        category: 'carro',
        description: 'Frenagem precisa e sem ruídos para carros de passeio de todas as marcas e montadoras.',
        price: 420,
        stock: 15,
        image: 'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Amortecedores Pressurizados e Batentes',
        category: 'carro',
        description: 'Estabilidade e conforto acústico para vias urbanas e viagens longas.',
        price: 680,
        stock: 11,
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Kit Transmissão com Retentor',
        category: 'moto',
        description: 'Aço 1045 com tratamento térmico para máxima durabilidade no trabalho diário.',
        price: 360,
        stock: 20,
        image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Baterias Seladas de Alta Performance',
        category: 'moto',
        description: 'Tecnologia AGM livres de manutenção e com alta corrente de partida.',
        price: 299,
        stock: 18,
        image: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Sistema Pneumático e Válvulas Niveladoras',
        category: 'onibus',
        description: 'Conforto para passageiros e segurança no controle de inclinação de chassis.',
        price: 1395,
        stock: 7,
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80',
        status: 'sob encomenda'
      },
      {
        title: 'Tambores e Sapatas de Freio de Alta Resistência',
        category: 'onibus',
        description: 'Dimensionados para suportar paradas constantes do transporte coletivo.',
        price: 1120,
        stock: 6,
        image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Discos e Reparos de Tomada de Força (TDP)',
        category: 'tratores',
        description: 'Força bruta e engates precisos para arados, grades e implementos da lida no campo.',
        price: 760,
        stock: 9,
        image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      },
      {
        title: 'Bomba Hidráulica e Cilindros de Direção',
        category: 'tratores',
        description: 'Pressão hidráulica constante para levantamento de cargas e manobras suaves.',
        price: 1280,
        stock: 4,
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
        status: 'disponível'
      }
    ];

    db.get('SELECT COUNT(*) AS total FROM products', (err, row) => {
      if (err) return;
      if (Number(row.total) === 0) {
        const insert = db.prepare(`
          INSERT INTO products (title, category, description, price, stock, image, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        seedProducts.forEach((product) => {
          insert.run(
            product.title,
            product.category,
            product.description,
            product.price,
            product.stock,
            product.image,
            product.status
          );
        });

        insert.finalize();
      }
    });
  });
};

const toBase64Url = (value) => Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const fromBase64Url = (value) => Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const createSessionToken = (payload, expiresInMinutes = 60) => {
  const body = { ...payload, exp: Date.now() + expiresInMinutes * 60 * 1000 };
  const bodyString = toBase64Url(JSON.stringify(body));
  const signature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(bodyString).digest('hex');
  return `${bodyString}.${signature}`;
};

const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [bodyString, expectedSignature] = parts;
  const expected = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(bodyString).digest('hex');

  try {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(expectedSignature, 'hex');

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      return null;
    }

    const payload = JSON.parse(fromBase64Url(bodyString).toString('utf8'));
    if (!payload || !payload.username || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

const getCookieValue = (req, name) => {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').find((item) => item.trim().startsWith(`${name}=`));
  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split('=').slice(1).join('='));
};

const getAdminSession = (req) => {
  const payload = verifySessionToken(getCookieValue(req, 'admin_token'));

  if (!payload || payload.username !== ADMIN_USERNAME) {
    return null;
  }

  return payload;
};

const ensureAdminAuth = (req, res, next) => {
  if (!getAdminSession(req)) {
    return res.status(401).json({ error: 'Acesso negado. Faça login no painel administrativo.' });
  }
  next();
};

const formatProduct = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  description: row.description,
  price: Number(row.price || 0),
  stock: Number(row.stock || 0),
  image: row.image,
  status: row.status || 'disponível',
  created_at: row.created_at
});

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (category && category !== 'todos') {
    query += ' WHERE category = ?';
    params.push(category);
  }

  if (search) {
    query += params.length ? ' AND ' : ' WHERE ';
    query += '(title LIKE ? OR category LIKE ? OR description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows.map(formatProduct));
  });
});

app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM products ORDER BY category ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows.map((row) => row.category));
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = createSessionToken({ username: ADMIN_USERNAME }, 60);
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
    path: '/'
  });

  res.set('Cache-Control', 'no-store');
  return res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('admin_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });

  res.json({ ok: true });
});

app.get('/api/session', (req, res) => {
  if (!getAdminSession(req)) {
    return res.status(401).json({ ok: false, error: 'Não autenticado.' });
  }

  return res.json({ ok: true, username: ADMIN_USERNAME });
});

app.post('/api/products', ensureAdminAuth, (req, res) => {
  const { title, category, description, price, stock, image, status } = req.body || {};

  if (!title || !category) {
    return res.status(400).json({ error: 'Título e categoria são obrigatórios.' });
  }

  const payload = {
    title: String(title).trim(),
    category: String(category).trim().toLowerCase(),
    description: String(description || '').trim(),
    price: Number(price || 0),
    stock: Number(stock || 0),
    image: String(image || '').trim() || 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80',
    status: String(status || 'disponível').trim() || 'disponível'
  };

  db.run(
    `INSERT INTO products (title, category, description, price, stock, image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [payload.title, payload.category, payload.description, payload.price, payload.stock, payload.image, payload.status],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (getError, row) => {
        if (getError) {
          return res.status(500).json({ error: getError.message });
        }

        res.status(201).json(formatProduct(row));
      });
    }
  );
});

app.put('/api/products/:id', ensureAdminAuth, (req, res) => {
  const { id } = req.params;
  const { title, category, description, price, stock, image, status } = req.body || {};

  if (!title || !category) {
    return res.status(400).json({ error: 'Título e categoria são obrigatórios.' });
  }

  db.run(
    `UPDATE products
     SET title = ?, category = ?, description = ?, price = ?, stock = ?, image = ?, status = ?
     WHERE id = ?`,
    [
      String(title).trim(),
      String(category).trim().toLowerCase(),
      String(description || '').trim(),
      Number(price || 0),
      Number(stock || 0),
      String(image || '').trim() || 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=900&q=80',
      String(status || 'disponível').trim() || 'disponível',
      id
    ],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Produto não encontrado.' });
      }

      db.get('SELECT * FROM products WHERE id = ?', [id], (getError, row) => {
        if (getError) {
          return res.status(500).json({ error: getError.message });
        }

        res.json(formatProduct(row));
      });
    }
  );
});

app.delete('/api/products/:id', ensureAdminAuth, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function (error) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json({ success: true, id });
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    appName: 'Paraibana Peças',
    requiresSecureLogin: true
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'paraibana-pecas' });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use((req, res) => {
  if (req.path.endsWith('.html')) {
    const filePath = path.join(__dirname, req.path.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

ensureSchema();

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel administrativo: http://localhost:${PORT}/admin`);
  console.log(`Host: ${HOST}`);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
