require('dotenv').config();
const { sequelize, Sport, Coach, Facility } = require('../models');

const linkProviders = async () => {
  try {
    console.log('🔗 Linking providers to sports...');

    // Get all sports
    const football = await Sport.findOne({ where: { name: 'Football' } });
    const basketball = await Sport.findOne({ where: { name: 'Basketball' } });
    const tennis = await Sport.findOne({ where: { name: 'Tennis' } });

    // Get all coaches and facilities
    const coaches = await Coach.findAll();
    const facilities = await Facility.findAll();

    // Link coaches to sports (assign each coach 1-2 sports)
    for (let coach of coaches) {
      const sports = [football, basketball, tennis].filter(Boolean).slice(0, 2);
      if (sports.length > 0) {
        await coach.setSports(sports);
      }
    }

    // Link facilities to sports
    for (let facility of facilities) {
      const sports = [football, basketball, tennis].filter(Boolean);
      if (sports.length > 0) {
        await facility.setSports(sports);
      }
    }

    console.log(`✅ Linked ${coaches.length} coaches and ${facilities.length} facilities to sports`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Linking failed:', error);
    process.exit(1);
  }
};

linkProviders();