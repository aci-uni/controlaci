const express = require('express');
const mongoose = require('mongoose');
const Contest = require('../models/Contest');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/contests
// @desc    Create a new contest
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, startDate, endDate, totalHours } = req.body;

    const contest = await Contest.create({
      name,
      description,
      startDate,
      endDate,
      totalHours: totalHours || 100,
      createdBy: req.user._id
    });

    res.status(201).json(contest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/contests
// @desc    Get all active contests
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const contests = await Contest.find({ active: true })
      .populate('members', 'username profilePhoto')
      .populate('createdBy', 'username');
    res.json(contests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/contests/my
// @desc    Get contests where user is a member
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const contests = await Contest.find({ 
      active: true,
      members: req.user._id 
    })
      .populate('members', 'username profilePhoto')
      .populate('createdBy', 'username');
    res.json(contests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   GET /api/contests/:id
// @desc    Get contest by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const contest = await Contest.findById(req.params.id)
      .populate('members', 'username profilePhoto')
      .populate('createdBy', 'username');

    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    res.json(contest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   PUT /api/contests/:id
// @desc    Update contest
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    const { name, description, startDate, endDate, totalHours, active } = req.body;

    contest.name = name || contest.name;
    contest.description = description || contest.description;
    contest.startDate = startDate || contest.startDate;
    contest.endDate = endDate || contest.endDate;
    contest.totalHours = totalHours || contest.totalHours;
    contest.active = active !== undefined ? active : contest.active;

    const updatedContest = await contest.save();
    res.json(updatedContest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   POST /api/contests/:id/members
// @desc    Add member to contest
// @access  Private/Admin
router.post('/:id/members', protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const contest = await Contest.findById(req.params.id);
    
    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Check if user is already a member
    if (contest.members.includes(userId)) {
      return res.status(400).json({ message: 'El usuario ya es miembro del concurso' });
    }

    contest.members.push(userId);
    await contest.save();

    const updatedContest = await Contest.findById(req.params.id)
      .populate('members', 'username profilePhoto')
      .populate('createdBy', 'username');

    res.json(updatedContest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   DELETE /api/contests/:id/members/:userId
// @desc    Remove member from contest
// @access  Private/Admin
router.delete('/:id/members/:userId', protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    contest.members = contest.members.filter(
      member => member.toString() !== req.params.userId
    );
    
    await contest.save();

    const updatedContest = await Contest.findById(req.params.id)
      .populate('members', 'username profilePhoto')
      .populate('createdBy', 'username');

    res.json(updatedContest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// @route   DELETE /api/contests/:id
// @desc    Delete contest
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID de concurso inválido' });
    }

    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Concurso no encontrado' });
    }

    await contest.deleteOne();
    res.json({ message: 'Concurso eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
