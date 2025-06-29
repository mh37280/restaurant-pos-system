const db = require('../models/database');

exports.getAllDrivers = (req, res) => {
  db.all('SELECT * FROM drivers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.addDriver = (req, res) => {
  const { name, phone } = req.body;
  db.run(
    'INSERT INTO drivers (name, phone) VALUES (?, ?)',
    [name, phone],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
};
