const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const axios = require('axios');

require('dotenv').config();

// Vercel redeploy trigger - v2
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Brevo configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

// Database connection
const dbPath = path.join(__dirname, 'db', 'data.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Initialize database if needed
    initializeDatabaseIfNeeded();
  }
});

// Initialize database tables if they don't exist
function initializeDatabaseIfNeeded() {
  db.serialize(() => {
    // Users table for admin authentication
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      images TEXT,
      category TEXT DEFAULT 'streetwear',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Product variants table
    db.run(`CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock_total INTEGER NOT NULL DEFAULT 0,
      stock_for_drop INTEGER DEFAULT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Drops table
    db.run(`CREATE TABLE IF NOT EXISTS drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_at DATETIME NOT NULL,
      end_at DATETIME NOT NULL,
      key_hash TEXT NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      processed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Drop products junction table
    db.run(`CREATE TABLE IF NOT EXISTS drop_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drop_id INTEGER NOT NULL,
      product_variant_id INTEGER NOT NULL,
      allocated_stock INTEGER NOT NULL,
      FOREIGN KEY (drop_id) REFERENCES drops (id),
      FOREIGN KEY (product_variant_id) REFERENCES product_variants (id)
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      items TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      stripe_session_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Newsletter subscribers
    db.run(`CREATE TABLE IF NOT EXISTS newsletter_subs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve images folder from repository root at /images so attachments in the
// project's `images/` folder are available to the front-end without moving files.
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// API Routes

// Admin Authentication
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });
});

// Get active drop
app.get('/api/drops/active', (req, res) => {
  const now = new Date().toISOString();
  
  db.get(`
    SELECT d.*, 
           CASE 
             WHEN d.start_at <= ? AND d.end_at >= ? THEN 1 
             ELSE 0 
           END as is_active
    FROM drops d 
    WHERE d.start_at <= ? AND d.end_at >= ? AND d.processed = 0
  `, [now, now, now, now], (err, drop) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!drop) {
      return res.status(404).json({ error: 'No active drop found' });
    }
    
    // Remove sensitive data
    delete drop.key_hash;
    res.json(drop);
  });
});

// Verify drop key
app.post('/api/drops/:id/unlock', (req, res) => {
  const { id } = req.params;
  const { key } = req.body;
  
  db.get('SELECT * FROM drops WHERE id = ?', [id], (err, drop) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }
    
    if (!bcrypt.compareSync(key, drop.key_hash)) {
      return res.status(401).json({ error: 'Invalid drop key' });
    }
    
    res.json({ success: true, message: 'Drop unlocked successfully' });
  });
});

// Get drop products
app.get('/api/drops/:id/products', (req, res) => {
  const { id } = req.params;
  
  db.all(`
    SELECT 
      p.id, p.title, p.description, p.images, p.category,
      pv.id as variant_id, pv.size, pv.price,
      dp.allocated_stock as stock
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    JOIN drop_products dp ON pv.id = dp.product_variant_id
    WHERE dp.drop_id = ?
  `, [id], (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Group variants by product
    const groupedProducts = {};
    products.forEach(product => {
      if (!groupedProducts[product.id]) {
        groupedProducts[product.id] = {
          id: product.id,
          title: product.title,
          description: product.description,
          images: JSON.parse(product.images),
          category: product.category,
          variants: []
        };
      }
      groupedProducts[product.id].variants.push({
        id: product.variant_id,
        size: product.size,
        price: product.price,
        stock: product.stock
      });
    });
    
    res.json(Object.values(groupedProducts));
  });
});

// Get shop products (permanent collection)
app.get('/api/shop', (req, res) => {
  db.all(`
    SELECT 
      p.id, p.title, p.description, p.images, p.category,
      pv.id as variant_id, pv.size, pv.price, pv.stock_total as stock
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    WHERE pv.stock_total > 0
  `, (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Group variants by product
    const groupedProducts = {};
    products.forEach(product => {
      if (!groupedProducts[product.id]) {
        groupedProducts[product.id] = {
          id: product.id,
          title: product.title,
          description: product.description,
          images: JSON.parse(product.images),
          category: product.category,
          variants: []
        };
      }
      groupedProducts[product.id].variants.push({
        id: product.variant_id,
        size: product.size,
        price: product.price,
        stock: product.stock
      });
    });
    
    res.json(Object.values(groupedProducts));
  });
});

