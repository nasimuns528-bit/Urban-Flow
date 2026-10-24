import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/wards - Fetch all wards
router.get('/', async (req, res) => {
  try {
    const [wards] = await pool.query(`
      SELECT w.*, 
        (SELECT COUNT(*) FROM incidents i WHERE i.ward_id = w.id AND i.status IN ('reported', 'verified', 'assigned', 'in_progress')) as active_incidents_count
      FROM wards w
      ORDER BY w.ward_number ASC
    `);
    res.json({ success: true, count: wards.length, wards });
  } catch (error) {
    console.error('Fetch wards error:', error);
    res.status(500).json({ success: false, error: 'Could not fetch municipal wards' });
  }
});

export default router;
