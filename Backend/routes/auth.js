const express = require('express');
const { registerValidation, loginValidation } = require('../validators/authValidator');
const { register, login, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);

module.exports = router;
