const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./menu.db');

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      category TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      items TEXT,
      total REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

module.exports = db;
