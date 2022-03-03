// const employees = require('../models/employees')
const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)

exports.login = (req,res) => {
    if (req.query.phone_number) {
       client
       .verify
       .services(process.env.SERVICE_ID)
       .verifications
       .create({
           to: `+${req.query.phone_number}`,
           channel: req.query.channel==='call' ? 'call' : 'sms' 
       })
       .then(data => {
           res.status(200).send({
               message: "Verification is sent!!",
               phone_number: req.query.phone_number,
               data
           })
       }) 
    } else {
       res.status(400).send({
           message: "Wrong phone number :(",
           phone_number: req.query.phone_number,
           data
       })
    }
}

exports.verify = (req, res) => {
    if (req.query.phone_number && (req.query.code).length === 4) {
        client
            .verify
            .services(process.env.SERVICE_ID)
            .verificationChecks
            .create({
                to: `+${req.query.phone_number}`,
                code: req.query.code
            })
            .then(data => {
                if (data.status === "approved") {
                    res.status(200).send({
                        message: "User is Verified!!",
                        data
                    })
                }
            })
    } else {
        res.status(400).send({
            message: "Wrong phone number or code :(",
            phone_number: req.query.phone_number,
            data
        })
    }
}