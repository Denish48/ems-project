const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const event_forms = new mongoose.Schema({
    event_id: { type: Schema.Types.ObjectId, ref: 'events', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    questions: [{ type: Schema.Types.Mixed, default: '' }],
    org_id: { type: Schema.Types.ObjectId, ref: 'org', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('event_forms', event_forms);