const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversation,
  searchUsers,
} = require('../controllers/conversationController');

router.use(authenticate);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/search/users', searchUsers);
router.get('/:id', getConversation);

module.exports = router;
