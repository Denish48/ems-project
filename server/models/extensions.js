const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const emailDomainSchema = new mongoose.Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org', required: true },
    email_domain: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('emailDomains', emailDomainSchema)