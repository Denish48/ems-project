const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const eventAttendanceSchema = new Schema({
    event_session_id: { type: Schema.Types.ObjectId, required: true },
    event_session_start: { type: Date },
    user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    event_user_id: { type: Schema.Types.ObjectId, ref: 'event_users' },
    event_id: { type: Schema.Types.ObjectId, ref: 'events', required: true },
    host_user_id: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    org_id: { type: Schema.Types.ObjectId, ref: 'org', required: true },
    start_time: { type: Date },
    end_time: { type: Date },
    status: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('event_attendances', eventAttendanceSchema);
