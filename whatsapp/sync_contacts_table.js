const { sequelize } = require('./src/config/database');
const Contact = require('./src/models/Contact');

async function syncContacts() {
  try {
    await sequelize.authenticate();
    console.log('Conexión establecida.');
    await Contact.sync({ alter: true });
    console.log('Tabla whatsapp_contacts sincronizada.');
    process.exit(0);
  } catch (err) {
    console.error('Error sincronizando tabla:', err);
    process.exit(1);
  }
}

syncContacts();
