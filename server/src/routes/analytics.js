const express = require('express');
const router = express.Router();
const db = require('../db');
const { evaluateRotationSequence } = require('../rules/rotationEngine');

// GET high level farm KPIs
router.get('/kpis', (req, res) => {
  try {
    const totalAcreage = db.prepare('SELECT COALESCE(SUM(acreage), 0) as total FROM fields').get().total;
    const activeFields = db.prepare("SELECT COUNT(*) as count FROM fields WHERE status = 'Active'").get().count;

    const pendingOps = db.prepare("SELECT COUNT(*) as count FROM field_operations WHERE status IN ('Planned', 'In Progress')").get().count;
    const completedOps = db.prepare("SELECT COUNT(*) as count FROM field_operations WHERE status = 'Completed'").get().count;

    // Maintenance alerts count
    const fleet = db.prepare('SELECT current_hours, next_service_hours FROM equipment').all();
    let overdueCount = 0;
    let dueSoonCount = 0;
    for (const eq of fleet) {
      const diff = eq.next_service_hours - eq.current_hours;
      if (diff <= 0) overdueCount++;
      else if (diff <= 25) dueSoonCount++;
    }

    // Average rotation score across all fields
    const allFields = db.prepare('SELECT id FROM fields').all();
    let totalScore = 0;
    let fieldsScored = 0;

    for (const f of allFields) {
      const rotations = db.prepare(`
        SELECT cr.year, cr.season, c.name, c.botanical_family, c.nitrogen_demand, c.root_depth, c.water_requirement
        FROM crop_rotations cr
        JOIN crops c ON cr.crop_id = c.id
        WHERE cr.field_id = ?
        ORDER BY cr.year ASC, cr.season ASC
      `).all(f.id);

      if (rotations.length > 0) {
        const evalRes = evaluateRotationSequence(rotations.map(r => ({
          year: r.year,
          season: r.season,
          crop: r
        })));
        totalScore += evalRes.score;
        fieldsScored++;
      }
    }

    const avgRotationScore = fieldsScored > 0 ? Math.round(totalScore / fieldsScored) : 100;

    // Total Financials
    const financials = db.prepare(`
      SELECT
        COALESCE(SUM(total_revenue), 0) as total_revenue,
        COALESCE(SUM(total_input_cost), 0) as total_expenses,
        COALESCE(SUM(net_profit), 0) as total_net_profit
      FROM harvest_yields
    `).get();

    res.json({
      success: true,
      data: {
        totalAcreage,
        activeFields,
        pendingOps,
        completedOps,
        overdueCount,
        dueSoonCount,
        avgRotationScore,
        financials: {
          totalRevenue: financials.total_revenue,
          totalExpenses: financials.total_expenses,
          totalNetProfit: financials.total_net_profit,
          overallMarginPct: financials.total_revenue > 0
            ? Math.round((financials.total_net_profit / financials.total_revenue) * 1000) / 10
            : 0
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET P&L (Profit & Loss) analysis
router.get('/pnl', (req, res) => {
  try {
    const { year } = req.query;

    let query = `
      SELECT
        hy.*,
        f.name as field_name, f.acreage,
        c.name as crop_name, c.yield_unit
      FROM harvest_yields hy
      JOIN fields f ON hy.field_id = f.id
      JOIN crops c ON hy.crop_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      query += ' AND hy.year = ?';
      params.push(year);
    }

    query += ' ORDER BY hy.year DESC, hy.total_revenue DESC';

    const records = db.prepare(query).all(...params);

    // Group by year
    const byYear = {};
    for (const r of records) {
      if (!byYear[r.year]) {
        byYear[r.year] = {
          year: r.year,
          revenue: 0,
          expenses: 0,
          netProfit: 0,
          acreage: 0,
          records: []
        };
      }
      byYear[r.year].revenue += r.total_revenue;
      byYear[r.year].expenses += r.total_input_cost;
      byYear[r.year].netProfit += r.net_profit;
      byYear[r.year].acreage += r.acreage;
      byYear[r.year].records.push(r);
    }

    // Group by crop
    const byCrop = {};
    for (const r of records) {
      if (!byCrop[r.crop_name]) {
        byCrop[r.crop_name] = {
          cropName: r.crop_name,
          revenue: 0,
          expenses: 0,
          netProfit: 0,
          totalYield: 0,
          unit: r.yield_unit,
          acres: 0
        };
      }
      byCrop[r.crop_name].revenue += r.total_revenue;
      byCrop[r.crop_name].expenses += r.total_input_cost;
      byCrop[r.crop_name].netProfit += r.net_profit;
      byCrop[r.crop_name].totalYield += r.total_yield;
      byCrop[r.crop_name].acres += r.acreage;
    }

    res.json({
      success: true,
      data: {
        records,
        byYear: Object.values(byYear),
        byCrop: Object.values(byCrop)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET inputs breakdown by category
router.get('/inputs-breakdown', (req, res) => {
  try {
    const breakdown = db.prepare(`
      SELECT category,
             COALESCE(SUM(total_cost), 0) as total_cost,
             COUNT(*) as line_items_count
      FROM operation_inputs
      GROUP BY category
      ORDER BY total_cost DESC
    `).all();

    const grandTotal = breakdown.reduce((sum, b) => sum + b.total_cost, 0);

    const formatted = breakdown.map(b => ({
      ...b,
      percentage: grandTotal > 0 ? Math.round((b.total_cost / grandTotal) * 1000) / 10 : 0
    }));

    res.json({
      success: true,
      data: {
        grandTotal,
        categories: formatted
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET yield comparisons
router.get('/yields', (req, res) => {
  try {
    const yields = db.prepare(`
      SELECT
        hy.year, hy.season, hy.yield_per_acre, hy.moisture_pct, hy.quality_grade,
        f.name as field_name,
        c.name as crop_name, c.typical_yield_per_acre as benchmark_yield, c.yield_unit
      FROM harvest_yields hy
      JOIN fields f ON hy.field_id = f.id
      JOIN crops c ON hy.crop_id = c.id
      ORDER BY hy.year ASC, f.name ASC
    `).all();

    res.json({ success: true, data: yields });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
