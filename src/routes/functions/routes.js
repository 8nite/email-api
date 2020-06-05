import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    if (req.body.issue.fields.project.name.search('TOC') >= 0 && req.body.changelog.items.some((item) => item.field === 'Assignee')) {
        const options = {
            method: 'POST',
            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/TOC/Assignment',
            json: true,
            body: req.body
        }
        rp(options).then(($) => {
            res.send($)
        })
    }
    else {
        res.send("nothing done")
    }
})

module.exports = router;