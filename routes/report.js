const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const Registration = require('../models/Registration');

//Get Course Registrations
router.get('/course-registrations/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const registrations = await Registration.find({
      courseId: course._id,
      status: 'registered'
    });
    
    const studentIds = registrations.map(reg => reg.studentId);
    const students = await Student.find({ _id: { $in: studentIds } });
    
    res.json({
      course,
      students,
      totalRegistrations: registrations.length
    });
  } catch (error) {
    console.error('Error generating course registrations report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Get Available Seats
router.get('/available-seats', async (req, res) => {
  try {
    const courses = await Course.find().sort({ availableSeats: -1 });
    
    res.json({
      courses,
      totalCourses: courses.length
    });
  } catch (error) {
    console.error('Error generating available seats report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Get Pre-requisites
router.get('/prerequisites', async (req, res) => {
  try {
    const registrations = await Registration.find({ status: 'registered' });
    
    const studentsWithMissingPrereqs = [];
    
    for (const registration of registrations) {
      const course = await Course.findById(registration.courseId).populate('prerequisites');
      const student = await Student.findById(registration.studentId);
      
      if (!course || !student) {
        continue;
      }
      
      if (course.prerequisites && course.prerequisites.length > 0) {
        const missingPrerequisites = [];
        
        for (const prereq of course.prerequisites) {
          const hasCompleted = student.completedCourses.includes(prereq._id);
          
          if (!hasCompleted) {
            const isRegistered = await Registration.findOne({
              studentId: student._id,
              courseId: prereq._id,
              status: 'registered'
            });
            
            if (!isRegistered) {
              missingPrerequisites.push(prereq);
            }
          }
        }
        
        if (missingPrerequisites.length > 0) {
          studentsWithMissingPrereqs.push({
            student,
            course,
            missingPrerequisites
          });
        }
      }
    }
    
    res.json({
      students: studentsWithMissingPrereqs,
      totalStudents: studentsWithMissingPrereqs.length
    });
  } catch (error) {
    console.error('Error generating prerequisites report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
