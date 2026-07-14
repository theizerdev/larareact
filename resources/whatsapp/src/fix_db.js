const { sequelize } = require('./config/database');

async function fix() {
  try {
    const [results] = await sequelize.query('SHOW INDEX FROM companies');
    
    // Group indexes by Key_name
    const keys = results.reduce((acc, row) => {
      acc[row.Key_name] = true;

      return acc;
    }, {});
    
    // Drop all keys except PRIMARY and maybe one apiKey
    for (const key of Object.keys(keys)) {
      if (key !== 'PRIMARY') {
        console.log(`Dropping index ${key}`);
        await sequelize.query(`ALTER TABLE companies DROP INDEX \`${key}\``);
      }
    }

    console.log('Done cleaning indexes');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

fix();
