var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var schema = Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    token_id: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    refreshToken: { type: String },
    device_id: { type: String },
});

module.exports = mongoose.model('tokens', schema);
