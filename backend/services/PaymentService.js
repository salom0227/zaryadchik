const pool = require('../config/database');
const crypto = require('crypto');
const logger = require('../utils/logger');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32chars!';

class PaymentService {
  // Kartani shifrlash
  static encryptCardNumber(cardNumber) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Kartani deshifrlash
  static decryptCardNumber(encryptedData) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Faqat oxirgi 4 raqamni olish
  static getLastFour(cardNumber) {
    return cardNumber.slice(-4);
  }

  // Foydalanuvchiga karta qo'shish
  static async addCard(userId, cardData) {
    const { card_holder, card_number, expiry_month, expiry_year, is_default = false } = cardData;
    
    // Agar is_default=true bo'lsa, boshqa kartalarni default emas qilish
    if (is_default) {
      await pool.query('UPDATE user_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const encryptedNumber = this.encryptCardNumber(card_number);
    const lastFour = this.getLastFour(card_number);

    const query = `
      INSERT INTO user_cards (user_id, card_holder, card_number_encrypted, card_last_four, card_expiry_month, card_expiry_year, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [userId, card_holder, encryptedNumber, lastFour, expiry_month, expiry_year, is_default];
    const result = await pool.query(query, values);
    
    // Shifrlangan raqamni qaytarmaslik
    const card = result.rows[0];
    delete card.card_number_encrypted;
    
    return card;
  }

  // Foydalanuvchi kartalarini olish
  static async getUserCards(userId) {
    const query = `
      SELECT id, card_holder, card_last_four, card_expiry_month, card_expiry_year, is_default, created_at
      FROM user_cards
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Kartani o'chirish
  static async deleteCard(userId, cardId) {
    const query = 'DELETE FROM user_cards WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(query, [cardId, userId]);
    return result.rows[0];
  }

  // Default kartani o'zgartirish
  static async setDefaultCard(userId, cardId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Barcha kartalarni default emas qilish
      await client.query('UPDATE user_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
      
      // Tanlangan kartani default qilish
      await client.query('UPDATE user_cards SET is_default = TRUE WHERE id = $1 AND user_id = $2', [cardId, userId]);
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // To'lov yaratish
  static async createPayment(paymentData) {
    const { user_id, card_id, booking_id, amount, description, transaction_id = null } = paymentData;
    
    const query = `
      INSERT INTO payments (user_id, card_id, booking_id, amount, currency, status, transaction_id, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [user_id, card_id, booking_id, amount, 'UZS', 'success', transaction_id, description];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // To'lovlar tarixini olish
  static async getPaymentHistory(userId, limit = 20) {
    const query = `
      SELECT p.*, uc.card_last_four, b.station_id, s.name as station_name
      FROM payments p
      LEFT JOIN user_cards uc ON p.card_id = uc.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN stations s ON b.station_id = s.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  // Mock to'lov jarayoni (haqiqiy integratsiya uchun Payme/Uzum API ishlatiladi)
  static async processMockPayment(cardId, amount) {
    // Haqiqiy loyihada bu yerda Payme/Uzum API chaqiriladi
    // Hozircha mock response
    return {
      success: true,
      transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      message: 'To\'lov muvaffaqiyatli amalga oshirildi'
    };
  }
}

module.exports = { PaymentService };
