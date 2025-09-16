const db = require("../models/database");

exports.getSettlementReport = async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "Start and end dates are required" });
  }

  try {
    const rows = await db.allAsync(
      `SELECT 
     DATE(created_at) AS date,
     SUM(CASE 
           WHEN cash_received IS NOT NULL THEN cash_received 
           WHEN payment_method = 'cash' THEN total 
           ELSE 0 
         END) AS cash,
     SUM(CASE 
           WHEN card_amount IS NOT NULL THEN card_amount 
           WHEN payment_method = 'card' THEN total 
           ELSE 0 
         END) AS card
   FROM orders
   WHERE DATE(created_at) BETWEEN ? AND ?
   GROUP BY date
   ORDER BY date DESC`,
      [start, end]
    );


    const formatted = {};
    rows.forEach(row => {
      formatted[row.date] = {
        cash: parseFloat(row.cash || 0),
        card: parseFloat(row.card || 0),
      };
    });
    res.json(formatted);
  } catch (err) {
    console.error("Error generating settlement report:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
