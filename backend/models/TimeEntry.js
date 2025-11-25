const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  description: {
    type: String,
    default: ''
  },
  photo: {
    type: String,
    default: ''
  }
});

const timeEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  entryTime: {
    type: Date,
    required: [true, 'La hora de entrada es requerida']
  },
  entryPhoto: {
    type: String,
    default: ''
  },
  exitTime: {
    type: Date,
    default: null
  },
  exitPhoto: {
    type: String,
    default: ''
  },
  activities: [activitySchema],
  activityCount: {
    type: Number,
    default: 0
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate hours worked when exit time is set
timeEntrySchema.pre('save', function(next) {
  if (this.entryTime && this.exitTime) {
    const diff = this.exitTime - this.entryTime;
    this.hoursWorked = Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
