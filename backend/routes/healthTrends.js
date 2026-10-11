const router = require('express').Router();
const { getHealthTrends } = require('../services/healthTrendsService');

router.get('/', async (req, res) => {
  try {
    res.json(await getHealthTrends({ includeDemo: req.query.include_demo !== 'false' }));
  } catch (error) {
    console.error('Health trends unavailable:', error.message);
    res.json({ alerts: [], baseline_status: 'unavailable' });
  }
});

module.exports = router;
