const express = require('express');
const mongoose = require('mongoose');
const TimeEntry = require('../models/TimeEntry');
const Contest = require('../models/Contest');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// @route   POST /api/timeentries/entry
// @desc    Clock in (entrada)
// @access  Private
router.post('/entry', protect, uploadLimiter, upload.single('entryPhoto'), async (req, res) => {
  try {
    const { contestId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    // Check if user is member of contest
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    if (!contest.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'No eres miembro de este concurso' });
    }

    // Check if there's an open entry (no exit time)
    const openEntry = await TimeEntry.findOne({
      user: req.user._id,
      contest: contestId,
      exitTime: null
    });

    if (openEntry) {
      return res.status(400).json({ message: 'Ya tienes una entrada sin salida. Marca tu salida primero.' });
    }

    const timeEntry = await TimeEntry.create({
      user: req.user._id,
      contest: contestId,
      entryTime: new Date(),
      entryPhoto: req.file ? `/uploads/${req.file.filename}` : '',
      date: new Date()
    });

    res.status(201).json(timeEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   PUT /api/timeentries/exit/:id
// @desc    Clock out (salida) with activities
// @access  Private
router.put('/exit/:id', protect, uploadLimiter, upload.array('activityPhotos', 10), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de entrada inválido' });
    }

    const timeEntry = await TimeEntry.findById(req.params.id);

    if (!timeEntry) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    if (timeEntry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    if (timeEntry.exitTime) {
      return res.status(400).json({ message: 'Esta entrada ya tiene salida registrada' });
    }

    // Parse activities from request
    const activityCount = parseInt(req.body.activityCount) || 0;
    const activities = [];
    
    let activityDescriptions = req.body.activityDescriptions;
    if (typeof activityDescriptions === 'string') {
      try {
        activityDescriptions = JSON.parse(activityDescriptions);
      } catch {
        activityDescriptions = [activityDescriptions];
      }
    }
    activityDescriptions = activityDescriptions || [];
    
    for (let i = 0; i < activityCount; i++) {
      activities.push({
        description: activityDescriptions[i] || `Actividad ${i + 1}`,
        photo: req.files && req.files[i] ? `/uploads/${req.files[i].filename}` : ''
      });
    }

    timeEntry.exitTime = new Date();
    timeEntry.activityCount = activityCount;
    timeEntry.activities = activities;
    if (req.body.exitPhoto) {
      timeEntry.exitPhoto = req.body.exitPhoto;
    }

    await timeEntry.save();

    res.json(timeEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/timeentries/contest/:contestId
// @desc    Get all time entries for a contest
// @access  Private
router.get('/contest/:contestId', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contestId)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const contest = await Contest.findById(req.params.contestId);
    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    if (!contest.members.includes(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No eres miembro de este concurso' });
    }

    const timeEntries = await TimeEntry.find({ contest: req.params.contestId })
      .populate('user', 'username profilePhoto')
      .sort({ date: -1 });

    res.json(timeEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/timeentries/my/:contestId
// @desc    Get user's time entries for a contest
// @access  Private
router.get('/my/:contestId', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contestId)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const timeEntries = await TimeEntry.find({
      user: req.user._id,
      contest: req.params.contestId
    }).sort({ date: -1 });

    res.json(timeEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/timeentries/open/:contestId
// @desc    Get open time entry (no exit) for user
// @access  Private
router.get('/open/:contestId', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contestId)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const openEntry = await TimeEntry.findOne({
      user: req.user._id,
      contest: req.params.contestId,
      exitTime: null
    });

    res.json(openEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/timeentries/stats/:contestId
// @desc    Get hours statistics for a contest
// @access  Private
router.get('/stats/:contestId', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contestId)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const contest = await Contest.findById(req.params.contestId)
      .populate('members', 'username profilePhoto');

    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    // Get all time entries for this contest
    const timeEntries = await TimeEntry.find({ 
      contest: req.params.contestId,
      exitTime: { $ne: null }
    }).populate('user', 'username profilePhoto');

    // Calculate hours per user
    const userHours = {};
    const weeklyHours = {};

    contest.members.forEach(member => {
      userHours[member._id.toString()] = {
        user: member,
        totalHours: 0,
        entries: []
      };
      weeklyHours[member._id.toString()] = {};
    });

    timeEntries.forEach(entry => {
      const userId = entry.user._id.toString();
      if (userHours[userId]) {
        userHours[userId].totalHours += entry.hoursWorked;
        userHours[userId].entries.push(entry);

        // Track weekly hours for covariance calculation
        const weekStart = getWeekStart(entry.date);
        if (!weeklyHours[userId][weekStart]) {
          weeklyHours[userId][weekStart] = 0;
        }
        weeklyHours[userId][weekStart] += entry.hoursWorked;
      }
    });

    // Calculate weekly expected hours
    const totalWeeks = Math.ceil((new Date(contest.endDate) - new Date(contest.startDate)) / (7 * 24 * 60 * 60 * 1000));
    const weeklyExpectedHours = contest.totalHours / totalWeeks;

    // Calculate support percentage and consistency for each user
    const stats = Object.values(userHours).map(userData => {
      const percentage = (userData.totalHours / contest.totalHours) * 100;
      const userWeeklyData = weeklyHours[userData.user._id.toString()];
      
      // Calculate consistency (based on standard deviation of weekly hours)
      const weeklyValues = Object.values(userWeeklyData);
      const consistency = calculateConsistency(weeklyValues, weeklyExpectedHours);

      return {
        user: userData.user,
        totalHours: Math.round(userData.totalHours * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
        entriesCount: userData.entries.length
      };
    });

    res.json({
      contest: {
        _id: contest._id,
        name: contest.name,
        totalHours: contest.totalHours,
        startDate: contest.startDate,
        endDate: contest.endDate
      },
      stats: stats.sort((a, b) => b.totalHours - a.totalHours),
      weeklyExpectedHours: Math.round(weeklyExpectedHours * 100) / 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/timeentries/daily/:contestId/:date
// @desc    Get attendance for a specific date
// @access  Private
router.get('/daily/:contestId/:date', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.contestId)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const timeEntries = await TimeEntry.find({
      contest: req.params.contestId,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('user', 'username profilePhoto')
      .sort({ entryTime: 1 });

    res.json(timeEntries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Helper function to get week start date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// Helper function to calculate consistency score based on covariance
function calculateConsistency(weeklyValues, expectedWeekly) {
  if (weeklyValues.length < 2) return 100;

  // Calculate mean
  const mean = weeklyValues.reduce((sum, val) => sum + val, 0) / weeklyValues.length;
  
  // Calculate standard deviation
  const variance = weeklyValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weeklyValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate coefficient of variation (lower is more consistent)
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
  
  // Convert to consistency score (100 = perfectly consistent, 0 = very inconsistent)
  const consistency = Math.max(0, 100 - cv);
  
  return consistency;
}

module.exports = router;
