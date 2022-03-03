const mongoose = require('mongoose');
const configs = require('../configs');
const Schema = mongoose.Schema;

const adminsettingsSchema = new mongoose.Schema({
    org_id: { type: Schema.Types.ObjectId, ref: 'org', required: true },
    config: {
        adminSetting: {
            fav_icon: {
                type: Schema.Types.String
            },
            logo: {
                type: Schema.Types.String
            },
            footer: {
                type: Schema.Types.String
            },
            custom: {
                type: Schema.Types.Mixed
            }
        },
        splash_screens: [
            {
                type: Schema.Types.Mixed
            }
        ]
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('adminsettings', adminsettingsSchema)