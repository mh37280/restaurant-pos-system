const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.get("/", orderController.getAllOrders);
router.post("/", orderController.createOrder);
router.delete('/:id', orderController.deleteOrder);
router.put('/assign-driver', orderController.updateOrderDriver);


module.exports = router;
