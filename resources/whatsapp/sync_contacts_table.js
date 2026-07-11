const Contact = require('./src/models/Contact');
const { sequelize } = require('./src/config/database');

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
