const { sequelize } = require('./src/config/database');
sequelize.query("UPDATE whatsapp_messages SET status = 'received' WHERE `from` != 'self' AND `status` = 'delivered'")
  .then(() => {
 console.log('Fixed DB'); process.exit(0); 
})
  .catch((e) => {
 console.error(e); process.exit(1); 
});
