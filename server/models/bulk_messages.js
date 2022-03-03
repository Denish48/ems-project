const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const bulk_messageSchema = new mongoose.Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'orgs' },
    receiver_user_id: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    event_id: [{ type: Schema.Types.ObjectId, ref: 'events' }],
    department_id: [{ type: Schema.Types.ObjectId, ref: 'departments' }],
    custom_field: { type: Schema.Types.Mixed },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('bulk_messages', bulk_messageSchema);