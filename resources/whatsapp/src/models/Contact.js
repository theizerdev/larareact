const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jid: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notify: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isGroup: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  }
}, {
  tableName: 'whatsapp_contacts',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['companyId', 'jid']
    }
  ]
});

module.exports = Contact;
