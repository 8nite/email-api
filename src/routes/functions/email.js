import express from 'express'
import nodemailer from 'nodemailer'
import readNextEmail from '../../functions/readNextEmail'
import rp from 'request-promise'
import { Base64 } from 'js-base64'

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

router.post('/', async (req, res) => {
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
        attachments: req.body.attachments || null
    });
    res.json(info)
})

router.get('/get', async (req, res) => {
    res.send('0')
    return
    let ret = await readNextEmail()
    if (ret && ret.body) {
        res.send(ret.body)
    } else {
    res.send('0')
    }
})

router.post('/sendToCustomerCarrierInternal', async (req, res) => {
    const from = process.env.IBVSDFROM
    const to = req.body.to
    const cc = req.body.cc
    const subject = req.body.subject
    const body = Base64.decode(req.body.body)
    const attachments = req.body.attachments
    /*
    const attachmentFilename = req.body.attachmentFilename
    let attachmentURI = req.body.attachmentURI
    if (attachmentURI.search(',' > -1)) {
        attachmentURI = attachmentURI.substring(attachmentURI.search(',') + 1)
    }
    */
    const emailOptions = {
        method: 'POST',
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
        json: true,
        body: {
            from: from,
            to: to,
            cc: cc,
            subject: subject,
            html: body,
            attachments
        }
    }
    /*
    if (attachmentFilename.length > 1) {
        emailOptions.body.attachments = [{
            filename: attachmentFilename,
            content: attachmentURI,
            encoding: 'base64'
        }]
    }
    */
    await rp(emailOptions)

    res.send('done')
})

module.exports = router;