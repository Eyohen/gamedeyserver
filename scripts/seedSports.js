require('dotenv').config();
const { sequelize, Sport, SessionPackage } = require('../models');

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed sports and packages...');

    // Clear existing data (optional)
    await SessionPackage.destroy({ where: {} });
    await Sport.destroy({ where: {} });

    // Create Sports
    const sports = await Sport.bulkCreate([
      {
        name: 'Football',
        description: 'Popular team sport played worldwide',
        category: 'team',
        icon: '⚽',
        popularityScore: 95,
        status: 'active'
      },
      {
        name: 'Basketball',
        description: 'Fast-paced indoor/outdoor team sport',
        category: 'team',
        icon: '🏀',
        popularityScore: 85,
        status: 'active'
      },
      {
        name: 'Tennis',
        description: 'Racquet sport for singles or doubles',
        category: 'racquet',
        icon: '🎾',
        popularityScore: 80,
        status: 'active'
      },
      {
        name: 'Swimming',
        description: 'Individual water sport and fitness activity',
        category: 'individual',
        icon: '🏊',
        popularityScore: 75,
        status: 'active'
      },
      {
        name: 'Fitness',
        description: 'Individual fitness training and conditioning',
        category: 'individual',
        icon: '💪',
        popularityScore: 80,
        status: 'active'
      },
      {
        name: 'Badminton',
        description: 'Indoor racquet sport',
        category: 'racquet',
        icon: '🏸',
        popularityScore: 70,
        status: 'active'
      },
      {
        name: 'Volleyball',
        description: 'Team sport played on court or beach',
        category: 'team',
        icon: '🏐',
        popularityScore: 65,
        status: 'active'
      },
      {
        name: 'Boxing',
        description: 'Combat sport with strategic striking',
        category: 'combat',
        icon: '🥊',
        popularityScore: 60,
        status: 'active'
      },
      {
        name: 'Yoga',
        description: 'Mind-body fitness practice',
        category: 'fitness',
        icon: '🧘',
        popularityScore: 85,
        status: 'active'
      },
      {
        name: 'Cricket',
        description: 'Bat-and-ball team sport',
        category: 'team',
        icon: '🏏',
        popularityScore: 55,
        status: 'active'
      },
      {
        name: 'Table Tennis',
        description: 'Fast-paced indoor racquet sport',
        category: 'racquet',
        icon: '🏓',
        popularityScore: 60,
        status: 'active'
      }
    ]);

    console.log(`✅ Created ${sports.length} sports`);

    // Get sport IDs
    const football = sports.find(s => s.name === 'Football');
    const tennis = sports.find(s => s.name === 'Tennis');
    const yoga = sports.find(s => s.name === 'Yoga');
    const basketball = sports.find(s => s.name === 'Basketball');
    const swimming = sports.find(s => s.name === 'Swimming');

    // Create Session Packages
    const packages = await SessionPackage.bulkCreate([
      // Football Packages
      {
        sportId: football.id,
        name: 'Football Training - Starter Pack',
        description: '4 sessions of professional football training for beginners',
        numberOfSessions: 4,
        pricePerSession: 3500.00,
        totalPrice: 12000.00,
        discount: 14.29,
        validityDays: 60,
        status: 'active'
      },
      {
        sportId: football.id,
        name: 'Football Training - Pro Pack',
        description: '8 sessions of intensive football training',
        numberOfSessions: 8,
        pricePerSession: 3200.00,
        totalPrice: 22000.00,
        discount: 14.06,
        validityDays: 90,
        status: 'active'
      },
      {
        sportId: football.id,
        name: 'Football Training - Elite Pack',
        description: '12 sessions for serious players',
        numberOfSessions: 12,
        pricePerSession: 3000.00,
        totalPrice: 32000.00,
        discount: 15.38,
        validityDays: 120,
        status: 'active'
      },

      // Tennis Packages
      {
        sportId: tennis.id,
        name: 'Tennis Lessons - Beginner',
        description: '4 sessions for tennis beginners',
        numberOfSessions: 4,
        pricePerSession: 4000.00,
        totalPrice: 14000.00,
        discount: 12.50,
        validityDays: 45,
        status: 'active'
      },
      {
        sportId: tennis.id,
        name: 'Tennis Lessons - Intermediate',
        description: '6 sessions for intermediate players',
        numberOfSessions: 6,
        pricePerSession: 4200.00,
        totalPrice: 23000.00,
        discount: 8.73,
        validityDays: 60,
        status: 'active'
      },
      {
        sportId: tennis.id,
        name: 'Tennis Lessons - Advanced',
        description: '8 sessions for advanced players',
        numberOfSessions: 8,
        pricePerSession: 4500.00,
        totalPrice: 32000.00,
        discount: 11.11,
        validityDays: 90,
        status: 'active'
      },

      // Yoga Packages
      {
        sportId: yoga.id,
        name: 'Yoga Sessions - Weekly',
        description: '4 weekly yoga sessions',
        numberOfSessions: 4,
        pricePerSession: 2800.00,
        totalPrice: 10000.00,
        discount: 10.71,
        validityDays: 30,
        status: 'active'
      },
      {
        sportId: yoga.id,
        name: 'Yoga Sessions - Monthly',
        description: '12 relaxing yoga sessions',
        numberOfSessions: 12,
        pricePerSession: 2500.00,
        totalPrice: 27000.00,
        discount: 10.00,
        validityDays: 60,
        status: 'active'
      },

      // Basketball Packages
      {
        sportId: basketball.id,
        name: 'Basketball Training - Starter',
        description: '4 sessions to learn basketball fundamentals',
        numberOfSessions: 4,
        pricePerSession: 3800.00,
        totalPrice: 13500.00,
        discount: 11.18,
        validityDays: 45,
        status: 'active'
      },
      {
        sportId: basketball.id,
        name: 'Basketball Training - Advanced',
        description: '8 sessions for competitive players',
        numberOfSessions: 8,
        pricePerSession: 3500.00,
        totalPrice: 25000.00,
        discount: 10.71,
        validityDays: 90,
        status: 'active'
      },

      // Swimming Packages
      {
        sportId: swimming.id,
        name: 'Swimming Lessons - Beginner',
        description: '6 sessions to learn swimming basics',
        numberOfSessions: 6,
        pricePerSession: 5000.00,
        totalPrice: 27000.00,
        discount: 10.00,
        validityDays: 60,
        status: 'active'
      },
      {
        sportId: swimming.id,
        name: 'Swimming Lessons - Advanced',
        description: '10 sessions for technique improvement',
        numberOfSessions: 10,
        pricePerSession: 4800.00,
        totalPrice: 45000.00,
        discount: 6.25,
        validityDays: 90,
        status: 'active'
      }
    ]);

    console.log(`✅ Created ${packages.length} session packages`);
    console.log('\n📊 Summary:');
    console.log(`   Sports: ${sports.length}`);
    console.log(`   Packages: ${packages.length}`);
    console.log('\n✨ Seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();