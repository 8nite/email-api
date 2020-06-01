import express from 'express'

var router = express.Router();

router.post('/', (req, res) => {
    console.log(req.body)
    res.send("1")
})

router.get('/', (req, res) => {
    console.log(req.query)
    res.send("1")
})

module.exports = router;