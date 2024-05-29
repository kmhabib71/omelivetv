const express = require("express");
const router = express.Router();
const { getEngagedPairs } = require("../controllers/matchController");

// Define the route to get engaged pairs
router.get("/engaged-pairs", getEngagedPairs);

module.exports = router;
