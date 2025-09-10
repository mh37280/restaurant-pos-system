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

exports.removeDriver = (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM drivers WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
};

exports.updateDriver = (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;

  db.run(
    'UPDATE drivers SET name = ?, phone = ? WHERE id = ?',
    [name, phone, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
};
