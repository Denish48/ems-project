const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const messageSchema = new mongoose.Schema({
    sender_user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    receiver_user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    conversion_id: { type: Schema.Types.ObjectId, ref: 'conversions' },
    message: { type: String },
    message_type: { type: String },
    is_seen: { type: Boolean, default: false },
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false },
    deleted_At: {type: Date, default: configs.utcDefault},
})

module.exports = mongoose.model('messages', messageSchema);