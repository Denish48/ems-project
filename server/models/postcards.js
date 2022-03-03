const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const postcardsSchema = new mongoose.Schema({
    postCard_templete_id: { type: Schema.Types.String, ref:'postcard_templetes'},
    post_date: {type: Schema.Types.Date, },
    user_id:{ type: Schema.Types.ObjectId, ref: 'users' },
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('postCard', postcardsSchema);