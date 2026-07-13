const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const path = require('path');

// Cargar el .env de la raíz del proyecto Laravel
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOSTAPI || process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORTAPI || process.env.DB_PORT || 3306,
  database: process.env.DB_DATABASEAPI || 'larawhatsapp',
  username: process.env.DB_USERNAMEAPI || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORDAPI || process.env.DB_PASSWORD || '',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };