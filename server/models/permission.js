const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const permissionSchema = new mongoose.Schema({
    read: {type: String, required: true},
    write: {type: String, required: true},
    org_id: {type: Schema.Types.ObjectId, ref: 'org'},
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: {type: Boolean, default: false}
})

module.exports = mongoose.model('permission', permissionSchema);