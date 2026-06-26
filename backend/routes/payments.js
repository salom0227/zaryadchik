const express = require('express');
const router = express.Router();
const { PaymentController, paymentValidators } = require('../controllers/PaymentController');
const { authMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Barcha routelarni autentifikatsiya qilish kerak
router.use(authMiddleware);

// Karta qo'shish
router.post('/cards',
  paymentValidators.addCard,
  validate,
  PaymentController.addCard
);

// Kartalarni olish
router.get('/cards',
  PaymentController.getCards
);

// Kartani o'chirish
router.delete('/cards/:cardId',
  paymentValidators.deleteCard,
  validate,
  PaymentController.deleteCard
);

// Default kartani o'zgartirish
router.put('/cards/default',
  paymentValidators.setDefaultCard,
  validate,
  PaymentController.setDefaultCard
);

// To'lov amalga oshirish
router.post('/process',
  paymentValidators.processPayment,
  validate,
  PaymentController.processPayment
);

// To'lovlar tarixini olish
router.get('/history',
  PaymentController.getPaymentHistory
);

module.exports = router;
