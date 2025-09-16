const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require("util");

// Use absolute path so it's always correct
const dbPath = path.join(__dirname, '..', 'menu.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      category TEXT,
      available BOOLEAN DEFAULT 1
    );
  `);


  db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT,
    total REAL,
    order_type TEXT,
    customer_name TEXT,
    phone_number TEXT,
    address TEXT,
    payment_method TEXT,
    driver_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ticket_number INTEGER,
    status TEXT DEFAULT 'open',
    cash_received REAL DEFAULT NULL,
    card_amount REAL DEFAULT NULL,
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
  );
`);



  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modifiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      menu_id INTEGER,
      is_required BOOLEAN DEFAULT 0,
      is_multiple BOOLEAN DEFAULT 0,
      FOREIGN KEY (menu_id) REFERENCES menu(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modifier_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      modifier_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      price_delta REAL DEFAULT 0,
      FOREIGN KEY (modifier_id) REFERENCES modifiers(id)
    );
  `);
});

db.allAsync = promisify(db.all).bind(db);

module.exports = db;