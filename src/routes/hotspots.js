import express from 'express';
import pool from '../config/db.js';
import { clusterIncidents } from '../services/priorityEngine.js';

const router = express.Router();

// GET /api/hotspots - Aggregated hotspot analysis and spatial clusters
router.get('/', async (req, res) => {
  try {
    // Fetch only active unresolved incidents
    const [incidents] = await pool.query(`
      SELECT i.*, w.name as ward_name, w.ward_number, w.drainage_capacity_rating
      FROM incidents i
      LEFT JOIN wards w ON i.ward_id = w.id
      WHERE i.status IN ('reported', 'verified', 'assigned', 'in_progress')
      ORDER BY i.priority_score DESC
    `);

    // Group into spatial clusters (~500m radius)
    const clusters = clusterIncidents(incidents, 0.6);

    // Identify critical emergency hotspots (Score >= 80 or submerged)
    const criticalHotspots = incidents.filter(
      inc => inc.priority_score >= 80 || inc.water_depth === 'submerged'
    );

    // Ward level aggregation
    const wardHotspots = {};
    incidents.forEach(inc => {
      const wardKey = inc.ward_name || 'Unassigned Ward';
      if (!wardHotspots[wardKey]) {
        wardHotspots[wardKey] = {
          wardName: wardKey,
          wardNumber: inc.ward_number || 'N/A',
          totalActive: 0,
          criticalCount: 0,
          maxPriority: 0,
          drainageCapacity: inc.drainage_capacity_rating || 70,
          incidents: []
        };
      }
      wardHotspots[wardKey].totalActive += 1;
      if (inc.priority_score >= 80) wardHotspots[wardKey].criticalCount += 1;
      if (inc.priority_score > wardHotspots[wardKey].maxPriority) {
        wardHotspots[wardKey].maxPriority = inc.priority_score;
      }
      wardHotspots[wardKey].incidents.push(inc);
    });

    res.json({
      success: true,
      totalActiveIncidents: incidents.length,
      criticalCount: criticalHotspots.length,
      hotspots: incidents,
      clusters,
      wardBreakdown: Object.values(wardHotspots)
    });
  } catch (error) {
    console.error('Hotspot analysis error:', error);
    res.status(500).json({ success: false, error: 'Failed to compute hotspot prioritisation' });
  }
});

export default router;
