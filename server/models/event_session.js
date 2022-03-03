const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const event_sessions = new mongoose.Schema({
    event_id: { type: Schema.Types.ObjectId, ref: 'events', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    event_status: {
        type: String,
        enum: ['inprogress', 'completed', 'cancel', 'upcoming'],
        default: 'inprogress'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
})

module.exports = mongoose.model('event_sessions', event_sessions);