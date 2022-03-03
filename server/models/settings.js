const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const settingSchema = new mongoose.Schema({
    configs: {type: Schema.Types.Mixed, default: null},
    org_id: {type: Schema.Types.ObjectId, ref: 'org'},
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: {type: Boolean, default: false}
})

module.exports = mongoose.model('settings', settingSchema);