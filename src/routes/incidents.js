import express from 'express';
import pool from '../config/db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadEvidence } from '../middleware/upload.js';
import { calculatePriorityScore } from '../services/priorityEngine.js';
import { reverseGeocode } from '../services/geoService.js';

const router = express.Router();

function generateTrackingCode() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `UF-${year}-${randomDigits}`;
}

// POST /api/incidents - Report a new flood/drainage incident
router.post('/', optionalAuth, uploadEvidence.single('photo'), async (req, res) => {
  try {
    const {
      citizen_name = 'Anonymous Citizen',
      citizen_phone,
      latitude,
      longitude,
      address,
      landmark,
      ward_id,
      water_depth = 'knee',
      blockage_type = 'drain_overflow',
      description,
      critical_infra_nearby = false,
      estimated_affected_people = 20
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Latitude and Longitude GPS coordinates are required' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Resolve address if missing
    let resolvedAddress = address;
    if (!resolvedAddress || resolvedAddress.trim() === '') {
      resolvedAddress = await reverseGeocode(lat, lng);
    }

    // Assign photo URL if uploaded
    let photo_url = null;
    if (req.file) {
      photo_url = `/uploads/${req.file.filename}`;
    }

    // Determine priority score using algorithm
    const isCriticalInfra = critical_infra_nearby === 'true' || critical_infra_nearby === true;
    const initialPriority = calculatePriorityScore({
      waterDepth: water_depth,
      criticalInfraNearby: isCriticalInfra,
      blockageType: blockage_type,
      createdAt: new Date()
    });

    const tracking_code = generateTrackingCode();
    const reported_by_user_id = req.user ? req.user.id : null;

    // Check / match nearest ward if ward_id not provided
    let finalWardId = ward_id ? parseInt(ward_id, 10) : null;
    if (!finalWardId) {
      const [wards] = await pool.query('SELECT id FROM wards ORDER BY ABS(center_lat - ?) + ABS(center_lng - ?) ASC LIMIT 1', [lat, lng]);
      if (wards.length > 0) finalWardId = wards[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO incidents (
        tracking_code, citizen_name, citizen_phone, latitude, longitude, address, landmark,
        ward_id, water_depth, blockage_type, description, photo_url, status,
        priority_score, critical_infra_nearby, estimated_affected_people, reported_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', ?, ?, ?, ?)`,
      [
        tracking_code, citizen_name, citizen_phone || null, lat, lng, resolvedAddress, landmark || null,
        finalWardId, water_depth, blockage_type, description || null, photo_url,
        initialPriority, isCriticalInfra, parseInt(estimated_affected_people, 10) || 20, reported_by_user_id
      ]
    );

    const incidentId = result.insertId;

    // Add initial log in incident_updates
    await pool.query(
      'INSERT INTO incident_updates (incident_id, updated_by_user_id, previous_status, new_status, comments) VALUES (?, ?, ?, ?, ?)',
      [incidentId, reported_by_user_id, 'none', 'reported', 'Incident logged by citizen. Priority computed by automated sensor/triage system.']
    );

    // Fetch newly created record
    const [createdRows] = await pool.query(
      'SELECT i.*, w.name as ward_name FROM incidents i LEFT JOIN wards w ON i.ward_id = w.id WHERE i.id = ?',
      [incidentId]
    );

    res.status(201).json({
      success: true,
      message: 'Flood incident reported successfully',
      incident: createdRows[0]
    });
  } catch (error) {
    console.error('Incident report error:', error);
    res.status(500).json({ success: false, error: 'Failed to record flood incident' });
  }
});

// GET /api/incidents - List incidents with filtering
router.get('/', async (req, res) => {
  try {
    const { status, ward_id, water_depth, min_priority, search } = req.query;

    let query = `
      SELECT i.*, w.name as ward_name, w.ward_number,
        (SELECT COUNT(*) FROM tasks t WHERE t.incident_id = i.id) as task_count,
        (SELECT t.status FROM tasks t WHERE t.incident_id = i.id ORDER BY t.id DESC LIMIT 1) as current_task_status
      FROM incidents i
      LEFT JOIN wards w ON i.ward_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND i.status = ?';
      params.push(status);
    }
    if (ward_id && ward_id !== 'all') {
      query += ' AND i.ward_id = ?';
      params.push(parseInt(ward_id, 10));
    }
    if (water_depth && water_depth !== 'all') {
      query += ' AND i.water_depth = ?';
      params.push(water_depth);
    }
    if (min_priority) {
      query += ' AND i.priority_score >= ?';
      params.push(parseFloat(min_priority));
    }
    if (search) {
      query += ' AND (i.tracking_code LIKE ? OR i.address LIKE ? OR i.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY i.priority_score DESC, i.created_at DESC';

    const [incidents] = await pool.query(query, params);
    res.json({ success: true, count: incidents.length, incidents });
  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ success: false, error: 'Could not fetch incidents' });
  }
});

// GET /api/incidents/track/:trackingCode - Public tracking for citizens
router.get('/track/:trackingCode', async (req, res) => {
  try {
    const code = req.params.trackingCode.trim().toUpperCase();

    const [incidents] = await pool.query(
      `SELECT i.*, w.name as ward_name, w.ward_number, w.officer_contact
       FROM incidents i
       LEFT JOIN wards w ON i.ward_id = w.id
       WHERE i.tracking_code = ?`,
      [code]
    );

    if (incidents.length === 0) {
      return res.status(404).json({ success: false, error: 'No incident found with this tracking code' });
    }

    const incident = incidents[0];

    // Fetch updates / timeline
    const [updates] = await pool.query(
      `SELECT iu.*, u.full_name as updated_by_name, u.role as updated_by_role
       FROM incident_updates iu
       LEFT JOIN users u ON iu.updated_by_user_id = u.id
       WHERE iu.incident_id = ?
       ORDER BY iu.created_at ASC`,
      [incident.id]
    );

    // Fetch active task info if assigned
    const [tasks] = await pool.query(
      `SELECT t.*, u.full_name as worker_name, u.phone as worker_phone
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to_user_id = u.id
       WHERE t.incident_id = ?
       ORDER BY t.created_at DESC LIMIT 1`,
      [incident.id]
    );

    res.json({
      success: true,
      incident,
      timeline: updates,
      task: tasks.length > 0 ? tasks[0] : null
    });
  } catch (error) {
    console.error('Track incident error:', error);
    res.status(500).json({ success: false, error: 'Tracking service error' });
  }
});

// GET /api/incidents/:id - Incident by ID
router.get('/:id', async (req, res) => {
  try {
    const [incidents] = await pool.query(
      `SELECT i.*, w.name as ward_name, w.ward_number
       FROM incidents i
       LEFT JOIN wards w ON i.ward_id = w.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (incidents.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const [updates] = await pool.query(
      `SELECT iu.*, u.full_name as updater_name
       FROM incident_updates iu
       LEFT JOIN users u ON iu.updated_by_user_id = u.id
       WHERE iu.incident_id = ?
       ORDER BY iu.created_at ASC`,
      [req.params.id]
    );

    const [tasks] = await pool.query(
      `SELECT t.*, u.full_name as assigned_to_name, u.phone as assigned_to_phone
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to_user_id = u.id
       WHERE t.incident_id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      incident: incidents[0],
      updates,
      tasks
    });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ success: false, error: 'Could not fetch incident' });
  }
});

// PATCH /api/incidents/:id/triage - Officer review and priority adjustment
router.patch('/:id/triage', authenticateToken, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const { status, priority_score, notes } = req.body;
    const incidentId = req.params.id;

    const [existing] = await pool.query('SELECT status, priority_score FROM incidents WHERE id = ?', [incidentId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const prevStatus = existing[0].status;
    const newStatus = status || prevStatus;
    const newPriority = priority_score !== undefined ? parseFloat(priority_score) : existing[0].priority_score;

    await pool.query(
      `UPDATE incidents 
       SET status = ?, priority_score = ?, verified_by_user_id = ?
       WHERE id = ?`,
      [newStatus, newPriority, req.user.id, incidentId]
    );

    // Log update
    await pool.query(
      'INSERT INTO incident_updates (incident_id, updated_by_user_id, previous_status, new_status, comments) VALUES (?, ?, ?, ?, ?)',
      [incidentId, req.user.id, prevStatus, newStatus, notes || `Status updated to ${newStatus} by Officer ${req.user.full_name}`]
    );

    res.json({ success: true, message: 'Incident triaged successfully' });
  } catch (error) {
    console.error('Triage error:', error);
    res.status(500).json({ success: false, error: 'Failed to triage incident' });
  }
});

export default router;
