// 'use strict';

// models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];


console.log('Environment:', env);
console.log('Database config:', {
  ...dbConfig,
  password: dbConfig.password ? '[HIDDEN]' : undefined
});



// Handle both individual config and DATABASE_URL
let sequelize;
try {
  if (dbConfig.use_env_variable) {
    const databaseUrl = process.env[dbConfig.use_env_variable];
    console.log('Using DATABASE_URL:', databaseUrl ? 'Present' : 'Missing');
    if (!databaseUrl) {
      throw new Error(`Environment variable ${dbConfig.use_env_variable} is not set`);
    }
    sequelize = new Sequelize(databaseUrl, dbConfig);
  } else {
    // Check if all required config is present
    if (!dbConfig.database || !dbConfig.username || !dbConfig.password || !dbConfig.host) {
      throw new Error('Missing required database configuration');
    }
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
  }
  console.log('Sequelize instance created successfully');
} catch (error) {
  console.error('Failed to create Sequelize instance:', error);
  throw error;
}

// Import models
const User = require('./User')(sequelize);
const Coach = require('./Coach')(sequelize);
const Facility = require('./Facility')(sequelize);
const Admin = require('./Admin')(sequelize);
const Booking = require('./Booking')(sequelize);
const Payment = require('./Payment')(sequelize);
const Review = require('./Review')(sequelize);
const Sport = require('./Sport')(sequelize);
const Post = require('./Post')(sequelize);
const Comment = require('./Comment')(sequelize);
const Vote = require('./Vote')(sequelize);
const Notification = require('./Notification')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const BankAccount = require('./BankAccount')(sequelize);
const CoachEarning = require('./CoachEarning')(sequelize);
const SessionPackage = require('./SessionPackage')(sequelize);
const Team = require('./Team')(sequelize);
const Conversation = require('./Conversation')(sequelize);

// Define associations
const models = {
  User,
  Coach,
  Facility,
  Admin,
  Booking,
  Payment,
  Review,
  Sport,
  Post,
  Comment,
  Vote,
  Notification,
  Transaction,
  BankAccount,
  CoachEarning,
  SessionPackage,
  Team,
  Conversation
};


// User associations
User.hasOne(Coach, { foreignKey: 'userId', as: 'Coach' }); // User can be a coach
User.hasMany(Booking, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });
User.hasMany(Post, { foreignKey: 'userId' });
User.hasMany(Comment, { foreignKey: 'userId' });
User.hasMany(Vote, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });
User.hasMany(Transaction, { foreignKey: 'userId' });
User.hasMany(Facility, { foreignKey: 'ownerId', as: 'ownedFacilities' }); // User can own facilities

// Coach associations
Coach.belongsTo(User, { foreignKey: 'userId', as: 'User' }); // Added alias
Coach.hasMany(Booking, { foreignKey: 'coachId' });
Coach.hasMany(Review, { foreignKey: 'coachId' });
Coach.belongsToMany(Sport, { through: 'CoachSports', as: 'Sports' }); // Added alias

// Facility associations
Facility.belongsTo(User, { foreignKey: 'ownerId', as: 'Owner' }); // Added alias
Facility.hasMany(Booking, { foreignKey: 'facilityId' });
Facility.hasMany(Review, { foreignKey: 'facilityId', as: 'Reviews' }); // Added alias
Facility.belongsToMany(Sport, { through: 'FacilitySports', as: 'Sports' }); // Added alias

// Booking associations
Booking.belongsTo(User, { foreignKey: 'userId', as: 'User' }); // Added alias
Booking.belongsTo(Coach, { foreignKey: 'coachId', as: 'Coach' }); // Added alias
Booking.belongsTo(Facility, { foreignKey: 'facilityId', as: 'Facility' }); // Added alias
Booking.hasOne(Payment, { foreignKey: 'bookingId' });

// Payment associations
Payment.belongsTo(Booking, { foreignKey: 'bookingId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

// Review associations
Review.belongsTo(User, { foreignKey: 'userId', as: 'User' }); // Added alias
Review.belongsTo(Coach, { foreignKey: 'coachId' });
Review.belongsTo(Facility, { foreignKey: 'facilityId' });

// Post associations
Post.belongsTo(User, { foreignKey: 'userId', as: 'User' }); // Added alias
Post.hasMany(Comment, { foreignKey: 'postId' });
Post.hasMany(Vote, { foreignKey: 'postId' });
Post.belongsTo(Sport, { foreignKey: 'sportId' });

// Comment associations
Comment.belongsTo(User, { foreignKey: 'userId', as: 'User' }); // Added alias
Comment.belongsTo(Post, { foreignKey: 'postId' });
Comment.hasMany(Vote, { foreignKey: 'commentId' }); // Added missing association

// Vote associations
Vote.belongsTo(User, { foreignKey: 'userId' });
Vote.belongsTo(Post, { foreignKey: 'postId' });
Vote.belongsTo(Comment, { foreignKey: 'commentId' }); // Added missing association

// Sport associations
Sport.belongsToMany(Coach, { through: 'CoachSports', as: 'Coaches' }); // Added alias
Sport.belongsToMany(Facility, { through: 'FacilitySports', as: 'Facilities' }); // Added alias
Sport.hasMany(Post, { foreignKey: 'sportId' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId' });

// Transaction associations
Transaction.belongsTo(User, { foreignKey: 'userId' });


Coach.hasMany(models.BankAccount, {
  foreignKey: 'coachId',
  as: 'BankAccounts'
});
Coach.hasMany(models.CoachEarning, {
  foreignKey: 'coachId',
  as: 'Earnings'
});



// SessionPackage associations
SessionPackage.belongsTo(Sport, { foreignKey: 'sportId', as: 'Sport' });
SessionPackage.belongsTo(Coach, { foreignKey: 'coachId', as: 'Coach' });
SessionPackage.belongsTo(Facility, { foreignKey: 'facilityId', as: 'Facility' });

Sport.hasMany(SessionPackage, { foreignKey: 'sportId', as: 'Packages' });
Booking.belongsTo(SessionPackage, { foreignKey: 'packageId', as: 'Package' });
Booking.belongsTo(Sport, { foreignKey: 'sportId', as: 'Sport' });

// Team associations
Team.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Team.belongsTo(Sport, { foreignKey: 'sportId', as: 'Sport' });
User.hasMany(Team, { foreignKey: 'userId', as: 'Teams' });
Sport.hasMany(Team, { foreignKey: 'sportId', as: 'Teams' });

// Conversation associations
Conversation.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Conversation.belongsTo(Coach, { foreignKey: 'coachId', as: 'coach' });
Conversation.belongsTo(Facility, { foreignKey: 'facilityId', as: 'facility' });

User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });
Coach.hasMany(Conversation, { foreignKey: 'coachId', as: 'conversations' });
Facility.hasMany(Conversation, { foreignKey: 'facilityId', as: 'conversations' });
Booking.hasOne(Conversation, { foreignKey: 'bookingId', as: 'conversation' });

module.exports = {
  sequelize,
  ...models
};