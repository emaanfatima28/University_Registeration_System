const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// Register for a course
router.get('/', async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('studentId', 'rollNumber name')
      .populate('courseId', 'code title');
    
    res.json(registrations);
  } catch (error) {
    console.error('Error getting registrations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Registeration Error Handling
router.get('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('studentId', 'rollNumber name')
      .populate('courseId', 'code title');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    res.json(registration);
  } catch (error) {
    console.error('Error getting registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Delete a registration
router.delete('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) return res.status(404).json({ message: 'Registration not found' });

    const course = await Course.findById(registration.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await Registration.findByIdAndDelete(req.params.id);

    course.availableSeats += 1;
    await course.save();

    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
