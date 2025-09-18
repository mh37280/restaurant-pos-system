const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/', storeController.getStore);
router.put('/', storeController.updateStore);

module.exports = router;
