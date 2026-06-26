const pool = require('../config/database');

class Booking {
  static async create({ user_id, station_id, booking_time, duration_minutes, total_amount, prepaid_amount, remaining_amount, port_number, payment_method, status, booking_code }) {
    const query = `
      INSERT INTO bookings (user_id, station_id, booking_time, duration_minutes, total_amount, prepaid_amount, remaining_amount, port_number, payment_method, status, booking_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [user_id, station_id, booking_time, duration_minutes, total_amount, prepaid_amount, remaining_amount, port_number, payment_method, status, booking_code];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT b.*, s.name as station_name, s.address as station_address, u.name as user_name, u.phone as user_phone
      FROM bookings b
      JOIN stations s ON b.station_id = s.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByCode(code) {
    const query = 'SELECT * FROM bookings WHERE booking_code = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  static async findByUser(userId, limit = 50, offset = 0) {
    const query = `
      SELECT b.*, s.name as station_name, s.address as station_address, s.type as station_type
      FROM bookings b
      JOIN stations s ON b.station_id = s.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async findAll(limit = 100, offset = 0, filters = {}) {
    let query = `
      SELECT b.*, s.name as station_name, s.address as station_address, u.name as user_name, u.phone as user_phone
      FROM bookings b
      JOIN stations s ON b.station_id = s.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.station_id) {
      query += ` AND b.station_id = $${paramCount}`;
      values.push(filters.station_id);
      paramCount++;
    }

    query += ' ORDER BY b.created_at DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1);
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE bookings 
      SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async cancel(id) {
    const query = `
      UPDATE bookings 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async count() {
    const query = 'SELECT COUNT(*) as count FROM bookings';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async getTodayBookings() {
    const query = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE DATE(booking_time) = CURRENT_DATE
    `;
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async getRevenueByStation(stationId) {
    const query = `
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue
      FROM bookings
      WHERE station_id = $1 AND status != 'cancelled'
    `;
    const result = await pool.query(query, [stationId]);
    return parseFloat(result.rows[0].total_revenue);
  }

  static async getRevenueByPaymentMethod() {
    const query = `
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_amount
      FROM bookings
      WHERE status != 'cancelled'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Booking;
