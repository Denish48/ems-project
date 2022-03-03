const mongoose = require('mongoose');
const configs = require("../configs");
const Joi = require('joi');
const Event = mongoose.model('events');
const ElevateForms = mongoose.model('elevate_forms');
const Event_forms = mongoose.model('event_forms');

exports.addElevateForms = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      name: Joi.string(),
      questions: Joi.array(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const elevateForms = new ElevateForms({
      org_id: validationResult.org_id,
      name: validationResult.name,
      questions: validationResult.questions,
      user_id: validationResult.user_id,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });

    const data = await elevateForms.save();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Request completed successfully'
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.elevateFormById = async (req, res, next) => {
  try {
    const data = await ElevateForms.findById(req.params.id)
      .exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Request completed successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: {},
        message: "Elevate Form not found!",
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.editElevateForm = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string(),
      questions: Joi.array(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const elevateForms = {
      name: validationResult.name,
      questions: validationResult.questions,
      user_id: validationResult.user_id,
      updatedBy: validationResult.user_id,
    };
    const data = await ElevateForms.findByIdAndUpdate(
      req.params.id,
      { $set: elevateForms },
      { new: true }
    ).exec();

    if (!data) {
      return res.json({
        status: configs.success_status,
        data,
        message: "Elevate form not found!",
      });
    }

    return res.json({
      status: configs.success_status,
      data,
      message: 'Elevate Form updated successfully'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}

exports.deleteElevateFormById = async (req, res, next) => {
  try {
    const data = await ElevateForms.findByIdAndDelete(req.params.id)
      .exec();
    if (data) {
      return res.json({
        status: configs.success_status,
        data,
        message: 'Elevate Form deleted successfully'
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: {},
        message: "Elevate Form not found!",
      });
    }
  } catch (error) {
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
};

exports.elevateFormsList = async (req, res, next) => {
  try {
    const schema = Joi.object({
      pageNum: Joi.number().default(1),
      pageLimit: Joi.number().default(10),
      search: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const pageNum = validationResult.pageNum;
    const limit = validationResult.pageLimit;
    const skip = limit * (pageNum - 1);

    let queryDoc = [
      {
        $project: {
          _id: "$_id",
          name: { $ifNull: ["$name", ""] },
        },
      },
    ];

    let queryCount = queryDoc;

    queryDoc = [...queryDoc, ...[{ $skip: skip }, { $limit: limit }]];

    queryCount = [
      ...queryCount,
      ...[
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ],
    ];
    const data = await ElevateForms.aggregate(queryDoc).exec();
    const totalfeedback_survey = await ElevateForms.aggregate(queryCount).exec();
    const totalFilteredPage =
      totalfeedback_survey?.length > 0 && totalfeedback_survey[0].count
        ? Math.ceil(totalfeedback_survey[0].count / limit)
        : 0;
    if (data && data.length > 0) {
      return res.json({
        status: configs.success_status,
        data,
        metaData: {
          currentPage: pageNum,
          totalFilteredCount: totalfeedback_survey[0].count,
          totalFilteredPage,
        },
        message: "Request completed successfully",
      });
    } else {
      return res.json({
        status: configs.success_status,
        data: [],
        metaData: {
          currentPage: 1,
          totalFilteredCount: 0,
          totalFilteredPage: 0,
        },
        message: "No data found",
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: configs.error_status,
      message: configs.errMessage,
      error: error ? error : "",
    });
  }
};

exports.saveEventForm = async (req, res, next) => {
  try {
    const schema = Joi.object({
      org_id: Joi.string(),
      event_id: Joi.string(),
      questions: Joi.array(),
      user_id: Joi.string(),
    });
    const validationResult = await schema.validateAsync(req.body);
    const eventFormInfo = await Event_forms.findOneAndUpdate({ event_id: validationResult.event_id }, {
      $set: {
        questions: validationResult.questions,
        updatedBy: validationResult.user_id,
      }
    }).exec();
    if (eventFormInfo) {
      await Event.findOneAndUpdate({ _id: validationResult.event_id }, {
        $set: {
          updatedBy: validationResult.user_id,
        }
      }).exec();
      return res.json({
        status: configs.error_status, message: "Event form updated successfully"
      });
    }
    const event_forms = new Event_forms({
      org_id: validationResult.org_id,
      questions: validationResult.questions,
      event_id: validationResult.event_id,
      createdBy: validationResult.user_id,
      updatedBy: validationResult.user_id,
    });

    const data = await event_forms.save();
    if (data) {
      const eventInfo = await Event.findOneAndUpdate({ _id: validationResult.event_id }, {
        $set: {
          event_form_id: data._id,
          updatedBy: validationResult.user_id,
        }
      }).exec();
      if (eventInfo) {
        console.log('eventInfo', eventInfo);
      }
      return res.json({
        status: configs.success_status,
        data,
        message: 'Event form updated successfully'
      });
    }
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }

}

exports.getEventForm = async (req, res, next) => {
  try {
    const eventFormInfo = await Event_forms.findById(req.params.id).select('questions event_id').exec();
    if (eventFormInfo) {
      return res.json({
        status: configs.success_status,
        data: eventFormInfo,
        message: "Event form found successfully"
      });
    }
    return res.json({
      status: configs.success_status,
      data: {},
      message: 'Event form not found!'
    });
  } catch (error) {
    console.log(error)
    return res.json({ status: configs.error_status, message: configs.errMessage, error: error ? error : "" });
  }
}