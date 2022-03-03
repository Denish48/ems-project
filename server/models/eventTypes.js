const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const eventTypesSchema = new Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    event_type: { type: String, required: true, unique: { args: true, msg: 'Event_type already exist' } },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('eventType', eventTypesSchema);