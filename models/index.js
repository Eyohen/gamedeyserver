// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const process = require('process');
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.js')[env];
// const db = {};

// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file.indexOf('.test.js') === -1
//     );
//   })
//   .forEach(file => {
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });

// Object.keys(db).forEach(modelName => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// module.exports = db;





// models/index.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

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
  Transaction
};


// User associations
User.hasMany(Booking, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });
User.hasMany(Post, { foreignKey: 'userId' });
User.hasMany(Comment, { foreignKey: 'userId' });
User.hasMany(Vote, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });
User.hasMany(Transaction, { foreignKey: 'userId' });
User.hasMany(Facility, { foreignKey: 'ownerId', as: 'OwnedFacilities' }); // Added reverse association

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

module.exports = {
  sequelize,
  ...models
};