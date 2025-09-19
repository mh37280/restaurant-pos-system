const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// Use absolute path so it's always correct
const dbPath = path.join(__dirname, '..', 'menu.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

function ensureColumn(table, columnDefinition) {
  const sql = 'ALTER TABLE ' + table + ' ADD COLUMN ' + columnDefinition;
  db.run(sql, (err) => {
    if (err && !/duplicate column name/i.test(err.message)) {
      console.error('Failed adding column to ' + table + ':', err.message);
    }
  });
}

function ensureIndex(name, sql) {
  db.run(sql, (err) => {
    if (err && !/already exists/i.test(err.message)) {
      console.error('Failed creating index ' + name + ':', err.message);
    }
  });
}

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run([
    'CREATE TABLE IF NOT EXISTS menu (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  name TEXT NOT NULL,',
    '  price REAL NOT NULL,',
    '  category TEXT,',
    '  available INTEGER DEFAULT 1,',
    '  category_id INTEGER,',
    '  panel_id INTEGER,',
    '  layout_slot_id INTEGER,',
    '  button_label TEXT,',
    '  button_color TEXT,',
    '  button_icon TEXT,',
    '  button_image TEXT,',
    '  sort_order INTEGER DEFAULT 0,',
    '  is_visible INTEGER DEFAULT 1',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS orders (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  items TEXT,',
    '  total REAL,',
    '  order_type TEXT,',
    '  customer_name TEXT,',
    '  phone_number TEXT,',
    '  address TEXT,',
    '  payment_method TEXT,',
    '  driver_id INTEGER,',
    '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
    '  ticket_number INTEGER,',
    "  status TEXT DEFAULT 'open',",
    '  cash_received REAL DEFAULT NULL,',
    '  card_amount REAL DEFAULT NULL,',
    '  FOREIGN KEY (driver_id) REFERENCES drivers(id)',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS drivers (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  name TEXT NOT NULL,',
    '  phone TEXT',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS store_settings (',
    '  id INTEGER PRIMARY KEY CHECK (id = 1),',
    '  name TEXT,',
    '  address TEXT,',
    '  city TEXT,',
    '  state TEXT,',
    '  zip TEXT,',
    '  lat REAL,',
    '  lon REAL,',
    '  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    ');'
  ].join('\n'));

  db.run([
    'INSERT INTO store_settings (id, name, address, city, state, zip, lat, lon)',
    "VALUES (1, 'Main Store', '123 E Allegheny Ave', 'Philadelphia', 'PA', '19120', 39.9973, -75.1251)",
    'ON CONFLICT(id) DO NOTHING;'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS menu_categories (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  name TEXT NOT NULL,',
    '  color TEXT,',
    '  icon TEXT,',
    "  position TEXT DEFAULT 'left',",
    '  sort_order INTEGER DEFAULT 0,',
    '  is_active INTEGER DEFAULT 1,',
    '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS menu_panels (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  category_id INTEGER NOT NULL,',
    '  name TEXT NOT NULL,',
    '  icon TEXT,',
    '  color TEXT,',
    '  sort_order INTEGER DEFAULT 0,',
    '  grid_rows INTEGER DEFAULT 4,',
    '  grid_cols INTEGER DEFAULT 5,',
    '  is_active INTEGER DEFAULT 1,',
    '  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
    '  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
    '  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS menu_layout_slots (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  panel_id INTEGER NOT NULL,',
    '  row_index INTEGER NOT NULL,',
    '  col_index INTEGER NOT NULL,',
    '  row_span INTEGER DEFAULT 1,',
    '  col_span INTEGER DEFAULT 1,',
    '  item_id INTEGER,',
    '  label_override TEXT,',
    '  sort_order INTEGER DEFAULT 0,',
    '  FOREIGN KEY (panel_id) REFERENCES menu_panels(id) ON DELETE CASCADE,',
    '  FOREIGN KEY (item_id) REFERENCES menu(id) ON DELETE SET NULL,',
    '  UNIQUE(panel_id, row_index, col_index)',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS modifiers (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  name TEXT NOT NULL,',
    '  menu_id INTEGER,',
    '  is_required INTEGER DEFAULT 0,',
    '  is_multiple INTEGER DEFAULT 0,',
    "  selection_mode TEXT DEFAULT 'whole',",
    '  min_select INTEGER DEFAULT 0,',
    '  max_select INTEGER,',
    '  sort_order INTEGER DEFAULT 0,',
    "  applies_to TEXT DEFAULT 'item',",
    '  FOREIGN KEY (menu_id) REFERENCES menu(id)',
    ');'
  ].join('\n'));

  db.run([
    'CREATE TABLE IF NOT EXISTS modifier_options (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  modifier_id INTEGER NOT NULL,',
    '  label TEXT NOT NULL,',
    '  price_delta REAL DEFAULT 0,',
    '  sort_order INTEGER DEFAULT 0,',
    '  is_default INTEGER DEFAULT 0,',
    '  FOREIGN KEY (modifier_id) REFERENCES modifiers(id)',
    ');'
  ].join('\n'));

  ensureColumn('menu', 'category_id INTEGER');
  ensureColumn('menu', 'panel_id INTEGER');
  ensureColumn('menu', 'layout_slot_id INTEGER');
  ensureColumn('menu', 'button_label TEXT');
  ensureColumn('menu', 'button_color TEXT');
  ensureColumn('menu', 'button_icon TEXT');
  ensureColumn('menu', 'button_image TEXT');
  ensureColumn('menu', 'sort_order INTEGER DEFAULT 0');
  ensureColumn('menu', 'is_visible INTEGER DEFAULT 1');

  ensureColumn('modifiers', "selection_mode TEXT DEFAULT 'whole'");
  ensureColumn('modifiers', 'min_select INTEGER DEFAULT 0');
  ensureColumn('modifiers', 'max_select INTEGER');
  ensureColumn('modifiers', 'sort_order INTEGER DEFAULT 0');
  ensureColumn('modifiers', "applies_to TEXT DEFAULT 'item'");

  ensureColumn('modifier_options', 'sort_order INTEGER DEFAULT 0');
  ensureColumn('modifier_options', 'is_default INTEGER DEFAULT 0');

  ensureIndex('idx_menu_category_id', 'CREATE INDEX IF NOT EXISTS idx_menu_category_id ON menu(category_id)');
  ensureIndex('idx_menu_panel_id', 'CREATE INDEX IF NOT EXISTS idx_menu_panel_id ON menu(panel_id)');
  ensureIndex('idx_menu_layout_slot_panel', 'CREATE INDEX IF NOT EXISTS idx_menu_layout_slot_panel ON menu_layout_slots(panel_id)');
  ensureIndex('idx_modifiers_menu_id', 'CREATE INDEX IF NOT EXISTS idx_modifiers_menu_id ON modifiers(menu_id)');
  ensureIndex('idx_modifier_options_modifier_id', 'CREATE INDEX IF NOT EXISTS idx_modifier_options_modifier_id ON modifier_options(modifier_id)');

  db.run([
    'INSERT INTO menu_categories (name, position, sort_order)',
    "SELECT 'All Items', 'left', 0",
    'WHERE NOT EXISTS (SELECT 1 FROM menu_categories);'
  ].join('\n'));

  db.run([
    'INSERT INTO menu_panels (category_id, name, sort_order)',
    "SELECT c.id, 'Main', 0",
    'FROM menu_categories c',
    'WHERE NOT EXISTS (',
    '  SELECT 1 FROM menu_panels p WHERE p.category_id = c.id',
    ');'
  ].join('\n'));
});

db.runAsync = promisify(db.run).bind(db);
db.getAsync = promisify(db.get).bind(db);
db.allAsync = promisify(db.all).bind(db);

module.exports = db;
