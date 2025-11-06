// Script to link existing facilities and coaches to sports
require('dotenv').config();
const { sequelize, Facility, Coach, Sport } = require('../models');

async function linkProvidersToSports() {
  try {
    console.log('Starting to link providers to sports...');

    // Get all active sports
    const sports = await Sport.findAll({ where: { status: 'active' } });
    console.log(`Found ${sports.length} active sports`);

    if (sports.length === 0) {
      console.log('No sports found. Please run seedSports.js first');
      return;
    }

    // Get all active facilities
    const facilities = await Facility.findAll({
      where: { status: 'active' }
    });
    console.log(`Found ${facilities.length} facilities`);

    // Get all active coaches
    const coaches = await Coach.findAll({
      where: { status: 'active' }
    });
    console.log(`Found ${coaches.length} coaches`);

    // For each facility, assign 2-5 random sports
    for (const facility of facilities) {
      const currentSports = await facility.getSports();

      if (currentSports.length === 0) {
        // Assign 3-5 random sports to each facility
        const numberOfSports = Math.floor(Math.random() * 3) + 3; // 3 to 5 sports
        const shuffledSports = sports.sort(() => 0.5 - Math.random());
        const selectedSports = shuffledSports.slice(0, numberOfSports);

        await facility.setSports(selectedSports.map(s => s.id));
        console.log(`✅ Linked ${facility.name} to ${selectedSports.map(s => s.name).join(', ')}`);
      } else {
        console.log(`⏭️  ${facility.name} already has ${currentSports.length} sports`);
      }
    }

    // For each coach, assign 1-3 random sports
    for (const coach of coaches) {
      const currentSports = await coach.getSports();

      if (currentSports.length === 0) {
        // Assign 1-3 random sports to each coach
        const numberOfSports = Math.floor(Math.random() * 3) + 1; // 1 to 3 sports
        const shuffledSports = sports.sort(() => 0.5 - Math.random());
        const selectedSports = shuffledSports.slice(0, numberOfSports);

        await coach.setSports(selectedSports.map(s => s.id));
        console.log(`✅ Linked Coach ${coach.id} to ${selectedSports.map(s => s.name).join(', ')}`);
      } else {
        console.log(`⏭️  Coach ${coach.id} already has ${currentSports.length} sports`);
      }
    }

    console.log('\n✅ Successfully linked all providers to sports!');

    // Show summary
    const facilitySportCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM "FacilitySports"',
      { type: sequelize.QueryTypes.SELECT }
    );
    const coachSportCount = await sequelize.query(
      'SELECT COUNT(*) as count FROM "CoachSports"',
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(`\nSummary:`);
    console.log(`- Total Facility-Sport associations: ${facilitySportCount[0].count}`);
    console.log(`- Total Coach-Sport associations: ${coachSportCount[0].count}`);

  } catch (error) {
    console.error('Error linking providers to sports:', error);
  } finally {
    await sequelize.close();
  }
}

linkProvidersToSports();
