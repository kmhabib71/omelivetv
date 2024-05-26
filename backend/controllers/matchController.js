const { getEngagedPairsService } = require("../services/matchingService");

const getEngagedPairs = (req, res) => {
  const engagedPairs = getEngagedPairsService();
  res.json(engagedPairs);
};

module.exports = {
  getEngagedPairs,
};
