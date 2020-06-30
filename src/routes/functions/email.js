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

    const to = process.env.EMAILTO || req.body.to
    const cc = process.env.EMAILCC || req.body.cc
    const bcc = process.env.EMAILBCC || req.body.bcc

    let info = await transporter.sendMail({
        from: req.body.from, // sender address
        to: to, // list of receivers
        cc: cc, // list of receivers
        bcc: bcc, // list of receivers
        subject: process.env.EMAILSUBPREFIX + req.body.subject, // Subject line
        text: req.body.text || null, // plain text body
        html: req.body.html || null, // html body
      });
    res.json(info)
})

module.exports = router;