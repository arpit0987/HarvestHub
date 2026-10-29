const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all crops
router.get('/', (req, res) => {
  try {
    const crops = db.prepare('SELECT * FROM crops ORDER BY name ASC').all();
    res.json({ success: true, data: crops });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single crop
router.get('/:id', (req, res) => {
  try {
    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(req.params.id);
    if (!crop) return res.status(404).json({ success: false, error: 'Crop not found' });
    res.json({ success: true, data: crop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new crop
router.post('/', (req, res) => {
  try {
    const {
      name,
      variety,
      botanical_family,
      season,
      days_to_maturity,
      nitrogen_demand,
      root_depth,
      water_requirement,
      typical_yield_per_acre,
      yield_unit,
      market_price_per_unit,
      pests_diseases,
      companion_crops,
      incompatible_following
    } = req.body;

    if (!name || !botanical_family || !season) {
      return res.status(400).json({ success: false, error: 'Name, botanical_family, and season are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO crops (
        name, variety, botanical_family, season, days_to_maturity, nitrogen_demand,
        root_depth, water_requirement, typical_yield_per_acre, yield_unit,
        market_price_per_unit, pests_diseases, companion_crops, incompatible_following
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      variety || '',
      botanical_family,
      season,
      days_to_maturity ? parseInt(days_to_maturity) : 100,
      nitrogen_demand || 'Medium Feeder',
      root_depth || 'Medium Fibrous',
      water_requirement || 'Moderate',
      typical_yield_per_acre ? parseFloat(typical_yield_per_acre) : 50.0,
      yield_unit || 'bu/ac',
      market_price_per_unit ? parseFloat(market_price_per_unit) : 5.0,
      pests_diseases || '',
      companion_crops || '',
      incompatible_following || ''
    );

    const newCrop = db.prepare('SELECT * FROM crops WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newCrop });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
