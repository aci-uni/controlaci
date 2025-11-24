const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese el nombre del concurso'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: [true, 'Por favor ingrese la fecha de inicio']
  },
  endDate: {
    type: Date,
    required: [true, 'Por favor ingrese la fecha de fin']
  },
  totalHours: {
    type: Number,
    required: [true, 'Por favor ingrese las horas totales'],
    default: 100
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contest', contestSchema);
