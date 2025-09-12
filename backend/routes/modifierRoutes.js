const express = require("express");
const router = express.Router();
const modifierController = require("../controllers/modifierController");

// CRUD for modifiers
router.get("/", modifierController.getAllModifiers);
router.post("/", modifierController.createModifier);
router.put("/:id", modifierController.updateModifier);
router.delete("/:id", modifierController.deleteModifier);
router.get("/by-menu/:menu_id", modifierController.getModifiersByMenuId);

// CRUD for modifier options
router.get("/options/:modifier_id", modifierController.getModifierOptions);
router.post("/options", modifierController.createModifierOption);
router.put("/options/:id", modifierController.updateModifierOption);
router.delete("/options/:id", modifierController.deleteModifierOption);

module.exports = router;
