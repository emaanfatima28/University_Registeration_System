const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');

// Student login
router.post('/student-login', async (req, res) => {
  try {
    const { rollNumber } = req.body;
    
    const student = await Student.findOne({ rollNumber });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ student });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await User.findOne({ username, role: 'admin' });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ admin });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
