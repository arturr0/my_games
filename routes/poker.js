const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
   res.render('poker'); // Render a subpage view, e.g., subpage.pug or subpage.html
});

module.exports = router;
