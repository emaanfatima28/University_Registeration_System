const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const Registration = require('../models/Registration');
const mongoose = require('mongoose');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('completedCourses', 'code title');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error getting student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student by roll number
router.get('/roll/:rollNumber', async (req, res) => {
  try {
    const student = await Student.findOne({ rollNumber: req.params.rollNumber }).populate('completedCourses', 'code title');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error getting student by roll number:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/registrations', async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      studentId: req.params.id,
      status: 'registered'
    });
    
    res.json(registrations);
  } catch (error) {
    console.error('Error getting student registrations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Register for courses
router.post('/:id/register', async (req, res) => {
  try {
    const { courseIds } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const registrations = [];
    
    for (const courseId of courseIds) {
      const course = await Course.findById(courseId);
      if (!course) throw new Error(`Course with ID ${courseId} not found`);

      if (course.availableSeats <= 0) {
        throw new Error(`Course ${course.code} has no available seats`);
      }

      const existingRegistration = await Registration.findOne({
        studentId: student._id,
        courseId: course._id,
        status: 'registered'
      });
      
      if (existingRegistration) {
        throw new Error(`Student is already registered for course ${course.code}`);
      }

      const registration = new Registration({ studentId: student._id, courseId: course._id });
      await registration.save();

      course.availableSeats -= 1;
      await course.save();

      registrations.push(registration);
    }

    res.status(201).json({ message: 'Courses registered successfully', registrations });
  } catch (error) {
    console.error('Error registering courses:', error);
    res.status(400).json({ message: error.message });
  }
});

// Override course registration
router.post('/:id/override', async (req, res) => {
  try {
    const { courseId } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const existingRegistration = await Registration.findOne({
      studentId: student._id,
      courseId: course._id,
      status: 'registered'
    });
    
    if (existingRegistration) {
      return res.status(400).json({ message: 'Student is already registered for this course' });
    }
    
    const registration = new Registration({
      studentId: student._id,
      courseId: course._id
    });
    
    await registration.save();
    
    if (course.availableSeats > 0) {
      course.availableSeats -= 1;
      await course.save();
    }
    
    res.status(201).json({ message: 'Course registration override successful', registration });
  } catch (error) {
    console.error('Error overriding registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
