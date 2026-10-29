const express = require('express');
const router = express.Router();
const db = require('../db');
const { evaluateRotationSequence } = require('../rules/rotationEngine');

// GET all rotations (optionally filter by fieldId or year)
router.get('/', (req, res) => {
  try {
    const { fieldId, year } = req.query;
    let query = `
      SELECT cr.*,
        f.name as field_name, f.acreage,
        c.name as crop_name, c.botanical_family, c.nitrogen_demand, c.root_depth, c.water_requirement, c.yield_unit
      FROM crop_rotations cr
      JOIN fields f ON cr.field_id = f.id
      JOIN crops c ON cr.crop_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (fieldId) {
      query += ' AND cr.field_id = ?';
      params.push(fieldId);
    }
    if (year) {
      query += ' AND cr.year = ?';
      params.push(year);
    }

    query += ' ORDER BY cr.field_id ASC, cr.year ASC, cr.season ASC';

    const rotations = db.prepare(query).all(...params);
    res.json({ success: true, data: rotations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET evaluation for a specific field's multi-year sequence
router.get('/evaluate/:fieldId', (req, res) => {
  try {
    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.fieldId);
    if (!field) return res.status(404).json({ success: false, error: 'Field not found' });

    const rotations = db.prepare(`
      SELECT cr.year, cr.season, cr.status,
             c.name, c.botanical_family, c.nitrogen_demand, c.root_depth, c.water_requirement
      FROM crop_rotations cr
      JOIN crops c ON cr.crop_id = c.id
      WHERE cr.field_id = ?
      ORDER BY cr.year ASC, cr.season ASC
    `).all(req.params.fieldId);

    const formatted = rotations.map(r => ({
      year: r.year,
      season: r.season,
      crop: {
        name: r.name,
        botanical_family: r.botanical_family,
        nitrogen_demand: r.nitrogen_demand,
        root_depth: r.root_depth,
        water_requirement: r.water_requirement
      }
    }));

    const evaluation = evaluateRotationSequence(formatted);

    res.json({
      success: true,
      field,
      rotations: formatted,
      evaluation
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST simulate what-if sequence
router.post('/evaluate-simulated', (req, res) => {
  try {
    const { sequence } = req.body;
    // sequence: Array of { year, season, cropId }
    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({ success: false, error: 'Sequence array is required' });
    }

    const formatted = sequence.map(item => {
      const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(item.cropId);
      return {
        year: item.year,
        season: item.season || 'Spring',
        crop: crop ? {
          name: crop.name,
          botanical_family: crop.botanical_family,
          nitrogen_demand: crop.nitrogen_demand,
          root_depth: crop.root_depth,
          water_requirement: crop.water_requirement
        } : null
      };
    }).filter(i => i.crop !== null);

    const evaluation = evaluateRotationSequence(formatted);
    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST upsert rotation entry
router.post('/', (req, res) => {
  try {
    const { field_id, crop_id, year, season, target_yield, notes, status } = req.body;
    if (!field_id || !crop_id || !year || !season) {
      return res.status(400).json({ success: false, error: 'field_id, crop_id, year, and season are required' });
    }

    const existing = db.prepare(`
      SELECT id FROM crop_rotations
      WHERE field_id = ? AND year = ? AND season = ?
    `).get(field_id, year, season);

    if (existing) {
      db.prepare(`
        UPDATE crop_rotations
        SET crop_id = ?, target_yield = ?, notes = ?, status = ?
        WHERE id = ?
      `).run(crop_id, target_yield !== undefined ? target_yield : null, notes || '', status || 'Planned', existing.id);

      const updated = db.prepare(`
        SELECT cr.*, c.name as crop_name, f.name as field_name
        FROM crop_rotations cr
        JOIN crops c ON cr.crop_id = c.id
        JOIN fields f ON cr.field_id = f.id
        WHERE cr.id = ?
      `).get(existing.id);

      return res.json({ success: true, data: updated, action: 'updated' });
    }

    const result = db.prepare(`
      INSERT INTO crop_rotations (field_id, crop_id, year, season, target_yield, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(field_id, crop_id, year, season, target_yield !== undefined ? target_yield : null, notes || '', status || 'Planned');

    const created = db.prepare(`
      SELECT cr.*, c.name as crop_name, f.name as field_name
      FROM crop_rotations cr
      JOIN crops c ON cr.crop_id = c.id
      JOIN fields f ON cr.field_id = f.id
      WHERE cr.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: created, action: 'created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE rotation entry
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM crop_rotations WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Rotation entry removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
