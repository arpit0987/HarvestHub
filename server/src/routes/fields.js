const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all fields with active crop and rotation overview
router.get('/', (req, res) => {
  try {
    const fields = db.prepare(`
      SELECT f.*,
        (
          SELECT c.name FROM crop_rotations cr
          JOIN crops c ON cr.crop_id = c.id
          WHERE cr.field_id = f.id AND cr.year = 2026 AND cr.season = 'Spring'
          LIMIT 1
        ) as current_crop,
        (
          SELECT COUNT(*) FROM field_operations fo
          WHERE fo.field_id = f.id AND fo.status IN ('Planned', 'In Progress')
        ) as pending_operations
      FROM fields f
      ORDER BY f.id ASC
    `).all();

    res.json({ success: true, data: fields });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single field by id with detailed soil and operation history
router.get('/:id', (req, res) => {
  try {
    const field = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Field not found' });
    }

    const rotations = db.prepare(`
      SELECT cr.*, c.name as crop_name, c.botanical_family, c.nitrogen_demand
      FROM crop_rotations cr
      JOIN crops c ON cr.crop_id = c.id
      WHERE cr.field_id = ?
      ORDER BY cr.year ASC, cr.season ASC
    `).all(req.params.id);

    const operations = db.prepare(`
      SELECT fo.*, c.name as crop_name
      FROM field_operations fo
      LEFT JOIN crops c ON fo.crop_id = c.id
      WHERE fo.field_id = ?
      ORDER BY fo.scheduled_date DESC
    `).all(req.params.id);

    const yields = db.prepare(`
      SELECT hy.*, c.name as crop_name
      FROM harvest_yields hy
      JOIN crops c ON hy.crop_id = c.id
      WHERE hy.field_id = ?
      ORDER BY hy.year DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        ...field,
        rotations,
        operations,
        yields
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new field
router.post('/', (req, res) => {
  try {
    const { name, acreage, soil_type, ph_level, organic_matter_pct, irrigation_type, latitude, longitude, status } = req.body;
    if (!name || !acreage || !soil_type) {
      return res.status(400).json({ success: false, error: 'Name, acreage, and soil_type are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO fields (name, acreage, soil_type, ph_level, organic_matter_pct, irrigation_type, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      parseFloat(acreage),
      soil_type,
      ph_level ? parseFloat(ph_level) : 6.5,
      organic_matter_pct ? parseFloat(organic_matter_pct) : 3.0,
      irrigation_type || 'Rainfed',
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      status || 'Active'
    );

    const newField = db.prepare('SELECT * FROM fields WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newField });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update field
router.put('/:id', (req, res) => {
  try {
    const { name, acreage, soil_type, ph_level, organic_matter_pct, irrigation_type, status } = req.body;
    const stmt = db.prepare(`
      UPDATE fields
      SET name = COALESCE(?, name),
          acreage = COALESCE(?, acreage),
          soil_type = COALESCE(?, soil_type),
          ph_level = COALESCE(?, ph_level),
          organic_matter_pct = COALESCE(?, organic_matter_pct),
          irrigation_type = COALESCE(?, irrigation_type),
          status = COALESCE(?, status)
      WHERE id = ?
    `);

    stmt.run(
      name,
      acreage !== undefined ? parseFloat(acreage) : null,
      soil_type,
      ph_level !== undefined ? parseFloat(ph_level) : null,
      organic_matter_pct !== undefined ? parseFloat(organic_matter_pct) : null,
      irrigation_type,
      status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM fields WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE field
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM fields WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Field deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
