const mongoose = require('mongoose');
const Joi = require('joi');
const configs = require('../configs');

const EventTypes = mongoose.model('eventType');
const Events = mongoose.model('events');

exports.addEventTypes = async (req, res, next) => {
    try {
        const schema = Joi.object({
            org_id: Joi.string().required(),
            event_type: Joi.string().required(),
            user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(req.body);

        const isEventType = await EventTypes.findOne({ event_type: { $regex: validationResult.event_type, $options: "i" } }).limit(5).select('_id').exec();
        if (isEventType) {
            return res.json({
                status: configs.error_status, message: "Event type is already registered"
            });
        }

        const new_eventType = new EventTypes({
            org_id: validationResult.org_id,
            event_type: validationResult.event_type,
            createdBy: validationResult.user_id,
            updatedBy: validationResult.user_id,
        });

        const data = await new_eventType.save();
        if (data) {
            return res.json({
                status: configs.success_status,
                data,
                message: 'Event type added successfully'
            });
        }
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }

}

exports.eventTypeList = async (req, res, next) => {
    try {
        const pageNum = req.body.pageNum ? req.body.pageNum : 1;
        const limit = req.body.pageLimit ? req.body.pageLimit : 10;
        const skip = limit * (pageNum - 1);
        const search = req.body.search?.trim() ? req.body.search.trim() : null;

        const query = {};

        if (search) {
            query.event_type = { $regex: search, $options: 'i' }
        }

        const queryListEventTypes = EventTypes.find(query);
        const qrCountEventType = EventTypes.find(query);

        if (limit) {
            queryListEventTypes.skip(skip).limit(limit);
        }

        const data = await queryListEventTypes.exec();
        const totalEventTypes = await qrCountEventType.countDocuments().exec();
        const totalFilteredPage = Math.ceil(totalEventTypes / limit);

        if (data && data.length > 0) {
            return res.json({
              status: configs.success_status,
              data,
              metaData: {
                currentPage: pageNum,
                totalEventTypes,
                totalFilteredPage,
              },
              message: "Request completed successfully",
            });
          } else {
            return res.json({
              status: configs.success_status,
              data: [],
              message: "No data found",
            });
          }
    } catch (error) {
        console.log(error);
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.eventTypeDropdownList = async (req, res, next) => {
    try {
        const data = await EventTypes.find()
            .select({ event_type: 1 })
            .exec();
        return res.json({
            status: configs.success_status,
            data,
            message: 'Request completed successfully'
        });
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.eventTypeById = async (req, res, next) => {
    try {
        const data = await EventTypes.findById(req.params.id).exec();
        if (data) {
            return res.json({
                status: configs.success_status,
                data,
                message: 'Request completed successfully'
            });
        } else {
            return res.json({
                status: configs.success_status,
                data,
                message: 'EventType not found!'
            });
        }
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.editEventType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            event_type: Joi.string().required(),
            user_id: Joi.string().required(),
        });
        const validationResult = await schema.validateAsync(req.body);

        const isEventType = await EventTypes.findOne({
            _id: { $ne: req.params.id },
            event_type: { $regex: validationResult.event_type,
                 $options: "i" }
        }).select('_id').exec();
        if (isEventType) {
            return res.json({
                status: configs.error_status, message: "Event type is already registered"
            });
        }

        const new_eventType = {
            event_type: validationResult.event_type,
            updatedBy: validationResult.user_id,
            updated_At: configs.utcDefault(),
        };
        const data = await EventTypes.findByIdAndUpdate(req.params.id, { $set: new_eventType }, { new: true }).exec();
        if (data) {
            return res.json({
                status: configs.success_status,
                data,
                message: 'EventType updated successfully'
            });
        } else {
            return res.json({
                status: configs.success_status,
                data,
                message: 'EventType not found!'
            });
        }
    } catch (error) {
        console.log(error)
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.deleteEventType = async (req, res, next) => {
    try {
        const schema = Joi.object({
            user_id: Joi.string().required(),
        });
        await schema.validateAsync(req.body);
        const eventList = await Events.find({ event_type_id: req.params.id }).countDocuments().exec();
        if (eventList > 0) {
            return res.json({
                status: configs.success_status,
                data: null,
                message: 'You can not delete this event type as it linked with event(s)'
            });
        }
        const data = await EventTypes.findByIdAndDelete(req.params.id).exec();
        if (data) {
            return res.json({
                status: configs.success_status,
                data,
                message: 'EventType deleted successfully'
            });
        } else {
            return res.json({
                status: configs.success_status,
                data,
                message: 'EventType not found!'
            });
        }
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};

exports.downloadeventTypeList = async (req, res, next) => {
    try {
        const data = await EventTypes.find()
            .exec()
        return res.json({
            status: configs.success_status,
            data,
            message: 'EventTypes Downloaded successfully!'
        });
    } catch (error) {
        return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
    }
};