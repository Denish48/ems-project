const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const notificationSchema = new mongoose.Schema({
    sender_user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    receiver_user_id: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    event_id: { type: Schema.Types.ObjectId, ref: 'events' },
    department_id: { type: Schema.Types.ObjectId, ref: 'departments' },
    bulk_message_id: { type: Schema.Types.ObjectId, ref: 'bulk_messages' },
    custom_field: { type: Schema.Types.Mixed },
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    is_seen: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('notifications', notificationSchema);