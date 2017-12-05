const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
    res.render('home');
});

// Do work here
router.get('/test', (req, res) => {
    res.render('test');
});

router.get('/chat', (req, res) => {
    res.render('chat');
});


module.exports = router;
