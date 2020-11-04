import express from 'express'
import rp from 'request-promise'
import queryString from 'query-string'

require('dotenv').config()

var router = express.Router();

router.get('/', async (req, res) => {
    console.log('Rechecking Jobs')
    let options = {
        uri: 'http://' + process.env.LOCALHOST + ':' + process.env.JIRAAPIPORT + '/get/jira/issue/search?jql=project%20%3D%20"Self%20Service"%20AND%20((type%20%3D%20"Service%20Request"%20AND%20"1st%20level%20Approval"%20%20is%20EMPTY%20AND%20status%20%3D%20"Pending%20for%201st%20Approval")%20OR%20(type%20%3D%20Incident%20AND%20"Assigned%20Group"%20is%20EMPTY%20AND%20status%20%3D%20Open))&maxResults=9999',
        json: true
    }
    rp(options).then(($) => {
        let spread = 0
        $.issues.forEach((issue) => {
            setTimeout(function(){
                console.log('Rechecking issue: ' + issue.key)
                let options2 = {
                    method: 'POST',
                    uri: 'http://' + process.env.LOCALHOST + ':' + process.env.PORT + '/emailapi/routes',
                    body: {
                        issue: issue,
                        webhookEvent: 'jira:issue_created'
                    },
                    json: true
                }
                rp(options2)
            }, 5000 * spread)
            spread++
        })
    })
})
module.exports = router;