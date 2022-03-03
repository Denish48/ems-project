const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const configs = require('../configs');

const eventsSchema = new Schema({
    event_name: { type: String, required: true },
    host_users: [{ type: Schema.Types.ObjectId,  ref: 'users' }],
    event_type_id: { type: Schema.Types.ObjectId, ref: 'eventType' },
    host_user_id: { type: Schema.Types.ObjectId, ref: 'users' },
    departments: [{ type: Schema.Types.ObjectId, ref: 'departments' }],
    designation: [{ type: Schema.Types.ObjectId, ref: 'designations' }],
    event_form_id: { type: Schema.Types.ObjectId, ref: 'event_forms' },
    manual_users: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    event_image: [{ type: String }],
    description: { type: String },
    credit: { type: Number, default: 0 },
    venue: { type: String, default: '' },
    venue_url: { type: String, default: '' },
    feedback_survey_url: { type: String, default: '' },
    start_date: { type: Date },
    end_date: { type: Date },
    start_time: { type: Date },
    end_time: { type: Date },
    custom_dates: [{ type: Date, default: [] }],
    //event_dates: [{type: Schema.Types.ObjectId, ref: 'event_sessions'}],  
    event_dates: {
        type: [
            {
                start: { type: Date },
                end: { type: Date },
            }
        ],
        ref: 'event_sessions',
        default: []
    },
    allDay: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isCustomDate: { type: Boolean, default: false },
    sendFeedbackCounter: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['inprogress', 'completed', 'cancel', 'upcoming'],
        default: 'upcoming'
    },
    event_seats: { type: Number, default: 50 },
    seats_booked: { type: Number, default: 0 },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'low'
    },
    event_notification_list: {
        type: Schema.Types.Mixed, default: [{
            duration_type: 'minutes',
            duration: 10
        }]
    },
    org_id: { type: Schema.Types.ObjectId, ref: 'org' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
    created_At: { type: Date, default: configs.utcDefault },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    updated_At: { type: Date, default: configs.utcDefault },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('events', eventsSchema);
