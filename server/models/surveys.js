const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const surveys = new mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    survey_name: { type: Schema.Types.String, default: '' },
    survey_questions: [{ type: Schema.Types.Mixed, default: '' }],
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('surveys', surveys);