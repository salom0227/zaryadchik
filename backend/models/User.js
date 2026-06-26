const pool = require('../config/database');

class User {
  static async create({ phone, name, email, car_types }) {
    const query = `
      INSERT INTO users (phone, name, email, car_types)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [phone, name, email, car_types || []];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = $1';
    const result = await pool.query(query, [phone]);
    return result.rows[0];
  }

  static async update(id, { name, email, car_types }) {
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          email = COALESCE($2, email), 
          car_types = COALESCE($3, car_types),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const values = [name, email, car_types, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async block(id) {
    const query = `
      UPDATE users SET is_blocked = true, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async unblock(id) {
    const query = `
      UPDATE users SET is_blocked = false, updated_at = NOW()
      WHERE id = $1 RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }
}

module.exports = User;
