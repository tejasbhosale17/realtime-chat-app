const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMessages } = require('../controllers/messageController');

router.use(authenticate);

router.get('/:conversationId', getMessages);

module.exports = router;
