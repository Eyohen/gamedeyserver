const { Sequelize } = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('./config')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool || {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: config.dialectOptions
  }
);

module.exports = {
  sequelize
};