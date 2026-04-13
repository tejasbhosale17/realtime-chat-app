const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversation,
  searchUsers,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  updateGroup,
} = require('../controllers/conversationController');

router.use(authenticate);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/search/users', searchUsers);
router.get('/:id', getConversation);
router.put('/:id', updateGroup);
router.put('/:id/members', addGroupMember);
router.delete('/:id/members/:memberId', removeGroupMember);
router.post('/:id/leave', leaveGroup);

module.exports = router;
