const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rateLimitPerMinute: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  dailyMessageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 500
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'companies',
  timestamps: true
});

module.exports = Company;