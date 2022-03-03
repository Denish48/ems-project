const mongoose = require('mongoose');
const Schema = mongoose.Schema
const configs = require('../configs');

const hostSchema = new Schema({
    isExternal: { type: Boolean, default: false },
    user_id: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    created_At: { type: Date, default: configs.utcDefault },
    updated_At: { type: Date, default: configs.utcDefault },
    isDeleted: { type: Boolean, default: false },
    isActivate: { type: Boolean, default: true },
});

module.exports = mongoose.model('host', hostSchema);