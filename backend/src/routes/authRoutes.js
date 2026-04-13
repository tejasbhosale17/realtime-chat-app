const router = require('express').Router();
const {
  register,
  login,
  refresh,
  logout,
  getMe,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { handleValidation, registerRules, loginRules } = require('../middleware/validate');

router.post('/register', registerRules, handleValidation, register);
router.post('/login', loginRules, handleValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
