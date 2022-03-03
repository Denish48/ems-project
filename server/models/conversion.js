const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const conversionSchema = new mongoose.Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'orgs' },
    receiver_user_id: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    message: { type: String },
    message_type: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('conversions', conversionSchema);