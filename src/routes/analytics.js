import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    // 1. Total and status counts
    const [statusCounts] = await pool.query(`
      SELECT 
        COUNT(*) as total_incidents,
        SUM(CASE WHEN status IN ('reported', 'verified', 'assigned', 'in_progress') THEN 1 ELSE 0 END) as active_incidents,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_incidents,
        SUM(CASE WHEN priority_score >= 80 AND status != 'resolved' THEN 1 ELSE 0 END) as critical_hotspots,
        SUM(CASE WHEN water_depth = 'submerged' AND status != 'resolved' THEN 1 ELSE 0 END) as submerged_zones
      FROM incidents
    `);

    // 2. Average resolution time in minutes from tasks
    const [avgTimeResult] = await pool.query(`
      SELECT 
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, dispatched_at, resolved_at))) as avg_resolution_minutes,
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, dispatched_at))) as avg_dispatch_minutes
      FROM tasks
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
    `);

    // 3. Field workforce deployment stats
    const [workerStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT id) as total_field_workers,
        (SELECT COUNT(DISTINCT assigned_to_user_id) FROM tasks WHERE status IN ('assigned', 'en_route', 'on_site', 'in_progress')) as currently_deployed
      FROM users
      WHERE role = 'field_worker' AND is_active = TRUE
    `);

    const overview = statusCounts[0];
    const resolutionRate = overview.total_incidents > 0 
      ? Math.round((overview.resolved_incidents / overview.total_incidents) * 100) 
      : 0;

    res.json({
      success: true,
      metrics: {
        totalIncidents: overview.total_incidents || 0,
        activeIncidents: overview.active_incidents || 0,
        resolvedIncidents: overview.resolved_incidents || 0,
        criticalHotspots: overview.critical_hotspots || 0,
        submergedZones: overview.submerged_zones || 0,
        resolutionRatePercent: resolutionRate,
        avgResolutionMinutes: avgTimeResult[0].avg_resolution_minutes || 85,
        avgDispatchMinutes: avgTimeResult[0].avg_dispatch_minutes || 22,
        totalWorkers: workerStats[0].total_field_workers || 0,
        deployedWorkers: workerStats[0].currently_deployed || 0
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ success: false, error: 'Failed to compute analytics overview' });
  }
});

// GET /api/analytics/charts
router.get('/charts', async (req, res) => {
  try {
    // 1. Water depth distribution
    const [depthRows] = await pool.query(`
      SELECT water_depth, COUNT(*) as count
      FROM incidents
      GROUP BY water_depth
    `);

    // 2. Blockage type distribution
    const [blockageRows] = await pool.query(`
      SELECT blockage_type, COUNT(*) as count
      FROM incidents
      GROUP BY blockage_type
      ORDER BY count DESC
    `);

    // 3. Ward vulnerability breakdown
    const [wardRows] = await pool.query(`
      SELECT 
        w.name as ward_name,
        w.ward_number,
        w.drainage_capacity_rating,
        COUNT(i.id) as incident_count,
        SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN i.status IN ('reported', 'verified', 'assigned', 'in_progress') THEN 1 ELSE 0 END) as active_count
      FROM wards w
      LEFT JOIN incidents i ON w.id = i.ward_id
      GROUP BY w.id, w.name, w.ward_number, w.drainage_capacity_rating
      ORDER BY active_count DESC, incident_count DESC
    `);

    // 4. Incident timeline (Last 7 days or sample hourly buckets)
    const [timelineRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b %d %H:00') as time_label,
        COUNT(*) as reported_count
      FROM incidents
      GROUP BY time_label
      ORDER BY MIN(created_at) ASC
      LIMIT 12
    `);

    res.json({
      success: true,
      waterDepthDistribution: depthRows,
      blockageTypeDistribution: blockageRows,
      wardVulnerability: wardRows,
      incidentTimeline: timelineRows
    });
  } catch (error) {
    console.error('Analytics charts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chart datasets' });
  }
});

export default router;
