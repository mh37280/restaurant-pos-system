const db = require("../models/database");

exports.getAllOrders = (req, res) => {
  db.all(
    `
    SELECT orders.*, drivers.name AS driver_name
    FROM orders
    LEFT JOIN drivers ON orders.driver_id = drivers.id
    ORDER BY orders.id DESC
  `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
};

exports.createOrder = (req, res) => {
  const {
    items,
    total,
    order_type,
    customer_name,
    phone_number,
    address,
    payment_method,
    driver_id,
  } = req.body;

  db.run(
    `INSERT INTO orders (items, total, order_type, customer_name, phone_number, address, payment_method, driver_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      JSON.stringify(items),
      total,
      order_type,
      customer_name,
      phone_number,
      address,
      payment_method,
      driver_id || null,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    }
  );
};

exports.deleteOrder = (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ID" });

  db.run(`DELETE FROM orders WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ success: true });
  });
};
