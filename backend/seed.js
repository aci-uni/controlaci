const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/db');

// Import models
const User = require('./models/User');
const Contest = require('./models/Contest');

const seedDatabase = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // Create admin user
      const admin = await User.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created:', admin.username);
    } else {
      console.log('Admin user already exists');
    }

    // Create a sample contest if none exists
    const contestExists = await Contest.findOne({});
    
    if (!contestExists) {
      const admin = await User.findOne({ role: 'admin' });
      
      const contest = await Contest.create({
        name: 'Concurso de Ejemplo',
        description: 'Este es un concurso de ejemplo para demostrar el sistema',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        totalHours: 100,
        createdBy: admin._id
      });
      console.log('Sample contest created:', contest.name);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
