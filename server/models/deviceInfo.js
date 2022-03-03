const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const deviceSchema = new mongoose.Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true},
    device_type: {type: String, required: true},
    device_token: {type: String, required: true} 
})

module.exports = mongoose.model('DeviceInfo', deviceSchema);