const db = require('../models/database');

exports.getMenuItems = (req, res) => {
  db.all('SELECT * FROM menu', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

exports.addMenuItem = (req, res) => {
  const { name, price, category } = req.body;
  const categoryNormalized = category.trim().toLowerCase();

  db.run(
    'INSERT INTO menu (name, price, category) VALUES (?, ?, ?)',
    [name, price, categoryNormalized],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
};


exports.deleteMenuItem = (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM menu WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Menu item not found" });
    }
    res.json({ message: "Menu item deleted" });
  });
};


exports.updateMenuItem = (req, res) => {
  const { id } = req.params;
  const { name, price, category } = req.body;

  db.run(
    `UPDATE menu SET name = ?, price = ?, category = ? WHERE id = ?`,
    [name, price, category, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: "Item updated" });
    }
  );
};