const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.getMenuItems);
router.post('/', menuController.addMenuItem);
router.delete('/:id', menuController.deleteMenuItem);
router.put('/:id', menuController.updateMenuItem);

router.put('/:id/availability', menuController.toggleAvailability);


module.exports = router;
