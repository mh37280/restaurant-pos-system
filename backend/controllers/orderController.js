const db = require("../models/database");

// ============================================
// ORDER CRUD OPERATIONS
// ============================================

exports.getAllOrders = (req, res) => {
  const query = `
    SELECT orders.*, drivers.name AS driver_name
    FROM orders
    LEFT JOIN drivers ON orders.driver_id = drivers.id
    ORDER BY orders.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Get all orders error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
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

  // Validate required fields
  if (!items || !total || !order_type) {
    return res.status(400).json({ error: "Missing required fields: items, total, order_type" });
  }

  const query = `
    INSERT INTO orders (items, total, order_type, customer_name, phone_number, address, payment_method, driver_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    JSON.stringify(items),
    total,
    order_type,
    customer_name || null,
    phone_number || null,
    address || null,
    payment_method || "cash",
    driver_id || null,
    "open"
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error("Create order error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, message: "Order created successfully" });
  });
};

exports.updateOrder = (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  const {
    items,
    total,
    order_type,
    customer_name,
    phone_number,
    address,
    payment_method,
  } = req.body;

  // Validate required fields
  if (!items || !total || !order_type) {
    return res.status(400).json({ error: "Missing required fields: items, total, order_type" });
  }

  const query = `
    UPDATE orders
    SET items = ?, total = ?, order_type = ?, customer_name = ?, phone_number = ?, address = ?, payment_method = ?
    WHERE id = ?
  `;

  const values = [
    JSON.stringify(items),
    total,
    order_type,
    customer_name || null,
    phone_number || null,
    address || null,
    payment_method || "cash",
    id,
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error("Update order error:", err.message);
      return res.status(500).json({ error: "Failed to update order" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order updated successfully" });
  });
};

exports.deleteOrder = (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  db.run("DELETE FROM orders WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Delete order error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  });
};

// ============================================
// DRIVER MANAGEMENT
// ============================================

exports.assignDriver = (req, res) => {
  const { order_id, driver_id } = req.body;

  // Validation
  if (!order_id || driver_id === undefined) {
    return res.status(400).json({ error: "Missing order_id or driver_id" });
  }

  const query = "UPDATE orders SET driver_id = ? WHERE id = ?";

  db.run(query, [driver_id, order_id], function (err) {
    if (err) {
      console.error("Assign driver error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Driver assigned successfully" });
  });
};

exports.unassignDriver = (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  db.run("UPDATE orders SET driver_id = NULL WHERE id = ?", [order_id], function (err) {
    if (err) {
      console.error("Unassign driver error:", err.message);
      return res.status(500).json({ error: "Failed to unassign driver" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Driver unassigned successfully" });
  });
};

// ============================================
// STATUS MANAGEMENT
// ============================================

exports.markOrdersDelivered = (req, res) => {
  const { order_ids } = req.body;

  // Validation
  if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
    return res.status(400).json({ error: "Invalid or empty order_ids array" });
  }

  const placeholders = order_ids.map(() => "?").join(",");
  const query = `UPDATE orders SET status = 'delivered' WHERE id IN (${placeholders})`;

  db.run(query, order_ids, function (err) {
    if (err) {
      console.error("Mark delivered error:", err.message);
      return res.status(500).json({ error: "Failed to update order status" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "No orders found with provided IDs" });
    }

    res.json({
      message: `${this.changes} order(s) marked as delivered`,
      updated_count: this.changes
    });
  });
};