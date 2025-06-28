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
  db.run(
    'INSERT INTO menu (name, price, category) VALUES (?, ?, ?)',
    [name, price, category],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
};
