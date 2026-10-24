import express from 'express';
import pool from '../config/db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadEvidence } from '../middleware/upload.js';

const router = express.Router();

// GET /api/tasks/workers - Fetch available field workers for assignment
router.get('/workers', authenticateToken, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const [workers] = await pool.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.ward_id, w.name as ward_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to_user_id = u.id AND t.status IN ('assigned', 'en_route', 'on_site', 'in_progress')) as active_tasks_count
      FROM users u
      LEFT JOIN wards w ON u.ward_id = w.id
      WHERE u.role = 'field_worker' AND u.is_active = TRUE
      ORDER BY active_tasks_count ASC, u.full_name ASC
    `);

    res.json({ success: true, workers });
  } catch (error) {
    console.error('Fetch workers error:', error);
    res.status(500).json({ success: false, error: 'Could not fetch field personnel' });
  }
});

// POST /api/tasks - Assign a municipal task to a field crew
router.post('/', authenticateToken, requireRole(['officer', 'admin']), async (req, res) => {
  try {
    const {
      incident_id,
      assigned_to_user_id,
      crew_size = 3,
      equipment_required = 'Submersible pump, safety cones, de-silting tools',
      sla_hours = 3,
      notes
    } = req.body;

    if (!incident_id || !assigned_to_user_id) {
      return res.status(400).json({ success: false, error: 'incident_id and assigned_to_user_id are required' });
    }

    // Verify incident exists
    const [incidents] = await pool.query('SELECT * FROM incidents WHERE id = ?', [incident_id]);
    if (incidents.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const incident = incidents[0];
    const hours = parseInt(sla_hours, 10) || 3;

    // Calculate SLA deadline
    const slaDeadline = new Date(Date.now() + hours * 3600000);

    const [taskResult] = await pool.query(
      `INSERT INTO tasks (
        incident_id, assigned_by_user_id, assigned_to_user_id, crew_size,
        equipment_required, status, sla_deadline, dispatched_at, resolution_notes
      ) VALUES (?, ?, ?, ?, ?, 'assigned', ?, NOW(), ?)`,
      [incident_id, req.user.id, assigned_to_user_id, parseInt(crew_size, 10), equipment_required, slaDeadline, notes || null]
    );

    // Update incident status to 'assigned'
    await pool.query(
      'UPDATE incidents SET status = "assigned", updated_at = NOW() WHERE id = ?',
      [incident_id]
    );

    // Fetch assigned worker details
    const [worker] = await pool.query('SELECT full_name FROM users WHERE id = ?', [assigned_to_user_id]);
    const workerName = worker.length > 0 ? worker[0].full_name : 'Field Crew';

    // Log progress update
    await pool.query(
      'INSERT INTO incident_updates (incident_id, updated_by_user_id, previous_status, new_status, comments) VALUES (?, ?, ?, ?, ?)',
      [
        incident_id,
        req.user.id,
        incident.status,
        'assigned',
        `Dispatched to Field Crew: ${workerName}. Equipment: ${equipment_required}. Target SLA: ${hours} hours.`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Task assigned successfully',
      taskId: taskResult.insertId
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign municipal task' });
  }
});

// GET /api/tasks - List tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT t.*,
        i.tracking_code, i.address, i.landmark, i.water_depth, i.blockage_type,
        i.description as incident_description, i.photo_url as incident_photo,
        i.latitude, i.longitude, i.priority_score,
        w.name as ward_name,
        u_assigner.full_name as assigned_by_name,
        u_worker.full_name as assigned_to_name,
        u_worker.phone as worker_phone
      FROM tasks t
      JOIN incidents i ON t.incident_id = i.id
      LEFT JOIN wards w ON i.ward_id = w.id
      LEFT JOIN users u_assigner ON t.assigned_by_user_id = u_assigner.id
      LEFT JOIN users u_worker ON t.assigned_to_user_id = u_worker.id
      WHERE 1=1
    `;
    const params = [];

    // If user is a field worker, only show tasks assigned to them
    if (req.user.role === 'field_worker') {
      query += ' AND t.assigned_to_user_id = ?';
      params.push(req.user.id);
    }

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.query(query, params);
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ success: false, error: 'Could not fetch tasks' });
  }
});

// PATCH /api/tasks/:id/status - Update task status and upload proof of resolution
router.patch('/:id/status', authenticateToken, uploadEvidence.single('proof_photo'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status, notes, water_level_after } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'New status is required' });
    }

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const task = tasks[0];

    // Field worker authorization: can only update their own tasks (unless officer/admin)
    if (req.user.role === 'field_worker' && task.assigned_to_user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You are not assigned to this task' });
    }

    let proof_photo_url = task.proof_photo_url;
    if (req.file) {
      proof_photo_url = `/uploads/${req.file.filename}`;
    }

    let on_site_sql = '';
    let resolved_sql = '';
    const updateParams = [status, notes || task.resolution_notes, proof_photo_url];

    if (status === 'on_site' && !task.on_site_at) {
      on_site_sql = ', on_site_at = NOW()';
    }
    if (status === 'resolved') {
      resolved_sql = ', resolved_at = NOW()';
    }

    await pool.query(
      `UPDATE tasks 
       SET status = ?, resolution_notes = ?, proof_photo_url = ? ${on_site_sql} ${resolved_sql}, updated_at = NOW()
       WHERE id = ?`,
      [...updateParams, taskId]
    );

    // Sync status with parent incident
    let incidentNewStatus = null;
    if (status === 'en_route') incidentNewStatus = 'assigned';
    else if (status === 'on_site' || status === 'in_progress') incidentNewStatus = 'in_progress';
    else if (status === 'resolved') incidentNewStatus = 'resolved';

    if (incidentNewStatus) {
      await pool.query('UPDATE incidents SET status = ?, updated_at = NOW() WHERE id = ?', [incidentNewStatus, task.incident_id]);

      // Add timeline entry
      await pool.query(
        'INSERT INTO incident_updates (incident_id, updated_by_user_id, previous_status, new_status, comments) VALUES (?, ?, ?, ?, ?)',
        [
          task.incident_id,
          req.user.id,
          task.status,
          incidentNewStatus,
          notes || `Field Crew updated status to ${status.replace('_', ' ').toUpperCase()}`
        ]
      );
    }

    res.json({
      success: true,
      message: `Task updated to ${status}`,
      proofPhoto: proof_photo_url
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

export default router;
