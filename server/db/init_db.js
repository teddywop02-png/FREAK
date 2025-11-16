const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'data.sqlite');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
function initDatabase() {
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
      images TEXT, -- JSON array of image URLs
      category TEXT DEFAULT 'streetwear',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Product variants table (sizes, prices, stock)
    db.run(`CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size TEXT NOT NULL,
      price INTEGER NOT NULL, -- Price in cents
      stock_total INTEGER NOT NULL DEFAULT 0,
      stock_for_drop INTEGER DEFAULT NULL, -- Stock allocated for drops
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Drops table
    db.run(`CREATE TABLE IF NOT EXISTS drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_at DATETIME NOT NULL,
      end_at DATETIME NOT NULL,
      key_hash TEXT NOT NULL, -- Hashed drop key
      is_active BOOLEAN DEFAULT FALSE,
      processed BOOLEAN DEFAULT FALSE, -- Mark as processed after completion
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
      items TEXT NOT NULL, -- JSON array of ordered items
      total_amount INTEGER NOT NULL, -- Total in cents
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

    console.log('Database tables created successfully');
  });
}

// Insert seed data
function insertSeedData() {
  db.serialize(() => {
    // Create admin user
    const adminPassword = 'FreakAdmin123!';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    
    db.run(`INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)`, 
      ['admin@freak.local', hashedPassword, 'admin'], 
      function(err) {
        if (err) {
          console.error('Error inserting admin user:', err.message);
        } else {
          console.log('Admin user created: admin@freak.local / FreakAdmin123!');
        }
      }
    );

    // Insert sample products (only if they don't exist)
    const sampleProducts = [
      {
        title: 'FREAK Classic Tee',
        description: 'Premium cotton t-shirt with minimalist FREAK logo',
        images: JSON.stringify(['/images/tee-black.jpg', '/images/tee-white.jpg']),
        category: 't-shirt'
      },
      {
        title: 'FREAK Signature Hoodie',
        description: 'Heavyweight hoodie with embroidered FREAK branding',
        images: JSON.stringify(['/images/hoodie-black.jpg', '/images/hoodie-grey.jpg']),
        category: 'hoodie'
      },
      {
        title: 'FREAK Snapback Cap',
        description: 'Adjustable snapback with 3D embroidered logo',
        images: JSON.stringify(['/images/cap-black.jpg']),
        category: 'accessories'
      }
    ];

    sampleProducts.forEach((product, index) => {
      db.run(`INSERT OR IGNORE INTO products (title, description, images, category) VALUES (?, ?, ?, ?)`,
        [product.title, product.description, product.images, product.category],
        function(err) {
          if (err) {
            console.error('Error inserting product:', err.message);
          } else {
            const productId = this.lastID;
            if (productId) {
              console.log(`Product created: ${product.title}`);
              
              // Add variants for each product
              let variants = [];
              if (product.category === 't-shirt' || product.category === 'hoodie') {
                variants = [
                  { size: 'S', price: product.category === 'hoodie' ? 8900 : 4500 },
                  { size: 'M', price: product.category === 'hoodie' ? 8900 : 4500 },
                  { size: 'L', price: product.category === 'hoodie' ? 8900 : 4500 },
                  { size: 'XL', price: product.category === 'hoodie' ? 8900 : 4500 }
                ];
              } else {
                variants = [{ size: 'ONE SIZE', price: 3500 }];
              }
              
              variants.forEach(variant => {
                db.run(`INSERT INTO product_variants (product_id, size, price, stock_total) VALUES (?, ?, ?, ?)`,
                  [productId, variant.size, variant.price, 20],
                  function(err) {
                    if (err) {
                      console.error('Error inserting variant:', err.message);
                    }
                  }
                );
              });
            }
          }
        }
      );
    });

    // Create active drop
    const dropKey = 'FREAK-TEST-KEY-2025';
    const hashedDropKey = bcrypt.hashSync(dropKey, 10);
    const now = new Date();
    const dropEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    
    db.run(`INSERT OR IGNORE INTO drops (title, description, start_at, end_at, key_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
      ['FREAK Winter 2025 Drop', 'Exclusive winter collection featuring signature pieces', 
       now.toISOString(), dropEnd.toISOString(), hashedDropKey, true],
      function(err) {
        if (err) {
          console.error('Error inserting drop:', err.message);
        } else {
          console.log(`Active drop created: FREAK Winter 2025 Drop`);
          console.log(`Drop key: ${dropKey}`);
        }
      }
    );
  });
}

// Initialize database and insert seed data
initDatabase();
setTimeout(() => {
  insertSeedData();
}, 1000);

// Close database connection
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}, 3000);