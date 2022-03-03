const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const orgSchema = new mongoose.Schema({
    org_name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('org', orgSchema);