const express = require('express');
const { search, getHistory, getSearchById } = require('../controllers/searchController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, search);
router.get('/history', authenticate, getHistory);
router.get('/:id', authenticate, getSearchById);

module.exports = router;
