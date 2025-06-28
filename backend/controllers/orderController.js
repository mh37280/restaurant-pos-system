const db = require('../models/database');

exports.getAllOrders = (req, res) => {
  db.all('SELECT * FROM orders', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

exports.createOrder = (req, res) => {
  const { items, total } = req.body;

  db.run(
    'INSERT INTO orders (items, total) VALUES (?, ?)',
    [JSON.stringify(items), total],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
};
