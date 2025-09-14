const express = require("express");
const router = express.Router();
const { getSettlementReport } = require("../controllers/settlements");

router.get("/", getSettlementReport);

module.exports = router;