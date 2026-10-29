const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to determine status based on hours
function calculateEquipmentStatus(currentHours, nextServiceHours, baseStatus) {
  if (baseStatus === 'Retired' || baseStatus === 'In Service') return baseStatus;
  const hoursRemaining = nextServiceHours - currentHours;
  if (hoursRemaining <= 0) return 'Overdue';
  if (hoursRemaining <= 25) return 'Due Soon';
  return 'Active';
}

// GET all equipment with live maintenance status calculation
router.get('/', (req, res) => {
  try {
    const fleet = db.prepare('SELECT * FROM equipment ORDER BY id ASC').all();

    const enriched = fleet.map(eq => {
      const tasks = db.prepare(`
        SELECT * FROM maintenance_tasks
        WHERE equipment_id = ?
        ORDER BY due_hours ASC
      `).all(eq.id);

      // Find earliest due task
      let minDue = eq.next_service_hours;
      for (const t of tasks) {
        if (t.due_hours && t.due_hours < minDue) {
          minDue = t.due_hours;
        }
      }

      const hoursRemaining = minDue - eq.current_hours;
      const computedStatus = calculateEquipmentStatus(eq.current_hours, minDue, eq.status);

      return {
        ...eq,
        computed_status: computedStatus,
        hours_remaining: Math.round(hoursRemaining * 10) / 10,
        next_service_target: minDue,
        tasks_count: tasks.length,
        tasks
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single equipment by id with tasks and maintenance logs
router.get('/:id', (req, res) => {
  try {
    const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    if (!eq) return res.status(404).json({ success: false, error: 'Equipment not found' });

    const tasks = db.prepare(`
      SELECT * FROM maintenance_tasks
      WHERE equipment_id = ?
      ORDER BY due_hours ASC
    `).all(req.params.id);

    const logs = db.prepare(`
      SELECT ml.*, mt.task_name
      FROM maintenance_logs ml
      LEFT JOIN maintenance_tasks mt ON ml.task_id = mt.id
      WHERE ml.equipment_id = ?
      ORDER BY ml.service_date DESC
    `).all(req.params.id);

    let minDue = eq.next_service_hours;
    for (const t of tasks) {
      if (t.due_hours && t.due_hours < minDue) minDue = t.due_hours;
    }

    const computedStatus = calculateEquipmentStatus(eq.current_hours, minDue, eq.status);

    res.json({
      success: true,
      data: {
        ...eq,
        computed_status: computedStatus,
        hours_remaining: Math.round((minDue - eq.current_hours) * 10) / 10,
        tasks,
        logs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add new equipment
router.post('/', (req, res) => {
  try {
    const { name, category, model, serial_number, year, current_hours, fuel_level_pct, location, next_service_hours, notes } = req.body;
    if (!name || !category || !model || !serial_number) {
      return res.status(400).json({ success: false, error: 'Name, category, model, and serial_number are required' });
    }

    const currentH = current_hours ? parseFloat(current_hours) : 0;
    const nextH = next_service_hours ? parseFloat(next_service_hours) : currentH + 100;

    const stmt = db.prepare(`
      INSERT INTO equipment (name, category, model, serial_number, year, current_hours, fuel_level_pct, location, next_service_hours, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category,
      model,
      serial_number,
      year ? parseInt(year) : new Date().getFullYear(),
      currentH,
      fuel_level_pct !== undefined ? parseFloat(fuel_level_pct) : 100,
      location || 'Main Shed',
      nextH,
      notes || ''
    );

    // Create a default routine 100h service task
    db.prepare(`
      INSERT INTO maintenance_tasks (equipment_id, task_name, interval_hours, last_completed_hours, due_hours, estimated_cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, '100-Hour Routine Inspection & Fluid Check', 100.0, currentH, currentH + 100.0, 150.0);

    const created = db.prepare('SELECT * FROM equipment WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST log operating hours
router.post('/:id/log-hours', (req, res) => {
  try {
    const { hours_to_add, total_hours, fuel_level_pct } = req.body;
    const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    if (!eq) return res.status(404).json({ success: false, error: 'Equipment not found' });

    let newCurrentHours = eq.current_hours;
    if (hours_to_add !== undefined) {
      newCurrentHours += parseFloat(hours_to_add);
    } else if (total_hours !== undefined) {
      newCurrentHours = parseFloat(total_hours);
    } else {
      return res.status(400).json({ success: false, error: 'hours_to_add or total_hours is required' });
    }

    const newFuel = fuel_level_pct !== undefined ? parseFloat(fuel_level_pct) : eq.fuel_level_pct;

    db.prepare(`
      UPDATE equipment
      SET current_hours = ?, fuel_level_pct = ?
      WHERE id = ?
    `).run(newCurrentHours, newFuel, req.params.id);

    const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    res.json({
      success: true,
      message: `Updated equipment meter to ${newCurrentHours.toFixed(1)} hrs`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST complete maintenance service
router.post('/:id/service', (req, res) => {
  try {
    const { task_id, service_date, hours_at_service, performed_by, cost, parts_replaced, notes, next_interval_hours } = req.body;
    const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id);
    if (!eq) return res.status(404).json({ success: false, error: 'Equipment not found' });

    const svcDate = service_date || new Date().toISOString().split('T')[0];
    const hrsAtService = hours_at_service ? parseFloat(hours_at_service) : eq.current_hours;
    const svcCost = cost ? parseFloat(cost) : 0;

    // Insert maintenance log
    db.prepare(`
      INSERT INTO maintenance_logs (equipment_id, task_id, service_date, hours_at_service, performed_by, cost, parts_replaced, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.id,
      task_id || null,
      svcDate,
      hrsAtService,
      performed_by || 'Farm Technician',
      svcCost,
      parts_replaced || 'Standard filters and fluids',
      notes || 'Scheduled maintenance completed'
    );

    // If a task_id was specified, advance its due_hours
    let newNextService = eq.next_service_hours;
    if (task_id) {
      const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(task_id);
      if (task) {
        const interval = next_interval_hours ? parseFloat(next_interval_hours) : task.interval_hours;
        const newDue = hrsAtService + interval;
        db.prepare(`
          UPDATE maintenance_tasks
          SET last_completed_hours = ?, last_completed_date = ?, due_hours = ?
          WHERE id = ?
        `).run(hrsAtService, svcDate, newDue, task_id);
        newNextService = newDue;
      }
    } else {
      newNextService = hrsAtService + 100.0;
    }

    // Update equipment last_service_date and status
    db.prepare(`
      UPDATE equipment
      SET last_service_date = ?, next_service_hours = ?, status = 'Active', current_hours = MAX(current_hours, ?)
      WHERE id = ?
    `).run(svcDate, newNextService, hrsAtService, req.params.id);

    res.json({
      success: true,
      message: 'Maintenance successfully logged and service interval reset'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE equipment
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
