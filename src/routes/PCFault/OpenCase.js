import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'
import { getEmails, getFieldMapping, issueNames } from '../../functions/jiraAPI'

require('dotenv').config()

var router = express.Router();

router.post('/', async (req, res) => {
    res.send('done')
    setTimeout(async function () {
        let mappedFields = await issueNames(req.body.issue.key)
        mappedFields = mappedFields.fields

        const caseNumber = req.body.issue.key
        console.log(caseNumber)
        const serviceName = req.body.issue.fields.issuetype.name
        console.log(serviceName)
        const caseSubject = req.body.issue.fields.summary
        console.log(caseSubject)
        const statusChanger = req.body.issue.fields.reporter.name
        console.log(statusChanger)
        const userName = req.body.issue.fields.reporter.name
        const assignedGroup = mappedFields['Assigned Group'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1]
        
        const to = await getEmails('HGC', 'SelfServiceSupportUser', 'SelfServiceSupportTeam', assignedGroup, 'Name')
        console.log(to)
        const cc = ['hgctoc@hgc.com.hk', '008OPS@hgc.com.hk', 'hgcitsd@hgc.com.hk']
        console.log(cc)
        const bcc = []

        const emailOptions = {
            method: 'POST',
            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
            json: true,
            body: {
                from: process.env.DEFUALTSENDER,
                to: to,
                cc: cc,
                bcc,
                subject: 'HGC Service Desk - ' + caseNumber + ' - ' + caseSubject + ' had been created',
                html: `Dear ` + userName + `</br></br>

            This is to acknowledge  the receipt of a reported case</br>
            We will have it checked and updates will be provided once available.</br></br>
            
            Ticket type : `+ serviceName + `</br>
            Reference Number : `+ caseNumber + `</br>
            Summary : `+ caseSubject + `</br>
            Service : `+ mappedFields['Category'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1] + `</br></br>
            
            Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC TOC`
            }
        }
        rp(emailOptions)

        const to2 = await getEmails('HGC', 'SelfServiceSupportUser', 'SelfServiceSupportTeam', assignedGroup, 'Name')
        const cc2 = ['hgctoc@hgc.com.hk', '008OPS@hgc.com.hk', 'hgcitsd@hgc.com.hk']
        const bcc2 = []

        const emailOptions2 = {
            method: 'POST',
            uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/email',
            json: true,
            body: {
                from: process.env.DEFUALTSENDER,
                to: to2,
                cc: cc2,
                bcc: bcc2,
                subject: 'HGC Service Desk - ' + caseNumber + ' - ' + caseSubject + ' had been assigned to you',
                html: `Dear ` + assignedGroup + `</br></br>

            This is to inform you that a case is assigned to you</br></br>
            
            Ticket type : `+ serviceName + `</br>
            Reference Number : `+ caseNumber + `</br>
            Summary : `+ caseSubject + `</br>
            Service : `+ mappedFields['Category'][0].match(/(.*) \(([-A-Z0-9]*)\)$/)[1] + `</br></br>
            
            Please do not hesitate to contact us at 2128 2666 or hgctoc@hgc.com.hk if any further questions or inquires regarding your ticket</br>
            This is an auto notification sent from system, please do not reply this email.</br></br>
            
            HGC TOC`
            }
        }
        rp(emailOptions2)
    }, 180000);
})

module.exports = router;