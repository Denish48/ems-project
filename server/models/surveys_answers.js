const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const surveysAnswersSchema = new Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org', required: true },
    survey_id: { type: Schema.Types.ObjectId, ref: 'surveys', required: true },
    answers: [{ type: Schema.Types.Mixed, default: [] }],
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('surveys_answers', surveysAnswersSchema);
