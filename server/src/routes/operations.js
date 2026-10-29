const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all operations
router.get('/', (req, res) => {
  try {
    const { status, fieldId, type } = req.query;
    let query = `
      SELECT fo.*,
             f.name as field_name, f.acreage,
             c.name as crop_name,
             (SELECT COALESCE(SUM(oi.total_cost), 0) FROM operation_inputs oi WHERE oi.operation_id = fo.id) as total_input_cost,
             (SELECT COUNT(*) FROM operation_inputs oi WHERE oi.operation_id = fo.id) as inputs_count
      FROM field_operations fo
      JOIN fields f ON fo.field_id = f.id
      LEFT JOIN crops c ON fo.crop_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND fo.status = ?';
      params.push(status);
    }
    if (fieldId) {
      query += ' AND fo.field_id = ?';
      params.push(fieldId);
    }
    if (type) {
      query += ' AND fo.operation_type = ?';
      params.push(type);
    }

    query += ' ORDER BY fo.scheduled_date ASC';

    const operations = db.prepare(query).all(...params);
    res.json({ success: true, data: operations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single operation with inputs
router.get('/:id', (req, res) => {
  try {
    const op = db.prepare(`
      SELECT fo.*, f.name as field_name, f.acreage, c.name as crop_name
      FROM field_operations fo
      JOIN fields f ON fo.field_id = f.id
      LEFT JOIN crops c ON fo.crop_id = c.id
      WHERE fo.id = ?
    `).get(req.params.id);

    if (!op) return res.status(404).json({ success: false, error: 'Operation not found' });

    const inputs = db.prepare('SELECT * FROM operation_inputs WHERE operation_id = ?').all(req.params.id);
    const totalCost = inputs.reduce((sum, i) => sum + i.total_cost, 0);

    res.json({
      success: true,
      data: {
        ...op,
        inputs,
        total_input_cost: totalCost
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new operation
router.post('/', (req, res) => {
  try {
    const { field_id, crop_id, operation_type, title, scheduled_date, assigned_to, priority, status, weather_prerequisites, notes, inputs } = req.body;

    if (!field_id || !operation_type || !title || !scheduled_date || !assigned_to) {
      return res.status(400).json({ success: false, error: 'field_id, operation_type, title, scheduled_date, and assigned_to are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO field_operations (field_id, crop_id, operation_type, title, scheduled_date, assigned_to, priority, status, weather_prerequisites, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      field_id,
      crop_id ? crop_id : null,
      operation_type,
      title,
      scheduled_date,
      assigned_to,
      priority || 'Medium',
      status || 'Planned',
      weather_prerequisites || '',
      notes || ''
    );

    const operationId = result.lastInsertRowid;

    // Optional initial inputs
    if (inputs && Array.isArray(inputs)) {
      const insertInput = db.prepare(`
        INSERT INTO operation_inputs (operation_id, input_name, category, quantity, unit, cost_per_unit, total_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of inputs) {
        if (item.input_name && item.quantity && item.cost_per_unit) {
          const totalCost = parseFloat(item.quantity) * parseFloat(item.cost_per_unit);
          insertInput.run(
            operationId,
            item.input_name,
            item.category || 'Supplies',
            parseFloat(item.quantity),
            item.unit || 'units',
            parseFloat(item.cost_per_unit),
            totalCost
          );
        }
      }
    }

    const created = db.prepare(`
      SELECT fo.*, f.name as field_name, c.name as crop_name
      FROM field_operations fo
      JOIN fields f ON fo.field_id = f.id
      LEFT JOIN crops c ON fo.crop_id = c.id
      WHERE fo.id = ?
    `).get(operationId);

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update operation (status, dates, notes)
router.put('/:id', (req, res) => {
  try {
    const { status, completed_date, scheduled_date, assigned_to, priority, notes, weather_prerequisites } = req.body;

    const stmt = db.prepare(`
      UPDATE field_operations
      SET status = COALESCE(?, status),
          completed_date = COALESCE(?, completed_date),
          scheduled_date = COALESCE(?, scheduled_date),
          assigned_to = COALESCE(?, assigned_to),
          priority = COALESCE(?, priority),
          notes = COALESCE(?, notes),
          weather_prerequisites = COALESCE(?, weather_prerequisites)
      WHERE id = ?
    `);

    stmt.run(
      status,
      completed_date,
      scheduled_date,
      assigned_to,
      priority,
      notes,
      weather_prerequisites,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM field_operations WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add input to operation
router.post('/:id/inputs', (req, res) => {
  try {
    const { input_name, category, quantity, unit, cost_per_unit } = req.body;
    if (!input_name || !quantity || !cost_per_unit) {
      return res.status(400).json({ success: false, error: 'input_name, quantity, and cost_per_unit are required' });
    }

    const qty = parseFloat(quantity);
    const cpu = parseFloat(cost_per_unit);
    const totalCost = qty * cpu;

    const stmt = db.prepare(`
      INSERT INTO operation_inputs (operation_id, input_name, category, quantity, unit, cost_per_unit, total_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(req.params.id, input_name, category || 'Supplies', qty, unit || 'units', cpu, totalCost);
    const created = db.prepare('SELECT * FROM operation_inputs WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE single input
router.delete('/inputs/:inputId', (req, res) => {
  try {
    db.prepare('DELETE FROM operation_inputs WHERE id = ?').run(req.params.inputId);
    res.json({ success: true, message: 'Input deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE operation
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM field_operations WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Operation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
