const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/course_registration';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    
    await seedInitialData();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedInitialData = async () => {
  const User = require('../models/User');
  const Student = require('../models/Student');
  const Course = require('../models/Course');

  const admins = [
    { username: 'emaan', password: 'emaan123', name: 'Emaan Fatima', role: 'admin' },
    { username: 'abdulhadi', password: 'hadi123', name: 'Abdulhadi', role: 'admin' },
    { username: 'anamta', password: 'anamta123', name: 'Anamta', role: 'admin' }
  ];

  for (const admin of admins) {
    const adminExists = await User.findOne({ username: admin.username });
    if (!adminExists) {
      await User.create(admin);
      console.log(`Admin user ${admin.username} created`);
    }
  }

  const studentExists = await Student.findOne({ rollNumber: '22F-3640' });
  if (!studentExists) {
    await Student.create({
      rollNumber: '22F-3640',
      name: 'Emaan',
      department: 'SE',
      semester: 8,
      completedCourses: []
    });
    console.log('Student created');
  }

  const coursesExist = await Course.countDocuments();
  if (coursesExist === 0) {
    const courses = [
      {
        code: 'CS101',
        title: 'Introduction to Programming',
        department: 'CS',
        level: 100,
        credits: 3,
        description: 'Basic programming concepts using Python',
        totalSeats: 50,
        availableSeats: 50,
        schedule: [
          { day: 'monday', startTime: '09:00', endTime: '10:30' },
          { day: 'wednesday', startTime: '09:00', endTime: '10:30' }
        ],
        prerequisites: []
      },
      {
        code: 'CS201',
        title: 'Data Structures',
        department: 'CS',
        level: 200,
        credits: 4,
        description: 'Fundamental data structures and algorithms',
        totalSeats: 40,
        availableSeats: 40,
        schedule: [
          { day: 'tuesday', startTime: '11:00', endTime: '12:30' },
          { day: 'thursday', startTime: '11:00', endTime: '12:30' }
        ],
        prerequisites: []
      },
      {
        code: 'SE301',
        title: 'Software Engineering',
        department: 'SE',
        level: 300,
        credits: 3,
        description: 'Software development lifecycle and methodologies',
        totalSeats: 35,
        availableSeats: 35,
        schedule: [
          { day: 'monday', startTime: '14:00', endTime: '15:30' },
          { day: 'wednesday', startTime: '14:00', endTime: '15:30' }
        ],
        prerequisites: []
      },
      {
        code: 'SE401',
        title: 'Web Engineering',
        department: 'SE',
        level: 400,
        credits: 3,
        description: 'Web application development and technologies',
        totalSeats: 30,
        availableSeats: 30,
        schedule: [
          { day: 'tuesday', startTime: '14:00', endTime: '15:30' },
          { day: 'thursday', startTime: '14:00', endTime: '15:30' }
        ],
        prerequisites: []
      },
      {
        code: 'EE201',
        title: 'Circuit Theory',
        department: 'EE',
        level: 200,
        credits: 4,
        description: 'Fundamentals of electrical circuits',
        totalSeats: 45,
        availableSeats: 45,
        schedule: [
          { day: 'monday', startTime: '11:00', endTime: '12:30' },
          { day: 'wednesday', startTime: '11:00', endTime: '12:30' }
        ],
        prerequisites: []
      }
    ];

    await Course.insertMany(courses);
    console.log('Courses created');

    const cs101 = await Course.findOne({ code: 'CS101' });
    const cs201 = await Course.findOne({ code: 'CS201' });
    const se301 = await Course.findOne({ code: 'SE301' });
    const se401 = await Course.findOne({ code: 'SE401' });

    cs201.prerequisites = [cs101._id];
    await cs201.save();

    se301.prerequisites = [cs201._id];
    await se301.save();

    se401.prerequisites = [se301._id];
    await se401.save();
  }
};


module.exports = { connectDB };
