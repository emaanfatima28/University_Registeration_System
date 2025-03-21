const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'dropped', 'completed'],
    default: 'registered'
  }
});


registrationSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
