const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Order CRUD operations
router.get("/", orderController.getAllOrders);
router.post("/", orderController.createOrder);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

// Driver management
router.put("/assign-driver", orderController.assignDriver);
router.put("/unassign-driver", orderController.unassignDriver);

// Status management
router.put("/mark-delivered", orderController.markOrdersDelivered);

module.exports = router;