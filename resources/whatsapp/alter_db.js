const { sequelize } = require('./src/config/database');
sequelize.query("ALTER TABLE whatsapp_messages ADD COLUMN senderName VARCHAR(255) NULL")
  .then(() => { console.log('Added senderName'); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
