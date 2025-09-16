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
    cash_received,
    card_amount
  } = req.body;

  if (!items || !total || !order_type) {
    return res.status(400).json({ error: "Missing required fields: items, total, order_type" });
  }

  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Step 1: Get max ticket number for today
  db.get(
    `SELECT MAX(ticket_number) AS lastTicket FROM orders WHERE DATE(created_at) = ?`,
    [todayStr],
    (err, row) => {
      if (err) {
        console.error("Ticket number lookup error:", err.message);
        return res.status(500).json({ error: err.message });
      }

      const nextTicket = (row?.lastTicket || 0) + 1;

      // Step 2: Insert order with ticket_number
      const query = `
  INSERT INTO orders (
    items, total, order_type, customer_name, phone_number,
    address, payment_method, driver_id, status, ticket_number,
    cash_received, card_amount
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        "open",
        nextTicket,
        cash_received || null,
        card_amount || null
      ];

      db.run(query, values, function (err) {
        if (err) {
          console.error("Create order error:", err.message);
          return res.status(500).json({ error: err.message });
        }

        res.json({
          id: this.lastID,
          ticket_number: nextTicket,
          message: "Order created successfully"
        });
      });
    }
  );
};

exports.getNextTicket = (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0];

  db.get(
    `SELECT MAX(ticket_number) AS lastTicket FROM orders WHERE DATE(created_at) = ?`,
    [todayStr],
    (err, row) => {
      if (err) {
        console.error("Error fetching next ticket number:", err.message);
        return res.status(500).json({ error: err.message });
      }

      const nextTicket = (row?.lastTicket || 0) + 1;
      res.json({ nextTicket });
    }
  );
};


exports.getTodaysOrders = (req, res) => {
  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const query = `
    SELECT orders.*, drivers.name AS driver_name
    FROM orders
    LEFT JOIN drivers ON orders.driver_id = drivers.id
    WHERE DATE(orders.created_at) = ?
    ORDER BY orders.ticket_number ASC
  `;

  db.all(query, [todayStr], (err, rows) => {
    if (err) {
      console.error("Get today's orders error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
};

exports.getFilteredOrders = (req, res) => {
  const { date, start, end, type, status } = req.query;
  const filters = [];
  const params = [];

  // Date filters
  if (date === "today") {
    filters.push("DATE(orders.created_at) = DATE('now', 'localtime')");
  } else if (date) {
    filters.push("DATE(orders.created_at) = ?");
    params.push(date);
  } else if (start && end) {
    filters.push("DATE(orders.created_at) BETWEEN ? AND ?");
    params.push(start, end);
  }

  // Order type (pickup, delivery, to_go)
  if (type) {
    filters.push("orders.order_type = ?");
    params.push(type);
  }

  // Order status (open, pending, delivered, etc.)
  if (status) {
    filters.push("orders.status = ?");
    params.push(status);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const query = `
    SELECT orders.*, drivers.name AS driver_name
    FROM orders
    LEFT JOIN drivers ON orders.driver_id = drivers.id
    ${whereClause}
    ORDER BY orders.ticket_number ${req.query.sort === "desc" ? "DESC" : "ASC"}
  `;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Get filtered orders error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
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