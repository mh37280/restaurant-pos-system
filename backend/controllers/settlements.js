const db = require("../models/database"); 

exports.getSettlementReport = async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const rows = await db.allAsync(
      `SELECT DATE(created_at) as date, payment_method, SUM(total) as total
       FROM orders
       WHERE DATE(created_at) BETWEEN ? AND ?
       GROUP BY date, payment_method
       ORDER BY date DESC`,
      [start, end]
    );

    // format into nested object: { "2025-09-14": { cash: 200, card: 150 } }
    const formatted = {};
    rows.forEach((row) => {
      if (!formatted[row.date]) formatted[row.date] = {};
      formatted[row.date][row.payment_method] = parseFloat(row.total);
    });

    res.json(formatted);
  } catch (err) {
    console.error("Error generating settlement report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
