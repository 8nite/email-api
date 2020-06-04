import express from 'express'
import nodemailer from 'nodemailer'

require('dotenv').config()

var router = express.Router();

let transporter = nodemailer.createTransport({
    host: process.env.EMAILHOST,
    port: process.env.EMAILPORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAILUSER, // generated ethereal user
        pass: process.env.EMAILPASS, // generated ethereal password
    },
});

router.post('/', async(req, res) => {
    console.log('sending email: ' + req.body.subject)
    let info = await transporter.sendMail({
        from: req.body.from, // sender address
        to: "herbert.tung@hgc.com.hk", // list of receivers
        cc: ["herbert.tung@hgc.com.hk"], // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.text || null, // plain text body
        html: req.body.html || null, // html body
      });
    res.json(info)
})

module.exports = router;