// Create Stripe checkout session
app.post('/api/checkout', async (req, res) => {
  const { items, email, dropId } = req.body;
  
  try {
    // Verify stock availability
    for (const item of items) {
      const stockCheck = await new Promise((resolve, reject) => {
        if (dropId) {
          db.get('SELECT allocated_stock FROM drop_products WHERE drop_id = ? AND product_variant_id = ?',
            [dropId, item.variantId], (err, result) => {
              if (err) reject(err);
              else resolve(result ? result.allocated_stock : 0);
            });
        } else {
          db.get('SELECT stock_total FROM product_variants WHERE id = ?',
            [item.variantId], (err, result) => {
              if (err) reject(err);
              else resolve(result ? result.stock_total : 0);
            });
        }
      });
      
      if (stockCheck < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.title} (${item.size})` 
        });
      }
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            description: `Size: ${item.size}`,
            images: item.images || [],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      customer_email: email,
      metadata: {
        items: JSON.stringify(items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        }))),
        dropId: dropId || ''
      }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook endpoint
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Update stock and create order
    const items = JSON.parse(session.metadata.items);
    const dropId = session.metadata.dropId;
    
    items.forEach(item => {
      if (dropId) {
        // Update drop stock
        db.run('UPDATE drop_products SET allocated_stock = allocated_stock - ? WHERE drop_id = ? AND product_variant_id = ?',
          [item.quantity, dropId, item.variantId]);
      } else {
        // Update regular stock
        db.run('UPDATE product_variants SET stock_total = stock_total - ? WHERE id = ?',
          [item.quantity, item.variantId]);
      }
    });
    
    // Create order record
    db.run(`INSERT INTO orders (user_email, items, total_amount, stripe_session_id, status) 
            VALUES (?, ?, ?, ?, ?)`,
      [session.customer_email, session.metadata.items, session.amount_total, session.id, 'completed']);
  }
  
  res.json({ received: true });
});

// Newsletter subscription
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  
  // Normalize email: trim whitespace and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  db.run('INSERT INTO newsletter_subs (email) VALUES (?)', [normalizedEmail], function(err) {
    if (err) {
      // Check if it's a unique constraint error (duplicate email)
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Email already subscribed' });
      }
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    res.json({ success: true, message: 'Subscribed successfully' });
  });
});

// Get all newsletter subscribers
app.get('/api/admin/newsletter-subscribers', (req, res) => {
  db.all('SELECT email, subscribed_at FROM newsletter_subs ORDER BY subscribed_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Send newsletter email to all subscribers via Brevo
app.post('/api/send-newsletter', async (req, res) => {
  const { subject, htmlContent } = req.body;
  
  if (!subject || !htmlContent) {
    return res.status(400).json({ error: 'Subject and htmlContent required' });
  }
  
  if (!BREVO_API_KEY) {
    return res.status(500).json({ error: 'Brevo API key not configured' });
  }

  try {
    // Get all subscribers
    const subscribers = await new Promise((resolve, reject) => {
      db.all('SELECT email FROM newsletter_subs', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No subscribers found' });
    }

    // Send emails via Brevo
    const emailList = subscribers.map(sub => ({ email: sub.email }));
    
    const response = await axios.post(
      `${BREVO_API_URL}/smtp/email`,
      {
        to: emailList,
        subject: subject,
        htmlContent: htmlContent,
        sender: {
          name: 'FREAK',
          email: 'teddywop02@gmail.com'
        }
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      message: `Email sent to ${subscribers.length} subscribers`,
      messageId: response.data.messageId 
    });
  } catch (error) {
    console.error('Brevo error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to send newsletter',
      details: error.response?.data?.message || error.message 
    });
  }
});

// Admin routes
app.get('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(products);
  });
});

app.post('/api/admin/products', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, images, category } = req.body;
  
  db.run('INSERT INTO products (title, description, images, category) VALUES (?, ?, ?, ?)',
    [title, description, JSON.stringify(images), category], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Product created successfully' });
    });
});

app.get('/api/admin/drops', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT * FROM drops ORDER BY created_at DESC', (err, drops) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(drops);
  });
});

app.post('/api/admin/drops', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, startAt, endAt, key } = req.body;
  const hashedKey = bcrypt.hashSync(key, 10);
  
  db.run('INSERT INTO drops (title, description, start_at, end_at, key_hash) VALUES (?, ?, ?, ?, ?)',
    [title, description, startAt, endAt, hashedKey], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Drop created successfully' });
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/drop', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'drop.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'shop.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.get('/subscribe', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'subscribe.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`FREAK server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});