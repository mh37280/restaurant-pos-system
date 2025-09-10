const express = require('express');
const router = express.Router();
const driversController = require('../controllers/driversController');

router.get('/', driversController.getAllDrivers);
router.post('/', driversController.addDriver);
router.put('/:id', driversController.updateDriver);     
router.delete('/:id', driversController.removeDriver);     


module.exports = router;
