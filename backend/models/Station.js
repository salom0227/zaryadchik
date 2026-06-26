const pool = require('../config/database');

class Station {
  static async create({ name, address, latitude, longitude, type, status, power, ports, price, image_url, owner_id }) {
    const query = `
      INSERT INTO stations (name, address, latitude, longitude, type, status, power, total_ports, available_ports, price_per_unit, image_url, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [name, address, latitude, longitude, type, status, power, ports, ports, price, image_url, owner_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM stations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM stations WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.type) {
      query += ` AND type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramCount} OR address ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedFields = ['name', 'address', 'latitude', 'longitude', 'type', 'status', 'power', 'total_ports', 'available_ports', 'price_per_unit', 'image_url'];
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (setClauses.length === 0) return null;

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const query = `
      UPDATE stations 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM stations WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateAvailability(stationId, availablePorts) {
    const query = `
      UPDATE stations 
      SET available_ports = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `;
    const result = await pool.query(query, [availablePorts, stationId]);
    return result.rows[0];
  }

  static async count() {
    const query = 'SELECT COUNT(*) as count FROM stations';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'busy') as busy,
        COUNT(*) FILTER (WHERE status = 'closed') as closed
      FROM stations
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = Station;
