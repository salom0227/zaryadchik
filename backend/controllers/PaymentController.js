const { PaymentService } = require('../services/PaymentService');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

class PaymentController {
  // Karta qo'shish
  static async addCard(req, res) {
    try {
      const userId = req.user.id;
      const { card_holder, card_number, expiry_month, expiry_year, is_default } = req.body;

      // Validatsiya
      if (!card_holder || !card_number || !expiry_month || !expiry_year) {
        return res.status(400).json({
          success: false,
          message: 'Barcha maydonlarni to\'ldiring'
        });
      }

      // Karta raqamini validatsiya qilish (Luhn algoritmi)
      if (!this.validateCardNumber(card_number)) {
        return res.status(400).json({
          success: false,
          message: 'Karta raqami noto\'g\'ri'
        });
      }

      const card = await PaymentService.addCard(userId, {
        card_holder,
        card_number,
        expiry_month,
        expiry_year,
        is_default
      });

      logger.info(`Karta qo'shildi: user ${userId}, card ending ${card.card_last_four}`);

      res.json({
        success: true,
        message: 'Karta muvaffaqiyatli qo\'shildi',
        data: card
      });
    } catch (error) {
      logger.error('Add card error:', error);
      res.status(500).json({
        success: false,
        message: 'Kartani qo\'shishda xatolik'
      });
    }
  }

  // Foydalanuvchi kartalarini olish
  static async getCards(req, res) {
    try {
      const userId = req.user.id;
      const cards = await PaymentService.getUserCards(userId);

      res.json({
        success: true,
        data: cards
      });
    } catch (error) {
      logger.error('Get cards error:', error);
      res.status(500).json({
        success: false,
        message: 'Kartalarni yuklashda xatolik'
      });
    }
  }

  // Kartani o'chirish
  static async deleteCard(req, res) {
    try {
      const userId = req.user.id;
      const { cardId } = req.params;

      const card = await PaymentService.deleteCard(userId, cardId);

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Karta topilmadi'
        });
      }

      logger.info(`Karta o'chirildi: user ${userId}, card ${cardId}`);

      res.json({
        success: true,
        message: 'Karta o\'chirildi'
      });
    } catch (error) {
      logger.error('Delete card error:', error);
      res.status(500).json({
        success: false,
        message: 'Kartani o\'chirishda xatolik'
      });
    }
  }

  // Default kartani o'zgartirish
  static async setDefaultCard(req, res) {
    try {
      const userId = req.user.id;
      const { cardId } = req.body;

      await PaymentService.setDefaultCard(userId, cardId);

      logger.info(`Default karta o'zgartirildi: user ${userId}, card ${cardId}`);

      res.json({
        success: true,
        message: 'Default karta o\'zgartirildi'
      });
    } catch (error) {
      logger.error('Set default card error:', error);
      res.status(500).json({
        success: false,
        message: 'Kartani sozlashda xatolik'
      });
    }
  }

  // To'lov amalga oshirish
  static async processPayment(req, res) {
    try {
      const userId = req.user.id;
      const { card_id, booking_id, amount, description } = req.body;

      if (!card_id || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Karta va summa ko\'rsatilishi kerak'
        });
      }

      // Mock to'lov jarayoni
      const paymentResult = await PaymentService.processMockPayment(card_id, amount);

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: paymentResult.message
        });
      }

      // To'lovni bazaga saqlash
      const payment = await PaymentService.createPayment({
        user_id: userId,
        card_id,
        booking_id,
        amount,
        description,
        transaction_id: paymentResult.transaction_id
      });

      logger.info(`To'lov amalga oshirildi: user ${userId}, amount ${amount}, tx ${paymentResult.transaction_id}`);

      res.json({
        success: true,
        message: 'To\'lov muvaffaqiyatli amalga oshirildi',
        data: payment
      });
    } catch (error) {
      logger.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        message: 'To\'lov amalga oshirishda xatolik'
      });
    }
  }

  // To'lovlar tarixini olish
  static async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      
      const payments = await PaymentService.getPaymentHistory(userId, limit);

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      logger.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'To\'lovlar tarixini yuklashda xatolik'
      });
    }
  }

  // Luhn algoritmi - karta raqamini validatsiya qilish
  static validateCardNumber(cardNumber) {
    let sum = 0;
    let shouldDouble = false;
    
    // Raqamni oxiridan boshlab iteratsiya qilish
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }
}

// Validation rules
const paymentValidators = {
  addCard: [
    body('card_holder').trim().notEmpty().withMessage('Karta egasi ismi required'),
    body('card_number').trim().notEmpty().withMessage('Karta raqami required')
      .isLength({ min: 13, max: 19 }).withMessage('Karta raqami 13-19 xonali bo\'lishi kerak'),
    body('expiry_month').trim().notEmpty().withMessage('Amal qilish muddati (oy) required')
      .matches(/^(0[1-9]|1[0-2])$/).withMessage('Oy 01-12 oraliqda bo\'lishi kerak'),
    body('expiry_year').trim().notEmpty().withMessage('Amal qilish muddati (yil) required')
      .matches(/^\d{4}$/).withMessage('Yil 4 xonali raqam bo\'lishi kerak'),
    body('is_default').optional().isBoolean()
  ],
  
  deleteCard: [
    param('cardId').isInt().withMessage('Karta ID raqam bo\'lishi kerak')
  ],
  
  setDefaultCard: [
    body('cardId').isInt().withMessage('Karta ID raqam bo\'lishi kerak')
  ],
  
  processPayment: [
    body('card_id').isInt().withMessage('Karta ID raqam bo\'lishi kerak'),
    body('booking_id').optional().isInt(),
    body('amount').isFloat({ min: 0 }).withMessage('Summa musbat raqam bo\'lishi kerak'),
    body('description').optional().trim()
  ]
};

module.exports = { PaymentController, paymentValidators };
