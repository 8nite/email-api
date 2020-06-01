import express from 'express'
import email from './email/email'

var router = express.Router();

router.use('/webhook/email', email);

module.exports = router;
