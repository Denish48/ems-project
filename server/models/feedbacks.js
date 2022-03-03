const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const feedbacksSchema = new Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org'},
    event_id: { type: Schema.Types.ObjectId, ref: 'events' },
    event_form_id: { type: Schema.Types.ObjectId, ref: 'evemt_forms' },
    answers: [{ type: Schema.Types.Mixed, default: [] }],
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('feedbacks', feedbacksSchema);