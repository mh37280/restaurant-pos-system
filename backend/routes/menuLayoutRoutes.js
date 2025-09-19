const express = require('express');
const controller = require('../controllers/menuLayoutController');

const router = express.Router();

router.get('/categories', controller.listCategories);
router.post('/categories', controller.createCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

router.get('/categories/:categoryId/panels', controller.listPanels);
router.post('/categories/:categoryId/panels', controller.createPanel);
router.put('/panels/:panelId', controller.updatePanel);
router.delete('/panels/:panelId', controller.deletePanel);

router.get('/panels/:panelId/slots', controller.getPanelSlots);
router.put('/panels/:panelId/slots', controller.replacePanelSlots);

module.exports = router;
