const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const db = require('../models/database');


router.put('/unassign-driver', (req, res) => {
  const { order_id } = req.body;

  db.run("UPDATE orders SET driver_id = NULL WHERE id = ?", [order_id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to unassign driver" });
    }
    res.status(200).json({ message: "Driver unassigned" });
  });
});

router.put("/mark-delivered", (req, res) => {
  const { order_ids } = req.body;
  const placeholders = order_ids.map(() => "?").join(",");
  const query = `UPDATE orders SET status = 'delivered' WHERE id IN (${placeholders})`;

  db.run(query, order_ids, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update order status" });
    }
    res.status(200).json({ message: "Orders marked as delivered" });
  });
});


router.get("/", orderController.getAllOrders);
router.post("/", orderController.createOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.put('/assign-driver', orderController.updateOrderDriver);


module.exports = router;
