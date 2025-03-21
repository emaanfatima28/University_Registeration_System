const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Registration = require('../models/Registration');

//Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().populate('prerequisites', 'code title');
    res.json(courses);
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Get course by id
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('prerequisites', 'code title');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Error getting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Add new course
router.post('/', async (req, res) => {
  try {
    const { code, title, department, level, credits, description, totalSeats, schedule, prerequisites } = req.body;
    
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }
    
    const newCourse = new Course({
      code,
      title,
      department,
      level,
      credits,
      description,
      totalSeats,
      availableSeats: totalSeats,
      schedule,
      prerequisites
    });
    
    await newCourse.save();
    
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Update course
router.put('/:id', async (req, res) => {
  try {
    const { code, title, department, level, credits, description, totalSeats, schedule, prerequisites } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (code !== course.code) {
      const existingCourse = await Course.findOne({ code });
      if (existingCourse) {
        return res.status(400).json({ message: 'Course with this code already exists' });
      }
    }
    
    const registeredCount = await Registration.countDocuments({ 
      courseId: course._id,
      status: 'registered'
    });
    
    const newAvailableSeats = totalSeats - registeredCount;
    
    course.code = code;
    course.title = title;
    course.department = department;
    course.level = level;
    course.credits = credits;
    course.description = description;
    course.totalSeats = totalSeats;
    course.availableSeats = newAvailableSeats;
    course.schedule = schedule;
    course.prerequisites = prerequisites;
    
    await course.save();
    
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Delete course
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const registrations = await Registration.find({ courseId: course._id });
    
    if (registrations.length > 0) {
      return res.status(400).json({ message: 'Cannot delete course with active registrations' });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
