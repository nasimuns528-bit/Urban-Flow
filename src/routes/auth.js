import express from 'express';
import pool from '../config/db.js';
import { generateToken, hashPassword, comparePassword, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const [users] = await pool.query(
      'SELECT u.*, w.name as ward_name FROM users u LEFT JOIN wards w ON u.ward_id = w.id WHERE u.email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = users[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'User account has been deactivated' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ward_id: user.ward_id,
        ward_name: user.ward_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server authentication error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, phone, role = 'citizen', ward_id = null } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required' });
    }

    // Role safety: only allow citizen registration via public endpoint
    const userRole = role === 'citizen' ? 'citizen' : 'citizen';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, phone, ward_id) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name.trim(), email.trim().toLowerCase(), passwordHash, userRole, phone || null, ward_id || null]
    );

    const newUser = {
      id: result.insertId,
      full_name,
      email: email.trim().toLowerCase(),
      role: userRole,
      phone,
      ward_id
    };

    const token = generateToken(newUser);
    res.status(201).json({
      success: true,
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT u.id, u.full_name, u.email, u.role, u.phone, u.ward_id, w.name as ward_name FROM users u LEFT JOIN wards w ON u.ward_id = w.id WHERE u.id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ success: false, error: 'Error fetching session user' });
  }
});

// GET /api/auth/demo-users (Allows rapid testing between the 4 personas)
router.get('/demo-users', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, role, phone, ward_id FROM users WHERE is_active = TRUE ORDER BY id ASC'
    );
    res.json({ success: true, users });
  } catch (error) {
    console.error('Fetch demo users error:', error);
    res.status(500).json({ success: false, error: 'Could not load demo accounts' });
  }
});

export default router;
