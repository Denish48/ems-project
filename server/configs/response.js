const configs = require('../configs');
const mongoose = require("mongoose");
const Tokens = mongoose.model('tokens');

exports.verifyDeviceId = async (req, res, next) => {
    let device_id = req.headers.device_id;
    if (device_id) {
        const device_data = await Tokens.findOne({
            user_id: req.user._id,
            device_id
        }).select('_id').exec();
        if (device_data) {
            next();
        } else {
            return res.status(configs.unauthorised_device_id).send({
                status: "err",
                code: configs.unauthorised_device_id,
                success: false,
                message: 'Device is already login in other device.',
                data: null
            });
        }
 
    } else {
        if (req.headers.platform === 'web-admin') {
            next();
        } else {
            return res.status(configs.badRequest_status).send({
                status: "err",
                code: configs.badRequest_status,
                success: false,
                message: 'Please provide device Id',
                data: null
            });
        }
    }
}