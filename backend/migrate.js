const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('🔄 Boshlanmoqda...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema.split(';').filter(s => s.trim() && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }
    
    console.log('✅ Jadvallar muvaffaqiyatli yaratildi');
    
    // Seed initial data
    await seed();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
}

async function seed() {
  console.log('🌱 Boshlang\'ich ma\'lumotlar qo\'shilmoqda...');
  
  // Create admin user
  const adminCheck = await pool.query('SELECT id FROM users WHERE phone = $1', ['998901234567']);
  if (adminCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO users (phone, name, email, role, car_types)
      VALUES ($1, $2, $3, $4, $5)
    `, ['998901234567', 'Admin User', 'admin@zaryaduz.uz', 'admin', []]);
    console.log('✅ Admin foydalanuvchi yaratildi');
  }
  
  // Create sample stations
  const stationsCount = await pool.query('SELECT COUNT(*) FROM stations');
  if (parseInt(stationsCount.rows[0].count) === 0) {
    const sampleStations = [
      {
        name: 'Yunusobod EV Station',
        address: 'Toshkent, Yunusobod tumani, Amir Temur ko\'chasi 45',
        latitude: 41.3117,
        longitude: 69.2797,
        type: 'ev',
        status: 'open',
        power: '150 kW',
        total_ports: 4,
        available_ports: 2,
        price_per_unit: '2500 so\'m/kWh',
        image_url: null
      },
      {
        name: 'Chilonzor Powerbank Hub',
        address: 'Toshkent, Chilonzor tumani, Bunyodkor ko\'chasi 12',
        latitude: 41.2995,
        longitude: 69.2401,
        type: 'power',
        status: 'open',
        power: '18W',
        total_ports: 10,
        available_ports: 7,
        price_per_unit: '3000 so\'m/soat',
        image_url: null
      },
      {
        name: 'Mirzo Ulug\'bek EV Zone',
        address: 'Toshkent, Mirzo Ulug\'bek tumani, Do\'rmon yo\'li 78',
        latitude: 41.3050,
        longitude: 69.2950,
        type: 'ev',
        status: 'busy',
        power: '120 kW',
        total_ports: 6,
        available_ports: 0,
        price_per_unit: '2500 so\'m/kWh',
        image_url: null
      },
      {
        name: 'Sergeli Skuter Station',
        address: 'Toshkent, Sergeli tumani, Qipchoq ko\'chasi 23',
        latitude: 41.2850,
        longitude: 69.2650,
        type: 'scooter',
        status: 'open',
        power: '2 kW',
        total_ports: 8,
        available_ports: 5,
        price_per_unit: '5000 so\'m/soat',
        image_url: null
      },
      {
        name: 'Shayxontohur ChargeHub',
        address: 'Toshkent, Shayxontohur tumani, Zarqaynar ko\'chasi 56',
        latitude: 41.3200,
        longitude: 69.2500,
        type: 'ev',
        status: 'open',
        power: '200 kW',
        total_ports: 8,
        available_ports: 4,
        price_per_unit: '3000 so\'m/kWh',
        image_url: null
      },
      {
        name: 'Uchtepa Powerbank Point',
        address: 'Toshkent, Uchtepa tumani, Mirobod ko\'chasi 89',
        latitude: 41.3150,
        longitude: 69.2200,
        type: 'power',
        status: 'closed',
        power: '20W',
        total_ports: 6,
        available_ports: 0,
        price_per_unit: '3500 so\'m/soat',
        image_url: null
      }
    ];
    
    for (const station of sampleStations) {
      await pool.query(`
        INSERT INTO stations (name, address, latitude, longitude, type, status, power, total_ports, available_ports, price_per_unit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [station.name, station.address, station.latitude, station.longitude, station.type, station.status, station.power, station.total_ports, station.available_ports, station.price_per_unit]);
    }
    
    console.log('✅ 6 ta namuna stansiya qo\'shildi');
  }
  
  console.log('✅ Boshlang\'ich ma\'lumotlar tayyor');
}

migrate();
